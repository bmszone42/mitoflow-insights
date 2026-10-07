## Dashboard band summary line (2026-10-07)

- ✅ A line above the Dashboard table counts profiles inside the saved band ("18 of 18 profiles sit inside the band (0.50x-1.00x); 0 outside."), using each profile's own effective strength, the same value the Band column shows.
- ✅ "Edit the band" in that line opens the header band popover, so the band stays edited in one place instead of gaining a second slider set.
- ✅ Verified live: default band reads 18 of 18 in / 0 outside while no Band cell says Outside; dragging the band's top edge down to 0.05x-0.50x flips the line to 0 of 18 in / 18 outside and all 18 Band cells then read Outside; the popover opens from the in-page link; no page errors. Build OK.

## Dashboard Latest progress opens that profile's log (2026-10-07)


- ✅ The Dashboard's Latest progress cell is now a link to /runs?profile=<id>, so one click lands on that profile's run log; profiles with no runs stay plain text.
- ✅ The Progress page reads ?profile=: only that profile's rows show, the counts and the superoxide-change chart follow the filter, and a "Show all profiles" link returns the full log.
- ✅ On such a jump the tool panels (recalibrate, strength history, band, paste measurements, not yet run) start hidden with a "Show the tools" line, so the profile's rows land in view instead of below the fold.
- ✅ Verified live: seeded run log, clicked the Demo 07 cell, landed on /runs?profile=demo-07 with one section and its rows in view (tools hidden), "Show the tools" restored the panels, "Show all profiles" returned every section; a direct /runs?profile=demo-15 with no logged runs says "No runs logged for Demo 15 yet"; plain /runs unchanged; no page errors, build green.

## Dashboard band, progress and Snap plan link (2026-10-07)


- ✅ Dashboard table gains a Band column: each profile's effective strength vs the saved band (same store as the Progress sliders), red when outside.
- ✅ Dashboard table gains a Latest progress column: newest run per profile from the local run log (date, source, strength), or "No runs yet".
- ✅ Snap plan button next to Therapy plan in the Dashboard header, opening /therapy-plan?tab=schedule.
- ✅ Verified live: 18 rows render both columns, Snap plan link navigates to the Schedule tab, no page errors, build green.

## Timeline visits persist in this browser (2026-10-07)

- ✅ Timeline visits (user, real and plan rows) now persist in IndexedDB ("cristae-lab-visits"), like runs; baseline and synthetic rows are still regenerated from demo data.
- ✅ Writes are fire-and-forget (add, plan, remove); hydration loads stored rows on first use and merges without duplicates.
- ✅ Verified live: added a visit, reloaded the page, visit still present (1 IndexedDB row), build green.

- ✅ Strength plan and Snap plan merged into Therapy plan tabs (Suggestions, Pairs, Schedule); /strength-plan and /snap-plan redirect.
- ✅ Menu grouped into Model, Patient, Plan, Reference; header band control (same saved band); selected profile remembered across pages (localStorage cristae-lab-profile).
- ✅ Paste measurements also schedules one snap per date (checkbox, on by default), shown on the Timeline snap strip.

## Paste-your-measurements panel (2026-10-06)

- ✅ New "Paste your measurements" panel on the Progress page: one line per entry (date, therapy, dose x, aconitase %, MitoSOX, optional strength x), with a preview table that flags bad lines.
- ✅ Applying adds each line as a real visit on the Timeline gap chart, logs it as a run, and moves the band sliders to the lowest and highest strengths in the data.
- ✅ Strength per line: pasted value wins, otherwise fitted from the aconitase % at 0.6x defences (0.2x cannot reach mild readings and clamped them to 0x).
- ✅ Verified live: two pasted lines fitted 0.90x-1.50x, both visits render on the Timeline gap chart, runs logged, no errors.

## Timeline pair Snap buttons (2026-10-06)

- ✅ Each top-three pair chart label has a Snap button scheduling the selected profile today at the pair's best-performing saved-band edge.
- ✅ Uses the existing browser-local Snap plan, names the selected pair, and leaves strength unchanged until confirmation on Snap plan.
- ✅ Verified all three buttons schedule distinct named pairs inside the band and read back on Snap plan without runtime errors; fixed scheduled-strip overlap with the pair chart.

