# 3D Cristae Viewer

## Goal
A rotatable 3D mitochondrion in the Structure tab. You reshape the outer and inner membranes with sliders (or by dragging handles) and see electron flux and ROS update live beside it.

## What you will see
- A 3D organelle: translucent outer membrane shell, inner boundary membrane, and lamellar cristae folding into the matrix, with narrow crista junctions.
- Orbit, zoom and reset camera. Mobile friendly (touch orbit, capped detail).
- Shape controls:
  - Outer membrane: length, width (existing), plus new "outer membrane swelling" (gap between outer and inner boundary membrane).
  - Inner membrane: cristae count, depth, junction width (existing), plus new "cristae shape" (lamellar to tubular) and "cristae tip curvature".
- Color overlay toggle on the cristae: local membrane potential, superoxide production, or complex density (tips brighter, where ATP synthase dimers and supercomplexes sit).
- Live readout panel next to the viewer: electron flux, Δψ, ATP, O2•-, H2O2, •OH, Fe-S intact, with change vs default shape.
- Existing 2D cross-section stays as a secondary view.

## Coupling shape to the model (new)
Today geometry does not feed the redox model. Add a pure `geometryEffects(geo)` in model.ts returning multipliers applied inside `simulate`:
- Inner membrane area (count x depth) scales Complex I-IV capacity, so more cristae means higher electron flux capacity.
- Junction width: narrow junctions trap protons and cytochrome c, raising local Δψ and Complex III Qo superoxide; wide junctions (OPA1 loss) lower Δψ and cyt c retention.
- Tip curvature: stronger curvature supports ATP synthase dimers (higher ATP efficiency); flat cristae lower it.
- Outer membrane swelling: loosens cristae, lowers cyt c retention, raises leak.
Strengths are my own estimates, bounded to about 0.5x to 1.8x, cited (Cogliati 2013, Frezza 2006, Paumard 2002) and documented in the parameter block.
Geometry becomes an optional sensitivity driver group "Structure" so tornado, sweep and CSV pick it up automatically.

## Technical details
- Packages: three, @react-three/fiber@^9, @react-three/drei@^10.
- New `src/components/mito/Cristae3D.tsx`, loaded lazily behind a client-only gate so SSR never evaluates three.
- Procedural geometry: capsule outer shell (MeshPhysical, transmission-free translucency), inner shell offset by swelling, cristae as extruded rounded slabs or tubes per shape slider, instanced where possible. Under 100 draw calls.
- Per-vertex color overlay computed from `geometryEffects` and local depth.
- Lighting via local Lightformer environment, no CDN presets. Art direction matches the existing bio-luminescent palette (deep teal, emerald, pink), not neon.
- `simulate(inputs, geo?)` keeps current behavior when geo is omitted; index route passes `geo`.
- Micrograph AI geometry suggestions keep working via extended `geometryRanges`.
- Verify with the skill screenshot harness; update progress.md and AGENTS.md.

## Out of scope
Free-form sculpting of individual cristae, and time-dependent remodeling.
