import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/mito/run-id.server";
import { checkLimit, clientKey, readLimitedJson } from "@/lib/mito/rate-limit.server";
import { inputRanges, type Inputs } from "@/lib/mito/model";

const Body = z.object({
  condition: z.string().trim().min(3).max(2000),
  inputs: z.record(z.string(), z.number()),
});

export const Route = createFileRoute("/api/suggest")({
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

        const runIdFetch = createLovableAiGatewayRunIdFetch();
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const keys = Object.keys(inputRanges) as (keyof Inputs)[];
        const spec = keys
          .map((k) => {
            const r = inputRanges[k];
            return `${k} (${r.label}, ${r.unit}, range ${r.min} to ${r.max}, current ${parsed.data.inputs[k] ?? "?"})`;
          })
          .join("\n");

        try {
          const result = streamText({
            model: provider.responses("openai/gpt-6-astra"),
            system:
              "You map an experimental condition onto the sliders of a lumped mitochondrial redox model. Reply with JSON only, no prose, shaped as {\"suggestions\":[{\"key\":string,\"value\":number,\"reason\":string,\"confidence\":\"low\"|\"medium\"|\"high\"}]}. Include only sliders the condition plausibly changes. Keep values inside the given ranges. Reasons are one short sentence citing the mechanism. Never use em dashes.",
            prompt: `Condition:\n${parsed.data.condition}\n\nSliders:\n${spec}`,
            abortSignal: request.signal,
            maxRetries: 0,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });
          const text = await result.text;
          const match = text.match(/\{[\s\S]*\}/);
          const data = JSON.parse(match?.[0] ?? "{}") as { suggestions?: unknown[] };
          const suggestions = (data.suggestions ?? [])
            .map((s) => s as { key?: string; value?: number; reason?: string; confidence?: string })
            .filter((s) => s.key && s.key in inputRanges && typeof s.value === "number" && Number.isFinite(s.value))
            .map((s) => {
              const r = inputRanges[s.key as keyof Inputs];
              return {
                key: s.key as keyof Inputs,
                value: Math.min(r.max, Math.max(r.min, s.value!)),
                reason: String(s.reason ?? "").slice(0, 300),
                confidence: ["low", "medium", "high"].includes(s.confidence ?? "") ? s.confidence : "low",
              };
            });
          return Response.json({ suggestions }, { headers: rlHeaders });
        } catch (e) {
          const err = e as { statusCode?: number; message?: string };
          const status = err.statusCode ?? 500;
          const msg =
            status === 429
              ? "AI is busy. Please wait a moment and try again."
              : status === 402
                ? "AI credits are used up. Add credits in Settings, Plans and credits."
                : "Could not get suggestions. Please try again.";
          console.error("suggest failed", err.message);
          return Response.json({ error: msg }, { status, headers: rlHeaders });
        }
      },
    },
  },
});