## Timeline combined gap over time (2026-10-06)

- ✅ Visit gap chart now orders visits by date, earliest first, so the combined therapies gap line shows chronological changes rather than gap-rank order.
- ✅ Combined gap uses a thicker dashed line with visible dots; missing pair visits remain breaks, and the saved-range corridor strips remain unchanged.
- ✅ Verified by adding two model visits with the same pair at different doses: two combined-gap dots and their connecting line render in chronological order; no runtime errors and preview build OK.
- ❌ Real therapy measurements and the Williams 1998 aconitase number still require user-supplied values.

## Single therapies ranked across the band (2026-10-06)

- Strength plan therapy table now ranks the same way as the pairs: therapies that lower superoxide at both band edges first, then by worst edge (the higher of the two edge columns), then by drop at the current strength.
- Added a Worst edge column (colored like the other gap cells) so the ranking is visible; ranking note states the rule.
- Verified live: at the 0.50x-1.00x band the five therapies that hold rank by worst edge -65%, -64%, -50%, -23%, -12%, then the no-benefit rows.
- Pending: Williams 1998 aconitase number; user's real therapy measurements.

## Top pairs ranked across the band (2026-10-06)

- Strength plan Top 3 pairs now scores every therapy pair at the current strength AND both band edges, then ranks pairs that still lower superoxide at both edges first, ordered by worst edge result, then current strength. Explainer text updated.
- Verified live: top 3 all hold across the 0.50x-1.00x band (worst edges -69%, -68%, -65%).
- Pending: Williams 1998 aconitase number; user's real therapy measurements.

## Timeline snap strip (2026-10-06)

- Timeline gap chart now plots scheduled snaps from the Snap plan page as a date strip below the chart: green dot when the planned target strength sits inside the saved band, red when outside, band shaded behind. Only planned snaps show; done and skipped stay in history.
- Reads useSnapPlan from src/lib/mito/snapPlan.ts and the shared band from rangeState.ts, so it follows the Progress range sliders and saved band.
- Verified live: seeded snaps at 0.75x (green, in band) and 1.30x (red, outside) render with correct colors; a done snap is excluded.
- Pending: Williams 1998 aconitase number; user's real therapy measurements.

## Timeline pair gap (2026-10-06)

- Timeline gap chart draws a dashed Combined therapies gap line for visits with two or more therapies, plus a shaded corridor strip spanning the pair's combined defences-only gap at the low and high ends of the saved strength band.
- Corridor math: pairGapCorridor in src/lib/mito/timeline.ts; wired as pairGap/pairCor in src/routes/timeline.tsx; rendered as pcor-lo/pcor-span bars and a dashed Line in src/components/mito/TimelineGapChart.tsx.
- Verified live: two-therapy visit (antioxidant support + iron chelation) saves and its dashed pair dot and strips render; earlier failure was Playwright clicking before hydration, not an app bug.
- Pending: Williams 1998 aconitase number; user's real therapy measurements.

## Auto-ranked Top 3 therapy pairs on Strength plan (2026-10-06) ✅
- ✅ New "Top 3 pairs" section on /strength-plan: searches all 153 therapy pairs over the 0.5x-2x dose grid at the current strength, ranks the three that lower superoxide most, then re-checks only those three at both band edges.
- ✅ Each row shows best doses, combined superoxide change now and at both edges, combined defences-only gap, holds-across-band flag and a Log button (same recordRun call as the manual pair picker).
- ✅ Pairs with no benefit at any dose are excluded from ranking; single-therapy-at-best-dose pairs can still rank.
- ✅ Verified live: three ranked rows rendered (top: Mild uncoupling + Mito-targeted antioxidant, 2x + 1.5x, gap -74%), Log lands a run, no console errors.

## Scenario compare table: strength band row coloring (2026-10-06) ✅
- ✅ ScenarioCompareTable.tsx now reads the shared saved range (rangeState) and tints every row green when the strength it was run at sits inside the band, red when outside, matching the Strength history chart dots: left edge accent plus a light tint, and the strength cell text follows the same color.
- ✅ Each row is judged by the strength it actually ran at: scenarios use their own saved rirrStrength (legacy scenarios fall back to the assumed 0.5x), the reference row uses the profile's inputs, the healthy row uses model defaults (1x); the strength cells now show that value.
- ✅ A count line above the table reads "N of M scenarios inside the band (lo-hi), K outside" and follows the strength-source filter; the footnote states the rule.

