# Measured peroxide (nM) in the Simulator and dashboard

## Changes
1. Simulator patient banner: a "Peroxide vs Sies 2017" line under the readout table. It shows the model H2O2 in nM and, when entered, the patient's measured nM value, each checked against the 1-100 nM band (flagged only above 100 nM). If no nM value was entered, it says "Not measured" and shows only the model check.
2. Dashboard: new "H2O2 band" column showing the measured nM value (or "Not measured") and the model nM value, each marked within or above 100 nM. The CSV gains "Measured H2O2 (nM)" and "H2O2 vs Sies 2017" columns.
3. A peroxide value above 100 nM counts as one extra assay flag in the dashboard total, so the sort order reflects it.
4. Measured peroxide does not move any Simulator slider; the banner says so.

## Technical details
- Shared helper `h2o2BandCheck(p, modelNm)` in `patientReference.ts` using `h2o2NmBand`.
- Edit `PatientRunReadouts.tsx`, `dashboard.tsx`; update progress.md.

## Verify
- Add a profile with 150 nM: banner and dashboard flag it 50% above, total flags +1. Demo profiles show "Not measured". No page errors.
