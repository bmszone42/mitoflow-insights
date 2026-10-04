# Dose-anchored oxaloacetate and mitophagy sliders

## What changes
The made-up 0 to 2x oxaloacetate slider (Simulator fuel presets, Warburg dashboard) and the made-up 0 to 2x mitophagy slider (Simulator) go away. In their place come sliders set in real daily doses taken from published human trials. Each slider shows a link to its source.

| Slider | Range | Sources (checked) | What trials found |
|---|---|---|---|
| Oxaloacetate (oral) | 0 to 2 g/day | Vidoni 2021, Alzheimer's & Dementia 17(1):7-17, doi 10.1002/alz.12156; TOAD trial NCT02593318 | 1 g and 2 g/day were safe; only small changes in brain energy markers |
| Urolithin A (mitophagy activator) | 0 to 1000 mg/day | Andreux 2019, Nature Metabolism, doi 10.1038/s42255-019-0073-4; Singh 2022, Cell Reports Medicine, doi 10.1016/j.xcrm.2022.100633 | 500 and 1000 mg/day raised markers of mitochondrial and mitophagy activity in muscle |

## The honest part
None of these papers gives a rate the model can use directly. Each slider turns a dose into the existing model lever using one stated assumption, shown on screen:
- Oxaloacetate: 2 g/day maps to at most 1.15x of the current lever (small effect, matching the weak trial signal). 0 g = 1x, no change.
- Urolithin A: 1000 mg/day maps to at most 1.3x of the mitophagy lever. 0 mg = 1x.
- Dose response is linear between those points and capped at the trial's top dose.
The labels change from MADE-UP to "Dose from trials, effect size assumed". These stay local exploration only and never change flags, saved scenarios or Diagnosis.

## Also
- Score each source out of 100 with a synopsis and add it to the References page.
- Keep the ATP and superoxide charts, with the healthy line, but drawn across the dose range.
- Update progress.md.

## Technical details
- New `src/lib/mito/doseAnchors.ts`: per-anchor `{ id, label, unit, maxDose, maxFactor, sources }` and `doseToFactor(anchor, dose)`; reuses `oaaFactor` math and `mitophagy.ts` effects with the factor as input.
- Edit `OaaSupplyExplorer.tsx`, `SliderPanel.tsx`, `MitophagyExplorer.tsx`, `MitophagyChart.tsx` to use dose sliders.
- Add the three DOIs to `studyReferences.ts` and `referenceLibrary.ts`.
- Replace the AGENTS rules for made-up levers to cover dose-anchored levers.
- Check Simulator and Warburg tab in the browser.
