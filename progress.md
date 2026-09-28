# Cristae Lab, progress

## Project overview

A browser workspace for modeling mitochondrial structure together with redox chemistry. It links
electron transport flux to ROS production, Fe-S cluster damage, labile iron release, red and
near-infrared photon input at cytochrome c oxidase, and a 71 THz mid-infrared output band. Session
only, no account or database.

## User personas

- Researcher exploring photobiomodulation dose windows and their redox cost.
- Clinician or practitioner reasoning about iron load, ferroptosis risk and light therapy.
- Student learning where each ROS species comes from and what removes it.

## Features

- ✅ Bio-luminescent design system in src/styles.css, all colors as oklch tokens
- ✅ Simulator with 11 literature-parameterized inputs and live steady-state outputs
- ✅ ROS panel covering O2•-, H2O2, •OH, ONOO-, 1O2, LOO• and HO2•
- ✅ Fe-S cluster integrity, aconitase-2 activity and free Fe2+ feedback loop
- ✅ Photon input at 660 nm and 810 nm with biphasic Arndt-Schulz dose response
- ✅ NO photodissociation from the Complex IV binuclear centre
- ✅ 71 THz reporter band with a 60 to 90 THz spectrum view
- ✅ Photon dose sweep chart for ATP flux and superoxide
- ✅ ROS and Fe-S dose response chart with 3 and 30 J/cm2 study markers and fitted estimates
- ✅ Structure modeler: cristae count, depth, junction width, matrix width, length
- ✅ Clickable complexes with annotations, ROS field overlay tied to redox stress
- ✅ Reference library: ROS species, Fe-S clusters, iron route, photon notes
- ✅ Route level head metadata
- ❌ Time-course integration, currently steady-state only
- ❌ Save, compare and export of model runs, needs a backend or file export
- ❌ Ca2+ handling, mPTP threshold and cytochrome c release
- ✅ Ferroptosis module with GPx4 and FSP1 explicit
- ✅ Site-resolved ROS pathways: CI IF/IQ, CIII Qo, CII IIF, OGDH; SOD1/SOD2; saturable Prx3 with hyperoxidation; ONOO- CO2/Prx3/thiol sinks; Fenton with Fe2+ recycling plus ONOOH homolysis; sources and sinks panel in Simulator
- ❌ Per-crista spatial gradients, current model is lumped
- ❌ User supplied rate constants and custom species

## Feature specifications

- As a user I set substrate supply, coupling, iron and photon dose and immediately see ROS levels,
  Fe-S integrity and the 71 THz output. Acceptance: every slider changes outputs without reload.
- As a user I shape cristae geometry and see derived membrane index and cristae density.
  Acceptance: geometry sliders redraw the section view and update derived values.
- As a user I look up any ROS species, Fe-S cluster or iron step with sources and sinks.
  Acceptance: all seven ROS species and all listed clusters are documented.

## Design assets

- Palette: background oklch(0.16 0.035 172), primary oklch(0.79 0.17 162), accent oklch(0.75 0.19 348)
- Type: Space Grotesk display, DM Sans body, JetBrains Mono data
- Tokens and utilities: src/styles.css, including panel, text-glow and mono-label

## Model and parameters

Full parameter list with citations lives in the header comment of src/lib/mito/model.ts. Key values:
SOD2 pseudo-first-order 1e4 s-1, Prx3 removal about 1.2 s-1, Fenton 1e3 M-1 s-1, ONOO- formation
1e10 M-1 s-1, aconitase inactivation 1e7 M-1 s-1, Fe-S assembly 5e-3 s-1, CIV photon gain up to
about 1.5x with optima near 10 J/cm2 at 660 nm and 20 J/cm2 at 810 nm.

## API documentation

No HTTP API. The model exposes pure functions: simulate(inputs) returns outputs, doseSweep(inputs,
wavelength) returns a 25 point dose series.

## Database schema

None. All state lives in React component state for the session.

## Environment setup

Bun plus Vite. Install with bun install, run with bun run dev on port 8080.

## Testing guidelines

Manual checks for now: sweep each slider through its range and confirm no NaN outputs, confirm dose
curves peak and then fall, confirm Fe-S integrity drops as superoxide rises. Add vitest unit tests
for simulate() boundary cases when the model gains a time course.

