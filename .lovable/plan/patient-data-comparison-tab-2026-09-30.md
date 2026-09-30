# Patient Data comparison tab

## Goal
Add a Patient Data tab that compares the live mitochondrial model with a clearly labeled synthetic patient cohort across bioenergetics, ROS/redox, iron/Fe-S, and clinical laboratory measurements.

## Experience
- Add a top-level **Patient Data** tab beside Physiology.
- Show a persistent **Synthetic demo data** notice and state that the view is for research and teaching, not diagnosis.
- Provide a compact patient selector with several synthetic phenotypes, including a reference-like case and mitochondrial stress patterns.
- Summarize the selected record with total flagged values, direct model matches, and measurements that cannot be compared safely.
- Group measurements into Bioenergetics, ROS and redox, Iron and Fe-S, and Clinical labs.
- For each measurement show patient value, live model value when units and assay context are compatible, cited reference interval, cohort median/range, and status.
- Use distinct states for within range, literature outlier, cohort outlier, both, and not comparable.
- Link every published interval to its source and explain specimen, assay, and interpretation limits inline.

## Data and flagging
- Keep the bundled cohort synthetic and de-identified. No upload, account storage, or backend changes.
- Define typed measurement metadata and demo records in a dedicated patient reference module.
- Flag literature outliers only when a valid cited interval exists.
- Compute cohort outliers robustly from the synthetic cohort using median and median absolute deviation, with a fallback for zero spread.
- Compare model values only where units and biological context align. Label derived or proxy mappings explicitly; do not convert unlike assays into fake equivalents.
- Include clinical lactate, pyruvate, lactate:pyruvate ratio, and glucose as contextual patient measurements, but mark them as not directly produced by the model.

## Sources and clinical boundaries
- Use assay-specific sources for PBMC respiration and standard clinical laboratory intervals.
- Reuse the app’s existing cited mitochondrial reference values where appropriate.
- Clearly state that reference intervals vary by tissue, age, preparation, platform, and laboratory, and that flags are not diagnoses.

## Project documentation
- Update `progress.md` with the completed feature, measurement policy, testing guidance, privacy posture, compliance limitations, and deployment recommendations.
- Add one architecture rule to `AGENTS.md`: patient comparison metadata and synthetic cohort definitions stay in the dedicated patient reference module.

## Verification
- Check type safety and the latest preview build status.
- Open the Patient Data tab in the running app, switch synthetic patients, and verify flag counts, group tables, source links, and non-comparable labels.
- Verify desktop and narrow viewport layouts without overlapping controls or clipped text.
