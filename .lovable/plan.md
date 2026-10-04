# Make antioxidant capacity count more for superoxide

## Problem
Superoxide clearance scales with antioxidant capacity to the power 0.3, so halving capacity raises superoxide only about 23%. Membrane potential dominates, which is why no disease profile beats the healthy adult (0.0141 nM).

## Change
- Raise the antioxidant exponent on matrix and IMS superoxide clearance from 0.3 to 0.8. At 0.5x capacity superoxide then rises about 74% instead of 23%. 1x capacity (healthy default) stays exactly the same, so the healthy line does not move.
- Same exponent for both clearance terms, kept as one named constant with a comment saying it is a model tuning choice, not a measured rate.
- No other inputs, bands, or therapy moves change.

## What will shift (to be reported after the change)
- Re-rank all 18 profiles by superoxide and list which now sit above healthy.
- Check downstream: peroxide, Fe-S intact, lipid peroxidation, ferroptosis, Diagnosis flags, dashboard counts, projected flag clearance, antioxidant therapy effects (these get larger).
- Profiles with low potential (for example sepsis kidney injury at 136 mV) may still sit below healthy; that is expected.

## Caveat
This changes cited model outputs everywhere (Simulator, Dashboard, Diagnosis, Timeline, CSVs). Saved scenarios rerun with the new math. The exponent is a judgment call; no paper gives a tissue-general value.

## Technical details
- `src/lib/mito/model.ts` lines ~308 and ~313: `kSod` and `kSod1` use `antioxidantCapacity ** SOD_AC_EXP` with `SOD_AC_EXP = 0.8`.
- Record the rule in `src/lib/mito/AGENTS.md`; update `progress.md`.
- Verify with a bun script ranking profiles before and after, plus a browser check of Dashboard and Diagnosis.