## Deployment

Publish from Lovable. Preview build and published build come from the same source, no environment
variables required.

## Version control

Small focused changes, one feature per change, model edits always accompanied by an update to the
parameter comment block and to this file.

## Security

- No authentication, no personal data, no secrets in the client bundle.
- All computation is client side, nothing is transmitted.
- Before deployment: keep dependencies current, avoid adding user generated HTML rendering, and if
  saved models are added later, put them behind authentication with row level security and
  per user ownership policies.
- Add a clear disclaimer wherever outputs could be mistaken for medical guidance. One is present
  at the foot of the workspace.

## Compliance

Educational and research tool only. Not a medical device and not for diagnosis or treatment. If
clinical claims or patient data are ever introduced, HIPAA and GDPR review is required first.


## Update: scenarios and AI interpretation
- ✅ Save, update, rename, delete, load scenarios: in your account when signed in (any device), in this browser when signed out
- ✅ Email/password and Google sign in (/auth), account button in header, one-click copy of browser scenarios into the account
- ✅ Export and import scenarios as JSON
- ✅ AI mechanistic interpretation of an experimental condition, streamed, grounded in current inputs and outputs
- ✅ Save interpretation into the active scenario
- ✅ Friendly errors for rate limit (429) and out of credits (402)
- ❌ Rate limiting per visitor on /api/interpret before publishing (security)
- ❌ Scenario comparison view

API: POST /api/interpret, body { condition: string, inputs: Record<string,number>, outputs: Record<string,number> }, returns streamed text/plain Markdown. Security: key stays server-side; input validated with zod (condition max 4000 chars); add abuse limits before publishing.


## Update: sensitivity analysis
- ✅ Sensitivity tab: tornado chart per output, driver by output heatmap, full-range sweep with baseline marker
- ✅ Drivers: NADH/NAD+, succinate, oxygen, labile iron, 660 nm and 810 nm dose; perturbation as share of range
- ❌ Two-driver interaction surface (e.g. iron by light dose)

## Update: comparison, AI limits, AI slider suggestions
- ✅ Compare two saved scenarios: inputs and outputs side by side with change and percent, ROS log bar chart, Fe-S and iron bars, saved AI notes in two columns
- ✅ AI usage limits: 10 per 10 minutes and 40 per day per visitor (by IP), 300 per day overall, 2000 character condition, 16 KB body, 10 second button cooldown, remaining counter
- ✅ Suggest settings: AI maps a described condition to slider values with reasons and confidence, clamped to slider ranges, apply one or all
- ❌ Durable rate limits (needs a database; current counters are per server instance and reset on restart)
- ❌ Workspace AI spending cap (recommended before publishing)

### API: POST /api/suggest
Body: { condition: string (3 to 2000 chars), inputs: Record<string, number> }
Response 200: { suggestions: [{ key, value, reason, confidence: "low" | "medium" | "high" }] }
Errors: 400 invalid, 413 too large, 429 limit reached (message includes minutes to wait), 402 credits used up. Header X-RateLimit-Remaining on every response.

### Security before deployment
- AI endpoints are public; limits are in-memory only. For strict limits, store counters in Lovable Cloud.
- Set a workspace AI spending cap so a burst of traffic cannot drain credits.
- Keys never reach the browser; all AI calls are server side. Inputs validated with zod and suggestions clamped server side.
- Signed-in scenarios are stored in Lovable Cloud with row level security: each user can only read and change their own rows; no anonymous access. Signed-out scenarios stay in the browser. Before publishing: turn on leaked password protection and consider moving AI rate limits to the database.
- The 3D cleanup change is presentation-only and adds no data access, network requests, or deployment secrets.

## Micrograph analysis (Structure tab)
- ✅ Upload or drop PNG, JPEG or WebP (8 MB max), resized in browser to 1600 px JPEG
- ✅ Optional modality, scale and sample fields
- ✅ Streaming AI analysis: identified features with confidence, effects on ROS, Fe-S, iron, photon response, caveats
- ✅ Suggested Structure geometry and model sliders, clamped, applied only on click
- ✅ Save analysis and thumbnail into the active scenario (IndexedDB)
- ❌ Show saved micrograph analyses in Compare
- API: POST /api/analyze-image, JSON {image (data URL), modality, sample, scale, inputs, outputs, geometry}; returns text/plain stream ending in a fenced JSON block {geometry, sliders}. Shares AI usage limits; body cap about 3.3 MB.
- Security: MIME and size checked on client and server, image never stored server side, users warned that images go to an AI provider.

