# Treatment page (therapy-to-slider map)

## Goal
A `/treatment` page that turns each Diagnosis mechanism into research therapy classes, shows which model sliders each therapy moves, and simulates the ATP and ROS effect of that move. Research and teaching only; never dosing or medical advice.

## Wording
- Title "Treatment", subtitle "Therapy targets in the model". Permanent banner: synthetic data, model levers not prescriptions, not medical advice.
- Therapies are named as mechanism classes with cited examples (for example "Complex I bypass: idebenone, research"), never as recommended treatments for a person.

## Experience
- Linked from the Diagnosis page (per profile: "See therapy targets") and from Physiology / Patient Data next to Diagnosis.
- Profile picker (same 18 synthetic profiles); default reads the profile's top Diagnosis causes.
- **Therapy table**: one row per therapy class with targeted mechanism, sliders it moves (direction and size, e.g. antioxidant capacity +50%), evidence status (approved use, trial, preclinical) and a citation.
- **Simulated effect**: for each therapy, ATP flux, ATP cost, superoxide, H2O2 and ATP/ROS flag counts before vs after, starting from the profile's membrane potential with other inputs at defaults (same rule as Diagnosis and ROS profiles).
- **Ranked for this profile**: therapies sorted by how many of the profile's flagged mechanisms they target, then by modeled flag reduction. Not a ranking of clinical benefit.
- "Open in Simulator" button applies the slider changes to the main workspace.
- Limits section: one-at-a-time slider moves, no pharmacokinetics, no interactions, synthetic profiles.

## Therapy classes (initial set, all mapped to existing sliders)
- Antioxidant support (MitoQ, NAC): antioxidant capacity up. Oxidant load.
- Iron chelation (deferiprone): labile Fe2+ down. Iron and Fe-S stress.
- Ferroptosis protection (GPx4 / FSP1 support, CoQ10): GPx4 and FSP1 up, cardiolipin PUFA down. Iron stress.
- Mild uncoupling (low-dose DNP analogs, UCP activation): uncoupling up. High-potential ROS; costs ATP.
- Complex II / succinate bypass, riboflavin: succinate drive up. Respiratory-chain block.
- NAD+ precursors (NR, NMN): NADH pool ratio adjusted. Respiratory / pyruvate.
- Ketogenic or dichloroacetate for pyruvate entry block: NADH pool and succinate drive. Pyruvate entry block.
- Photobiomodulation (660 / 810 nm): red or NIR dose up. Coupling loss and respiratory block.
- Nitric oxide modulation: NO down (relieves CIV inhibition). Respiratory block.
- Oxygen support: oxygen up. Acute ischemia profiles.

## Technical details
- `src/lib/mito/treatment.ts`: therapy records (mechanisms, slider patch, evidence status, studyReferences id), `simulateTherapy(profile, therapy)` reusing `simulate`, `atpNetworkRangeFlags` and `rosSourceRows`, and `rankTherapies(diagnosis)`.
- Citations verified and added to `studyReferences.ts`; unverified ones labeled.
- `src/routes/treatment.tsx` with own head metadata; Simulator handoff via search param read in `index.tsx`.
- Update `progress.md`, `roadmap.md`, `src/lib/mito/AGENTS.md`.

## Verification
- Leigh ranks Complex II bypass and photobiomodulation high; iron overload ranks chelation first; healthy profiles show no targeted therapy.
- Desktop and mobile, no page errors.
