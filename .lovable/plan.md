# Model settings reference dashboard

## Goal
Add a complete settings audit to the existing Physiology overview. It will show all 16 Simulator controls and all 8 mitochondrial shape controls against defensible published context, with one status per setting and a clear drift summary.

## Dashboard
- Add a **Model settings reference dashboard** near the top of Physiology overview.
- Summary strip shows:
  - settings outside a published/reference band
  - settings within a band
  - context-dependent settings with no universal numeric range
  - the names of all settings currently outside range
- Group the 24 settings into Energy and substrates, Iron and redox, Light, Ferroptosis, and Membrane geometry.
- Each row shows live value, model default, published/reference range or context, status, and linked source with interpretation limits.
- Statuses are **Within range**, **Outside range**, and **Context dependent**. Every setting receives one status.
- For out-of-range values, show direction and distance to the nearest range boundary, such as “40% uncoupling, 15 percentage points above 25%.”

## Reference integrity
- Keep slider min/max separate from literature ranges. Slider limits will never be presented as textbook physiology.
- Reuse the existing membrane potential and uncoupling bands and citations.
- Add numeric literature bands only where the cited source and unit match the model setting.
- Relative model controls, experimental light doses, tissue depth, and geometry without a universal interval remain visible but are labeled **Context dependent**, with their relevant literature or model-basis note.
- Keep P/O and ATP cost as derived readouts in the existing Physiology section, not as settings.

## Technical details
- Create a typed reference metadata module for all `Inputs` and `Geometry` keys, with group, formatter, optional numeric band, citation, URL, and caveat.
- Create a focused dashboard component that computes statuses and drift from live `inputs` and `geo`.
- Mount it in `PhysiologyOverview` without changing simulation math, scenario storage, or existing tables.
- Record the shared-reference metadata rule in `AGENTS.md` and update `progress.md` and `roadmap.md`.

## Verification
- Test default settings and deliberately out-of-range membrane potential and uncoupling values.
- Confirm all 24 settings render exactly once, drift names and distances are correct, source links are present, and context-dependent controls are never falsely flagged.
- Check desktop and narrow layouts, type safety, preview build, and runtime errors.
