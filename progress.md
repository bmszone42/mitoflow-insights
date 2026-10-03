- Diagnosis page gains a Model dose picker (0.25x to 2x) beside Therapy flags; diagnoseProfile and diagnoseAll take a dose parameter, so the Therapy flags list, its counts and the all-profiles table Therapies column follow the chosen dose and match the dashboard (verified: Leigh 13 at 1x, 14 at 2x, 11 at 0.25x).

## Dashboard therapy flag count (2026-10-03) ✅
- Dashboard table flag column reads "Flags: lab / assay / model / therapy (dose)"; the therapy count follows the model dose picker and matches the Diagnosis page at 1x (verified: sepsis 15, Leigh 13 at 1x; Leigh 14 at 2x).
- Dashboard CSV gains a "Therapy flags (dose)" column between Model flags and Total flags (total still lab + assay + model, since therapy flags are model levers, not abnormal flags).
- Batch therapy CSV gains a "Therapy flags" column after Total flags, and its footer note explains that therapy flags count model therapies and are not part of Total flags.
- Dashboard header text explains the therapy count. Verified live: Demo 15 = 11/5/2/15 (total 18), Demo 04 = 9/6/2/13 matching Diagnosis, both CSVs carry the new columns, no page errors; typecheck clean.
