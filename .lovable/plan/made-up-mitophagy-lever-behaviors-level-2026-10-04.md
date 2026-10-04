# Made-up mitophagy lever (behaviors level)

## What you get
- A "Mitophagy (exploratory)" card on the Simulator, under the existing results, labeled **MADE-UP, unvalidated**.
- One slider, 0 to 2x mitophagy rate (1x = current run, no change).
- Readout table: membrane potential, labile iron, ATP, superoxide, peroxide, Fe-S intact, current vs with-lever, with percent change; plus a chart of ATP and superoxide across 0 to 2x.
- Tagged "Behaviors level (Monzel 2023)" with a link to that reference library entry.

## How the invented lever works
Mitophagy clears damaged mitochondria, so the remaining pool looks healthier:
- Membrane potential moves toward the 160 mV default: shift = (160 - current) x 0.3 x (rate - 1), clamped.
- Labile iron falls as damaged mitochondria are cleared: iron x (1 - 0.2 x (rate - 1)).
- Above 1x, ATP capacity is trimmed slightly because there are fewer mitochondria: ATP x (1 - 0.1 x (rate - 1)).
- Below 1x the signs reverse (damaged mitochondria build up).
No published rate backs any of these numbers.

## Guardrails
- Lever stays inside the card: it never changes Simulator sliders, flags, Diagnosis, scenarios or CSVs.
- Not a diagnosis; model estimates only.

## Technical details
- `src/lib/mito/mitophagy.ts`: `applyMitophagy(inputs, rate)` returns adjusted Inputs (clamped with `inputRanges`) plus the ATP trim factor.
- `src/components/mito/MitophagyExplorer.tsx`, rendered from Simulator; the chart sits in a separate lazy file.
- progress.md and AGENTS.md updated.
