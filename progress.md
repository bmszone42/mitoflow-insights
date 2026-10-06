## JSON export bumped to version 3 (2026-10-05) ✅
- ✅ scenariosExportPayload in src/lib/mito/scenarios.ts now emits version 3 with a summary.versionNote listing what changed since version 2: per-scenario defencesOnlyGap, the healthyReference block, the referenceProfile block with its own defencesOnlyGap, and scenario rows sorted by defences-only gap, weakest defences first, matching the compare table's default sort.
- ✅ Import is unchanged: scenariosFromJson accepts any versioned payload plus the older flat array, so version 2 files still load.
- ✅ Verified live: seeded a scenario, clicked Export JSON on the Simulator, read the file back (version 3, versionNote present, row gap +486.3%, reference gap +3.9%), and round-tripped it through the importer (1 scenario).

## Recalibrate: Williams SOD and glutathione anchor (2026-10-05) ✅
- ✅ Anchor picker: weakest 0.2x (Melov method) or Williams-derived defences from SOD and glutathione drops (default 50/30 gives 0.6x, ASSUMED equal weighting)
- ✅ Strength fitted from aconitase at the chosen defence level; curve follows the anchor
- ✅ Williams reference entry updated with the anchor and pending strength label (score 76/100)
- ❌ Williams aconitase % still unread (paywalled)

## All-18 strength slider widened to 0-1.5 (2026-10-05) ✅
- ✅ The strength picker beside "Clear log and re-run all 18" on the Progress page is now a slider covering the full range the model supports (0 to 1.5, step 0.05) instead of the three fixed choices 0.5x/1x/2x; data-testid `clear-rerun-all-strength` unchanged, new `clear-rerun-all-strength-value` readout next to it.
- ✅ The button label, the confirm dialog and every logged cell follow the slider value, so a recalibrated strength such as 0.35x or 0.6x can be batch-run without typing anything into the Recalibrate box.
- ✅ Caption under the grid now states the slider range and what the ends mean (0 = no ROS-induced ROS release, 1.0x = the current partly published fit).
- ✅ Verified live: slider props min 0 / max 1.5 / step 0.05; setting 0, 0.35, 0.6 and 1.5 updates the readout and the button label ("... at 0.35x"); the confirm dialog reads "re-run all 18 profiles at 0.6x ROS-induced strength? This logs 2880 runs"; no page errors, build OK.

## Williams 1998 entry on the References page (2026-10-05) ✅
- ✅ Added Williams et al. 1998 (JBC 273(43):28510-28515, DOI 10.1074/jbc.273.43.28510, Crossref-verified) to studyReferences.ts next to Melov 1999, section "ROS, iron and assays".
- ✅ Library entry carries the public drops (MnSOD down ~50%, glutathione down ~30%, aconitase reported only as "decreased", figure paywalled, no public percentage) and the fitted strength label: the Recalibrate helper fits from its aconitase % once supplied, but the current 1.0x default is the Melov 1999 brain fit, not this paper. Scored 74/100 (relevance 36, evidence 24, usability 14).
- ✅ Verified live on /references: entry renders with synopsis, usedFor and score; no page errors.

## Strength vs aconitase curve in Recalibrate (2026-10-05) ✅
- ✅ New src/components/mito/RecalibrateCurve.tsx: line chart of the model's Fe-S intact % at the weakest defences (antioxidant capacity 0.2x) against ROS-induced strength from 0 to 1.5x, falling from 72% to 15%; a dashed line marks the pasted aconitase number and a red dot marks the fitted strength.
- ✅ aconitasePct, S_MIN and S_MAX are exported from RecalibrateStrength.tsx so the curve and the fit share one source of truth; the chart is lazy-loaded so recharts stays out of the Progress page's initial bundle.
- ✅ Verified live: pasting 45% fits 0.6x (model gives 45.1%) and the curve, dashed line and dot render with no page errors.

## Saved ROS-induced strength default (2026-10-05) ✅
- ✅ New src/lib/mito/rirrDefault.ts: savedRirrStrength/saveRirrStrength/clearRirrStrength over localStorage key "cristae-lab-rirr-default" (browser-only, 0-1.5 validated).
- ✅ RecalibrateStrength.tsx gained "Save as my default" (disabled when the fit is clamped), a saved-default line with a Clear button, and a note that it does not touch the Progress log.
- ✅ src/routes/index.tsx applies the saved strength after mount (useEffect, so SSR never reads localStorage); the Simulator starts at the saved value from then on.
- ✅ Verified live: fitted 0.6x from 45% aconitase, saved, reloaded the Simulator, strength slider reads 0.6; no page errors.

