- Diagnosis page gains a Model dose picker (0.25x to 2x) beside Therapy flags; diagnoseProfile and diagnoseAll take a dose parameter, so the Therapy flags list, its counts and the all-profiles table Therapies column follow the chosen dose and match the dashboard (verified: Leigh 13 at 1x, 14 at 2x, 11 at 0.25x).

## Dashboard therapy flag count (2026-10-03) ✅
- Dashboard table flag column reads "Flags: lab / assay / model / therapy (dose)"; the therapy count follows the model dose picker and matches the Diagnosis page at 1x (verified: sepsis 15, Leigh 13 at 1x; Leigh 14 at 2x).
- Dashboard CSV gains a "Therapy flags (dose)" column between Model flags and Total flags (total still lab + assay + model, since therapy flags are model levers, not abnormal flags).
- Batch therapy CSV gains a "Therapy flags" column after Total flags, and its footer note explains that therapy flags count model therapies and are not part of Total flags.
- Dashboard header text explains the therapy count. Verified live: Demo 15 = 11/5/2/15 (total 18), Demo 04 = 9/6/2/13 matching Diagnosis, both CSVs carry the new columns, no page errors; typecheck clean.

- ✅ Projected peroxide: measured nM scaled by model H2O2 change, in the Simulator therapy table and a dashboard column + CSV (follows dose and Batch therapy picker)
- ✅ Projected MitoSOX: measured fold scaled by model superoxide change, in the Simulator therapy table and a dashboard column + CSV; flag clears when the projection re-enters the 0.59-1.5x band
- ✅ Projected flags on Diagnosis: measured MitoSOX / peroxide band flags shown with the strongest therapy's projected value at the chosen model dose, separate from the measured flag counts; note explains clearance is a model estimate, not a lab result, and why iron chelation and lipid radical-trapping never lower model peroxide while NAD+ precursors can raise it
- ✅ Best-therapy choice for projected flags unified (Diagnosis and dashboard agree)
- ✅ Timeline projected flag column (MitoSOX and peroxide per visit, follows each visit's therapies and model doses)
- ✅ Therapy plan page (/therapy-plan): flagged therapies per profile and model dose with projected flag clearance, CSV

## Timeline plan rows (2026-10-03) ✅
- New "Add a plan row" section: saves therapies and model doses for a date without new labs; the row reuses the latest earlier visit's labs and shows in the table as "Plan (no new labs)".
- Plan rows get the same simulated readouts and Projected flag column (MitoSOX and peroxide clearance) as real visits, removable via the trash icon; tab-only, never saved.
- Verified live: Leigh plan row with the antioxidant at 1x shows MitoSOX 1.32x to 1.12x, no page errors; typecheck and build clean.
