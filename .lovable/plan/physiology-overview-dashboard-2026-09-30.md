# Physiology overview dashboard

## Goal
Turn the existing Physiology tab into one coordinated overview combining physiological reference status, an ATP driver network, and the iron × light interaction map.

## Experience
- Keep **Physiology** as the top-level tab and rename its page heading to **Physiology overview**.
- Add a compact status strip for ATP flux, P/O, Fe-S integrity, aconitase, and total flags.
- Use a responsive two-column overview area:
  - ATP driver network with a comparison mode selector.
  - Iron × light map with wavelength and output selectors.
- Keep the detailed whole-mitochondrion note, ETC reference table, citations, and iron-sulfur reference rows below the overview.
- Clicking an ATP network node highlights and scrolls to the matching ETC table row. Clicking it again clears the selection.
- Preserve horizontal scrolling for data-dense content on narrow screens without clipping controls.

## ATP comparison modes
- **Healthy reference**: compare the current model with the existing healthy default using the current membrane geometry.
- **Saved scenario**: choose one saved scenario as the comparison baseline. Use the existing scenario storage behavior, account-backed when signed in and browser-backed when signed out.
- Label baseline and current states clearly. Network color and node size continue to represent direction and share of the ATP-rate gap.
- If no saved scenarios exist, keep healthy reference active and show a concise empty state for the saved mode.

## Iron × light map
- Extract the existing map into a reusable component rather than duplicating its calculations.
- Preserve wavelength and output controls, baseline marker, study-dose lines, ferroptosis markers, NO crossing-dose context, platelet ACO2 study-control flags, source link, and research-only caveats.
- Keep the full Sensitivity tab working with the same reusable map.
- Keep AI map interpretation in Sensitivity only so the overview stays focused and does not duplicate saved-reply behavior.

## Technical details
- Add a shared ATP comparison-row helper so Compare and the overview use the same per-step rate formula and flag context.
- Add a reusable iron × light map component that owns its local wavelength/output state and accepts live model inputs.
- Extend Physiology with an optional focused ETC row and stable row targets for network-to-table linking.
- Compose the dashboard in a focused Physiology Overview component and pass the existing live inputs, geometry, outputs, and scenario refresh key from the page.
- Preserve cited math in the existing model/reference modules and record the new shared-view architecture in `AGENTS.md`.

## Documentation and verification
- Update `progress.md` with scope, user story, acceptance criteria, data behavior, testing, security, compliance, and deployment notes.
- Check type safety and the latest preview build.
- Verify healthy-reference and saved-scenario modes, network-to-row highlighting, both map wavelength/output controls, flags, citation links, and empty saved-scenario handling.
- Verify desktop and narrow layouts with no overlapping controls or clipped text.
