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

- Redox math lives in `model/` behind the `model.ts` barrel (import the barrel); ATP/P/O bands in `reference.ts`; fuel changes flux, not P/O.
- State in `index.tsx`; scenarios use owner-only Cloud or signed-out IndexedDB with legacy geometry defaults.
- AI interpretation streams through `api/interpret.ts`; key stays server-side.
- AI routes share an in-memory limiter; use database limits for strict enforcement.
- `inputRanges` in `model.ts` supplies slider bounds for AI clamping and comparison labels.
- Micrographs are resized JPEGs sent inline and never stored server-side; `geometryRanges` clamps AI suggestions.

- Membrane geometry feeds `simulate(inputs, geo)` only through `geometryEffects` in `model.ts` (all multipliers 1 at `defaultGeometry`), and the 3D viewer `src/components/mito/Cristae3D.tsx` is lazy-loaded after mount so three.js never runs during SSR.
- 3D viewer shares `layout(geo)`; bloom affects particles, not membranes.
- Reuse `atpComparisonRows` and `IronLightMap` across views.

- Simulator UI is split: `SliderPanel.tsx` owns controls and presets, `PatientRunBanner.tsx` wraps the patient-run notice and readouts, `TherapyEffectTable.tsx` owns before/after therapy rows, and `SimulatorCharts.tsx` holds every recharts chart (lazy-loaded behind Suspense so recharts stays out of the initial bundle); keep new Simulator sections in their own files to stop Simulator.tsx regrowing.
- Charts inside `ScenarioCompareTable.tsx` (e.g. `ScenarioGapChart.tsx`) are separate modules lazy-loaded with `lazy()` + `<Suspense>`; why: the table itself is imported eagerly by Dashboard and Diagnosis, so a static recharts import in it would pull the charting library into those initial bundles.
- Projected flag clearance picks its therapy only via `bestProjectionTherapy` in `treatment.ts` (all therapies, or the one picked via onlyId); Diagnosis, the Timeline and the dashboard each expose the same single-therapy picker; why: all pages and CSVs must agree.
- Real-world dose anchors carry their source in `doseSource` on the `Therapy`; the Therapy plan, Therapy calculator and Therapy comparison render it as a link and the calculator's and comparison's CSVs export it. Only sources that resolve (checked live) are kept; therapies with no clinical dose get none.
- Local-only build: no auth UI, no cloud sync; scenarios persist in IndexedDB via src/lib/mito/scenarios.ts and AI replies in localStorage. Why: single user running the app on their own machine.
- Therapy UI is consolidated: /therapy-tools holds calculator and comparison tabs; /therapy-plan holds Suggestions, Pairs and Schedule tabs via ?tab=; old routes were deleted, not redirected. Why: overlapping routes confused navigation.
- Run logging goes through recordRun in src/lib/mito/runs.ts (IndexedDB "cristae-lab-runs", dedupe key patient|source|dose|therapies); any new page that simulates therapies must call it. Why: the progress page stays truthful only if every simulation site logs.
- Exploratory levers (made-up, or dose-anchored via src/lib/mito/doseAnchors.ts with trial doses and an assumed effect size) stay local component state, are labeled as such, and never enter Inputs, flags or scenarios; why: keeps cited model outputs clean.
- Every study reference gets a synopsis and 0-100 score in src/lib/mito/referenceLibrary.ts keyed by DOI; the /references page reads it. Why: one scored library for all sources.
- Carrier efficiency levers live in src/lib/mito/carriers.ts (applyCarriers maps 0-2x rates onto existing Inputs, clamped by inputRanges) and stay local to /carriers; why: made-up rates must never reach flags, scenarios or Diagnosis.
- Mitophagy is the model input mitoHalfLife (published turnover half-lives) handled by qualityControl in model.ts, neutral at the 17.2 d default; the urolithin A card in mitophagy.ts only shortens it locally. Why: turnover must change the model math while defaults keep cited outputs stable.
- Scheduled strength snaps live in src/lib/mito/snapPlan.ts (localStorage cristae-lab-snap-plan) and only apply on user confirm on the Therapy plan Schedule tab, writing per-profile overrides via saveProfileRirr; why: dates mark snaps due without silently changing model strength.
- Timeline visit-gap chart orders rows by date and breaks the combined-gap line at visits without a pair; why: connecting gap-ranked or missing-pair visits would imply a false time trend.
- Timeline visits persist in IndexedDB "cristae-lab-visits" (user/real/plan rows only, fire-and-forget writes, hydrate on first useVisits); why: pasted measurements must survive a reload like runs do.
- Selected profile is shared via useSelectedProfile (localStorage, ?profile= wins); why: a profile picked on one page must carry to every page.
- Start here explainer is one shared component (StartHereCard.tsx) with per-page storageKey, steps and strengthWhere; why: definitions must match everywhere while each page names only its own controls.
- /runs?profile= shows one profile's logged runs only and hides the tool panels until "Show the tools"; why: a Dashboard row click must land on that profile's rows.

