## Mitochondrial model rules

- Ferroptosis math lives in `simulate` and exposes numeric `sensOutputs` to Sensitivity, CSV and AI routes.
- Light effects come from `photoreceptor(i)` in `model.ts`; 71 THz is a pumped coherence term in `simulate`.
- Warburg: ATP step rate = ATP/pair × routed flux ÷ 2, no chain summary; ROS gap counts five O2•- sites once incl. OGDH.
- Patient values carry origin (published/user/synthetic); published only from checked tables; user results tab-only, never stored.
- Profile comparisons flag only applicable cited bands; invented profiles have no full slider state.
- Keep setting bands in `settingsReference.ts`; non-comparable controls stay unflagged. Published controls stay separate from simulated ATP baselines to prevent false measurement claims.
- Verified study metadata belongs in `studyReferences.ts`; publication spans are not claim-specific pages.
- ROS flags are simulated, nonclinical; driver effects reset one changed input at a time, include indirect paths, and do not add.
- ROS profile comparisons use only the synthetic profile's membrane potential with all other default inputs at current geometry; never convert assay fold signals or disorder labels into source-specific textbook rates.
- ROS assay flags compare a profile's MitoSOX, H2O2 or lipid signal with healthy demo-01 per species (±25%), shown beside model flags; never site-specific.
- MitoSOX band is one study's healthy-control IQR scaled to its median; never call it a clinical range.
- The MitoSOX and peroxide (Sies 2017, above 100 nM only) band flags live in diagnosis rosAssayFlags; MitoSOX is excluded from patientFlags and the dashboard adds no separate peroxide count, so neither is double-counted.
- interpretation.ts builds the narrative deterministically; scores are not probabilities.
- ATP assay flags compare a profile's NADH P/O (pumping steps) and ATP-linked OCR (chain summary) with healthy demo-01 at ±25%; whole-chain, never step-specific.
- Diagnosis page ranks mechanisms, never diseases, via fixed rules in diagnosis.ts; oxidant load half weight (nonspecific probes); ferritin quarter weight in acute profiles (acute-phase marker); scores are not probabilities.
- treatment.ts maps therapies to slider moves for strong Diagnosis causes; "model dose" means slider value only, never drug doses.
- Timeline visits live in `timeline.ts` module memory only; invented demo follow-ups are labeled synthetic and each visit is scored with `diagnoseProfile`.
- Therapy calculator dose = fraction of a therapy's slider move via applyTherapyDose; never a drug dose.
- L:P maps to nadhRatio via LDH equilibrium in `lpMapping` (healthy L:P 10 = default); skipped if synthetic or lactate < 2.5 mmol/L.
- Adult research bands (MitoSOX, ATP-linked OCR) are applied to child profiles with an explicit caution label; never silently, never treated as pediatric intervals.
- Simulator result panels (FerroptosisPanel, RosBudgetPanel, PhotoreceptorPanel, WarburgSummaryCard) live in their own files; shared Metric/BudgetBar/chart helpers in SimulatorShared.tsx.
- Diagnosis therapyFlags list model therapies targeting a strong cause (score >= 1.5) that move ATP, superoxide or peroxide by >=1% at 1x model dose; model levers only, never drug doses, and never counted in assay flag totals.
- Superoxide: SOD clearance scales with antioxidantCapacity ** SOD_AC_EXP and production by antioxidantCapacity ** -rirrStrength (Input, ROS-induced ROS release); the default is fitted so 0.2x capacity reproduces Melov 1999 Sod2-null brain aconitase loss, labeled "partly published", and legacy states without it fall back to 0.5; why: weak defenses must raise ROS while 1x stays unchanged, anchored to a measured Fe-S loss.
- Per-enzyme Fe-S pool exposures are Inputs fesExposureCI/CII/CIII (aconitase fixed at 1), with legacy fallbacks in simulate; why: Melov heart tests need tunable, assumed exposures without shifting defaults.
- Fenton reactivity depends on iron ligand via Input chelatorBound (chelation therapies set it; bound iron also leaves the repair supply), and complex IV copper is Input copperCiv scaling fluxCIV; both neutral at defaults with legacy fallbacks; why: chelation must change damage, not just iron level, without shifting cited defaults.
- simulate() in model/simulate.ts only orchestrates: chain flux and ATP live in model/atp.ts, ROS chemistry and the ROS budget in model/ros.ts, Fe-S cluster states and free iron in model/fes.ts; leftover ferroptosis, singlet and 71 THz stay in simulate.ts; why: each science change lands in one file and model.lock.test.ts proves the split is neutral.
- Profile sensitivity (Sensitivity tab) nudges rirrStrength, mitoHalfLife, antioxidantCapacity, labileIron and deltaPsi one at a time on each profile's own baseline via profileSensitivity.ts; effects do not add.

- The Timeline defences-only column uses defencesOnlyGap in timeline.ts, the same matched-healthy comparison as the Dashboard (same potential, iron and L:P held at healthy); the after-arrow value applies the visit therapies at their model doses, so therapies that do not move antioxidantCapacity or deltaPsi show no change.
- Progress real-dose sliders use realDoses.ts (top of published range = 1x model dose, linear, capped 2x); the run log stores realDose text and superoxide change; why: real units without implying a validated dose-response.

- Not yet run grid has a batch button that runs and logs every missing cell at the effective strength (selected filter strength, else the profile setting); runs are sequential recordRun calls with source "progress".

- Scenario compare lives in Scenarios.tsx: ticked scenarios are re-simulated with simulate(s.inputs, scenarioGeometry(s)), never the saved snapshot, so the table follows model updates.
- Scenario export/import goes through scenariosExportPayload and scenariosFromJson in scenarios.ts: the file is a versioned payload whose summary lists each scenario's ROS-induced strength (null = never noted) and defences-only gap, plus a healthyReference block and a referenceProfile block carrying the reference profile's own defences-only gap (Scenarios.tsx passes the healthy adult demo-01, the Dashboard compare table's default); import also accepts the older flat-array and single-object shapes; why: the strength is an assumed setting and the gap a shared comparison, so shared files must say which values they carry and match the compare CSV's fields.
- The Progress grid "Clear log and re-run" button wipes the whole run log, then logs every cell for the picked profile at its current strength; why: recalibrating the strength must not mix old and new runs.

- The Heart check column (Diagnosis table, Timeline per visit) compares the model's Fe-S intact % at the profile's own settings with the Melov 1999 Sod2-null heart band (complex I 59%, complex II 24% of normal) via MELOV_HEART_BAND and melovHeartCheck in model.ts; it is a severity reference, never a calibration target, and never counted in flag totals.
- Ferroptosis propagation (kProp) uses only unbound iron, freeIron x (1 - chelatorBound), matching the Fenton ligand rule; why: chelation must lower lipid damage, not just iron level.
- Holm teaching scenarios and the rule-based damageSignature live in holmScenarios.ts; Diagnosis shows the signature as a column, never counted in flag totals; why: one place for the four cluster patterns.
