# Cristae Lab

Mitochondrial modeling workspace. The simulator, demo profiles, Diagnosis, Dashboard, Timeline, therapy pages, and CSV exports run in the browser. Scenarios, timeline visits, and the run log stay in IndexedDB and localStorage.

## Run locally

Node.js 22 or newer:

```sh
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173). No environment file is required for the model.

Optional AI buttons (interpretation, suggestions, sensitivity explanation, micrograph analysis, and lab extraction) call [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) from the server routes under `src/routes/api/`. Copy `.env.example` to `.env` and set `AI_GATEWAY_API_KEY` for local AI. On Vercel, those routes authenticate with the deployment OIDC token, so the key is only needed off-platform. Without a credential the buttons report that AI is not configured; the rest of the app still works.

```sh
npm run build
npm run preview
```

`npm test` runs the model lock suite.

## Deploy on Vercel

This repo is set up for Vercel and is not published from here.

1. Import the Git repository at [vercel.com/new](https://vercel.com/new).
2. Confirm the framework preset is **TanStack Start** (`vercel.json` sets `framework` to `tanstack-start`). The build command is `npm run build`. Nitro writes the Vercel output during that build.
3. Leave `AI_GATEWAY_API_KEY` unset if the project should use [AI Gateway OIDC](https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc). Set it only for a local or non-Vercel runtime. `AI_GATEWAY_MODEL` is optional and defaults to `openai/gpt-6-astra`.
4. Deploy from the Vercel dashboard or CLI when you are ready. Do not commit `.env` or `.vercel`.

Server functions run on Vercel Functions with Fluid compute. AI routes allow up to 60 seconds. The in-memory rate limit is per instance.

## Notes

- Data stays in the browser except for optional AI calls.
- Clearing site data deletes saved scenarios, visits, and the run log. Use the CSV downloads to keep copies.
- Every readout is a model estimate, not a measurement, and nothing here is medical advice.
