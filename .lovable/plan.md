# Diagnosis page (mechanism pattern review)

## Goal
One page that lists, for each of the 18 synthetic profiles, the most likely mitochondrial mechanisms behind its flags, combining Patient Data, ROS and ATP flags. It ranks causes inside a disorder's profile; it never names or confirms a disease from the numbers.

## Wording
- Page title "Diagnosis", subtitle "Mechanism pattern review". A permanent banner says: synthetic data, research and teaching only, not a medical diagnosis.
- Causes are mechanisms (for example "coupling loss", "respiratory-chain block", "pyruvate entry block", "iron and Fe-S stress", "oxidant load"), not diagnoses.

## Experience
- New route `/diagnosis`, linked from the Physiology and Patient Data tabs next to "Profiles vs healthy baseline".
- Overview table: one row per profile with age, condition label, flag counts (Patient Data, ROS assay, ATP assay, model) and the top cause.
- Select a profile to see:
  1. **Likely causes**, ranked, each with a score, supporting flags, conflicting flags, and the evidence type (measured assay, derived ratio, or model simulation).
  2. **Evidence by source**: Patient Data flags, ROS species assay flags, ATP assay flags, and model flags from the profile's membrane potential.
  3. **Does the label fit?** For each condition, the expected pattern written from the profile's own context text (for example PDH deficiency: high lactate and pyruvate with a normal ratio). Shown as "matches", "partly matches" or "does not match", never as a confirmed diagnosis.
  4. **Limits**: proxies are not assays, pediatric and nonfasting rules still apply, and scores are not probabilities.

## How causes are scored
- Fixed rules map each flag to the mechanisms it supports, for example: high lactate:pyruvate ratio plus low P/O supports respiratory-chain block; high lactate and pyruvate with a normal ratio supports pyruvate entry block; high labile iron, low aconitase and high lipid oxidation support iron and Fe-S stress; MitoSOX or H2O2 flags support oxidant load; low P/O with low ATP-linked oxygen use supports coupling loss.
- Score = number of supporting flags, weighted by evidence type (measured assay 1.0, derived ratio 0.75, model simulation 0.5), minus conflicting flags. Ties keep a fixed order.
- Reuses existing flag logic only: Patient Data outlier and band flags, ROS and ATP profile assay flags, and the ATP model flags from the baseline page. No new biology numbers.

## Technical details
- `src/lib/mito/diagnosis.ts`: mechanism rules, `diagnoseProfile(profile)`, and `expectedPattern` per condition label.
- `src/routes/diagnosis.tsx` with its own title and description.
- Update `progress.md`, `roadmap.md` and the mito `AGENTS.md`.

## Verification
- Check that Leigh ranks respiratory-chain block first, PDH deficiency ranks pyruvate entry block, iron overload ranks iron and Fe-S stress, and healthy adults show no strong cause.
- Test at desktop and mobile widths with no page errors.
