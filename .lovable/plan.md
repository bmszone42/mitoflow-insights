# Mitophagy as a real model setting, based on published turnover half-lives

## What changes
The urolithin A card's assumed curve is replaced by a new Simulator setting: **mitochondrial turnover half-life (days)**. It feeds the model's own math, so superoxide, peroxide, Fe-S, ATP, flags, Diagnosis, the Dashboard, scenarios and downloads all respond.

## Published anchors (checked)
| Tissue (mouse) | Median half-life | Source |
|---|---|---|
| Liver | 4.3 days | Kim 2012, Mol Cell Proteomics 11(12):1586-1594, doi 10.1074/mcp.M112.021162 |
| Heart | 17.2 days | same |
| Liver / brain synaptic | 3.5 / 25.7 days | Stauch 2023, Scientific Reports, doi 10.1038/s41598-023-38484-0 |

Slider range 2 to 60 days. Default 17.2 days (heart). Quick-set buttons for liver, heart and brain.

## How it enters the math
- Turnover rate = ln 2 / half-life (published).
- Damaged-mitochondria fraction = damage rate / (damage rate + turnover rate). The damage rate is **set so 10% are damaged at the default**. This calibration is my assumption, not a measured number.
- The damaged fraction compared with the default changes three things inside the model:
  1. Membrane potential: damaged mitochondria are depolarized, so the effective potential falls a little.
  2. Electron leak: damaged chains leak more superoxide.
  3. Labile iron: damaged mitochondria release iron, raising free Fe2+ and Fe-S attack.
- ATP capacity scales with the share of healthy mitochondria.
- At 17.2 days every output is exactly as today, so current results, flags and the healthy line do not move until you change the setting.

## Urolithin A
The urolithin A dose slider stays. It now shortens the half-life instead of using a separate curve (1000 mg/day = up to 30% faster turnover, still labeled "effect size assumed"). It stays a local exploration card and does not change saved settings.

## Patient profiles
Profiles keep the default half-life (no lab measures it). It shows as "not measured" in the patient banner.

## Also
- Both papers scored and logged on the References page.
- Replace the project rule that mitophagy must stay local; update the code notes and progress.md.
- Report what changes on Demo 18 and the healthy profile at liver, heart and brain half-lives.

## Technical details
- `model.ts`: add `mitoHalfLife` to `Inputs`, `defaultInputs` (17.2) and `inputRanges` (2 to 60 days). In `simulate`: `kt = ln2 / t`, `D = kd / (kd + kt)` with `kd = kt0 * 0.1 / 0.9`, `dD = D - 0.1`; psi minus `40 * dD` mV, leak times `1 + 2 * dD`, labile iron times `1 + 1.5 * dD`, ATP times `(1 - D) / 0.9`. Clamp `dD`.
- Old saved scenarios without the field default to 17.2 when loaded.
- `mitophagy.ts` becomes the urolithin A to half-life mapping; `MitophagyExplorer` updated.
- Add slider to `SliderPanel.tsx` groups; check Sensitivity and AI routes pick it up through `inputRanges`.
- Browser check of Simulator, Dashboard and Diagnosis.
