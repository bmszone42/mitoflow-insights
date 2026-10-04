# Real-dose sliders on the Progress grid

## What you get
- On the Progress page "Not yet run" section, each therapy row gets a slider in its real units (for example MitoQ 0-40 mg/day, NAC 0-1800 mg/day, selenium 0-200 micrograms/day), with a link to the dose source already on file.
- Next to each slider: superoxide change vs no therapy (%), plus the new value in nM against the healthy line.
- A "Run at this dose" button runs and logs it; the log row shows the real dose and the superoxide drop.
- Therapies with no numeric clinical dose (ketogenic diet, oxygen titration, photobiomodulation J/cm2 only if parseable) keep the existing 0.25x-2x model-dose cells only.

## Caveat (labeled on screen)
The doses are real; how a dose maps onto the model is assumed: top of the published range = 1x model dose, linear below it, capped at 2x. Same "Dose from trials, effect size assumed" badge used elsewhere.

## Technical details
- New `src/lib/mito/realDoses.ts`: numeric anchors per therapy id (min, max, unit, source from existing `doseSource`), `realDoseToModel(id, dose)`.
- `NotYetRun.tsx`: per-row slider (local state), compute via `applyTherapyDose` + `simulate`, show superoxide %.
- `runs.ts`: `RunRecord` gains optional `realDose` and `soChangePct`; `recordRun` stores them; `runs.tsx` log adds "Real dose" and "Superoxide change" columns. Grid cell for the mapped model dose still fills in.
- Update AGENTS.md rule, progress.md.
