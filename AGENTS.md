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

- Membrane geometry feeds `simulate(inputs, geo)` only through `geometryEffects` in `model.ts` (all multipliers 1 at `defaultGeometry`), and the 3D viewer `src/components/mito/Cristae3D.tsx` is lazy-loaded after mount so three.js never runs during SSR.
- 3D viewer shares `layout(geo)`; bloom affects particles, not membranes.
- Reuse `atpComparisonRows` and `IronLightMap` across views.

- Simulator UI is split: `SliderPanel.tsx` owns controls and presets, `PatientRunBanner.tsx` wraps the patient-run notice and readouts, `TherapyEffectTable.tsx` owns before/after therapy rows, and `SimulatorCharts.tsx` holds every recharts chart (lazy-loaded behind Suspense so recharts stays out of the initial bundle); keep new Simulator sections in their own files to stop Simulator.tsx regrowing.
- Projected flag clearance picks its therapy only via `bestProjectionTherapy` in `treatment.ts` (all therapies, or the one picked via onlyId); Diagnosis, the Timeline and the dashboard each expose the same single-therapy picker; why: all pages and CSVs must agree.
- Real-world dose anchors carry their source in `doseSource` on the `Therapy`; the Therapy plan, Therapy calculator and Therapy comparison render it as a link and the calculator's and comparison's CSVs export it. Only sources that resolve (checked live) are kept; therapies with no clinical dose get none.
- Local-only build: no auth UI, no cloud sync; scenarios persist in IndexedDB via src/lib/mito/scenarios.ts and AI replies in localStorage. Why: single user running the app on their own machine.
- Therapy UI is consolidated: /therapy-tools holds the dose calculator and comparison as tabs, /therapy-plan holds flagged therapies plus the per-cause plan; old routes only redirect. Why: five overlapping therapy routes confused navigation.
