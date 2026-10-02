## Mitochondrial model rules

- Ferroptosis math lives in `simulate` and exposes numeric `sensOutputs` to Sensitivity, CSV and AI routes.
- Light effects come from `photoreceptor(i)` in `model.ts`; 71 THz is a pumped coherence term in `simulate`.
- Warburg: ATP step rate = ATP/pair × routed flux ÷ 2, no chain summary; ROS gap counts five O2•- sites once incl. OGDH.
- Keep invented patient data in `patientReference.ts`: paired L:P, age/fasting flags, proxies not assays. Entered ROS flags require matched local controls; no persistence.
- Profile comparisons flag only applicable cited bands; invented profiles have no full slider state.
- Keep setting bands in `settingsReference.ts`; non-comparable controls stay unflagged. Published controls stay separate from simulated ATP baselines to prevent false measurement claims.
- Verified study metadata belongs in `studyReferences.ts`; publication spans are not claim-specific pages.
- ROS flags are simulated, nonclinical; driver effects reset one changed input at a time, include indirect paths, and do not add.
- ROS profile comparisons use only the synthetic profile's membrane potential with all other default inputs at current geometry; never convert assay fold signals or disorder labels into source-specific textbook rates.
- ROS assay flags compare a profile's MitoSOX, H2O2 or lipid signal with healthy demo-01 per species (±25%), shown beside model flags; never site-specific.
- interpretation.ts builds the narrative deterministically; scores are not probabilities.
- ATP assay flags compare a profile's NADH P/O (pumping steps) and ATP-linked OCR (chain summary) with healthy demo-01 at ±25%; whole-chain, never step-specific.
- Diagnosis page ranks mechanisms, never diseases, via fixed rules in diagnosis.ts; oxidant load half weight (nonspecific probes); ferritin quarter weight in acute profiles (acute-phase marker); scores are not probabilities.
- treatment.ts maps therapies to slider moves, targeting strong Diagnosis causes only; never doses.
