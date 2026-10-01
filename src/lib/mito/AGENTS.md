## Mitochondrial model rules

- Ferroptosis math lives in `simulate` and exposes numeric `sensOutputs` to Sensitivity, CSV and AI routes.
- Light effects come from `photoreceptor(i)` in `model.ts`; 71 THz is a pumped coherence term in `simulate`.
- Warburg compares ATP with cited ranges and ROS with same-geometry defaults. ATP step rate = ATP/pair × routed flux ÷ 2; omit chain summary. ROS gap counts five primary O2•- sites once, including OGDH.
- Keep invented patient data in `patientReference.ts`: paired L:P, age/fasting flags, proxies not assays. Entered ROS flags require matched local controls; no persistence.
- Keep setting bands in `settingsReference.ts`; non-comparable controls stay unflagged. Published controls stay separate from simulated ATP baselines to prevent false measurement claims.
- Verified study metadata belongs in `studyReferences.ts`; publication spans are not claim-specific pages.
- ROS flags are simulated, nonclinical; driver effects reset one changed input at a time, include indirect paths, and do not add.
- ROS + ATP dashboard resets potential or uncoupling individually against current inputs at fixed geometry; model counterfactuals are conditional, not additive or clinical.