## Update: AI explanation of sensitivity results
- ✅ Sensitivity tab: "Explain these results" panel streams an AI explanation of the sensitivity table (dominant drivers, key interactions, ROS and Fe-S implications, caveats)
- ✅ New route POST /api/explain-sensitivity: zod-validated sensitivity payload, same rate limits, run-id pass-through and streaming as /api/interpret
- ✅ Shares the per-visitor AI usage limits; 10 second cooldown and remaining counter in the panel
- ❌ Save a sensitivity explanation into a scenario

## Update: two-input interaction map (Sensitivity tab)
- ✅ "Interaction map: labile iron x light dose" panel: 21 x 21 grid over labile iron and 660 nm or 810 nm dose, any of the 8 sensitivity outputs, log coloring for ROS, linear for Fe-S/aconitase/free iron, baseline cell outlined, hover for exact values
- ✅ New pure function grid2d(base, keyX, keyY, n) in src/lib/mito/model.ts; each axis spans the driver's slider range, each cell runs simulate
- ✅ Browser verified: grid renders, switching light driver and output updates cells, no page errors
- ❌ AI explanation of the interaction map (current Explain panel is one-driver-at-a-time)

## Update: CSV export for sensitivity results
- ✅ "Download CSV report" button in the Sensitivity tab exports cristae-lab-sensitivity.csv
- ✅ New browser-safe module src/lib/mito/csv.ts: sections for baseline inputs, sensitivity table (48 rows), full-range sweep (41 rows) and iron x light interaction map (441 rows)
- ✅ Pure client-side download, no server call, no AI usage
- ✅ Browser verified: download fires, CSV parses, all sections present, no page errors

- ✅ Direct NO-independent photon ROS: low-dose superoxide/H2O2 burst (~3 J/cm2) plus high-dose stress rise (>=30 J/cm2), flavin H2O2 term (Chen 2011, Huang 2013, Hockberger 1999)

- ✅ Ferroptosis module: GPx4, FSP1, cardiolipin PUFA sliders; PLOOH, oxidized cardiolipin, risk and Protected/Primed/Committed state; removal share and threshold gauge; wired into Sensitivity, CSV, Compare, AI routes and Reference

## Update: per-species light dose response curve (Simulator)
- ✅ New "ROS and Fe-S dose response" panel: every ROS species (O2•-, H2O2, •OH, ONOO-, 1O2, LOO•) versus delivered dose on a shared log10 pM axis, Fe-S intact on a right percent axis
- ✅ 660 nm / 810 nm toggle; doseSweep in model.ts now returns all species and fesIntact per dose point
- ✅ Tooltip shows actual pM (or % for Fe-S), not the log value
- ✅ Browser verified: both wavelengths render, toggle switches curves, no page errors

## 3D cristae viewer
- ✅ Rotatable 3D mitochondrion (outer membrane, inner boundary membrane, lamellar or tubular cristae) in the Structure tab
- ✅ New shape sliders: outer membrane swelling, cristae shape, tip curvature
- ✅ Shape now drives the model: capacity, local membrane potential, cyt c retention, ATP efficiency, superoxide leak
- ✅ Color overlays (superoxide, local membrane potential, complex density) and live outputs vs default shape
- ✅ Viewer cleanup fixed: labels now render as native 3D sprites instead of separate HTML roots, eliminating the tab teardown race so the mitochondrion redraws after returning to Structure
- ❌ Structure sliders as a Sensitivity driver group
- ✅ Membrane geometry saved inside scenarios; loading restores it and Compare shows shape differences

## Photoreceptor model (light) and 71 THz coherence
- ✅ Light now follows a photoreceptor chain: tissue attenuation, absorption by CuA, heme a/a3, flavins and porphyrins, saturation at high irradiance, and one named effect per chromophore (NO release, Complex IV speed-up, flavin and semiquinone superoxide, direct H2O2, heating, photoinhibition)
- ✅ New Simulator inputs: irradiance (mW/cm2) and tissue depth (mm)
- ✅ Photoreceptor panel and 71 THz coherence panel (pump vs losses, threshold, coherent fraction)
- ✅ 71 THz, coherent fraction, NO released and temperature rise added to Sensitivity, CSV and AI explanations
- ❌ Calibrate chromophore strengths against measured action spectra and dose curves

