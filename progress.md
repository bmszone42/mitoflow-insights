
## Dashboard therapy flag count (2026-10-03) ✅
- Dashboard table flag column now reads "Flags: lab / assay / model / therapy" with the therapy flag count appended, matching the Diagnosis page's Therapy flags count for every profile.
- Dashboard CSV gains a "Therapy flags" column between Model flags and Total flags (total still lab + assay + model, since therapy flags are model levers, not abnormal flags).
- Batch therapy CSV gains a "Therapy flags" column after Total flags, and its footer note explains that therapy flags count model therapies and are not part of Total flags.
- Dashboard header text explains the therapy count. Verified live: Demo 15 = 11/5/2/15 (total 18), Demo 04 = 9/6/2/13 matching Diagnosis, both CSVs carry the new columns, no page errors; typecheck clean.
