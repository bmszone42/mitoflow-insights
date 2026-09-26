# Sensitivity analysis view

New "Sensitivity" tab next to Simulator, Structure and Reference. Uses the current slider settings as the baseline.

## 1. Tornado chart
- For each driver, nudge it down and up by a chosen step (default plus or minus 20%) and show how much each output moves.
- Drivers: electron flux (NADH/NAD+ pool, succinate drive, oxygen), iron (labile iron), photon (660 nm dose, 810 nm dose).
- Pick the output from a dropdown: superoxide, H2O2, hydroxyl radical, peroxynitrite, lipid peroxyl, Fe-S intact, aconitase, free Fe2+.
- Bars sorted by impact, pink for increases, green for decreases.

## 2. Sensitivity heatmap
- Grid of drivers (rows) by outputs (columns), each cell colored by normalized sensitivity (percent change in output per percent change in driver).
- Hover shows the exact value. Answers "which knob matters most for which output" at a glance.

## 3. Sweep curves
- Choose one driver, sweep it across its full range, plot ROS outputs (log scale) and Fe-S intact / free iron on a second axis.
- Dashed marker at the current baseline value.

## Technical details
- New pure function `sensitivity(base, drivers, delta)` and `sweep(base, key, n)` added to `src/lib/mito/model.ts`, reusing `simulate`.
- New component `src/components/mito/Sensitivity.tsx` with recharts; driver ranges reuse the slider definitions (exported from Simulator into a shared list).
- Update progress.md.
