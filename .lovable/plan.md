# Profile sensitivity: ROS-induced ROS release vs half-life vs antioxidant capacity

## What you get
A new card in the Sensitivity tab, "Profile sensitivity", listing all 18 profiles.

- For each profile, three settings are nudged down and up one step (default 20% of their range): ROS-induced ROS release strength, turnover half-life, antioxidant capacity.
- Columns show the percent change in superoxide, ATP and free iron for each nudge (9 cell pairs per row), colored pink for increases, green for decreases.
- A small "which matters most" tag per profile names the setting with the biggest superoxide swing.
- Step slider (5 to 50%) and output filter; a toggle to sort by the biggest ROS-induced ROS release effect.
- A line chart for one picked profile: superoxide across the full range of each of the three settings (normalized 0 to 100% of range), with the healthy line.
- CSV download of the table.

Each profile runs on its own baseline (default inputs plus its profile values, current geometry), one setting changed at a time. Effects do not add. Model estimates only, labeled as such; ROS-induced ROS release strength stays marked "assumed".

## Technical details
- New `src/lib/mito/profileSensitivity.ts`: `profileSensitivity(geo, delta)` using `profileInputs` from treatment.ts and `simulate`; returns per-profile down/up percent for superoxide, atpFlux, freeIron; plus `profileSweep(p, key, n)`.
- New `src/components/mito/ProfileSensitivity.tsx` (chart lazy-loaded), mounted in `Sensitivity.tsx`; CSV built client side.
- Update progress.md and src/lib/mito/AGENTS.md (one rule).
- Verify in browser: card renders 18 rows, CSV downloads, no errors.