## Timeline therapy-strength chart: saved range band (2026-10-06) ✅
- ✅ TimelineGapChart.tsx now draws the saved strength range as a shaded band behind the per-therapy strength lines on the right-hand 0-2x axis, labeled "range lo-hi", moving live with the Progress range sliders via the shared rangeState store.
- ✅ Verified live: band rect and label render on the Timeline chart with the default 0.50x-1.00x range.

## Diagnosis therapy picker shows the model dose (2026-10-06) ✅
- ✅ The Therapy picker beside Projected flags on the Diagnosis page now suffixes every option with the chosen Model dose, e.g. "Mitochondrial antioxidant support 1.5x", and the "Strongest therapy" option reads "Strongest therapy 1.5x", matching the Dashboard therapy chart's picker labels.
- ✅ The picker's max width grew to 220px so the longer labels are not clipped.
- ✅ Verified live: options read "... 1x" at the default dose, then "... 1.5x" after switching Model dose to 1.5x; selecting an option keeps the suffixed label; no page errors, build OK.

## JSON export bumped to version 3 (2026-10-05) ✅
- ✅ scenariosExportPayload in src/lib/mito/scenarios.ts now emits version 3 with a summary.versionNote listing what changed since version 2: per-scenario defencesOnlyGap, the healthyReference block, the referenceProfile block with its own defencesOnlyGap, and scenario rows sorted by defences-only gap, weakest defences first, matching the compare table's default sort.
- ✅ Import is unchanged: scenariosFromJson accepts any versioned payload plus the older flat array, so version 2 files still load.
- ✅ Verified live: seeded a scenario, clicked Export JSON on the Simulator, read the file back (version 3, versionNote present, row gap +486.3%, reference gap +3.9%), and round-tripped it through the importer (1 scenario).

## Strength range reset button (2026-10-06) ✅
- ✅ New "Reset range to 0.5x-1.0x" button on the Strength range check: restores the default band, saves it to this browser, and refreshes the band on the Strength history and Recalibrate charts live.
- ✅ The button greys out when the band is already at the default, and a note appears while the band differs from 0.50x-1.00x. Resetting does not move any profile's strength; the snap preview remains the way to move them.

## Recalibrate curve: saved range band and both fit dots (2026-10-06) ✅
- ✅ The strength band from the range sliders is drawn behind both the Melov and Williams curves on the Recalibrate chart, and it moves live with the sliders.
- ✅ Each fit gets its own dot where the pasted aconitase number crosses its curve: green inside the band, red outside, colored to match its curve (Melov solid, Williams dashed amber). A number the model cannot reach at that defence level shows "not reached by the model" in the readout instead of a dot.
- ✅ A readout line above the chart states both fitted strengths and whether each is inside or outside the band, e.g. "Melov fit 0.67x, inside · Williams fit 1.31x, outside".

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
- ✅ Strength plan: "Try two together" section picks two therapies, searches both dose sliders jointly, and shows combined superoxide change and defences-only gap at the current strength and both band edges, with a Log this pair button (verified: combined gap -73%, same-therapy hint works).
- ✅ Progress grid run rows colored by the saved strength band: green inside, red outside or with no strength noted, with an inside/outside count line that follows the range sliders live (verified: 0.7x green, 1.3x and no-strength red at the 0.50x-1.00x band).
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
- ✅ Restore button on each Strength history row (confirm dialog, re-saves that strength as the default, logged as a new history entry)
- ✅ Tuned scenarios saved from Profile sensitivity carry the profile's own strength (or saved default) and note its source

## Dashboard therapy chart: dose in the therapy labels (2026-10-06) ✅
- ✅ TherapyProfileChart.tsx therapy picker options now read "<therapy name> <dose>x" (e.g. "Iron chelation 1.5x"), following the Dashboard's Model dose picker.
- ✅ Verified live: 15 options each carry the current dose, switching Model dose to 1.5x rewrites every label to 1.5x, no page errors.