## AI interpretation of the interaction map
- ✅ "Interpret this map (AI)" button on the iron x light map sends iron-only, light-only, combined effects and synergy for every output plus a coarse grid
- ✅ Streams into the AI panel; on success a new scenario (inputs, snapshot, interpretation) is saved automatically and appears in Scenarios and Compare

## Ferroptosis time course (done)
- [x] timeCourse() in model.ts: integrates dP/dt = vInit + (kProp - kRemove)*P after acute GPx4 block (gpx4=0 at t=0), exact exponential step (Euler was unstable at hour-scale dt), 48 h window, Primed/Committed thresholds match simulate()
- [x] timeToCommitted() helper for overlays
- [x] Simulator: "Ferroptosis time course" panel, cardiolipin oxidation vs hours with Primed (10%) and Committed (30%) reference lines and a badge with transition times
- [x] Photon dose chart: time-to-Committed lines for 660 and 810 nm on a hidden 0-48 h axis; gaps mean no commitment within 48 h
- [x] Verified at defaults: Primed at 0.5 h, plateaus ~13% oxidized cardiolipin, never Committed (FSP1 + basal hold it); no page errors

## Light dose comparison panel (done)
- [x] Simulator: "Light dose comparison" panel plots percent change versus no light for O2•-, H2O2 and •OH, solid 660 nm and dashed 810 nm, markers at 3, 30 and 60 J/cm2 with fitted estimates at each marker
- [x] Fixed a recharts yAxis id crash from the new panel's reference lines that took down the whole Simulator view
- [x] Verified: superoxide and H2O2 rise together (+76% / +88% at 60 J/cm2, 660 nm), hydroxyl stays flat at default iron; no page errors

## Ferroptosis risk vs light dose curve (done)
- [x] Ferroptosis panel now shows ferroptosis risk versus dose for 660 and 810 nm by default, with a "now" marker at the active dose and a protect/sensitize/neutral verdict versus no light
- [x] Curve computed through simulate() per dose step (2.5 J/cm2), so it inherits the photoreceptor and ferroptosis math automatically

## Stronger Fe-S damage term (done)
- [x] model.ts: effective cluster attack rate raised 3.5x (kAcon 1e7 to 3.5e7 M-1 s-1), lumping superoxide, H2O2 and peroxynitrite attack on the cluster pool, so light-driven superoxide visibly erodes Fe-S
- [x] Re-ran the iron x light map: Fe-S intact now falls from 94.1% (no light) to 90.0% at 60 J/cm2 660 nm and 88.6% at 60+60 J/cm2; aconitase tracks it; free iron gains ~1 µM from released cluster iron at high dose

## Drug presets (done)
- [x] Simulator input column: one-click preset buttons (erastin sets GPx4 0.2, RSL3 sets GPx4 0, ferrostatin-1 sets FSP1 2, iron chelator DFO/DFOm sets labile iron 0); other sliders untouched, presets combine

## Fe-S / aconitase / free iron on the dose chart (done)
- [x] doseSweep rows now carry aconitase and freeIron; the ROS and Fe-S dose chart plots Fe-S intact, aconitase and free Fe2+ (percent of zero-dose) on the right axis with the 3 and 30 J/cm2 markers
- [x] Fitted estimates under the markers extended: at 3 J/cm2 Fe-S 93.5%, aconitase 93.5%, free Fe2+ +4.1%; at 30 J/cm2 Fe-S 90.5%, aconitase 90.5%, free Fe2+ +25.1% (660 nm)
- [x] High-dose re-run: 60 J/cm2 660 nm gives Fe-S 90.0% / acon 90.0% / free Fe 4.39 µM; 60 J/cm2 810 nm gives 90.9% / 90.9% / 4.20 µM; combined 60+60 gives 88.6% / 88.6% / 4.73 µM. No divergence, Fe-S erosion stays light-driven

