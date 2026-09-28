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
    .max(20)
    .default([]),
  map: z
    .object({
      xLabel: z.string().max(60),
      yLabel: z.string().max(60),
      xRange: z.tuple([z.number(), z.number()]),
      yRange: z.tuple([z.number(), z.number()]),
      baseline: z.object({ x: z.number(), y: z.number() }),
      shownOutput: z.string().max(40),
      shownGrid: z.array(z.array(z.number()).max(9)).max(9),
      outputs: z
        .array(
          z.object({
            label: z.string().max(40),
            base: z.number(),
            xOnlyPct: z.number(),
            yOnlyPct: z.number(),
            bothPct: z.number(),
            synergyPct: z.number(),
            min: z.number(),
            max: z.number(),
          }),
        )
        .max(20),
      nitricOxide: z
        .object({
          currentNm: z.number(),
          atMaxIron: z.number(),
          crossingDoses: z.object({
            no0: z.number().nullable(),
            current: z.number().nullable(),
            no400: z.number().nullable(),
          }),
          levels: z
            .array(
              z.object({
                no: z.number(),
                peroxynitrite: z.number(),
                fesIntactPct: z.number(),
                aconitasePct: z.number(),
                cardiolipinOxPct: z.number(),
              }),
            )
            .max(6),
        })
        .optional(),
    })
    .optional(),
});

const MAP_SYSTEM = `You are a mitochondrial redox biologist interpreting a two-input interaction map from a lumped steady-state model.
Two inputs were varied jointly across their full ranges; every cell is a full model run. For each output you get: the value at current settings, and, relative to the cell where both inputs are at their minimum, the percent change with only x at maximum, with only y at maximum, and with both at maximum, and synergy = both minus the sum of the single effects (positive = synergistic, negative = antagonistic or saturating). A coarse grid of the displayed output is included (rows from low to high y, columns from low to high x).
Write a concise explanation in Markdown with these sections:
## What the map shows (the main gradient direction and which input dominates, with numbers)
## Parameter interactions (synergy or antagonism per output, and the mechanism in the model, e.g. Fenton chemistry, NO photodissociation, chromophore-driven superoxide, Fe-S damage feedback)
## Implications for ROS and Fe-S (where oxidative damage risk and Fe-S loss are highest, and safe or risky regions for light dosing at a given iron load)
## Nitric oxide and peroxynitrite (only when the NO block is present: how NO shifts the light dose at which oxidized cardiolipin crosses the 30% Committed threshold at the map's highest iron, and how the peroxynitrite driven Fe-S attack term changes Fe-S intact and aconitase across the NO levels given. The model has three separate Fe-S attack terms, one each for superoxide, H2O2 and peroxynitrite, so say which of them the numbers implicate. A null crossing dose means the threshold is never crossed within the mapped dose range.)
## Caveats (steady-state lumping, estimated coefficients, percent changes hide absolute scale, the peroxynitrite and H2O2 Fe-S rate constants are effective and unfitted)
Ground every claim in the numbers given. Label speculation explicitly. Never use em dashes. Keep it under about 400 words.`;

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
        const { delta, inputs, rows, map } = parsed.data;
        if (!map && rows.length === 0)
          return Response.json({ error: "Nothing to explain." }, { status: 400 });
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
          system: map ? MAP_SYSTEM : SYSTEM,
          prompt: map
            ? `x input: ${map.xLabel} from ${map.xRange[0]} to ${map.xRange[1]} (baseline ${map.baseline.x})\ny input: ${map.yLabel} from ${map.yRange[0]} to ${map.yRange[1]} (baseline ${map.baseline.y})\n\nBaseline inputs:\n${fmt(inputs)}\n\nPer-output interaction summary:\n${map.outputs
                .map(
                  (o) =>
                    `${o.label}: base ${Number(o.base.toPrecision(4))}, x only ${o.xOnlyPct.toFixed(1)}%, y only ${o.yOnlyPct.toFixed(1)}%, both ${o.bothPct.toFixed(1)}%, synergy ${o.synergyPct.toFixed(1)}%, range ${Number(o.min.toPrecision(3))} to ${Number(o.max.toPrecision(3))}`,
                )
                .join("\n")}\n\nDisplayed output ${map.shownOutput}, coarse grid:\n${map.shownGrid.map((r) => r.map((v) => Number(v.toPrecision(3))).join(" ")).join("\n")}`
            : `Perturbation step: plus or minus ${(delta * 100).toFixed(0)}% of each driver's full range.\n\nBaseline inputs:\n${fmt(inputs)}\n\nSensitivity results (percent change per output):\n${table}`,
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
