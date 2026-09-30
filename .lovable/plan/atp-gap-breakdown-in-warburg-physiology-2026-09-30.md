# ATP gap breakdown in Warburg Physiology

## Goal
Add a live step-by-step ATP rate breakdown to the Warburg Physiology tab, comparing the current settings with the same-geometry healthy baseline.

## Changes
- Extend each Physiology row with its healthy ATP rate, current ATP rate, signed gap, and contribution to the independent-step ATP gap.
- Use the existing model convention: ATP rate = ATP per electron pair × routed step flux ÷ 2.
- Route Complex I rows through Complex I flux, Complex II through Complex II flux, and downstream Complex III, cytochrome c, and Complex IV rows through Complex IV flux.
- Calculate contribution share from the absolute gaps of the eight independent rows. Show Overall NADH to O₂ separately as a chain summary so it does not double-count the total.
- Add a compact summary above the table with healthy ATP flux, current ATP flux, and the signed whole-chain gap.
- Preserve all existing textbook-range, cause, ROS, and citation columns and flags.
- Add stable test labels for the summary and per-row ATP gap values.

## Verification
- Run a Warburg case with 40% uncoupling.
- Confirm every row shows healthy rate, live rate, gap, and share.
- Confirm independent shares sum to 100%, the overall row is labeled as a summary, and existing ATP/ROS flags still work.
- Check the preview at desktop and the current narrower viewport, then confirm no build or runtime errors.

## Documentation
- Update `progress.md` with the completed ATP gap breakdown and current security/deployment notes.
- Record the shared ATP-rate attribution convention in `AGENTS.md` so Physiology and Compare remain consistent.
