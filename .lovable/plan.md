# Link therapies to the disorders they target

## Goal
On the Treatment page, each therapy row becomes expandable: clicking it shows which synthetic disorder profiles it targets, with links into the Diagnosis page.

## Changes
1. `src/lib/mito/treatment.ts`: add `therapyTargets(t, all)` returning each profile where the therapy matches a strong cause (score >= 1.5, same cutoff as the existing ranking), with the matched mechanism names and cause scores.
2. `src/routes/diagnosis.tsx`: add a `profile` search param (zod, optional) used as the initial selected profile, so links can deep-link a disorder.
3. `src/routes/treatment.tsx`: each therapy row gets a toggle ("Which disorders does this target?"). Expanded, it lists matching profiles with mechanism and score, each linking to `/diagnosis?profile=<id>`. Rows with no strong-cause match say so plainly.

## Honesty rules
- Label it "targets in the model", not clinical indication; profiles stay marked synthetic.
- No new sliders, doses, or claims.

## Verify
- Expand a therapy (e.g. iron chelation) and confirm Friedreich / iron overload profiles appear with scores.
- Click through to Diagnosis and confirm that profile is preselected.
- Typecheck clean; desktop and mobile spot check; update progress.md and roadmap.md.