## H2O2-specific Fe-S attack term (done)
- [x] model.ts: cluster attack is now kAcon x superoxide + kH2o2Fes x H2O2 (kH2o2Fes 1e4 M-1 s-1 effective, shaped after Jang & Imlay 2007, unfitted); GPx4 also clears matrix H2O2 weakly (kGpx4h2o2 = 0.2 x gpx4) so the GPx4 slider modulates cluster loss
- [x] Calibrated so the H2O2 term does not dominate: default Fe-S 90.0% (was 94.1% with superoxide only)
- [x] Re-ran iron x light map: Fe-S 90.0% no light, 83.3% at 60 J/cm2 660 nm, 81.1% at 60+60 combined; GPx4 blocked worsens to 82.7% at 60 J; aconitase tracks Fe-S; free iron gains ~1.6 µM from released cluster iron at high dose

## Study-point markers on the iron x light map (done)
- [x] Sensitivity interaction map: dashed line at 3 J/cm2 and solid line at 30 J/cm2 (Chen 2011, Huang 2013) overlaid on the grid rows, plus a caption with Fe-S erosion at each dose computed live from the current inputs (default: 88.9% intact at 3 J, 84.2% at 30 J, aconitase tracks Fe-S)
- [x] Verified in browser: lines render on the map, caption values match the model

## Combination presets (done)
- [x] Simulator input column: second preset row under Drug presets with named combo buttons: Erastin + 660 nm (GPx4 0.2 + 10 J/cm2), RSL3 + 660 nm (GPx4 0 + 10 J/cm2), Chelator + 660 nm (labile iron 0 + 10 J/cm2), Erastin + chelator (GPx4 0.2 + iron 0); presets still stack with whatever is set
- [x] Light variants added: Erastin + 810 nm, RSL3 + 810 nm, Chelator + 810 nm (each sets nirDose 10 J/cm2 and zeroes redDose so the near-infrared path is isolated) and Erastin + chelator + light (GPx4 0.2 + iron 0 + 10 J/cm2 red); caption updated to explain the 810 nm zeroing
- [x] Verified in browser: buttons render and clicking applies the patches (Chelator + 660 nm shows labile iron 0, 660 nm dose 10 J/cm2); typecheck clean, build OK

## RSL3 + iron preset verification (Sep 27 2026)
- ✅ Ran RSL3 (GPx4 = 0) with labile iron at 10 uM: Ferroptosis panel shows Committed, risk 100, cardiolipin oxidized 32.7%, time course badge "Primed 0.0 h / Committed 0.0 h" (GPx4 is already zero when the integration starts, so the crossing is immediate).
- ✅ At 5 uM iron the curve stays Primed and never commits within 48 h; at 20 uM it saturates. The threshold behavior is continuous and plausible.
- ❌ Found and fixed: with GPx4 blocked plus high iron, the exact integration step overflowed to Infinity and cardiolipin oxidation went NaN. PLOOH is now clamped at physical saturation (99% oxidized cardiolipin) in timeCourse().

## Ferroptosis threshold overlay on the iron x light map ✅
- Each map cell now carries a filled dot when it is Committed (risk 100: propagation ratio 0.8 or 30% cardiolipin oxidized) and a ring when Primed (risk 50); hover shows risk and CL ox % per cell.
- A live caption reports how many of the 441 cells are Committed, the lowest light dose that commits any cell, and the iron level that commits without light.
- Verified: at defaults 188/441 cells are Primed and none Committed; RSL3 + 10 µM iron commits 236/441; typecheck clean, no page errors.

## Ferroptosis risk versus iron curve ✅
- The Ferroptosis panel now plots risk against labile iron (0-20 µM) for four antioxidant states at the active light dose: current, GPx4 blocked, FSP1 blocked, both blocked, with a "now" marker at the current iron.
- A caption reports light's tilt (protects / sensitizes / neutral, with the risk delta) for each state at the current iron, so blocking GPx4 or FSP1 shows how it flips light's protective effect.
- Verified in the browser with Erastin + 660 nm applied: FSP1-blocked and both-blocked curves saturate at risk 100 while current stays Primed; typecheck clean, no page errors.

