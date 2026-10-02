# Peroxide in nM on Patient Data

## Clarification
- A peroxide reading in nM is H2O2, not superoxide. Superoxide (MitoSOX) stays fold of control; no published nM range exists for it.
- P/O is a separate measurement and is not affected by peroxide. Only the peroxide band (1-100 nM, Sies 2017) gets a real comparison.

## Changes
1. New optional measurement "Hydrogen peroxide (nM)" alongside the existing fold-of-control peroxide signal (both kept; they are different assays).
2. Accept it in manual entry, CSV template, and PDF/photo extraction, with nM and µM unit conversion.
3. Show the 1-100 nM band next to it in the upload review and the Patient Data table, labeled a research band, not a lab range. Flag only above 100 nM (10-100 nM is normal stress signalling).
4. Patient Comparison drift check: the peroxide row uses the measured nM value when entered, otherwise stays model-only as today.
5. Lab Ranges page notes that measured peroxide can now be checked when entered in nM.
6. Demo profiles get no invented nM value; the row reads "Not measured".

## Technical details
- `patientReference.ts`: optional `h2o2Nm` metric (values may be missing), reuse `readoutBands` H2O2 band in `referenceFor` and `readoutChecks`.
- `userPatients.ts`: `toAppUnit` for nM/µM; CSV template row.
- `api/extract-labs.ts`: add key to schema.
- `UserLabsPanel.tsx`, `PatientData.tsx`, `PatientComparison.tsx`, `lab-ranges.tsx`; update progress.md.

## Verify
- Enter 150 nM: flagged 50% above 100; 40 nM within band; drift check shows measured value. Typecheck clean, no page errors.
