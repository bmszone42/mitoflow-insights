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
