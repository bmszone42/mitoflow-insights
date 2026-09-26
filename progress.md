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
- ✅ Structure modeler: cristae count, depth, junction width, matrix width, length
- ✅ Clickable complexes with annotations, ROS field overlay tied to redox stress
- ✅ Reference library: ROS species, Fe-S clusters, iron route, photon notes
- ✅ Route level head metadata
- ❌ Time-course integration, currently steady-state only
- ❌ Save, compare and export of model runs, needs a backend or file export
- ❌ Ca2+ handling, mPTP threshold and cytochrome c release
- ❌ Ferroptosis module with GPx4 and FSP1 explicit
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
- ✅ Save, update, rename, delete, load scenarios in IndexedDB (this browser only)
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
- Scenario data stays in each visitor's browser (IndexedDB); nothing personal is stored on the server.
