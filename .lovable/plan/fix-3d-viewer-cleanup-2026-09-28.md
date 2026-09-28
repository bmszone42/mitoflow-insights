# Fix 3D viewer cleanup

## What will change
- Render 3D labels only while they are enabled, rather than keeping hidden HTML overlays mounted inside the scene.
- Add a small teardown guard so the Structure selection is cleared when the viewer unmounts.
- Preserve the current camera, glow, controls, labels toggle, and model-driven animation behavior.

## Verification
- Repeatedly switch from Structure to Simulator and back.
- Confirm the mitochondrion redraws each time, labels and controls return, and no cleanup or page errors occur.
- Check the preview build status and update `progress.md` with the completed fix and deployment security review.

## Technical detail
The failure is isolated to the React Three Fiber canvas lifecycle. Drei `Html` labels create DOM portal nodes; hiding them with CSS leaves those nodes mounted until the canvas and tab tear down together, which can trigger a stale `removeChild`. Conditional mounting lets React remove the portals before the canvas is disposed.
