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

- Keep cited redox math in `src/lib/mito/model.ts` for auditability.
- Keep shared bands in `src/lib/mito/reference.ts` and show them in `src/components/mito/Physiology.tsx`; shared bands align network and physiology flags without changing math.
- Workspace state lives in `src/routes/index.tsx`; components in `src/components/mito/`; scenarios in `src/lib/mito/scenarios.ts` use owner-only Cloud or signed-out IndexedDB and legacy geometry defaults.

- AI interpretation streams through `src/routes/api/interpret.ts`, keeping the gateway key server-side.
- All AI routes (`/api/interpret`, `/api/suggest`, `/api/analyze-image`, `/api/explain-sensitivity`) go through `src/lib/mito/rate-limit.server.ts` (in-memory, per instance) so abuse limits live in one place; move to a database if strict limits are needed.
- `inputRanges` in `src/lib/mito/model.ts` is the source of slider ranges for clamping AI suggestions and for comparison labels.
- Micrograph analysis runs through `src/routes/api/analyze-image.ts` (Responses API, image sent inline as a resized JPEG data URL, never stored server side); Structure geometry state lives in `src/routes/index.tsx` and `geometryRanges` in `model.ts` clamps AI geometry suggestions.

- Ferroptosis math lives inside `simulate` in `src/lib/mito/model.ts` and exposes numeric outputs through `sensOutputs`, so Sensitivity, CSV and AI routes pick it up with no extra wiring.
- Membrane geometry feeds `simulate(inputs, geo)` only through `geometryEffects` in `model.ts` (all multipliers 1 at `defaultGeometry`), and the 3D viewer `src/components/mito/Cristae3D.tsx` is lazy-loaded after mount so three.js never runs during SSR.
- Light effects come only from `photoreceptor(i)` in `src/lib/mito/model.ts` (one downstream effect per chromophore), and the 71 THz output is a pumped coherence term inside `simulate`, so the photon chain stays auditable in one place.
- The 3D viewer shares `layout(geo)` for scene and camera presets, and uses thresholded bloom on model-driven particles, not membranes, to preserve detail.
