# Two-input interaction map: iron x light dose

## What to build

A heatmap in the Sensitivity tab that varies two drivers at once: labile iron on one axis, and 660 nm or 810 nm dose on the other. Each cell shows the value of a chosen output (ROS species, Fe-S intact, aconitase, free iron), so the user can see how iron and light jointly shape the outputs, not just one at a time.

## How

1. `src/lib/mito/model.ts`
   - Add `grid2d(base, keyX, keyY, n)` returning an n x n grid: each axis spans the driver's slider range, each cell runs `simulate` and records all sensitivity outputs. n = 21 (441 simulations, all pure functions, fast enough).

2. `src/components/mito/Sensitivity.tsx`
   - New panel "Interaction map: iron x light" below the sweep chart.
   - Controls: light driver picker (660 nm / 810 nm) and output picker (the 8 sensitivity outputs).
   - Render as a colored cell grid (color-mix between primary and accent like the existing heatmap) with axis ticks and a hover title showing both input values and the output value. A baseline marker notes where current settings sit.
   - Log-scale coloring for ROS outputs (they span orders of magnitude), linear for Fe-S/aconitase/free iron.

3. Verify: typecheck, then browser test (panel renders, switching light driver and output updates the grid).

## Notes

- No AI call in this feature; the existing "Explain these results" panel stays one-driver-at-a-time.
- No changes to the model math, only a new read-only grid function.