## Strength source in scenario compare + JSON export (2026-10-06) ✅
- ✅ Scenario type gains optional strengthSource; Profile sensitivity save records it (profile's own strength / saved default / tuned on this card / model default).
- ✅ scenarioStrengthSource() in scenarios.ts falls back to parsing older notes text, else "not noted".
- ✅ Scenario compare table and its CSV gain a Strength source column; JSON export summary rows gain strengthSource.

## Strength range check on Progress (2026-10-06) ✅
- ✅ StrengthRange.tsx: low/high sliders (0-1.5x, 0.05 steps) with a per-profile table showing effective strength (profile's own, else saved default, else 1.0x model default), its source, and inside/outside coloring, plus an "N of M profiles inside" count.

- ✅ Recalibrate: SOD vs glutathione weight slider for the Williams fit
- ✅ Scenario compare: strength-source filter (all, saved default, profile own)
- ✅ Strength range: snap outside profiles to nearest edge and re-run all
- ✅ Strength range: shared range state (src/lib/mito/rangeState.ts) so the Strength history chart draws the picked range as a shaded band that moves live with the sliders

- [x] Strength range pick (low/high sliders) persisted in browser storage (cristae-lab-rirr-range) so the sliders and history-chart band survive a reload

## Strength history dots colored by the band (2026-10-06) ✅
- ✅ StrengthHistoryChart.tsx: every dot (saved-default line dots, per-profile circles, batch-run triangles) is green inside the picked strength band and red outside it; colors follow the shared range state live.
- ✅ Count line above the chart: "N of M history points inside the band (lo-hi), K outside"; each history entry counted once even when its default-line dot and profile dot overlap.
- ✅ Verified live: seeded history with a 0.90x-1.10x band shows 1 of 4 inside; the 1.0x default dot is green, the 1.3x and 0.8x profile dots and the 0.7x batch triangle are red; build clean.

## Recalibrate curve shows the strength band (2026-10-06) ✅
- ✅ RecalibrateCurve.tsx draws the same picked range as a vertical shaded band (shared range state, moves live with the sliders), labeled "range lo-hi".
- ✅ The fitted-strength dot now colors green inside the band and red outside it; no target entered yet leaves the dot hidden as before.
- ✅ Verified live on /runs with a 0.70x-1.00x band: band renders between the curves with its label, no page errors; build clean.

## Snap preview and undo on Strength range (2026-10-06) ✅
- ✅ StrengthRange.tsx: the snap button now opens a preview table first, listing each outside profile with its current effective strength and the edge it will move to; Confirm applies the snap and re-runs all 18 profiles, Cancel dismisses.
- ✅ After a snap, an Undo button restores each moved profile's previous override (including "follow default" for profiles that had none) and logs the undo to Strength history. The Progress grid is not rebuilt on undo; the message says to re-run the batch.
- ✅ Verified live: Demo 10 at 0.20x with a 0.90x-1.10x band previewed as 0.20x -> 0.90x, confirm snapped it and logged 2880 runs, undo restored 0.20x; build clean.

## Recalibrate: own aconitase measurement (2026-10-06)
- ✅ Third anchor "My own measurement" in the Recalibrate box: editable defence level (x of healthy) so a personal aconitase reading fits at the level it was measured under.
- ✅ Curve shows the own-measurement fit as a third dotted line and dot, band-colored (green inside, red outside), alongside Melov and Williams.
- ✅ Readout line reports all three fits at once; unreachable numbers read "not reached by the model" instead of guessing.

## Scenario compare rows colored by the strength band (2026-10-06) ✅
- ✅ ScenarioCompareTable.tsx: every row tints green inside the picked band and red outside it (left edge accent plus a light tint, strength cell text follows the same color), judged by the strength that row actually ran at; count line above the table reads "N of M scenarios inside the band (lo-hi), K outside" and follows the strength-source filter.
- ✅ Fix: the band is now read only after mount (useStrengthRange starts at the 0.5x-1.0x default on the server and the first client render, then loads the saved range). Before this, the colors the server rendered with the default band were never patched after hydration, so the healthy and reference rows stayed green even when 1x sat outside a saved band such as 1.1x-1.4x.
- ✅ Verified live: with the default band, healthy, reference, tuned and 0.70x rows are green and 1.30x red ("2 of 3 scenarios inside"); after saving the band at 1.10x-1.40x and reloading, healthy and reference turn red and 1.30x green ("1 of 3 inside"); build clean.

## Strength plan page
- ✅ /strength-plan: therapies ranked at current strength, checked at both band edges, logged progress and strength history per profile

## Per-therapy gap corridors on the Timeline gap chart (2026-10-06) ✅
- ✅ therapyGapCorridor in timeline.ts: per visit and therapy, the defences-only gap that therapy alone gives at the saved range's low and high strengths, % vs matched healthy.
- ✅ TimelineGapChart.tsx draws each corridor as a stacked-bar strip (transparent low pad + colored span) on the gap axis, next to each visit's gap bars; flat corridors (therapies that do not move antioxidant capacity or membrane potential) draw as a hairline; tooltip filters the corridor plumbing rows out.
- ✅ Verified live on /timeline (demo-04) with an added antioxidant-support visit: the teal strip renders below zero at that visit; build clean.

## Snap plan page
- ✅ /snap-plan: pick profiles (outside band preselected), date per profile or for all, target nearest edge or custom
- ✅ Schedule with Planned / Due today / Overdue / Done / Skipped, apply due with preview + confirm, apply now, skip, remove, undo, CSV
- ✅ Progress tracker: done bar, band count now vs after planned snaps, date strip colored by band

## Superoxide-change-over-time chart on the Progress page (2026-10-06) ✅
- ✅ New `RunHistoryChart.tsx` (lazy-loaded on `/runs`): every logged run with a recorded superoxide change is plotted at its timestamp on a percent axis with a zero reference line.
- ✅ Each dot is green when the run's ROS-induced strength sat inside the saved range band, red when outside or when no strength was noted; reads the shared range state so it follows the Progress sliders live.
- ✅ Count line above the chart: "N of M runs inside the band (lo-hi), K outside or with no strength noted."
- ✅ Verified live with seeded runs: 2 of 3 inside the 0.50x-1.00x band, correct green/red dots, clean axis ticks.
- ✅ Strength plan: "Add #1 pair to Snap plan" schedules a snap today to the band edge where the top pair works best

- ✅ Timeline: "Top 3 pairs across your band" line chart, shared ranking in pairRank.ts

## "Start here" card on the Simulator (2026-10-07) ✅
- ✅ New `StartHereCard.tsx` mounted above the Simulator grid: plain-words explainer of strength, band and the defences-only gap, with the live strength value from the sliders and the saved band, colored green inside / red outside like the other charts.
- ✅ "Try this first" list (click a therapy lever or preset, drag antioxidant capacity down, open Diagnosis) plus a note that outputs are model estimates, not clinical advice.
- ✅ Hide button remembers the choice in this browser (localStorage cristae-lab-start-here); a one-line "What do strength, band and gap mean?" link brings the card back.
- ✅ Verified live: card renders on the Simulator tab, Hide collapses it, it stays collapsed after a reload, the link restores it, and the band chip follows a saved band (1.10x-1.40x) after reload; no page errors, build clean.
- ✅ Timeline visits export/import as a JSON file (dedupe on profile, date, therapies, type)
- [x] Move everything file (Timeline): visits, runs, snaps, band, strengths in one download/load

## "Start here" card on Diagnosis (2026-10-07) ✅
- ✅ `StartHereCard.tsx` is now shared: optional `storageKey`, `steps` and `strengthWhere` props keep the same plain-words definitions of strength, band and the defences-only gap on every page, while each page points at the controls it actually has.
- ✅ Diagnosis mounts the card under its page header, reading the selected profile's own strength (its saved override, else the saved default), with Diagnosis-specific "Try this first" steps: pick a profile row, read the "Superoxide high, defences only" flag, then check whether that gap holds across your band.
- ✅ Dismissal is remembered per page: Diagnosis uses localStorage `cristae-lab-start-here-diagnosis`, so hiding it there leaves the Simulator card showing.
- ✅ Verified live: card renders on Diagnosis with the strength chip (1.00x) and band chip (0.50x to 1.00x), Hide collapses it and it stays collapsed after a reload, the Simulator card is unaffected, and the "What do strength, band and gap mean?" link restores it; no page errors, build clean.

- ✅ Upgraded recharts 3.10, zod 4.6, ai 7.0.128 and @ai-sdk/openai 4.0.84; charts and AI interpretation verified (2026-10-07)
