# Mitochondria graphics overhaul

## Problems seen in the current view
- 3D organelle fills only about a third of the viewer, with a lot of empty black space around it.
- Labels are huge, overlap each other and cover the structure ("Crista juncti...", "Complex IV" under "Complex III").
- The membranes look like flat salmon plastic. There's no depth, no translucency and no sense of a double membrane.
- Complexes and particles read as colored noise at whole-organelle zoom.
- The 2D cross section is a basic diagram: straight green tubes with dots and a flat yellow glow.

## 3D viewer
1. **Framing:** fit the camera to the organelle bounds so it fills about 80% of the viewer, at a slight 3/4 tilt so the cut face and folds both show.
2. **Membranes:** switch to translucent physical materials with a soft rim light (Fresnel), for:
   - the outer membrane: pale, semi-clear, thin shell
   - the inner membrane: warmer, denser, with a subtle procedural bump texture for the lipid surface
   - the cut face: a clean, slightly glossy cross-section cap, so the double membrane and intermembrane gap read clearly
3. **Cristae:** smooth folds with rounded tips and visible neck junctions, shaded a little darker in the recesses (soft ambient occlusion) for depth.
4. **Matrix:** faint, grainy volume fog inside, instead of a flat fill.
5. **Lighting:** a studio-style lighting setup (bundled, no remote files), a key light and a colored back rim light, with tone mapping for gentle highlights. Bloom stays limited to glowing particles.
6. **Level of detail:** at whole-organelle zoom, hide individual complexes and show density shading on the folds instead. Complexes, electrons and ROS puffs fade in on Crista close-up and deeper.
7. **Labels:**
   - small (11px) leader-line callouts placed outside the silhouette, with collision avoidance
   - at most 6 labels per zoom level
   - the rest appear on hover

## 2D cross section
- Redraw as an illustrated SVG:
  - gradient double membrane with a visible intermembrane space
  - curved cristae folds with tapered necks and rounded tips
  - complexes drawn as small shaped glyphs (not dots) along the fold walls
  - soft matrix gradient
  - ROS and Fe-S hotspots as blurred radial glows sized by live model values
- Keep the current click-to-select behavior and legend colors.

## Out of scope
- No model or number changes. Links to the pathway map, the step labels and their green/amber tones all stay as they are.

## Technical details
- Files: `src/components/mito/3d/Organelle.tsx`, `3d/parts.tsx`, `Cristae3D.tsx` (camera fit, lighting, post effects), and the 2D cross-section component.
- Materials: `meshPhysicalMaterial` (transmission off for performance, `opacity`/`clearcoat`/`sheen`), with a custom Fresnel `onBeforeCompile` for the rim. The bump map is a canvas-generated noise texture.
- Local `<Environment>` with Lightformers (no preset CDN). ACES tone mapping, pixel ratio capped at 2.
- Labels: drei `Html` with a simple screen-space overlap pass, replacing the large sprites. The step labels keep their current text and colors.
- Performance stays within budget: under 100 draw calls using instancing for complexes and ATP synthase, and at most 2 post passes.
- Verify with screenshots at all four zoom presets, plus the 2D view.
