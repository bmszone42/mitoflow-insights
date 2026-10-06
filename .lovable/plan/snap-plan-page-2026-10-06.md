# Snap plan page

## What you get
A new "Snap plan" page in the menu where you schedule strength snaps per profile, with dates, and track progress.

- **Pick profiles**: checklist of all 18 profiles showing current effective strength, source, and inside/outside your saved band. Profiles outside the band are preselected.
- **Pick when**: a date per profile (or one date applied to all selected), plus target: nearest band edge (default) or a custom value 0-1.5x.
- **Schedule list**: each planned snap shows profile, from value, to value, date and status: Planned, Due today, Overdue, Done, Skipped.
- **Apply**: "Apply due snaps" button with a preview of which profiles move (same preview style as the Progress snap), Confirm, then reruns those profiles and logs each change in Strength history. Per-row Apply now, Skip, Remove.
- **Progress tracker**: count bar (done / planned / overdue), "N of 18 profiles inside the band" now vs after all planned snaps, and a small timeline of planned and done snaps by date, green inside band and red outside.
- Undo for the last applied batch, as on Progress.
- Spreadsheet download of the schedule.

Nothing applies automatically on a date; the date marks it Due and you confirm.

## Technical details
- New store `src/lib/mito/snapPlan.ts`: browser-local (localStorage `cristae-lab-snap-plan`), module state + change event, SSR guards, read after mount to avoid hydration mismatch.
- New route `src/routes/snap-plan.tsx` with its own head(); nav link in `__root.tsx`.
- Components split: `SnapPlanPicker.tsx`, `SnapPlanSchedule.tsx`, `SnapPlanProgress.tsx` (chart lazy-loaded).
- Reuses per-profile strength writes from `rirrDefault.ts`, `useStrengthRange`, history logging, and `recordRun` for reruns.
- Update AGENTS.md rule and progress.md.