## Labile iron dose chart in the Simulator ✅
- New panel "Labile iron dose response" after the light dose comparison: free Fe2+ (µM, left axis) and Fe-S intact / aconitase (%, right axis) versus the iron slider 0-20 µM, solid lines at the active light dose and dashed with no light, "now" marker at the current iron.
- Caption reports the chelator (zero-iron) endpoint live: free Fe2+ and Fe-S intact with the active light dose, so DFO/DFOm's effect is readable at a glance.
- Verified in the browser with Erastin + 660 nm applied: free Fe2+ rises linearly and gains under light from released cluster iron; Fe-S lines split between light and no light while iron alone barely moves them; typecheck clean, no page errors.

## Oxidized cardiolipin lines on the risk versus light dose chart ✅
- The "Ferroptosis risk versus light dose" chart now plots oxidized cardiolipin (%) for 660 nm (solid) and 810 nm (dashed) alongside the risk curves, on the same 0-100 axis.
- A dashed red reference line at 30% marks the Committed threshold with an in-chart label; the caption explains that crossing that line means cells commit at that dose.
- Verified in the browser at defaults: risk ~19 and ox CL ~5.8% stay flat across the dose range, so no dose commits at baseline; typecheck clean, build OK, no page errors.

## 30% ox CL threshold in the iron x light map caption ✅
- The map's ferroptosis threshold caption now scans all 441 cells for cardiolipinOx >= 30 and reports the exact lowest light dose (and the iron level at that dose) where oxidized cardiolipin first crosses the Committed threshold, or states that it stays below 30% everywhere.
- Typecheck clean.

## Peroxynitrite-specific Fe-S attack term ✅
- model.ts: kOnooFes = 1e7 * 1e-6 µM-1 s-1 effective added to clusterAttack; ONOO- oxidizes aconitase [4Fe-4S] at ~1e5 M-1 s-1 (Castro 1994, Hausladen & Fridovich 1994), scaled up because the model's ONOO- steady state is nM-scale. Fe-S block moved after the peroxynitrite calculation. Unfitted.
- NO now modulates cluster loss: Fe-S 88.6% at 40 nM NO, 85.1% at 200 nM, 82.1% at 400 nM, 77.5% at 400 nM + 60 J/cm2 660 nm.
- Iron x light map re-run: Fe-S 88.6% no light, 82.4% at 60 J/cm2 660 nm, 84.0% at 810 nm, 80.1% at 60+60 combined; aconitase tracks Fe-S; iron alone still does not move Fe-S. Typecheck clean.

## 30% ox CL threshold on the NO dose chart and map caption ✅
- Simulator: new "Nitric oxide dose response" chart sweeping NO 0-400 nM at the active light dose, plotting ONOO- (nM, left axis), Fe-S intact and oxidized cardiolipin (%, right axis), with a dashed red 30% Committed threshold line, a "now" marker at the current NO, and a caption reporting the NO level where ox CL first crosses Committed.
- Iron x light map caption now reports the 30% ox CL crossing dose at the map's highest iron for three NO levels: 0 nM, current, and 400 nM, so NO's effect on the threshold is visible without re-rendering the map.
- Typecheck clean.

## Preset clicks save named scenarios ✅
- Every Drug preset and Combination preset click now applies the patch AND saves a named scenario ("Preset: Erastin + 660 nm", etc.) with a full snapshot, so presets can be compared side by side in the Compare tab.
- A "Saved scenario: ..." confirmation appears under the preset rows; the scenario list refreshes live.
- Verified in the browser: clicking Erastin + 660 nm saved the scenario to IndexedDB and showed the confirmation.

## SNAP NO donor preset (done)
- Drug presets: new "NO donor SNAP" button raises nitric oxide to 200 nM (S-nitroso-N-acetylpenicillamine releases NO that competes with O2 at Complex IV); other sliders untouched, click saves a named scenario like the other presets.
- Verified in the browser: NO slider reads 200 nM, the "now" marker sits at 200 nM on the Nitric oxide dose response chart, ox cardiolipin crosses Committed at 360 nM, and the "Preset: NO donor SNAP" scenario appears in the list (Fe-S 85%, O2- 0.01 nM, ATP 26).

## Preset tagging and Compare filter
- ✅ Every preset click now tags the saved scenario with its preset name (`preset` field on the Scenario type).
- ✅ Compare tab has a "Presets only (n)" toggle that filters both pickers to preset-saved scenarios; picker entries show the preset tag.
- ✅ Typecheck clean (bunx tsgo --noEmit).

