import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "@/lib/mito/run-id.server";
import { checkLimit, clientKey, readLimitedJson } from "@/lib/mito/rate-limit.server";

const MAX = 6_000_000;
const Body = z.object({
  file: z.string().regex(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/).max(MAX),
  filename: z.string().trim().max(120).optional().default("report"),
});

const keys = ["membranePotential", "poNadh", "atpLinkedOcr", "mitosox", "h2o2", "lipidPeroxidation", "aconitase", "labileIron", "ferritin", "transferrinSaturation", "lactate", "pyruvate", "lactatePyruvate", "glucose", "h2o2Nm"] as const;

const Item = z.object({
  key: z.enum(keys),
  value: z.coerce.number().finite(),
  unit: z.string().max(40).nullable().optional(),
  printedRange: z.string().max(80).nullable().optional(),
  sourceText: z.string().max(300).nullable().optional(),
});
const Result = z.object({
  items: z.array(z.unknown()).max(40).transform((a) => a.flatMap((x) => { const r = Item.safeParse(x); return r.success ? [r.data] : []; })),
  age: z.coerce.number().int().min(0).max(120).nullable().optional().catch(null),
  sex: z.enum(["F", "M"]).nullable().optional().catch(null),
  fasting: z.preprocess((v) => (v === "yes" || v === "true" ? true : v === "no" || v === "false" ? false : v), z.boolean().nullable().optional()).catch(null),
  notes: z.string().max(1000).nullable().optional(),
});

const SYSTEM = `You read a laboratory report (photo or PDF) and extract only these analytes when printed on it:
membranePotential (mV), poNadh (P/O ratio), atpLinkedOcr (ATP-linked oxygen consumption), mitosox (fold control), h2o2 (fold control probe signal), h2o2Nm (hydrogen peroxide concentration in nM, µM or pM), lipidPeroxidation (% control), aconitase, labileIron (µM), ferritin (serum), transferrinSaturation (%), lactate, pyruvate, lactatePyruvate (lactate:pyruvate ratio), glucose.
Rules:
- Copy the value and unit exactly as printed. Do not convert units. Do not guess or infer values that are not printed.
- printedRange: the report's own reference range for that test if printed, else null.
- sourceText: the short printed line you read, with any personal identifiers removed.
- age, sex (F or M) and fasting status only if printed; else null.
- NEVER return names, dates of birth, record or accession numbers, addresses, phone numbers, or clinician names, anywhere in the output.
- If the file is not a lab report, return an empty items array and say so in notes.
Return only one JSON object: {"items":[{"key","value","unit","printedRange","sourceText"}],"age","sex","fasting","notes"}. No prose, no code fences. Never use em dashes.`;

export const Route = createFileRoute("/api/extract-labs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readLimitedJson(request, MAX + 2000);
        if (raw.tooLarge) return Response.json({ error: "File too large. Use a file under about 4 MB." }, { status: 413 });
        const parsed = Body.safeParse(raw.json);
        if (!parsed.success) return Response.json({ error: "Upload a PDF, PNG, JPEG or WebP file under about 4 MB." }, { status: 400 });
        const lim = checkLimit(clientKey(request));
        if (!lim.ok) return Response.json({ error: lim.message }, { status: 429 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured" }, { status: 500 });

        const runIdFetch = createLovableAiGatewayRunIdFetch(request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const { file, filename } = parsed.data;
        const isPdf = file.startsWith("data:application/pdf");
        const part = isPdf
          ? ({ type: "file", filename: filename.endsWith(".pdf") ? filename : "report.pdf", data: file.split(",")[1]!, mediaType: "application/pdf" } as const)
          : ({ type: "image", image: new URL(file) } as const);
        try {
          const res = await generateText({
            model: provider.responses("openai/gpt-6-astra"),
            system: SYSTEM,
            messages: [{ role: "user", content: [{ type: "text", text: "Extract the lab values from this report." }, part] }],
            abortSignal: request.signal,
            maxRetries: 0,
            providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] } },
          });
          const text = res.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
          let json: unknown;
          try { json = JSON.parse(text); } catch { return Response.json({ error: "Could not read values from this file. Try a clearer photo." }, { status: 422 }); }
          const out = Result.safeParse(json);
          if (!out.success) return Response.json({ error: "The extracted values were not in the expected format. Try again or enter them by hand." }, { status: 422});
          return Response.json(out.data);
        } catch (error) {
          const e = error as { statusCode?: number; message?: string };
          const status = e.statusCode ?? 500;
          const msg = status === 429 ? "Rate limited. Please wait a moment and try again." : status === 402 ? "AI credits are used up. Add credits in Settings, Plans and credits." : "Reading the file failed. Please try again.";
          return Response.json({ error: msg }, { status });
        }
      },
    },
  },
});
