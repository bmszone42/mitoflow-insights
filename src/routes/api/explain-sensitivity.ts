import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/mito/run-id.server";
import { checkLimit, clientKey, readLimitedJson } from "@/lib/mito/rate-limit.server";

const Cell = z.record(z.string(), z.number());
const Body = z.object({
  delta: z.number().min(0.01).max(1),
  inputs: z.record(z.string(), z.number()),
  rows: z
    .array(
      z.object({
        driver: z.string(),
        group: z.string(),
        down: Cell,
        up: Cell,
      }),
    )
    .max(20),
});

const SYSTEM = `You are a mitochondrial redox biologist explaining a local sensitivity analysis of a lumped steady-state model.
Each driver was perturbed down and up by a fixed fraction of its full slider range around the baseline inputs; the numbers are percent changes in each output.
Write a concise explanation in Markdown with these sections:
## Dominant drivers (which inputs move ROS and Fe-S outputs most, with the numbers)
## Key interactions (e.g. labile iron x Fenton chemistry on hydroxyl radical, photon dose x peroxynitrite and lipid peroxyl, electron flux x superoxide, oxygen tension effects)
## Implications for ROS and Fe-S (what the pattern means for oxidative damage risk, aconitase and Fe-S cluster integrity, and where the model is stiff or insensitive)
## Caveats (local linear view of a nonlinear system, steady-state lumping, percent changes hide absolute scale)
Ground every claim in the numbers given. Label speculation explicitly. Never use em dashes. Keep it under about 400 words.`;

export const Route = createFileRoute("/api/explain-sensitivity")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readLimitedJson(request);
        if (raw.tooLarge) return Response.json({ error: "Request too large" }, { status: 413 });
        const parsed = Body.safeParse(raw.json);
        if (!parsed.success)
          return Response.json({ error: "Invalid sensitivity payload." }, { status: 400 });
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
        const { delta, inputs, rows } = parsed.data;
        const fmt = (o: Record<string, number>) =>
          Object.entries(o)
            .map(([k, v]) => `${k}: ${Number(v.toPrecision(4))}`)
            .join(", ");
        const table = rows
          .map(
            (r) =>
              `${r.driver} (${r.group}): down -> ${fmt(r.down)} | up -> ${fmt(r.up)}`,
          )
          .join("\n");

        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          prompt: `Perturbation step: plus or minus ${(delta * 100).toFixed(0)}% of each driver's full range.\n\nBaseline inputs:\n${fmt(inputs)}\n\nSensitivity results (percent change per output):\n${table}`,
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
