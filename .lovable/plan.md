# Real lab reference ranges in Patient Data

## What is possible
Real clinical lab reference intervals exist only for the blood tests: lactate, pyruvate, lactate:pyruvate ratio, glucose, ferritin and transferrin saturation. No clinical lab publishes a reference range for membrane potential, P/O, MitoSOX, H2O2, lipid oxidation, aconitase or labile iron. Those stay as research context, marked "No lab reference range", never given a made-up range.

Only one model slider (membrane potential) maps directly to a profile measurement, and it has no lab range. So the percent-outside flag applies to the lab tests, not to the sliders. This is stated on the page.

## Changes
- **Lab ranges, checked against the lab's own test page**: each of the six blood tests gets the performing lab's published interval, with lab name, test code, specimen and a link (for example Mayo Clinic Laboratories). Every range is re-checked before it goes in; anything that can't be confirmed is labeled "unverified".
- **Age and sex-specific where the lab publishes them**: ferritin by sex (profiles gain an invented sex field), and child intervals for lactate, glucose and pyruvate where the lab lists them, so the two child profiles get flagged against child ranges instead of being skipped.
- **Percent outside the range**: each flagged value shows how far outside it is, as percent beyond the nearest limit (for example "Lactate 4.1 mmol/L, 86% above the 2.2 upper limit"). Values inside show "Within lab range".
- **Fasting rule kept**: glucose in the three acute, non-fasting profiles still isn't compared with the fasting range.
- **Research measurements**: the other eight show "No lab reference range" plus their existing research context and the healthy-profile comparison.
- Patient Comparison and Diagnosis reuse the same ranges and percent, so all pages agree.

## Technical details
- `patientReference.ts`: `labRanges` per metric with optional age and sex strata, lab, test code, URL, verified flag; `labRangeFor(patient, key)` and `percentOutside(value, range)`.
- `PatientData.tsx` and `PatientComparison.tsx`: new "Lab range" and "% outside" columns.
- `diagnosis.ts`: `metricDirection` uses `labRangeFor`, so child profiles use child ranges.
- Update `progress.md`, `roadmap.md`, `src/lib/mito/AGENTS.md`.

## Verification
- Each range checked against its source page before use.
- Leigh lactate and L:P flag with correct percent; healthy adult shows all lab tests within range; child profiles use child ranges; Diagnosis rankings checked for changes.
- Desktop and mobile, no page errors.
