# Ferroptosis module

## What you get
- Three new Simulator sliders: GPx4 activity, FSP1/CoQ10H2 capacity, and cardiolipin PUFA fraction.
- New Simulator result cards: lipid hydroperoxide load (PLOOH), cardiolipin oxidized fraction, and a ferroptosis state badge (Protected / Primed / Committed) with the threshold crossed.
- A small "Ferroptosis" panel in the Simulator: a gauge of PLOOH against the commitment threshold, and a bar showing how much of the lipid peroxide load GPx4, FSP1 and baseline scavenging each remove.
- Sensitivity tab: the new sliders become drivers and PLOOH, oxidized cardiolipin and ferroptosis risk become outputs, so they show in the tornado chart, heatmap, sweep, CSV report and AI explanation automatically. The interaction map can pick them as outputs.
- Reference library: short entries for GPx4, FSP1, ACSL4 and cardiolipin peroxidation.

## How the model works (plain terms)
- Lipid peroxidation starts from hydroxyl radical, peroxynitrite and free iron (Fenton on lipid hydroperoxides), so iron and light still feed in.
- GPx4 (needs glutathione, tied to antioxidant capacity) and FSP1 (regenerates reduced CoQ10) remove lipid hydroperoxides; each is a first-order removal term.
- Cardiolipin oxidized fraction rises with PLOOH and PUFA content. Thresholds: Primed above ~10% oxidized cardiolipin (cytochrome c release begins), Committed when PLOOH exceeds removal capacity and iron-driven propagation self-amplifies.
- Values drawn from literature: GPx4 k ~ 1e7 M-1 s-1 on PLOOH (Ursini 1985), FSP1 CoQ10 route (Bersuker 2019, Doll 2019), cardiolipin peroxidation and cyt c release (Kagan 2005). Scaling is a lumped estimate, marked as such.

## Technical details
- `model.ts`: add inputs `gpx4`, `fsp1`, `cardiolipinPufa` with defaults and `inputRanges`; add outputs `plooh`, `cardiolipinOx`, `ferroptosisRisk` (0 to 1) and `ferroptosisState`; extend `sensitivityDrivers` and `sensOutputs`; citations in the parameter block.
- AI suggest/interpret routes pick up the new sliders via `inputRanges`; older saved scenarios get defaults for missing inputs on load.
- `reference.ts`: new entries. `Simulator.tsx`: sliders, cards, panel. No server or storage changes.
- Update progress.md and AGENTS.md.
