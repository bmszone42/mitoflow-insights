# Microscopy image analysis

New panel in the Structure tab: "Analyze a micrograph".

## What the user does
- Upload or drag in a mitochondrial image (TEM, cryo-ET slice, confocal/MitoTracker, SIM/STED). PNG, JPEG or WebP, up to 8 MB. Image is resized in the browser to max 1600 px before sending.
- Optional fields: imaging modality, sample/condition, scale (nm per pixel or scale bar length).
- Click "Analyze". Results stream in live.

## What the AI returns
1. Identified features, each with a confidence level:
   - Cristae density, shape (lamellar, tubular, swollen, onion-like), junction width, crista lumen swelling
   - Matrix density, outer membrane integrity, size/elongation, fragmentation vs network, contact sites, inclusions or electron-dense deposits (possible iron)
2. Effects on predictions: ROS (supercomplex packing, RET risk), Fe-S and aconitase, iron handling (deposits, ferritin, mitophagy), photon response (CCO density per membrane area, light penetration), with the 71 THz band only as a relative reporter.
3. Suggested geometry for the Structure view (cristae count, depth, junction width, matrix width, length) and suggested model sliders, each with a reason. Preview first; nothing changes until you click Apply.
4. Caveats (modality limits, fixation artifacts, single-section sampling).

## Storage and limits
- The image is not stored on the server. Optionally save the analysis text and a small thumbnail into the active scenario (IndexedDB).
- Counts toward the same AI usage limits; body limit raised only for this endpoint (about 3 MB after resize).

## Technical details
- `src/routes/api/analyze-image.ts`: Responses API, `openai/gpt-6-astra`, image sent as an input image content part (data URL), streamed text. A fenced JSON block at the end carries geometry and slider suggestions, parsed and clamped in the client using `inputRanges` and a new `geometryRanges`.
- `src/components/mito/MicrographAnalyzer.tsx`; Structure geometry state lifted to the route so suggestions can apply.
- Scenario record gains optional `micrograph: { thumb, analysis, at }`.
- Update AGENTS.md and progress.md (API docs, security: image size/type checks, no server retention, privacy note about uploading unpublished data to an AI provider).
