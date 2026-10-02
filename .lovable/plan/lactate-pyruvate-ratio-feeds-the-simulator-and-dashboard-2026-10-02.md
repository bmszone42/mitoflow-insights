# Lactate:pyruvate ratio feeds the Simulator and dashboard

## What exists today
- Patient Data already has lactate, pyruvate and the calculated L:P ratio (manual, CSV, PDF/photo upload, with lab ranges and the 25 cut point).
- The ratio never reaches the Simulator: Run in Simulator only maps membrane potential, labile iron and MitoSOX. So the dashboard's model ATP/ROS ignore it.

## Change
1. **Map L:P to the NADH redox slider.** Lactate dehydrogenase holds L:P in near-equilibrium with cytosolic NADH/NAD+ (L:P = K x NADH/NAD+). Scale the patient's NADH fraction from the healthy reference (L:P about 10 at the default 0.55), clamped to the slider range. Labeled a proxy: cytosolic redox, not matrix NADH.
2. **Skip unreliable ratios.** When lactate is below 2.5 mmol/L (Debray 2007: ratio accuracy poor) or lactate/pyruvate are synthetic fill, keep the default and say why in the banner notes.
3. **Simulator banner** lists the new mapping ("L:P 35 sets NADH ratio 0.xx").
4. **Dashboard** gains an L:P column (value, flag above 25, "mapped" or "not mapped" tag), and its model ATP/ROS now reflect the mapping automatically.
5. **Patient Data tab**: the Run in Simulator note mentions L:P; the L:P row shows the slider it drives in the Live model column.

## Effects to expect
- Leigh (L:P 35, lactate 9.26) and PDH deficiency (L:P 9.9) will shift; PDH may move the NADH ratio down. Treatment, Therapy calculator, Diagnosis-linked runs share this baseline, so their numbers may change.

## Technical details
- `patientReference.ts` `inputsFromPatient`: add nadhRatio from lactatePyruvate with origin and lactate checks; note string.
- `dashboard.tsx`: L:P column.
- `PatientData.tsx`: note text.
- Update progress.md, src/lib/mito/AGENTS.md.

## Verify
- Leigh run shows changed NADH slider and banner note; healthy adult unchanged; dashboard column correct; typecheck; desktop and mobile.
