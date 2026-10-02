# Real lab data for patient profiles

## Goal
Replace invented numbers with real ones wherever a source exists: published case values for each condition, plus your own uploaded, de-identified results. Values that were never measured stay invented but are clearly marked, so Diagnosis shows which parts of a ranking come from real numbers.

## Published case values
- For each of the 18 conditions, find a published case report or cohort table (open access, linked by DOI) that gives blood lab values: lactate, pyruvate, L:P ratio, glucose, ferritin, transferrin saturation, and any mitochondrial assays it reports (for example muscle complex activity, OCR, P/O).
- Each real value records its paper, table or page, specimen and whether it is one patient's value or a cohort mean or median.
- Profiles become "published-case profiles": named by condition and paper, never by patient identity. Healthy profiles use published control group values.
- Any condition without a usable published source keeps its current invented values and is labeled "No published case found".

## Your own data
- New "Add your lab results" panel on Patient Data and Diagnosis: enter values by hand or upload a CSV (template download provided), with age, sex and fasting status.
- Entries stay in this browser tab only; nothing is sent to or saved on the server. A warning says not to include names, dates of birth or record numbers, and identifier-like columns are rejected.
- Your profile is ranked on the Diagnosis page next to the published ones.

## Missing values
- Gaps are filled with the current invented value and marked "Synthetic fill" everywhere they show.
- Diagnosis lists each cause's supporting evidence as real or synthetic and shows a "real-data share" per ranking. A cause backed only by synthetic fill is labeled as such.

## Technical details
- `patientReference.ts`: each value becomes `{ value, origin: "published" | "user" | "synthetic", citation?, locator? }`; `values` stays available as plain numbers so existing pages keep working.
- `src/lib/mito/userPatients.ts`: CSV parse and validation (zod), units checked against metric ranges, identifier column rejection; held in React state only.
- `diagnosis.ts`: evidence carries origin; scores unchanged, plus real-data share.
- Citations added to `studyReferences.ts` after checking each paper's table.
- Update `progress.md`, `roadmap.md`, `src/lib/mito/AGENTS.md`.

## Verification
- Every published value checked against its source table.
- Diagnosis checks rerun (Leigh, PDH, iron overload, healthy); report any ranking that changes with real numbers.
- CSV upload with a test file; identifier columns rejected; desktop and mobile with no page errors.
