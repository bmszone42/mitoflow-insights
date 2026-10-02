# Real lab data for patient profiles

## Goal
Replace invented numbers with real ones wherever a source exists: published case values for each condition, plus your own uploaded, de-identified results. Values that were never measured stay invented but are clearly marked, so Diagnosis shows which parts of a ranking come from real numbers.

## Published case values
- For each of the 18 conditions, find a published case report or cohort table (open access, linked by DOI) that gives blood lab values: lactate, pyruvate, L:P ratio, glucose, ferritin, transferrin saturation, and any mitochondrial assays it reports (for example muscle complex activity, OCR, P/O).
- Each real value records its paper, table or page, specimen and whether it is one patient's value or a cohort mean or median.
- Profiles become "published-case profiles": named by condition and paper, never by patient identity. Healthy profiles use published control group values.
- Any condition without a usable published source keeps its current invented values and is labeled "No published case found".

## Your own data
- New "Add your lab results" panel on Patient Data and Diagnosis: enter values by hand, upload a CSV (template provided), or upload a lab report as a PDF or photo (JPG, PNG).
- PDF and photo: the AI reads the report and fills in the matching tests (value, unit, the lab's own range if printed). You review every extracted value in an editable table before it is used; anything it can't read is left blank. Units are converted where safe (for example glucose mg/dL to mmol/L), otherwise flagged.
- Privacy: the file is sent once for reading and never stored. Before reading, you're warned to remove names, birth dates and record numbers; the AI is told to ignore and never return identifiers. Results stay in this browser tab only.
- Your profile is ranked on the Diagnosis page next to the published ones.

## Missing values
- Gaps are filled with the current invented value and marked "Synthetic fill" everywhere they show.
- Diagnosis lists each cause's supporting evidence as real or synthetic and shows a "real-data share" per ranking. A cause backed only by synthetic fill is labeled as such.

## Technical details
- `patientReference.ts`: each value becomes `{ value, origin: "published" | "user" | "synthetic", citation?, locator? }`; `values` stays available as plain numbers so existing pages keep working.
- `src/lib/mito/userPatients.ts`: CSV parse and validation (zod), units checked against metric ranges, identifier column rejection; held in React state only.
- `src/routes/api/extract-labs.ts`: authenticated-or-rate-limited server route; PDF pages rendered to images in the browser (pdf.js), images resized, sent to Lovable AI (vision model) with a strict JSON schema of the 14 metrics; response validated with zod; nothing logged or saved.
- `diagnosis.ts`: evidence carries origin; scores unchanged, plus real-data share.
- Citations added to `studyReferences.ts` after checking each paper's table.
- Update `progress.md`, `roadmap.md`, `src/lib/mito/AGENTS.md`.

## Verification
- Every published value checked against its source table.
- Diagnosis checks rerun (Leigh, PDH, iron overload, healthy); report any ranking that changes with real numbers.
- CSV upload with a test file; identifier columns rejected; desktop and mobile with no page errors.