## Timeline visit-gap bar chart (2026-10-05) ✅
- ✅ New TimelineGapChart.tsx (lazy-loaded, recharts): per-visit superoxide, ATP and free iron gaps vs the healthy adult (model defaults) as %, sorted by superoxide gap biggest first; red when worse than healthy (superoxide/iron above, ATP below), green at or better; dashed healthy line. Strength lines are per therapy (each therapy's dose multiplier on a 0-2x right axis, line breaks on visits without it), cycling the theme chart palette.
- ✅ timeline.ts gained visitSim (full simulate output per visit, sharing visitSimInputs with visitReadouts); timeline.tsx caches it in simCache and renders the chart under the table.
- ✅ Verified live on demo-04: 12 bars (4 visits x 3 metrics), red/green correct, sorted 71% > 64% > 20% > 5%, no page errors.

## Strength picker on the re-run all 18 button (2026-10-05) ✅
- ✅ NotYetRun.tsx: "Clear log and re-run all 18" gained a strength control (0.5x, 1x, 2x, default 1x); the batch logs every cell at the picked strength and the button label follows it.
- ✅ Verified live: options 0.5x/1x/2x, label updates, 2x batch confirmed logging (2880 cells). Superseded: now a 0 to 1.5 slider (see top entry).

## JSON export summary sorted by defences-only gap (2026-10-05) ✅
- ✅ scenariosExportPayload sorts summary.scenarios by defencesOnlyGap descending (weakest defences first), matching the compare table's default sort; referenceNote states the rule so JSON and table agree.
- ✅ Verified live: seeded Weak/Mid/Strong scenarios, exported JSON from the Simulator, rows read Weak +486%, Mid +55%, Strong -48% in that order. Typecheck clean.

## Defences-only gap bar chart on the compare table (2026-10-05) ✅
- ✅ New `src/components/mito/ScenarioGapChart.tsx`: horizontal bars of every saved scenario's defences-only gap, always sorted weakest defences first, red above the healthy level and green at or below, the reference profile in a neutral colour, dashed line at the healthy level (0%), percent printed at each bar end.
- ✅ `ScenarioCompareTable.tsx` renders it under the table (Dashboard and Diagnosis), lazy-loaded with `lazy()` + `<Suspense>` so recharts stays out of those routes' initial bundles; the chart keeps its own order even when the table is sorted by superoxide or last updated.
- ✅ Verified live with three seeded scenarios on /dashboard and /diagnosis?profile=demo-04: bars read Weak +486% (red), Demo 04 reference +143% (grey), Mid +100% (red), Strong -60% (green); switching the table sort to Last updated flipped the table rows but left the chart weakest-first; no page errors. Typecheck clean.

## Reference profile gap in the JSON export summary (2026-10-05) ✅
- ✅ scenariosExportPayload takes an optional reference ({ label, inputs }); the summary gains a healthyReference block (model-default superoxide, ATP, peroxide, free iron) and a referenceProfile block (label, live recomputed readouts, defencesOnlyGap) mirroring the CSV's "reference profile" row. Fields now match between cristae-lab-scenarios.json and cristae-lab-scenario-compare.csv. Payload stays version 2 (additive fields).
- ✅ New shared defencesGapFromInputs in scenarios.ts; scenarioDefencesGap and ScenarioCompareTable's reference gap both call it, so table, CSV and JSON can never disagree.
- ✅ Scenarios.tsx export passes the healthy adult (demo-01, the Dashboard compare table's default reference) as the reference; summary.referenceNote states which reference was used.
- ✅ Verified live: clicked Export JSON, downloaded file shows referenceProfile Demo 01 with defencesOnlyGap 0 (healthy default) and the same readouts as the CSV's reference row. Typecheck clean.

## Sort toggle on the scenario compare table (2026-10-05) ✅
- ✅ ScenarioCompareTable gains a sort picker above the table: Defences gap (weakest first), Superoxide (highest first) and Last updated (newest first); pill buttons with aria-pressed, data-testids spc-sort-gap, spc-sort-superoxide, spc-sort-updated. Healthy and reference rows stay pinned at the top. CSV follows the currently picked order. Caption updated.
- ✅ Verified live on /dashboard with three seeded scenarios: gap and superoxide put B weak first, Last updated puts A mid (newest) first; switching changes the order live, no page errors. Typecheck clean.

## Colored "vs healthy" lines for ATP, free iron and peroxide (2026-10-05) ✅
- ✅ ScenarioCompareTable (Dashboard and Diagnosis): every "vs healthy" line is now colored like superoxide. Superoxide, free iron and peroxide go red above the healthy adult and green at or below; ATP goes red BELOW healthy (an ATP shortfall is the bad direction) and green at or above. "vs profile" lines stay neutral. Caption under the table explains the coloring. data-testids: spc-vs-healthy-so, spc-vs-healthy-atp, spc-vs-healthy-fe, spc-vs-healthy-h2o2.
- ✅ Verified live on /dashboard with two seeded scenarios: Weak defences (superoxide +486% red, free iron +162% red, peroxide +318% red, ATP +0% green), Strong defences (all green, superoxide -55%, iron -30%, peroxide -50%). No page errors. Typecheck clean.

## Defences-only gap in the JSON export summary (2026-10-05) ✅
- ✅ New shared `scenarioDefencesGap` in src/lib/mito/scenarios.ts (same matched-healthy comparison as the Dashboard, Timeline and compare table). `ScenarioSummaryRow` gains an optional `defencesOnlyGap` and `scenariosExportPayload` fills it for every scenario.
- ✅ ScenarioCompareTable now calls the shared helper, so table, CSV and JSON export can never disagree.
- ✅ Verified live: clicked Export JSON on /, downloaded file carries `defencesOnlyGap: 486.3` for the seeded 0.4x-defences scenario, matching the compare table (+486%). Payload stays version 2 (optional field, backward compatible). Typecheck clean.

## Compare table sorted by defences-only gap (2026-10-05) ✅
- ✅ ScenarioCompareTable scenario rows are sorted by the Defences only gap, weakest defences first (largest positive gap at the top); the healthy and reference rows stay pinned at the top. CSV rows follow the same sorted order. Caption under the table notes the sorting. Verified live on /diagnosis with two seeded scenarios: Weak defences (+486%) first, Strong defences (-69%) second. Typecheck clean.

## Reference profile defences-only gap in compare table (2026-10-05) ✅
- ✅ ScenarioCompareTable takes a new optional `referenceInputs` prop; the reference profile row now shows its own defences-only gap (data-testid `spc-reference-gap`), computed from its inputs with the same matched-healthy comparison as scenarios (healthy defaults at the profile's membrane potential, iron and L:P held at healthy). Red above healthy, green at or below; CSV row carries it too.
- ✅ Both call sites pass inputs: Diagnosis (`profileInputs(d.patient)`) and Dashboard (`profileInputs(compareRow.p)`). Verified live: Demo 04 (Leigh) reference row reads +143%. Typecheck clean.
## Scenario compare CSV download (2026-10-05) ✅
- ✅ New "Download CSV" button on the shared ScenarioCompareTable (Dashboard and Diagnosis, data-testid `spc-csv`, shown once at least one scenario is saved). File `cristae-lab-scenario-compare.csv` mirrors the table: healthy adult row, reference profile row, then one row per scenario.
- ✅ Columns match the JSON export summary fields (scenario ID, name, ROS-induced strength + whether it was noted, preset, readouts, updated ISO time) plus live recomputed superoxide, ATP, free iron and peroxide, each with "vs healthy" and "vs profile" percent columns, and the same model-estimates note as the page.
- ✅ Verified live on /diagnosis with a seeded scenario: healthy 0.0124 nM, reference Demo 04 0.0212 nM, scenario 0.0335 nM (+170% vs healthy, +58% vs profile, strength 1x, noted yes). Button also present on /dashboard. Typecheck clean.
## Scenario compare on Dashboard and Diagnosis (2026-10-05) ✅

- New shared ScenarioCompareTable component: saved scenarios recomputed live from their own settings, compared with a reference profile's simulated superoxide, ATP, free iron and peroxide, each with a "% vs profile" line (superoxide red above, green at or below).
- Diagnosis: "Saved scenarios vs this profile" section follows the selected profile. Dashboard: "Saved scenarios vs a profile" card with a reference profile picker (default healthy adult). Empty state points to the Simulator. Verified live on both pages with a seeded scenario (Demo 04 reference: scenario at 1x strength showed -41% superoxide, -25% ATP), no page errors; typecheck and build clean.

## Scenario compare vs healthy adult (2026-10-05) ✅
- The scenario compare table now opens with a "Healthy adult (reference)" row computed from model defaults, and every scenario cell shows a "% vs healthy" line under the value for superoxide, ATP, free iron and peroxide.
- Superoxide above healthy shows in red, at or below in green; ATP, iron and peroxide percents are neutral. Values still recomputed live from each scenario's settings. Typecheck and build clean.

## Timeline chart dot colors from the defences-only gap (2026-10-04) ✅
- Timeline chart dots are colored by the defences-only gap: red when above the healthy level, green at or below (same tokens as the table column). Visit dots use gap.before; plan dots use gap.after, falling back to before.
- chart points now carry gapBefore/gapAfter from the simCache gap; TimelineChart renders custom dot shapes per Line (gating on props.value, since recharts calls the renderer for null rows too; dots appear only after the line's entry animation finishes).
- Caption under the chart explains dot colors. Verified live: Demo 04 all four dots red (+134/+104/+98/+65%); Demo 01 green/green/red/green (0/-4/+6/-6%), matching the Defences only column. Typecheck clean.

- Diagnosis page gains a Model dose picker (0.25x to 2x) beside Therapy flags; diagnoseProfile and diagnoseAll take a dose parameter, so the Therapy flags list, its counts and the all-profiles table Therapies column follow the chosen dose and match the dashboard (verified: Leigh 13 at 1x, 14 at 2x, 11 at 0.25x).

## Dashboard therapy flag count (2026-10-03) ✅
- Dashboard table flag column reads "Flags: lab / assay / model / therapy (dose)"; the therapy count follows the model dose picker and matches the Diagnosis page at 1x (verified: sepsis 15, Leigh 13 at 1x; Leigh 14 at 2x).
- Dashboard CSV gains a "Therapy flags (dose)" column between Model flags and Total flags (total still lab + assay + model, since therapy flags are model levers, not abnormal flags).
- Batch therapy CSV gains a "Therapy flags" column after Total flags, and its footer note explains that therapy flags count model therapies and are not part of Total flags.
- Dashboard header text explains the therapy count. Verified live: Demo 15 = 11/5/2/15 (total 18), Demo 04 = 9/6/2/13 matching Diagnosis, both CSVs carry the new columns, no page errors; typecheck clean.

- ✅ Projected peroxide: measured nM scaled by model H2O2 change, in the Simulator therapy table and a dashboard column + CSV (follows dose and Batch therapy picker)
- ✅ Projected MitoSOX: measured fold scaled by model superoxide change, in the Simulator therapy table and a dashboard column + CSV; flag clears when the projection re-enters the 0.59-1.5x band
- ✅ Projected flags on Diagnosis: measured MitoSOX / peroxide band flags shown with the strongest therapy's projected value at the chosen model dose, separate from the measured flag counts; note explains clearance is a model estimate, not a lab result, and why iron chelation and lipid radical-trapping never lower model peroxide while NAD+ precursors can raise it
- ✅ Best-therapy choice for projected flags unified (Diagnosis and dashboard agree)
- ✅ Timeline projected flag column (MitoSOX and peroxide per visit, follows each visit's therapies and model doses)
- ✅ Therapy plan page (/therapy-plan): flagged therapies per profile and model dose with projected flag clearance, CSV

## Timeline plan rows (2026-10-03) ✅
- New "Add a plan row" section: saves therapies and model doses for a date without new labs; the row reuses the latest earlier visit's labs and shows in the table as "Plan (no new labs)".
- Plan rows get the same simulated readouts and Projected flag column (MitoSOX and peroxide clearance) as real visits, removable via the trash icon; tab-only, never saved.
- Verified live: Leigh plan row with the antioxidant at 1x shows MitoSOX 1.32x to 1.12x, no page errors; typecheck and build clean.

## Therapy plan real-world dose column (2026-10-03) ✅
- Each therapy in treatment.ts gains a clinicalDose field: the published clinical or trial dose the 1x model dose is anchored to (e.g. MitoQ 20-40 mg/day, deferiprone 75-100 mg/kg/day, NAC 600-1800 mg/day; research-only levers say so).
- Therapy plan table gains a "Real-world dose (1x anchor)" column; at doses other than 1x a note says the model dose scales the slider move only, not this dose. CSV gains the same column and footer wording.
- Page note: the link between model lever and literature is illustrative, never a dosing guide. Verified live (1x and 2x), no page errors; typecheck clean.

## Therapy plan dose-source links (2026-10-04) ✅
- Each therapy in treatment.ts gains an optional doseSource { text, url }: the label, fact sheet or trial listing behind its real-world dose anchor (Ferriprox/Exjade EMA labels, DailyMed for deferoxamine and methylene blue, ClinicalTrials.gov searches for trial-dose compounds, NIH ODS fact sheets for CoQ10/riboflavin/selenium/vitamin E, MedlinePlus for oxygen therapy, Hamblin 2017 for PBM). Therapies with no clinical dose (mild uncoupling, nitric oxide reduction, mitochondria-targeted chelator) get none.
- Therapy plan table: each real-world dose anchor shows its source as a link (data-testid plan-dose-source-<id>); CSV gains a "Dose source" column with the source name and URL. Footer note says links are informational only.
- Every URL checked live before adding (one 404 found and replaced). Verified in the browser: 85 source links render across the 18 profiles, CSV header and rows carry the new column, no page errors; typecheck and build clean.

- [x] Timeline: Convert to visit button on plan rows copies date, therapies and model doses into the Add a visit form; the saved visit shows projected flag clearance on the table and chart (verified live on Leigh syndrome: antioxidant 1x, MitoSOX 1.32x to 1.12x, within band).

## Dose anchor on calculator and comparison (2026-10-04) ✅
- Therapy calculator: info section shows "Real-world dose anchor (1x)" with the clinical dose and its doseSource link (data-testid calc-dose-anchor, calc-dose-source-<id>), plus the "model dose scales the slider move only, not this dose" note.
- Therapy comparison: each therapy card shows the same anchor and source link (cmp-dose-anchor-<id>, cmp-dose-source-<id>); both CSV scopes (this profile / all profiles) gained the dose anchor text, the dose source name and URL, and an illustrative-not-dosing-guide footer line; the this-profile CSV keeps note and evidence.
- Verified live: anchors render for MitoQ and NR with working links, uncoupling shows no source link, CSV rows carry anchor and source, no page errors. AGENTS.md rule updated to cover all three pages.
- [x] ✅ Real-world visit type on Timeline (actual labs and doses, shown as filled points beside plan rows on the chart)

## Single-therapy override on Diagnosis and Timeline (2026-10-04) ✅
- diagnoseProfile and diagnoseAll take an optional onlyId, passed to bestProjectionTherapy, so the Projected flags pick can be pinned to one therapy.
- Diagnosis page: Therapy picker beside Projected flags ("Strongest therapy" default, or any therapy), matching the dashboard's Batch therapy choice.
- Timeline: "Projected flag therapy" picker; "Each visit's own therapies" keeps the per-visit projection, a picked therapy shows the Diagnosis projection for that therapy at 1x in every row.
- Verified live: Leigh syndrome with the mitochondria-targeted antioxidant pinned shows MitoSOX 1.58x to 1.34x, flag clears, identically on Diagnosis, the dashboard (Batch therapy) and the Timeline. Build and typecheck clean.

## Dashboard sweep memoization (2026-10-04) ✅
- Split the dashboard's single useMemo in two: a heavy memo keyed on [users, dose, batchTherapy] runs every per-profile simulation and the 20-therapy sweep, and a light memo keyed on [simulated, readoutOnly] only re-filters the display list.
- Toggling "Only therapies that change ATP, superoxide or peroxide" no longer re-runs the ~360 simulations; dose and batch-picker changes still do, as they must.
- Build OK.

## Timeline per-visit memoization (2026-10-04) ✅
- Per-visit simulation cache (useRef Map) keyed on profile, visit id, pinned projection therapy and visit content (labs, peroxide, therapies, doses): a visit's diagnosis, readouts and projection recompute only when that visit changes, not when form state or other visits do. Cache cleared past 200 entries.
- Chart derivation wrapped in useMemo keyed on [timeline, metric].
- Build OK.

## Persistent top nav (2026-10-04) ✅
- [x] Sticky top nav in `src/routes/__root.tsx` (data-testid="top-nav"): Simulator, Dashboard, Diagnosis, Timeline, Therapy plan, Lab ranges; active link highlighted; every page one click away.

## Offline-only local build (2026-10-04) ✅
- [x] Removed the sign-in button (`AccountButton.tsx`) and the `/auth` page; no auth UI remains.
- [x] Scenarios are browser-only: `scenarios.ts` now uses IndexedDB exclusively (cloud sync, copy-to-account and driver-reply cloud saves removed; Compare AI replies stay in localStorage).
- [x] `start.ts` no longer attaches a cloud auth token to server functions.
- [x] Dropped unused `drizzle-orm`, `drizzle-kit` and `postgres` packages.
- [x] Verified live: home page renders with top nav, zero sign-in mentions, no page errors.
- Note: AI interpretation still calls the built-in AI gateway, so it needs an internet connection; everything else runs fully offline.

## Offline-only local build (2026-10-04) ✅
- [x] Removed the sign-in button (`AccountButton.tsx`) and the `/auth` page; no auth UI remains.
- [x] Scenarios are browser-only: `scenarios.ts` now uses IndexedDB exclusively (cloud sync, copy-to-account and driver-reply cloud saves removed; Compare AI replies stay in localStorage).
- [x] `start.ts` no longer attaches a cloud auth token to server functions.
- [x] Dropped unused `drizzle-orm`, `drizzle-kit` and `postgres` packages.
- [x] Verified live: home page renders with top nav, zero sign-in mentions, no page errors.
- Note: AI interpretation still calls the built-in AI gateway, so it needs an internet connection; everything else runs fully offline.

## Therapy pages merged (2026-10-04) ✅
- [x] `/therapy-tools` replaces `/therapy-calculator` and `/therapy-compare`: two tabs (Dose calculator, Compare two therapies) sharing one profile picker; old URLs redirect with their search params.
- [x] `/treatment-plan` folded into `/therapy-plan`: picking a single profile shows the "Plan by cause" section with the combined plan; old URL redirects.
- [x] Top nav gained Therapy tools; links on Treatment, Diagnosis, dashboard and Therapy plan updated.
- [x] Verified live: both tabs render, redirects land correctly, Plan by cause and Combined plan show for Leigh syndrome, no page errors.

## Scenario progress page (2026-10-04) ✅
- [x] `/runs` page (nav: Progress) logs every simulated profile / therapy / model-dose combination to a local IndexedDB store (`cristae-lab-runs`); nothing leaves the browser.
- [x] Logging wired into the Dashboard sweep, Therapy tools (calculator = full dose sweep, comparison = the picked pair) and Therapy plan.
- [x] Exact repeats are deduped and marked "repeated" with a run count; Clear log button wipes the log.
- [x] Verified live: 21 combinations across 18 profiles logged, repeat of the calculator run flagged, no page errors.

## Run locally guide (2026-10-04) ✅
- [x] README gained a "Run locally (fully offline)" section: bun install, bun run dev, no .env needed; production build steps; data-stays-local notes.
- [x] `.env.example` documents the two optional values (LOVABLE_API_KEY for AI buttons, cloud keys only if cloud features are re-enabled); neither is required offline.

## Literature log: SLC25A34 (2026-10-04) ✅
- [x] Karavaeva et al., Science 2026, DOI 10.1126/science.adz4797 added to study references (ATP and respiratory controls).
- [x] Physiology references gained a Mitochondrial carriers table: Mitoferrin-1/2 (SLC25A37/28) beside SLC25A34 (oxaloacetate importer), qualitative only.
- [x] Evaluated an OAA/anaplerosis slider for Warburg routing: not added. The paper gives adipocyte-specific, qualitative data, no transferable flux; the model already folds TCA carbon supply into the NADH ratio and fuel supply.
- ❌ Revisit an anaplerosis lever if a source gives a tissue-general OAA import or pyruvate carboxylase flux.
 - [x] Oxaloacetate supply explorer (made-up, unvalidated) on the Warburg dashboard: 0-2x lever scales the NADH pool by an invented saturating curve and shows ATP and superoxide change; never alters sliders, flags, scenarios or diagnosis.
 - [x] Citation verified against the journal page and Crossref: Science 394(6819), Article eadz4797, 1 Oct 2026, 64 authors (first: Iuliia Karavaeva; seniors: Zachary Gerhart-Hines, Mitchell A. Lazar). Study references and the carriers table now carry the full volume, issue and article number.

## Literature log: Multifaceted mitochondria (2026-10-04) ✅
- [x] Monzel, Enríquez, Picard. Nature Metabolism 5(4):546-562 (2023), DOI 10.1038/s42255-023-00783-1 (via @dantawfik post), verified on Crossref and added to study references.
- [x] Reference library page `/references` (nav: References): every study with synopsis and score /100 (relevance 40 + evidence 30 + usability 30), search and section filter.
- ❌ Rename "dysfunction"-style wording toward the paper's levels (activity vs function vs behavior) in flags.

## Oxaloacetate slider on the Simulator (2026-10-04)
- [x] MADE-UP OAA supply slider added to the Simulator's fuel presets area (SliderPanel, data-testid sim-oaa); moving it scales the NADH / NAD+ pool slider by the invented saturating curve from OaaSupplyExplorer.
- [x] Verified live: slider renders at 1x and moves to 1.5x; build and typecheck clean.

## OAA slider as a visible Warburg control (2026-10-04)
- [x] OaaSupplyExplorer moved inside the Warburg dashboard control card, next to the fuel presets (was a separate card above).
- [x] Ran the lever on the Leigh syndrome baseline visit (2026-01-15): ATP 60.8 -> 48.8 uM/s at 0.5x (-19.8%), 70.5 at 2x (+15.8%); superoxide changes are percent noise on a 0.01 nM baseline.
- [x] OAA explorer chart: ATP flux and superoxide lines across the full 0-2x range with a dot at the current lever setting, under the percent-change table. Verified live on the Warburg tab, no page errors.

## Carrier efficiency module
- ✅ /carriers page: 0-2x rate sliders for Mitoferrin, SLC25A34, ANT, PiC, MPC, UCP1 (all MADE-UP mappings)
- ✅ Readout table (NADH, ATP, superoxide, peroxide, free Fe2+) and lazy chart across 0-2x
- ✅ Carrier reference table; five new sources logged in the reference library with scores
- ❌ Run carriers on Timeline visits (demo profiles only for now)

## Mitophagy lever (behaviors level)
- ✅ MADE-UP mitophagy rate slider (0-2x) on the Simulator with readout table and ATP/superoxide chart
- ❌ Published mitophagy rate to replace the invented curve
- [x] OAA explorer chart: dashed 'healthy' reference line at the healthy-adult superoxide level (defaultInputs/defaultGeometry), so ROS high vs low is visible at a glance; caption updated.
- ✅ Progress page: Not yet run grid (therapy x model dose per profile, missing count, hide fully run)

- ✅ Progress page "Run missing" button: simulates the next unrun therapy and dose for the chosen profile, shows ATP/superoxide/peroxide change, logs it
- ✅ Antioxidant capacity weighs more in superoxide clearance (exponent 0.3 to 0.8); still no disease profile above healthy
- ✅ Oxaloacetate and mitophagy sliders replaced by trial-dose sliders (oxaloacetate 0-2 g/day; urolithin A 0-1000 mg/day), assumed effect size, 3 sources scored
- ✅ Superoxide rewrite: clearance follows defenses 1:1, weak defenses raise leak (ROS-induced ROS release, Zorov 2014); six disease profiles now above healthy
- ✅ Mitophagy as model setting: turnover half-life (2-60 d, default 17.2 d heart; Kim 2012, Stauch 2023) changes potential, leak, iron and ATP; urolithin A card shortens it
- ✅ Dashboard superoxide vs healthy at the same membrane potential (healthy adult re-run at each profile's potential), on screen and in CSV
- ✅ Simulator slider for ROS-induced ROS release strength (rirrStrength, 0-1.5, default 0.5 assumed)

- ✅ Profile sensitivity card: ROS-induced ROS release, half-life and antioxidant capacity effects on superoxide, ATP and free iron for all 18 profiles, sweep chart, CSV
- ✅ Dashboard superoxide "Defences only" gap: same potential, labile iron and L:P held at healthy
- ✅ Diagnosis model flags now include "Superoxide high, defences only": the same matched comparison as the Dashboard's Defences-only line (healthy demo-01 baseline re-run at the profile's membrane potential, with and without the profile's antioxidant capacity). 16 of 18 profiles flag; demo-01 and demo-02 do not. The flag also supports the Oxidant load mechanism score.
✅ Progress run log notes ROS-induced ROS release strength: recordRun stores rirrStrength (assumed setting) from each run site (dashboard, calculator, compare, plan, progress); the log table has a ROS-induced strength column and the Not yet run grid lists the strengths logged per profile.

- ✅ Timeline defences-only superoxide gap per visit: new "Defences only" column (defencesOnlyGap in timeline.ts, same matched-healthy comparison as the Dashboard) shows the gap from the visit's labs, and after an arrow the gap with the visit's therapies at their model doses; therapies that do not move antioxidant capacity or membrane potential show no change. Verified: Leigh baseline +88%, mitochondria-targeted antioxidant 1x takes it to -20%.
- ✅ Progress grid real-dose sliders per therapy with live superoxide change, Run button, log columns Real dose and Superoxide change (mapping assumed)
- ✅ Profile sensitivity card: tune ROS-induced strength, half-life and antioxidant capacity per profile and save as a named scenario
- ✅ Not yet run grid split by ROS-induced strength: strength picker (All strengths / each logged strength / profile setting / Not noted) scopes the done and missing counts; when a specific strength is picked, Run missing and the real-dose preview run at that strength (not the profile setting) and log it; healthy line uses the same strength. Verified: run at 0.5x fills only that strength's grid, 160 -> 159 missing.
- ✅ Per-scenario ROS-induced strength setting: each saved scenario row has a strength picker (0-1.5x); the value is stored in the scenario's own inputs, loading the scenario applies it to the Simulator, and scenarios saved before the setting existed show "was Simulator default" until picked (verified live: 1.25x survives reload + load, no page errors).
- ✅ Profile sensitivity card: labile iron and membrane potential added as tunable columns alongside ROS-induced strength, half-life and antioxidant capacity; table, sweep chart, CSV, tune-and-save sliders and ranges footnote all cover the five settings (verified live: 5 columns, 5 tune sliders, chart renders, no page errors).

- ✅ Progress grid: "Run all missing at this strength" batch button runs and logs every missing therapy+dose cell at the selected ROS-induced strength (verified: 160 runs logged, grid 0 missing, no page errors).

- ✅ Scenario compare view: checkboxes on each saved scenario in the Simulator panel; with 2+ ticked, a side-by-side table shows superoxide, ATP, free iron, peroxide and ROS-induced strength, recomputed live from each scenario’s settings (verified: 2 rows, no page errors).

## Scenario strength in export and compare (2026-10-05) ✅
- Scenario JSON export is now a versioned payload (format "cristae-lab-scenarios", version 2) with a summary naming each scenario's ROS-induced strength: name, id, strength (or null when never noted), whether it was noted, its fuel preset and its stored ATP/superoxide/peroxide/iron snapshot, plus a byStrength count per strength and a note that the strength is assumed.
- Import accepts the new payload, the old flat array, the {scenarios} shape and a single scenario, so older files still load.
- Scenario compare view shows a "ROS-induced strength (assumed)" column per scenario: the stored value (e.g. "1.25x") or "not noted (assumed 0.5x)" for scenarios saved before strengths were recorded.
- Verified live: two scenarios, one set to 1.25x, compare cells read 1.25x and 0.5x; export summary listed both strengths with byStrength {1.25x: 1, 0.5x: 1}; re-import reported "Imported 2 scenario(s)". A legacy scenario with no stored strength showed "not noted (assumed 0.5x)" and byStrength {0.5x: 1, 'not noted': 1}. No page errors; typecheck clean.

## ROS-induced strength calibration (Melov 1999)
- ✅ Default strength 0.5 → 1.0, fitted so 0.2x antioxidant capacity leaves 29% Fe-S intact (Melov 1999 brain aconitase 24-33% of control in Sod2 null mice); labeled "partly published"
- ✅ Melov 1999 logged in study references and reference library (score 80/100)
- ✅ "Clear log and re-run" button on the Progress grid
- ✅ Re-checked 18 profiles: above healthy superoxide 6 → 11; strong causes 32 and therapy flags 102 unchanged
- ❌ Williams 1998 (halved SOD) aconitase figure still unavailable (paywalled)

## Scenario full run (2026-10-05) ✅
- Compare view button runs each selected scenario and logs it on Progress as "Scenario full run" (profile shown as scenario:name).

## Healthy-adult row in scenario compare tables (2026-10-05) ✅
- The scenario compare table (Dashboard and Diagnosis) now leads with a "Healthy adult (model)" row from the model defaults, so every scenario can be judged against normal levels as well as the reference profile.
- Each scenario cell shows two percent lines: "vs healthy" (superoxide colored red above healthy, green at or below) and "vs profile".
- When the reference profile already is the healthy adult (Dashboard default), the extra row collapses to avoid duplication.
- Verified live on Diagnosis with a seeded weak-defences scenario: +248% vs healthy superoxide, red; no page errors; typecheck clean.

## Heart check column (Melov 1999 heart) (2026-10-05) ✅
- New "Heart check" column on Diagnosis (all-profiles table) and Timeline (per visit, with after-therapies arrow).
- Shows the model's Fe-S intact % at the profile's own settings vs the Melov 1999 Sod2-null mouse heart band (complex I 59%, complex II 24% of normal); red when inside the band.
- Band and check live in model.ts (MELOV_HEART_BAND, melovHeartCheck); Timeline uses heartCheck in timeline.ts.
- Verified live: all 18 profiles read 81-89%, none inside the 24-59% band; the band is a severity reference, not a calibration target (model floor ~29% at weakest defences, fitted to the milder brain figure).

## 2026-10-05: Re-run all profiles at 1x in one click
- ✅ New "Clear log and re-run all 18 at 1x" button on the Progress page (Not yet run view, data-testid `clear-rerun-all`): wipes the whole run log, then logs every therapy+dose cell for every profile at 1x ROS-induced strength (2880 runs), with a live progress line while it runs.
- ✅ Verified live: "Cleared the log and re-ran all 18 profiles at 1x ROS-induced strength: 2880 combinations logged." Typecheck clean.

## 2026-10-05: Healthy-adult reference row on the Timeline
- ✅ Timeline table now leads with a "Healthy adult (model)" reference row (data-testid `tl-healthy`): model-default ATP, superoxide, peroxide, Defences only 0%, Heart check %, so every gap column has its baseline in view. The scenario compare table already had its healthy row.
- ✅ Verified live on demo-04: reference reads ATP 45.4, superoxide 0.0124 nM, H2O2 32.9 nM; the Leigh visit reads +134% defences-only against it. Typecheck clean.

## 2026-10-05: "Partly published" source note under the Dashboard superoxide column
- ✅ Superoxide column header now carries a small "partly published" tag (data-testid `dash-so-note-tag`) and the table gained a note under it (data-testid `dash-so-note`).
- ✅ The note explains the 6 → 11 shift: the ROS-induced ROS release mechanism is published (Zorov 2014), the exponent 1.0 is fitted to Melov 1999 Sod2-null mouse brain aconitase (24-33% of control), not a human measurement; raising it from 0.5 to 1.0 moved demo-12, demo-13, demo-14, demo-16 and demo-17 above the healthy adult, while the other six were already over it. Defences only stays 16 of 18 either way. Links to /references.
- ✅ Counts re-verified in code at both strengths before writing the note (6 at 0.5, 11 at 1.0).
- ✅ Tag renders on one line under the column header (whitespace-nowrap), so the header row stays readable.

## 2026-10-05: Melov 1999 heart figures with source note on Diagnosis
- ✅ Added a visible source note under the Diagnosis profiles table (data-testid `dx-heart-note`): Melov et al. 1999 (PNAS 96(3):846), Sod2-null mouse heart, complex I at 59% and complex II at 24% of normal; Fe-S intact % is flagged red inside the 24-59% band; severity reference only, never a calibration target, not counted in flag totals; links to /references.
- ✅ Previously the figures lived only in the Heart check cell's hover tooltip; they are now visible in the page.
- ✅ Verified live: note renders on all 18 profile rows, link resolves, no page errors; typecheck clean.

## 2026-10-05 (defences-only gap in scenario compare)
- ✅ Scenario compare table (Dashboard + Diagnosis) gained a "Defences only" column: same matched-healthy comparison as the Dashboard/Timeline (healthy defaults re-run at the scenario's own membrane potential, iron and L:P held at healthy), red above 0%, green at/below; healthy row shows 0%.
- ✅ Compare CSV gained a "Defences-only gap (%)" column matching the table.
- Verified live: seeded 0.4x antioxidant scenario reads +486%; typecheck clean.
- ✅ Recalibrate ROS-induced strength helper on Progress (paste aconitase %, bisection fit at 0.2x defences, clear and re-run all 18 at fitted strength)

- ✅ Scenario plan on /therapy-plan: pick a saved scenario, therapies and model doses ranked by defences-only gap drop, assumed turnover-based timing (weeks 1-12)

- ✅ Timeline gap chart: added a therapy-strength line (mean dose multiplier per visit, right axis 0-2x) alongside the superoxide, ATP and free iron gap bars.

- ✅ Saved ROS-induced strength now applies on Dashboard, Diagnosis and Timeline too: a shared hook sets it after mount and profile inputs overlay it, so all pages read the same fitted strength after a recalibrate.

## Strength line on the Dashboard therapy chart (2026-10-05) ✅
- ✅ TherapyProfileChart.tsx switched to a ComposedChart: per-profile ROS-induced strength line on a right 0-1.5x axis alongside the ATP/superoxide/H2O2 percent-change bars. Strength comes from profileInputs (saved recalibrated default overlay), so the line is flat unless profiles carry their own strength; caption says so.
- ✅ Verified live: line renders at 1.0x across all flagged profiles, legend shows "ROS-induced strength", no page errors.

## Recalibrate: Melov and Williams fits side by side (2026-10-06) ✅
- ✅ RecalibrateCurve.tsx now draws both fit curves on one chart: solid line = Melov 1999 at 0.2x defences, dashed amber line = Williams 1998 at the defence level from its SOD and glutathione drops (0.6x at the 50%/30% defaults), with a legend.
- ✅ The dashed horizontal line still marks the pasted aconitase number and the red dot marks the fitted strength on the selected anchor; the Williams curve follows the editable SOD and glutathione drop inputs live.
- ✅ Verified live on /runs: both lines render, target line at 45%, no page errors.

## Per-profile ROS-induced strength (2026-10-06) ✅
- ✅ New src/lib/mito/rirrDefault.ts additions: per-profile overrides in localStorage (cristae-lab-rirr-profiles), profileRirr/saveProfileRirr/useProfileRirr; profileInputs in treatment.ts uses a profile's own strength first, then the saved default, then 1.0x.
- ✅ New src/components/mito/ProfileStrengthEditor.tsx on the Dashboard: one input per profile (0-1.5x, blank = follow default), labeled a tuning control, browser-only.
- ✅ Dashboard therapy chart strength line now varies per profile; caption updated. Verified live: Demo 15 at 0.2x and Demo 04 at 1.5x dip and peak against the 1.0x default, no page errors.

## Timeline chart: therapy name labels on lines (2026-10-06) ✅
- ✅ TimelineGapChart.tsx draws each therapy's name at the last point of its line, in the line's own color; right margin widened so labels fit. Legend unchanged. Verified live: "Nitric oxide reduction" label renders at the line end, no page errors.

- ✅ Strength history log on Progress (dates, events, CSV, clear)
- ✅ Strength history time chart on Progress (step line for saved default with a gap where cleared, scatter marks for per-profile strengths and batch runs, 1x reference line; lazy-loaded)
- ✅ Tuned scenarios saved from Profile sensitivity carry the profile's own strength (or saved default) and note its source