## Combo preset batch run
- ✅ All 8 combination presets clicked and saved as tagged scenarios; Compare "Presets only" filter showed all 8 and lined up RSL3 + 660 nm vs Erastin + 660 nm with output and input deltas (browser verified).

## Detailed mitochondrion graphics
- ✅ 3D viewer rebuilt (src/components/mito/3d/): cutaway outer and inner membranes with lipid bilayer edge, lamellar cristae with OPA1/MICOS junction rings, CI, CII, CIII dimer, CIV, ATP synthase dimer rows, cytochrome c, ubiquinone, mtDNA nucleoids, TCA ring with aconitase [4Fe-4S], ball-and-stick [2Fe-2S] and [4Fe-4S] clusters
- ✅ Live animated flows: electrons, protons, ROS puffs (scaled by superoxide), red/NIR photons to CIV, iron release sparks (scaled by Fe-S loss), 71 THz membrane shimmer (scaled by coherence)
- ✅ Zoom presets (whole, crista, complex, Fe-S), labels toggle, click-for-details cards with live values
- ✅ Pathway map (ROS/RNS, Fe-S, iron, Fenton loop) and 71 THz H1-H4 hypotheses card in the Simulator tab
- ✅ Soft, thresholded bloom in the 3D view: red/NIR photons, ROS puffs and iron-release sparks glow at their live model-driven intensities; Fe-S iron atoms brighten as clusters erode, while membranes stay readable
- ❌ MOT and causal DAG figures as model features

### Security before deployment
- Bloom runs entirely in the browser and does not send model inputs or images elsewhere. Keep graphics dependencies updated and confirm acceptable performance on mobile before publishing.

## Membrane shapes in scenarios
- ✅ Save new and update capture all eight shape sliders with inputs and the matching output snapshot. Preset and AI map saves also capture the current shape.
- ✅ Loading a scenario restores its saved shape; old scenarios without geometry load the default shape. Imported JSON retains saved geometry.
- ✅ Compare shows A, B and the difference for every membrane shape parameter; output comparisons run each scenario with its own geometry.
- ✅ Browser-verified two saved shapes (11 versus 14 cristae), distinct ATP outputs in Compare, and restoration of the first shape on load.
- ❌ Existing older runs cannot recover shapes that were never saved.
- ❌ Switching away from the 3D Structure view can emit a viewer cleanup error; shape storage and comparison still work. Investigate separately.

### Security before deployment
- Shape values from imported scenarios are bounded to the existing slider limits before being rendered or simulated. Scenario storage stays under the existing browser or owner-only account permissions; do not include personal images in exported scenario files without consent.

## Nitric oxide sensitivity driver
- ✅ Nitric oxide is a ROS / RNS driver from 0 to 400 nM, using the existing simulator slider limits. Its perturbations appear in the tornado chart and heatmap; its full-range sweep can be selected and exported in the CSV report.
- ❌ The model's nitric oxide response remains an estimate and needs validation against measured dose-response data before clinical use.

### Security before deployment
- Sensitivity analysis runs locally without sending settings to an external service. AI interpretations remain rate-limited server requests; validate biological claims before presenting results as guidance.

## Save all eight combination presets
- ✅ One button saves all eight combination presets as individually named, preset-tagged scenarios with the current membrane shape and their own model snapshots, without changing the active settings.
- ✅ The button shows a saving state and reports how many saves succeeded; the scenario list and Compare refresh after saving.
- ❌ Repeated clicks create additional scenario runs rather than replacing prior runs, matching individual preset clicks.

### Security before deployment
- Batch saving uses the existing owner-only account storage or this browser's local storage. Confirm quotas and retention needs before collecting large numbers of runs.

## NO crossing doses and peroxynitrite term in the AI map payload

✅ The map interpretation payload now carries the nitric oxide context: current NO level, the map's
highest labile iron, and the light dose where oxidized cardiolipin crosses the 30% Committed
threshold at NO 0, current NO and 400 nM (null means it is never crossed in range).
✅ It also carries a per NO level row of peroxynitrite, Fe-S intact, aconitase and oxidized
cardiolipin, so the peroxynitrite driven Fe-S attack term is visible to the model.
✅ The map prompt gained a "Nitric oxide and peroxynitrite" section and names the three separate
Fe-S attack terms (superoxide, H2O2, peroxynitrite) so the interpretation says which one the
numbers implicate.
✅ Verified with a live call to /api/explain-sensitivity: the response reports the 12 J/cm2 crossing
at the current NO level.
❌ The peroxynitrite and H2O2 Fe-S rate constants stay effective and unfitted, and the prompt now
says so in the caveats; they need validation against measured cluster loss data before clinical use.

