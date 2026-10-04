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
- Superoxide: SOD clearance scales with antioxidantCapacity ** SOD_AC_EXP and production by antioxidantCapacity ** -rirrStrength (Input, default 0.5, ROS-induced ROS release); why: weak defenses must raise ROS while 1x stays unchanged, and the unpublished strength stays user-tunable.
- Profile sensitivity (Sensitivity tab) nudges rirrStrength, mitoHalfLife and antioxidantCapacity one at a time on each profile's own baseline via profileSensitivity.ts; effects do not add.

- The Timeline defences-only column uses defencesOnlyGap in timeline.ts, the same matched-healthy comparison as the Dashboard (same potential, iron and L:P held at healthy); the after-arrow value applies the visit therapies at their model doses, so therapies that do not move antioxidantCapacity or deltaPsi show no change.
