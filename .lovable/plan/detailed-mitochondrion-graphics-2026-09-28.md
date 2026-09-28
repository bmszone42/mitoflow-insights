# Detailed mitochondrion graphics

Goal: replace the simple capsule-and-fins 3D viewer with a rich, labeled, textbook-quality mitochondrion modeled on the uploaded Figures 1 to 5, still driven live by the model.

## What you will see

1. **Detailed 3D mitochondrion (Structure tab)**
   - Translucent outer membrane with a visible lipid bilayer edge (two leaflets, head-group beads) on a cutaway half, so you look inside.
   - Folded inner membrane with lamellar cristae, narrow crista junctions (OPA1 / MICOS rings), and matrix granules.
   - Real protein shapes along the cristae: Complex I (L-shape), II, III (dimer), IV, ATP synthase dimers at the crista tips, cytochrome c and ubiquinone shuttles moving between them.
   - Matrix contents: circular mtDNA nucleoids, TCA cycle ring, Fe-S cluster sites ([2Fe-2S] and [4Fe-4S] ball-and-stick) on CI, CII, CIII Rieske and aconitase.
   - Animated flows: electrons along the chain, protons pumped into the cristae space, ROS puffs at CI/CIII sites scaled by model superoxide, iron release glow when Fe-S erodes, red/NIR photons entering at CIV, and a 71 THz shimmer on the membrane scaled by coherence.
   - Hover or click any part for a label card (name, role, live model value).
   - Zoom presets: Whole organelle, Crista close-up, Complex close-up, Fe-S cluster.

2. **New "Pathway map" panel (Simulator)** in the style of Figure 3: the ROS/RNS, Fe-S, iron, Fenton loop as a live diagram. Each box shows its current value and arrows thicken with flux, with antioxidant and iron-handling brakes.

3. **71 THz hypotheses card** (Figure 4): H1 to H4 shown with which model terms currently drive the signal.

## Out of scope for now
- MOT / causal DAG (Figures 5 and 6) as model features. Can be a later step.

## Technical details
- Rewrite `Cristae3D.tsx` into smaller pieces under `src/components/mito/3d/` (Membranes, Cristae, Complexes, FeSCluster, Flows, Labels), still lazy-loaded, client-only.
- Procedural geometry (LatheGeometry for membranes, instanced meshes for lipids and complexes) to stay under ~100 draw calls; drei `Html` for labels, local `Environment` with Lightformers, soft bloom for glows.
- Bio-luminescent palette kept from the current theme; values read from existing `simulate` outputs and `geometryEffects`, no model math changes.
- Pathway map is SVG, reads `Outputs`.
- Verify with Playwright screenshots at each zoom preset.