## ETC step energetics (eV)
- ✅ `etcSteps` table in `src/lib/mito/reference.ts`: nine electron transfer steps from NADH entry to O2 reduction, each with donor/acceptor midpoint potentials (E'm, mV), energy released per electron in eV, and protons pumped per pair (Nicholls & Ferguson, Bioenergetics 4th ed.).
- ✅ `EtcEnergyCard` in `src/components/mito/PathwayMap.tsx`, mounted on the Simulator tab: per-step eV bars, H+ counts, live chain flux header; uphill steps (Complex II, cyt c shuttle) shown in amber.
- ✅ Browser-verified: card visible, all rows render, zero page errors.
- ❌ Midpoint potentials are standard-state values; in-situ potentials shift with Δψ and reduction state, not yet modeled per step.

## 3D to Pathway map link
- ✅ Clicking a Complex, ROS puff, photon, Fe-S cluster, TCA or membrane in the 3D view highlights its matching terms (and the arrows between them) in the Pathway map
- ✅ Linked Pathway map shown under the 3D view on the Structure tab, and the Simulator map follows the same selection
- ❌ Part to term mapping is a teaching simplification, not derived from the rate equations

## Shape comparison in Compare (2026-09-28)
- ✅ New `ShapeSketch.tsx`: pure-SVG cross-section of the organelle drawn from a saved Geometry (outer/boundary membranes, cristae folds with count, depth, junction width, lamellar-to-tubular shape, tip curvature). No three.js, safe to render inline.
- ✅ Compare "Membrane shape" section now lines A and B up side by side as labeled sketches (A green, B pink, matching the charts) above the shape values table.
- ✅ Typecheck clean; browser-verified with two preset scenarios, 2 sketches render, zero page errors.
- ❌ The sketch is a stylized teaching view, not a tomographic reconstruction; junctions and tips are schematic.

## ATP yield per ETC step (2026-09-28)
- ✅ `atpPerPair()` in reference.ts: two derivations per step, proton-based (H+ / 4, Nicholls & Ferguson) and energy-based (eV x 2 / 0.52 eV per ATP, clamped at 0 uphill).
- ✅ EtcEnergyCard shows "ATP yield per pair" under each step and a footer summing the chain: 2.50 ATP captured via protons vs ~4.4 thermodynamic ceiling (~57% captured).
- ✅ Typecheck clean; browser-verified, 9 yield lines render, zero page errors.
- ❌ Standard-state estimates; in-situ yields shift with delta-psi and reduction state, not modeled per step.

## 3D per-step eV labels
- ✅ Complex close-up view shows a small sprite per ETC step along the focus crista's electron path: CI entry +0.02, CI Fe-S +0.26, CI to Q +0.13, CIII Qo +0.19, CIV CuA +0.055, CIV to O2 +0.53 eV, sourced from etcSteps in reference.ts.
- ✅ Label3D gained a size prop; eV sprites render at 0.028 world units so they stay readable at close-up zoom; whole-organelle labels unchanged.
- ✅ eV labels appear only in the Complex close-up preset to avoid cluttering the whole-organelle view.
- ✅ Typecheck clean; browser-verified with zero page errors.

## Compare: ETC step energetics
- ✅ Compare view gained an "ETC step energetics" table: per step the standard-state eV drop, ATP per pair, and each scenario's live ATP rate (ATP per pair x electron flux / 2, CI steps on CI flux, CII on its own, CIII/CIV/cyt c on CIV flux), with a B vs A delta column and a whole-chain ATP flux footer.
- ✅ Different membrane shapes and pump states now show different per-step energy costs because the rates use each scenario's simulated fluxes.
- ✅ Typecheck clean; browser-verified with two preset scenarios (RSL3 + 810 nm vs Erastin + chelator, -24% across pumping steps), zero page errors.
