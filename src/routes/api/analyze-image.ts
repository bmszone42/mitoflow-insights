import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";
import { aiConfigured, aiModelId, aiNotConfiguredResponse } from "@/lib/ai-gateway.server";
import { checkLimit, clientKey, readLimitedJson } from "@/lib/mito/rate-limit.server";
import { geometryRanges, inputRanges } from "@/lib/mito/model";

const Body = z.object({
  image: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
    .max(3_200_000),
  modality: z.string().trim().max(120).optional().default(""),
  sample: z.string().trim().max(600).optional().default(""),
  scale: z.string().trim().max(120).optional().default(""),
  inputs: z.record(z.string(), z.number()),
  outputs: z.record(z.string(), z.number()),
  geometry: z.record(z.string(), z.number()),
});

const rangeText = (r: Record<string, { min: number; max: number; label: string }>) =>
  Object.entries(r)
    .map(([k, v]) => `${k} (${v.label}): ${v.min} to ${v.max}`)
    .join("\n");

const SYSTEM = `You are a mitochondrial ultrastructure expert helping a modeler relate a microscopy image to a lumped steady-state redox model.
Examine the image and write Markdown with these sections:
## Identified features
Bullet list. For each: feature, observation, confidence (high, medium, low). Cover where visible: cristae density, cristae shape (lamellar, tubular, swollen, onion-like, absent), crista junction width, lumen swelling, matrix density, outer membrane integrity, size and elongation, fragmentation versus network, ER or lipid contacts, inclusions or electron-dense deposits (possible iron or calcium, say which is uncertain). If the image is not a mitochondrial micrograph, say so and stop.
## Effects on ROS predictions
## Effects on Fe-S and aconitase
## Effects on iron handling
## Effects on photon response (cytochrome c oxidase density per membrane area, 660 and 810 nm absorption, light penetration; the 71 THz band is only a relative reporter, never an absolute value)
## Caveats (modality limits, fixation and sectioning artifacts, single-plane sampling)
Label speculation explicitly. Never use em dashes. Keep the prose under about 500 words.
Then end with exactly one fenced \`\`\`json block of the form
{"geometry": {<key>: number, ...}, "sliders": [{"key": string, "value": number, "reason": string}]}
Only include geometry keys and slider keys you have evidence for. Geometry keys and ranges:
${rangeText(geometryRanges)}
Slider keys and ranges:
${rangeText(inputRanges)}`;

export const Route = createFileRoute("/api/analyze-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readLimitedJson(request, 3_300_000);
        if (raw.tooLarge) return Response.json({ error: "Image too large. Use a smaller image." }, { status: 413 });
        const parsed = Body.safeParse(raw.json);
        if (!parsed.success)
          return Response.json({ error: "Upload a PNG, JPEG or WebP image under about 2 MB." }, { status: 400 });
        const lim = checkLimit(clientKey(request));
        const rlHeaders = { "X-RateLimit-Remaining": String(lim.remaining) };
        if (!lim.ok) return Response.json({ error: lim.message }, { status: 429, headers: rlHeaders });
        if (!aiConfigured()) return aiNotConfiguredResponse(rlHeaders);
        const d = parsed.data;
        const fmt = (o: Record<string, number>) =>
          Object.entries(o)
            .map(([k, v]) => `${k}: ${Number(v.toPrecision(4))}`)
            .join("\n");
        const context = `Imaging modality: ${d.modality || "not given"}
Sample or condition: ${d.sample || "not given"}
Scale: ${d.scale || "not given"}

Current geometry:
${fmt(d.geometry)}

Current model inputs:
${fmt(d.inputs)}

Current model outputs:
${fmt(d.outputs)}`;

        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: aiModelId(),
          reasoning: "medium",
          system: SYSTEM,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: context },
                { type: "image", image: new URL(d.image) },
              ],
            },
          ],
          abortSignal: request.signal,
          maxRetries: 0,
          onError: ({ error }) => {
            const e = error as { statusCode?: number; message?: string };
            upstreamError = { status: e.statusCode ?? 500, message: e.message ?? "AI request failed" };
          },
        });

        const reader = result.textStream.getReader();
        const first = await reader.read().catch(() => ({ done: true, value: undefined }));
        if (first.done && upstreamError) {
          const { status, message } = upstreamError as { status: number; message: string };
          const friendly =
            status === 429
              ? "Rate limited. Please wait a moment and try again."
              : status === 402
                ? "AI Gateway credits are used up. Add credits in the Vercel project, then try again."
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
        return new Response(body, { headers });
      },
    },
  },
});
