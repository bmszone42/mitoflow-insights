import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/mito/run-id.server";
import { checkLimit, clientKey, readLimitedJson } from "@/lib/mito/rate-limit.server";

const Body = z.object({
  condition: z.string().trim().min(3).max(2000),
  inputs: z.record(z.string(), z.number()),
  outputs: z.record(z.string(), z.number()),
  compare: z
    .object({
      a: z.string().max(200),
      b: z.string().max(200),
      atpFluxA: z.number(),
      atpFluxB: z.number(),
      steps: z
        .array(
          z.object({
            step: z.string().max(80),
            ev: z.number(),
            atpPerPairA: z.number(),
            atpPerPairB: z.number(),
            rateA: z.number(),
            rateB: z.number(),
            sharePct: z.number(),
            direction: z.enum(["up", "down", "none"]),
          }),
        )
        .max(12),
    })
    .optional(),
});

const COMPARE_SYSTEM = `
When a scenario comparison block is given, add a first section "## ATP change drivers" before the others:
name the step with the largest driver share, say whether scenario B raised or lowered it, and rank the steps that together explain most of the gap.
For each dominant step, say whether its change comes from the ATP yield per pair (membrane potential, uncoupling) or from electron flux through that complex (substrate supply, inhibition, light, NO).
Driver shares are fractions of the total absolute per-step rate gap, not of whole-chain ATP flux. Label steps with zero share as not contributing.`;

const SYSTEM = `You are a mitochondrial redox biologist interpreting a lumped steady-state model.
Given an experimental condition, the model inputs and the predicted outputs, write a concise mechanistic interpretation in Markdown with these sections:
## ROS changes (which species, which site: CI forward/reverse electron transport, CIII Qo, SOD2/Prx3 handling, Fenton, peroxynitrite)
## Fe-S clusters and aconitase
## Iron handling (labile pool, Fenton risk, IRP/ferritin, frataxin/ISC)
## Photon response (CCO absorption at 660/810 nm, NO photodissociation, position on the biphasic dose curve; treat the 71 THz band only as a relative reporter, never an absolute radiometric value)
## Caveats and suggested measurements
Ground every claim in the numbers given. Label speculation explicitly. Never use em dashes. Keep it under about 450 words.`;

export const Route = createFileRoute("/api/interpret")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readLimitedJson(request);
        if (raw.tooLarge) return Response.json({ error: "Request too large" }, { status: 413 });
        const parsed = Body.safeParse(raw.json);
        if (!parsed.success)
          return Response.json({ error: "Describe the condition in 3 to 2000 characters." }, { status: 400 });
        const lim = checkLimit(clientKey(request));
        const rlHeaders = { "X-RateLimit-Remaining": String(lim.remaining) };
        if (!lim.ok) return Response.json({ error: lim.message }, { status: 429, headers: rlHeaders });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured" }, { status: 500 });

        const runIdFetch = createLovableAiGatewayRunIdFetch(
          request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined,
        );
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const { condition, inputs, outputs, compare } = parsed.data;
        const fmt = (o: Record<string, number>) =>
          Object.entries(o)
            .map(([k, v]) => `${k}: ${Number(v.toPrecision(4))}`)
            .join("\n");

        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: compare ? SYSTEM + COMPARE_SYSTEM : SYSTEM,
          prompt: `Experimental condition:\n${condition}\n\nModel inputs:\n${fmt(inputs)}\n\nModel outputs:\n${fmt(outputs)}${
            compare
              ? `\n\nScenario comparison (A = ${compare.a}, B = ${compare.b}). Whole chain ATP flux A ${compare.atpFluxA.toPrecision(4)}, B ${compare.atpFluxB.toPrecision(4)}.\nPer-step ATP drivers (step | eV | ATP/pair A, B | rate A, B | driver share % | direction):\n${compare.steps
                  .map((x) => `${x.step} | ${x.ev} | ${x.atpPerPairA.toFixed(2)}, ${x.atpPerPairB.toFixed(2)} | ${x.rateA.toPrecision(3)}, ${x.rateB.toPrecision(3)} | ${x.sharePct.toFixed(1)} | ${x.direction}`)
                  .join("\n")}`
              : ""
          }`,
          abortSignal: request.signal,
          maxRetries: 0,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "medium",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          onError: ({ error }) => {
            const e = error as { statusCode?: number; message?: string };
            upstreamError = { status: e.statusCode ?? 500, message: e.message ?? "AI request failed" };
          },
        });

        // Peek at the first chunk so upstream status errors surface before headers are sent.
        const reader = result.textStream.getReader();
        const first = await reader.read().catch(() => ({ done: true, value: undefined }));
        if (first.done && upstreamError) {
          const { status, message } = upstreamError as { status: number; message: string };
          const friendly =
            status === 429
              ? "Rate limited. Please wait a moment and try again."
              : status === 402
                ? "AI credits are used up. Add credits in Settings, Plans and credits."
                : message;
          return Response.json({ error: friendly }, { status, headers: rlHeaders });
        }
        const enc = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(c) {
            if (!first.done && first.value) c.enqueue(enc.encode(first.value));
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                c.enqueue(enc.encode(value));
              }
            } catch {
              c.enqueue(enc.encode("\n\n[Stream interrupted]"));
            }
            c.close();
          },
          cancel: (r) => reader.cancel(r),
        });
        const headers = new Headers({
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          ...rlHeaders,
        });
        const rid = runIdFetch.getRunId();
        if (rid) headers.set("X-Lovable-AIG-Run-ID", rid);
        return new Response(body, { headers });
      },
    },
  },
});
