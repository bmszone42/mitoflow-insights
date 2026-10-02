# Membrane potential in the Patient Data upload

## What exists today
- Manual entry, CSV template, and PDF/photo extraction already accept `membranePotential` (mV).
- The 150-180 mV research band (Zorova 2018) already drives the Patient Comparison drift check.

## What is missing
- The upload panel (UserLabsPanel) shows no healthy range next to any entered value, so a membrane potential reading gives no feedback until after the profile is added.

## Change
1. In `UserLabsPanel.tsx`, show the applicable healthy range next to each review row, resolved with `referenceFor` against the draft profile's age (research band for membrane potential, lab ranges for the 7 lab metrics, "no published range" otherwise).
2. When a membrane potential (or any ranged value) falls outside its band, mark the row inline (e.g. "12% below the 150 lower limit") using the existing `outsideText` helper, before the profile is added.
3. Keep wording honest: the mV band stays labeled a research measurement, not a clinical lab range.

## Verify
- Upload flow with 128 mV shows the below-band note inline; 165 mV shows within band.
- Added profile still feeds the Patient Comparison drift check as before.
- Typecheck clean; desktop and mobile spot check.
