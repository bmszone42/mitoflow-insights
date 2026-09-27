# CSV export for sensitivity results

## What to build

A "Download CSV report" button in the Sensitivity tab that exports the numbers behind every chart: the tornado/heatmap sensitivity table, the full-range sweep for the selected driver, and the iron x light interaction map. One file, `cristae-lab-sensitivity.csv`, with labeled sections.

## How

1. `src/lib/mito/csv.ts` (new, browser-safe)
   - `sensitivityCsv(inputs, delta, sweepKey, lightKey)`: builds CSV text with sections:
     - header: app name, date, baseline inputs (key, value)
     - sensitivity table: driver, group, output, down %, up %
     - sweep: driver value, all 8 outputs per row
     - interaction map: labile iron, light dose, all 8 outputs per row
   - Proper escaping for labels; numbers via toPrecision.

2. `src/components/mito/Sensitivity.tsx`
   - Button next to the perturbation step slider. Builds the CSV from the current inputs and settings, downloads via Blob URL. No server call, no AI, no usage limit.

3. Verify: typecheck, then browser test (click the button, confirm the download fires and the CSV parses with the expected sections and row counts).

## Notes

- Export is values only; charts themselves are not embedded (CSV cannot hold images).
- All data is already computed client side, so this is a pure download with no new backend.
