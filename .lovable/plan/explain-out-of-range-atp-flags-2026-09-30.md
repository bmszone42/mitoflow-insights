# Explain out-of-range ATP flags

## Changes
- Add shared attribution logic for flagged pumping steps using the live membrane potential, uncoupling, and derived NADH/FADH₂ P/O values.
- Show the active cause and its deviation from the healthy reference in Physiology step statuses.
- Show scenario-specific causes in Compare and healthy-versus-current causes in the Warburg ATP network details and tooltips.
- Keep fixed redox-drop flags clearly separate because sliders do not cause them.

## Technical details
- Extend ATP network row data with each run's membrane potential, uncoupling, and P/O values.
- Use counterfactual checks against the shared standard state to identify which changed inputs contribute to an out-of-range ATP-cost proxy.
- Update project documentation, then verify the flagged state in the running app at high uncoupling.
