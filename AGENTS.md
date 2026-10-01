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

- Redox math in `model.ts`; ATP/P/O bands in `reference.ts`; fuel supply changes flux, not P/O.
- State in `index.tsx`; scenarios use owner-only Cloud or signed-out IndexedDB with legacy geometry defaults.
- AI interpretation streams through `api/interpret.ts`; key stays server-side.
- AI routes share an in-memory limiter; use database limits for strict enforcement.
- `inputRanges` in `model.ts` supplies slider bounds for AI clamping and comparison labels.
- Micrographs are resized JPEGs sent inline and never stored server-side; `geometryRanges` clamps AI suggestions.

- Ferroptosis math lives in `simulate` and exposes numeric `sensOutputs` to Sensitivity, CSV and AI routes.
- Membrane geometry feeds `simulate(inputs, geo)` only through `geometryEffects` in `model.ts` (all multipliers 1 at `defaultGeometry`), and the 3D viewer `src/components/mito/Cristae3D.tsx` is lazy-loaded after mount so three.js never runs during SSR.
- Light effects come from `photoreceptor(i)` in `model.ts`; 71 THz is a pumped coherence term in `simulate`.
- 3D viewer shares `layout(geo)`; bloom affects particles, not membranes.
- Warburg compares ATP with cited ranges and ROS with same-geometry defaults. ATP step rate = ATP/pair × routed flux ÷ 2; omit chain summary. ROS gap counts five primary O2•- sites once, including OGDH.
- Keep invented patient data in `patientReference.ts`: paired L:P, age/fasting flags, proxies not assays. Entered ROS flags require matched local controls; no persistence.
- Keep setting bands in `settingsReference.ts`; non-comparable controls stay unflagged. Published controls stay separate from simulated ATP baselines to prevent false measurement claims.
- Reuse `atpComparisonRows` and `IronLightMap` across views.
- Verified study metadata belongs in `studyReferences.ts`; publication spans are not claim-specific pages.
- ROS flags are simulated, nonclinical; driver effects reset one changed input at a time, include indirect paths, and do not add.
