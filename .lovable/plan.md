# Textbook range layer for the iron x light map

## What will change

- Add shared published reference bands for Fe-S integrity and aconitase activity.
- Use 80 to 100% for modeled Fe-S integrity and 63 to 100% for aconitase activity.
- On the iron x light map, draw a red dashed inset halo around cells outside the active output's range.
- Extend each cell tooltip with the measured value, reference band, and outside-range status.
- Add a compact legend and count of flagged cells below the map.

## Technical details

- Keep reference values in `src/lib/mito/reference.ts`, separate from model calculations.
- Change only presentation and reference data. The mitochondrial equations and map values stay unchanged.
- The Fe-S 80% floor is a conservative healthy-control band. The aconitase 63% floor uses the lower published respiration-impact threshold reported by Scandroglio et al. Range labels will state this distinction.
- Update `progress.md`, run the focused type check, and verify both output selections in the live preview.
