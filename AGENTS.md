<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history: force pushing, or rebasing/amending/squashing commits
> that are already pushed: as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- The whole redox model lives in `src/lib/mito/model.ts` as pure functions with a cited parameter
  block, so numbers stay auditable in one place.
- Static domain content lives in `src/lib/mito/reference.ts`, separate from the model, so reference
  text can change without touching the math.
- Workspace UI is one route (`src/routes/index.tsx`) holding the input state, with section
  components under `src/components/mito/`; `src/lib/mito/scenarios.ts` is a storage facade: Cloud `scenarios` table (owner-only RLS, whole scenario in `data` jsonb) when signed in, browser IndexedDB when signed out, so callers never branch on auth.

- AI interpretation runs through one streaming server route `src/routes/api/interpret.ts` (Responses API, openai/gpt-6-astra) so the gateway key stays server-side.
- All AI routes (`/api/interpret`, `/api/suggest`, `/api/analyze-image`, `/api/explain-sensitivity`) go through `src/lib/mito/rate-limit.server.ts` (in-memory, per instance) so abuse limits live in one place; move to a database if strict limits are needed.
- `inputRanges` in `src/lib/mito/model.ts` is the source of slider ranges for clamping AI suggestions and for comparison labels.
- Micrograph analysis runs through `src/routes/api/analyze-image.ts` (Responses API, image sent inline as a resized JPEG data URL, never stored server side); Structure geometry state lives in `src/routes/index.tsx` and `geometryRanges` in `model.ts` clamps AI geometry suggestions.

- Ferroptosis math lives inside `simulate` in `src/lib/mito/model.ts` and exposes numeric outputs through `sensOutputs`, so Sensitivity, CSV and AI routes pick it up with no extra wiring.
