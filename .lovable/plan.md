# Warburg physiology tab

## What will change
- Add **Dashboard** and **Physiology** subtabs inside the existing Warburg view.
- Keep the current Warburg dashboard unchanged as the default subtab.
- Add a physiology table covering each cited electron-transport step.

## Physiology table
Each row will show:
- Step and electron path
- Literature-derived redox range and linked source
- Current ATP per electron pair, healthy-baseline ATP, and percent change
- Step-linked modeled ROS source, healthy-baseline ROS source, and percent change
- Separate ATP and ROS status flags

ATP flags will reuse the app’s existing cited redox ranges and effective ATP-cost band. ROS flags will use the selected healthy respiration baseline because universal per-step ROS concentration ranges are not established. A ROS source will flag when its modeled production differs from baseline by at least 25%; rows without a direct modeled ROS source will be labeled accordingly rather than assigned invented values.

## Step-to-ROS mapping
- Complex I entry: Complex I flavin site
- Complex I Fe-S relay and Complex I to Q: Complex I Q-site / reverse electron transport
- Complex II: Complex II flavin site
- Complex III Qo: Complex III Qo source
- Complex IV and carrier-only steps: no direct ROS source in the current model
- Overall NADH to O₂: total modeled superoxide production

## Documentation and validation
- Update project progress, feature specification, testing, and deployment-security notes.
- Record the shared Warburg physiology comparison rule in the architecture notes.
- Check the app build, then verify both Warburg subtabs and flagged states in the running preview.
