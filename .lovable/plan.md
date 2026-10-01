# Clinical Interpretation view

## Goal
Turn the current ATP and ROS model flags into a plain-language narrative that ranks the sliders and steps most likely behind each flag, clearly labeled as model interpretation for research and teaching, not diagnosis.

## Experience
- New **Interpretation** subtab in Physiology, next to "ROS + ATP flags". It uses your live slider settings, so it updates as you move them (a separate page would lose the current settings).
- Optional profile picker (Simulated default or any synthetic profile), the same one used on the ROS tab.
- Sections:
  1. **Summary**: count of ATP and ROS flags, plus a one-paragraph overview.
  2. **Most likely causes**: sliders ranked by the size of their one-at-a-time effect on flagged ATP cost and ROS rates. Each entry says direction, size, and which flags it touches.
  3. **ATP steps**: each flagged step, whether it comes from the slider-driven ATP cost or a fixed redox drop, and the P/O shift.
  4. **ROS sources**: each flagged source, its largest input effect, and whether the profile's assay flag agrees.
  5. **Limits**: effects interact and do not add up, flags are model comparisons, and assay flags are species-level.
- Optional "Ask AI to expand" button that streams a longer write-up from the same facts and saves nothing.

## How it works
- Built only from existing calculations: ATP flags and causes, ROS rows, input effects, and profile assay flags. No new biology numbers.
- Ranking: for each changed slider, reset it alone and measure the change in flagged ROS rates and ATP cost. Normalize each to its own flag threshold so ATP and ROS can be ranked together.
- The narrative text comes from fixed templates, so it is the same every time for the same settings.

## Technical details
- `src/lib/mito/interpretation.ts`: `buildInterpretation(inputs, geo, profile?)` returns ranked causes, step and source sections.
- `src/components/mito/ClinicalInterpretation.tsx`, mounted in `index.tsx`.
- The AI expansion reuses `api/interpret.ts` with a new mode, so the key stays on the server and the shared rate limiter applies.
- Update `progress.md`, `roadmap.md` and the mito `AGENTS.md`.

## Verification
- Check default settings (no flags, "nothing to explain") and the stressed case at 190 mV with 40% uncoupling (expect 4 ATP flags and 7 ROS flags, with membrane potential and uncoupling ranked).
- Test at desktop and mobile widths with no page errors.
