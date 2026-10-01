## Mitochondrial model rules

- Ferroptosis math lives in `simulate` and exposes numeric `sensOutputs` to Sensitivity, CSV and AI routes.
- Light effects come from `photoreceptor(i)` in `model.ts`; 71 THz is a pumped coherence term in `simulate`.
- Warburg compares ATP with cited ranges and ROS with same-geometry defaults. ATP step rate = ATP/pair × routed flux ÷ 2; omit chain summary. ROS gap counts five primary O2•- sites once, including OGDH.
- Keep invented patient data in `patientReference.ts`: paired L:P, age/fasting flags, proxies not assays. Entered ROS flags require matched local controls; no persistence.
- Patient profile comparisons flag only applicable, cited measurement bands; distinguish direct sliders from derived readouts and assay-only measurements, since invented profiles have no complete slider state.
- Keep setting bands in `settingsReference.ts`; non-comparable controls stay unflagged. Published controls stay separate from simulated ATP baselines to prevent false measurement claims.
- Verified study metadata belongs in `studyReferences.ts`; publication spans are not claim-specific pages.
- ROS flags are simulated, nonclinical; driver effects reset one changed input at a time, include indirect paths, and do not add.
- ROS profile comparisons use only the synthetic profile's membrane potential with all other default inputs at current geometry; never convert assay fold signals or disorder labels into source-specific textbook rates.
- ROS assay flags compare a profile's MitoSOX, H2O2 or lipid signal with healthy demo-01 per species (±25%), shown beside model flags; never site-specific.
- Interpretation narrative is built deterministically in interpretation.ts from existing flags; scores normalize effects to flag thresholds and are not probabilities.
