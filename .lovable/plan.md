# ATP flag cause attribution

## Changes
- Show a visible cause list beneath the ATP driver network for every flagged step, not only the selected node.
- Keep click details, but label current-run attribution as **Slider cause** and distinguish fixed redox-drop flags as model parameters.
- Add the same slider-cause wording to Warburg ETC step cards when ATP yield or effective cost is flagged.
- Update Physiology status cells to use **Slider cause** for membrane-potential and uncoupling attribution, while keeping P/O clearly labeled as the resulting readout.
- Preserve existing ATP formulas, ranges, and reference citations.

## Verification
- Test a high-uncoupling Warburg case and confirm all flagged pumping steps name uncoupling and resulting P/O.
- Confirm Physiology flags show the same attribution.
- Check desktop and narrow layouts, type safety, and preview health.
- Update `progress.md` after verification.
