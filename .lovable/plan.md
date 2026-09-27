# Photoreceptor model for red / near-infrared light, with 71 THz coherence

## Goal
Replace the current fitted curve shapes (bell curves and ramp terms that multiply the model's rates) with a mechanistic photoreceptor model: photons reach the mitochondrion, specific chromophores absorb them, and each excited chromophore drives a named downstream effect. The 71 THz output becomes a pumped coherence term with a threshold, not just a value proportional to electron flux. Then re-run the full sensitivity analysis and report what changed.

## What changes for you
- Simulator light inputs gain two sliders: **irradiance** (mW/cm², sets dose rate) and **tissue depth** (mm, 0 = cultured cells). Dose stays in J/cm²; exposure time is derived and shown.
- A new **"Photoreceptor" panel** in the Simulator: photons absorbed per chromophore (CuA, heme a/a3, flavins, porphyrins), share of NO released, and each path's contribution to Complex IV rate, superoxide and H2O2.
- A new **"71 THz coherence" readout**: pump rate vs threshold, coherent fraction, and what is damping it (lipid peroxidation, oxidized cardiolipin, heat).
- Dose response curves, the iron x light map, Sensitivity, CSV and AI explanations all update automatically.

## The model (replaces photonResponse, photonLeak, noAfterPhotolysis)
1. **Delivery:** fluence at the mitochondrion = dose x exp(-mu_eff x depth), with mu_eff about 0.35/mm at 660 nm and 0.2/mm at 810 nm for soft tissue (Jacques 2013). 810 nm reaches deeper.
2. **Absorption by chromophore:** absorbed photons = fluence x action spectrum weight x cross-section, for CuA (red-shifted, strong at 810 nm), heme a/a3 (stronger at 660 nm), flavins/FMN (660 nm tail only) and porphyrins. Action spectrum from Karu 1999/2010 CCO bands (620, 680, 760, 820 nm).
3. **Excitation with saturation:** excited fraction = absorbed rate / (absorbed rate + relaxation), so high irradiance saturates (this is where the dose-rate reciprocity breakdown comes from).
4. **Downstream effects, each from its own chromophore:**
   - NO photodissociation from heme a3-CuB (quantum yield about 0.1 to 0.3, Lane 2006) frees Complex IV.
   - CuA / heme a excitation speeds up Complex IV electron transfer (the Complex IV gain).
   - Flavin / FMN excitation makes H2O2 directly and raises Complex I IF superoxide (Hockberger 1999).
   - Semiquinone excitation at Complex III raises Qo superoxide at high dose.
   - Heating: temperature rise proportional to irradiance x absorption; above about 2 °C it raises proton leak and ROS. This gives the biphasic high-dose fall naturally, replacing the hand-made bell curve.
5. **71 THz coherence (Frohlich-type pumped mode, hypothetical):** pump = electron flux x membrane potential plus a share of absorbed photon energy; losses = baseline damping plus lipid peroxyl, oxidized cardiolipin and heat. Coherent fraction switches on smoothly above threshold (pump / loss > 1). Emission = coherent fraction x pump. Still clearly labelled a relative reporter, not a radiometric prediction.

Strengths are my own estimates chosen so default settings stay close to today's outputs; cited sources set the shapes and relative sizes, not fitted values.

## Re-run sensitivity
Run the full tornado at defaults and at a real dose (10 J/cm² 660 nm, 20 J/cm² 810 nm), compare against the previous table, and report the biggest shifts in ROS, Fe-S and 71 THz.

## Technical details
- All math stays in `simulate` in `src/lib/mito/model.ts` as a pure `photoreceptor(i)` function returning a typed breakdown; the cited parameter block gets the new sources.
- New inputs `irradiance` and `tissueDepth` added to `Inputs`, `defaultInputs`, `inputRanges` and a "Photon input" sensitivity group; saved scenarios without them fall back to defaults.
- New numeric outputs (`coherentFraction`, `tempRise`, `noReleased`) added to `sensOutputs`; the breakdown object is excluded from AI payloads like the other non-numeric outputs.
- Reference library photon notes updated; progress.md and AGENTS.md updated.
- Verify: typecheck, a script comparing old vs new dose curves, browser check of the Simulator and Sensitivity tabs.

## Out of scope
Wavelengths other than 660 and 810 nm, pulsed-light timing, and time-course (non steady state) behaviour.
