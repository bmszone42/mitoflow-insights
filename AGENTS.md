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
- Keep shared bands and ATP flag attribution in `reference.ts`; sliders are causes and P/O is the resulting readout.
- Workspace state lives in `index.tsx`; mito components stay together; scenarios use owner-only Cloud or signed-out IndexedDB with legacy geometry defaults.

- AI interpretation streams through `src/routes/api/interpret.ts`, keeping the gateway key server-side.
- All AI routes share the in-memory rate limiter; use database limits when strict enforcement is needed.
- `inputRanges` in `src/lib/mito/model.ts` is the source of slider ranges for clamping AI suggestions and for comparison labels.
- Micrographs are resized JPEGs sent inline and never stored server-side; `geometryRanges` clamps AI suggestions.

- Ferroptosis math lives inside `simulate` in `src/lib/mito/model.ts` and exposes numeric outputs through `sensOutputs`, so Sensitivity, CSV and AI routes pick it up with no extra wiring.
- Membrane geometry feeds `simulate(inputs, geo)` only through `geometryEffects` in `model.ts` (all multipliers 1 at `defaultGeometry`), and the 3D viewer `src/components/mito/Cristae3D.tsx` is lazy-loaded after mount so three.js never runs during SSR.
- Light effects come only from `photoreceptor(i)` in `src/lib/mito/model.ts` (one downstream effect per chromophore), and the 71 THz output is a pumped coherence term inside `simulate`, so the photon chain stays auditable in one place.
- The 3D viewer shares `layout(geo)` for scene and camera presets, and uses thresholded bloom on model-driven particles, not membranes, to preserve detail.
- Warburg physiology compares ATP to cited ranges and named ROS rates to the same-geometry healthy default; unmapped steps remain unassessed. Step ATP rate is ATP/pair × routed flux ÷ 2; exclude the chain summary from totals.
- Keep patient metadata, citations, synthetic cohort values, and robust cohort flags in `patientReference.ts`; never present model proxies as clinical measurements.
