## Patient profiles against healthy baseline (2026-10-01)
- [x] ✅ Added an all-profile comparison page with selected-profile setting and ATP-step details, linked from Physiology and Patient Data.
- [x] ✅ Only illustrative membrane potential receives a cited adult-range flag. Other sliders are unknown; ATP steps are conditional simulations at default unrecorded settings.
- [ ] ❌ Patient-specific ATP flags require calibrated paired measurements of coupling and other settings before interpretation.

### Security before deployment
- Keep invented profiles and conditional projections visibly distinct from measurements or diagnoses; do not infer missing settings from derived assay readouts.

## ROS paper citations and high-uncoupling check (2026-10-01)
- [x] ✅ ROS Physiology now gives full linked citations for all 11 source rows and distinguishes paper context from a nonexistent transferable source-specific µM/s range.
- [x] ✅ Verified 40% uncoupling in the browser: 2 of 11 model-change flags, CI IQ/RET −29% (0.0169 to 0.0119 µM/s) and Fenton −29% (0.000142 to 0.000101 µM/s). Both attribute the effect to uncoupling, Fenton indirectly; no browser errors.
- [ ] ❌ No cited experimental range crossings can be judged until modeled rates are calibrated to a matched assay and preparation.

### Security before deployment
- Keep exploratory ROS change flags separate from research measurements and clinical normal ranges; avoid presenting them as diagnoses.

## ROS patient-profile comparisons (2026-10-01)
- [x] ✅ Select any synthetic profile in ROS Physiology and compare the live 11-source simulation against its membrane-potential-matched model state at current geometry.
- [x] ✅ Show the profile's illustrative ROS assay signals separately; rate flags remain ±25% model changes, not textbook or clinical outliers.
- [x] ✅ Checked default and two disorder profiles at desktop and mobile widths: 11 sources appear; the default has 0 flags and both stressed illustrative comparisons have 7, with no page errors or horizontal overflow.
- [ ] ❌ Disorder-specific site-rate intervals need assay-matched measurements before they can be used as reference flags.

### Security before deployment
- Keep synthetic records and ROS assay signals clearly labeled; never infer clinical or textbook ranges from diagnosis labels or fluorescence folds.

## Patient profile comparison (2026-10-01)
- [x] ✅ Added a Physiology Patient Comparison view for any two of 18 synthetic profiles, with side-by-side values, linked published context, and per-profile flag counts.
- [x] ✅ Separates direct slider equivalents from derived P/O and other measurements. Only comparable, applicable published bands produce flags; pediatric and acute nonfasting limits are withheld.
- [x] ✅ Browser-verified 14 rows on desktop and mobile: healthy adult has zero applicable flags; illustrative AKI profile has six, including membrane potential as the only flagged slider equivalent. A pediatric profile suppresses the adult membrane-potential band. No page errors or horizontal overflow.
- [ ] ❌ Clinical interpretation requires real matched measurements and validated local intervals; invented profiles remain clearly labeled.

### Security before deployment
- No identifiers, submissions, persistence or new endpoints. Preserve the synthetic-data warning and review reference applicability before clinical-facing use.

## ROS source references (2026-10-01)

- [x] ✅ Added a searchable ROS References view mapping all 11 modeled sources to their four cited papers, with full author lists, titles, journal details, DOI links and verified publication page spans.
- [x] ✅ Identified Radi's 2013 print year (online 2012) and separated publication spans from unverified claim-specific pages. Marked modeled rates, partitions and yields as assumptions rather than measured intervals.
- [x] ✅ Browser-verified all 11 citations across four distinct papers, search filtering and no page errors at 1280px and 390px. The Physiology tab strip wraps without page-wide horizontal overflow.
- [ ] ❌ Check individual claim locations in the full papers before presenting any page as the exact evidence for a model parameter; validate source-specific rates experimentally.

### Security before deployment
- No new patient collection or external submission. Citation links open with safe external-link attributes. Review citation accuracy and preserve research-only labels before release.

## Patient ROS assay comparisons (2026-10-01)

- [x] ✅ Added optional, transient ROS measurement entry for PBMC DCFH-DA, fluor-DHPE, MitoSOX and C11-BODIPY, each with its own unit, probe direction and citation.
- [x] ✅ Verified du Plessis et al. 2010 original study: 15 unexposed controls had unstimulated DCFH-DA 3.78 ± 1.20 MFI and fluor-DHPE 957.02 ± 51.55 MFI (mean ± SEM). These are context, not cutoffs; MitoSOX and C11-BODIPY method papers supply no transferable control intervals.
- [x] ✅ Entered-result flags require numeric limits from the same laboratory assay; synthetic cohort flags remain separate. Assay entries remain in the open page only.
- [x] ✅ Browser-tested at desktop and mobile: an entered result without limits stays unflagged; DCFH-DA above controls and fluor-DHPE below controls flag with the correct oxidation direction; clearing removes entries; no page errors.
- [ ] ❌ Clinical use requires actual specimen-matched measurements, laboratory controls and locally validated decision limits. Published instrument-specific means are not diagnostic ranges.

### Security before deployment
- No uploaded sample or identifier, network submission, or persistent assay storage was added. Retain the no-identifiers warning and check that entered values remain client-only before deployment.

## ROS driver network (2026-10-01)

- [x] ✅ Added a selectable network for all eleven modeled ROS sources; changed controls show red/green rate effects and selected sources highlight matching physiology rows.
- [x] ✅ Flags show direct and indirect input effects using one-control-at-a-time comparisons at current settings. Effects are nonadditive model estimates, not clinical causes or normal-rate intervals.
- [x] ✅ Verified default and red-light cases at desktop and narrow widths. Flavin peroxide flags when light turns on, with its light effect and matching row visible. No browser errors; preview build OK.
- [ ] ❌ Source-specific rates and causal effects need matched experimental validation before clinical interpretation.

### Security before deployment
- No new network endpoint or patient storage. Retain nonclinical labels and review model-rate provenance before release.

## Verified platelet study-control flags (2026-10-01)

- [x] ✅ Checked González-Mingot et al. 2023, Results §3.2 and Figure 1: 22 controls ranged 209.41–541.41 mU/mg, with mean 375.41 ± 166 mU/mg. Existing study-normalized bounds were correct.
- [x] ✅ Added live within/outside study-control status for the current Fe-S or aconitase map selection, alongside already flagged cells and Physiology readouts.
- [x] ✅ Browser-checked 1280px and 390px: default 332.5 mU/mg assay-equivalent is within controls; 200 mV stress yields 168.1 mU/mg, outside controls, with flagged map cells and both dependent Physiology rows. No page errors.
- [ ] ❌ No validated universal clinical normal range exists for Fe-S integrity or this modeled aconitase proxy; these duplicated study-control flags are research-only and require specimen/assay calibration before clinical use.

### Security before deployment
- No new data collection or endpoint. Keep the nonclinical, proxy and non-independent flag caveats visible, and review that external citation links remain safe.

## Biochemical concentrations and reaction rates (2026-10-01)

- [x] Added a live Physiology concentration/rate ledger with clickable publications, explicit measured-kinetic versus assumed-parameter labels and uncalibrated-output notices.
- [x] Replaced the Prx3 H₂O₂ removal's uncited standalone saturation law with the measured human Prx3 second-order peroxide rate (Cox et al. 2009, doi:10.1021/bi900558g), multiplied by an explicitly assumed 0.075 µM accessible reduced pool and limited by the existing assumed NADPH recycling cap.
- [x] Updated ATP flux to weight 2.5 NADH-linked and 1.5 succinate-linked ATP per electron pair by CI/CII contribution, following Hinkle's stoichiometric P/O review. The model's ADP, uncoupling and geometry penalties remain estimates.
- [x] Typecheck and runtime checks passed for default, high uncoupling, anoxia and red light with finite ATP/ROS outputs.
- [ ] Relative ROS source coefficients, SOD2 effective sink, NADH/succinate input proxies, accessible Prx3 concentration, Fe-S light multiplier (3.5×), lipid calibration (1.15×), and electron-chain capacities are not measured for a matched tissue. Do not call the resulting rates measured concentrations or clinically valid ranges.
## ATP step and Warburg flowchart flags (2026-10-01)

- ✅ Simulator ATP step rows and Warburg step cards now visibly mark out-of-band redox drops or effective ATP costs, while preserving green/amber yield colors as a separate signal.
- ✅ Warburg ATP network nodes have stronger dashed red halos and exclamation markers for the same flagged steps; a named cause remains available below the diagram.
- ✅ Verified at 1280px and 390px: zero flags at default settings, then four matching flags at 40% uncoupling (CI Fe-S, CIII Qo, CIV to O2, and the Overall chain summary). No page errors or horizontal overflow; preview build OK.
- ❌ The effective ATP cost band is a model-wide proxy, not a measured step-specific clinical interval.

### Security before deployment
- Presentation only: no new data collection or permissions. Keep research-only wording visible; do not represent model flags as patient diagnoses.

## Warburg P/O efficiency comparison (2026-10-01)

- ✅ Physiology compares current NADH-linked and succinate-linked P/O with simulated respiration and Hinkle's approximate experimental bands, with per-path flags and source link.
- ✅ Separates estimated glycolysis share from mitochondrial ATP per oxygen atom and names membrane potential and uncoupling as P/O inputs.
- ✅ Live checks at 1280px and 390px: a Warburg fuel shift raises glycolysis share from 5% to 52% without changing P/O (2.38 and 1.42, both within bands); 40% uncoupling changes them to 1.50 and 0.90, both flagged. No page errors or horizontal overflow.
- ❌ Literature estimates are not Warburg-specific or patient reference intervals; clinical use requires assay-matched validation.

### Security before deployment
- No new patient inputs or stored health data. Keep research flags non-diagnostic and citation links safe for external navigation.

## Expanded synthetic patient cohort (2026-10-01)

- ✅ Eighteen invented profiles span ages 3 to 84: three healthy comparators and 15 conditions including Leigh syndrome, PDH deficiency, Friedreich ataxia, POLG-related disease, MELAS, Parkinson disease, Alzheimer disease, ALS, Huntington disease, TBI, stroke, sepsis-associated AKI, heart failure, sarcopenia and iron overload.
- ✅ Each profile has 14 internally consistent illustrative observations and a specimen/timing context; lactate:pyruvate is calculated from paired venous values, not independently invented.
- ✅ Adult reference bands are withheld for pediatric records, and fasting-glucose bands are withheld for acute nonfasting cases. OCR is no longer fabricated from incompatible modeled ATP flux.
- ✅ Mixed-condition cohort statistics and redox/Fe-S signals are explicitly described as hypothetical teaching examples, not disease-specific norms or diagnoses.
- ❌ Validate any disease-specific numerical distribution against measured, assay-matched patient cohorts before clinical use.

### Security before deployment
- All profiles are static synthetic data, without uploads, personal identifiers or new network storage. Keep the demo-only notice visible and never ingest real clinical data without a privacy, consent, access-control and medical-device review.

## ROS physiology source comparison (2026-10-01)

- ✅ Added a separate ROS Physiology view with 11 named production pathways spanning superoxide, hydrogen peroxide, peroxynitrite and hydroxyl radical.
- ✅ Each row shows current and same-geometry simulated default rates, cited mechanism or kinetic context, changed relevant settings and a ±25% model-change flag. Previously inactive sources flag on activation.
- ✅ Distinguishes reaction constants and model assumptions from source-specific production-rate intervals; singlet oxygen and lipid peroxyl remain unassessed as source-resolved rates.
- ✅ Checked at 1280px and 390px: all 11 rows render with zero default flags; 10 J/cm² red light activates the flavin pathway and flags 7 sources without page errors or viewport overflow.
- ❌ Source-specific reference rates require matched tissue, preparation and assay measurements; no universal textbook rate interval was invented.

### Security before deployment
- No new personal data, network endpoint or stored result. Literature links open in a separate tab with safe external-link attributes; model-only flags must not be represented as clinical findings.

## Physiology study references (2026-09-30)

- ✅ Added a searchable References view inside Physiology with 29 deduplicated studies grouped by model domain.
- ✅ Included full authors, title, publication, year, page span or article number, DOI link, and the model setting or readout each study supports.
- ✅ Distinguished publication-wide page spans from claim-specific locators; retained named Table 1 and Table 2 locators where the model cites them.
- ✅ Listed incomplete model-note citations separately instead of inventing page numbers.
- ✅ Corrected mismatched Q-pool, Complex III attribution, Complex IV article number, FSP1, and labile-iron source records found during the audit.

## Model settings reference dashboard
- ✅ Physiology overview lists all 16 model inputs and 8 membrane geometry controls in five groups with live and default values, cited context, and source limitations.
- ✅ Comparable membrane potential shows within/outside flags and exact distance to the closest boundary. Uncoupling is labeled context dependent: its dimensionless model control cannot be compared numerically to published proton-leak respiration shares.
- ✅ The summary names every currently flagged setting; slider limits are explicitly distinguished from literature comparisons. This is research context, not a diagnosis.
- ❌ Before clinical use: validate proxy bands and assay-specific interpretations for each tissue and preparation.

# Cristae Lab, progress

## Published healthy-control check (2026-09-30)
- ✅ Physiology compares live NADH and succinate P/O with published estimates and aconitase with a platelet control study via a labeled assay-equivalent proxy.
- ✅ ATP network labels its reference as a simulation; healthy blood-cell oxygen consumption is cited but not flagged against incompatible ATP-flux units.
- ✅ Non-comparable uncoupling and derived ATP cost no longer receive misleading measured-data flags in the whole-mitochondrion table.
- ❌ No paired patient specimen and assay calibration exist for clinically validated flags; this is research-only and not diagnostic.

### Security before deployment
- No patient uploads or personal measurements are accepted. Keep measurements read-only, never present proxies as clinical results, and review assay compatibility before clinical interpretation.


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
- ✅ Physiology overview combines live status, ATP gap network, cited physiology rows, and the iron × light map
- ✅ ATP network supports healthy-reference and saved-scenario baselines with shared network-to-table selection

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

## Update: integrated physiology overview

- ✅ One Physiology overview combines ATP flux and P/O status, the ATP driver network, the cited ETC and iron-sulfur rows, and the iron × light map.
- ✅ ATP gaps compare the current model against either the healthy default or a browser/account-saved scenario using the shared scenario storage facade.
- ✅ Clicking a network node highlights and scrolls to the matching physiology row.
- ✅ The reusable iron × light map preserves NO crossing doses, ferroptosis markers, study-dose lines, ACO2 study-control flags, proxy labels, and citations.
- ✅ Physiology and Warburg ATP flags identify membrane-potential or uncoupling slider causes and label P/O as the resulting readout; fixed redox flags are separated from slider attribution.
- Acceptance: both ATP baseline modes update direction and gap share; map wavelength and output selectors update independently; desktop and narrow layouts remain readable.
- Testing: typecheck, preview build status, desktop interaction flow, and 390 px narrow-layout overflow checks.
- Security: no new data collection or permissions; signed-in scenarios remain owner-scoped and signed-out scenarios remain in browser storage.
- Compliance: study-control envelopes remain research assay context, not clinical reference intervals or diagnostic flags.
- Deployment: no new environment variables, services, or migrations are required.

## Update: Warburg ATP gap breakdown

- ✅ Warburg Physiology shows healthy and current ATP rates, signed rate gaps, and each ETC step's share of the independent-step gap.
- ✅ Overall NADH to O2 is labeled as a chain summary and excluded from contribution totals to prevent double-counting.
- ✅ Healthy, current, and whole-chain ATP flux are summarized above the Physiology table.
- Security: derived entirely from the existing in-browser model; no new data collection, network access, secrets, or permissions.
- Deployment: no configuration changes required; verify the production preview after publishing.

## Update: synthetic patient data comparison

- ✅ Patient Data tab compares the live Simulator with six explicitly synthetic, de-identified demo records.
- ✅ Covers bioenergetics, ROS/redox, iron/Fe-S, and clinical laboratory measurements.
- ✅ Each row includes assay context, patient and compatible model values, published range where defensible, demo cohort statistics, source, and limitations.
- ✅ Flags distinguish literature outliers, robust demo-cohort outliers, both, and cohort-only context.
- ✅ Model proxies are labeled; clinical labs without safe model equivalents show "Not modeled".
- Testing: check every record, source link, flag count, live model column, and desktop/narrow layout.
- Security: no patient information is accepted, stored, or transmitted. Real health data requires access controls, encryption, audit logs, retention rules, consent, and privacy review.
- Compliance: educational and research use only, not diagnosis. Ranges vary by assay, tissue, age, preparation, and laboratory.
- Deployment: no new secrets, backend tables, storage, or service configuration.


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

- [x] AI map interpretation carries a light pump energy block: 660/810 nm photon eV (1240/lambda) versus each proton-pumping ETC step drop, plus photon gain at baseline and max mapped dose; new MAP_SYSTEM section instructs the AI to treat the photon as a separate energy source (Sensitivity.tsx, explain-sensitivity.ts).

- [x] Compare gained a third shape sketch: ShapeOverlay draws both saved mitochondrion outlines in one SVG on a shared scale (A green, B pink) so size, cristae count and fold-shape differences line up directly (ShapeSketch.tsx, Compare.tsx).

- ✅ Compare: "View A/B in 3D" loads a saved shape into the Structure tab 3D viewer
- ✅ Pathway map boxes are clickable: they open Sensitivity, set the tornado to that term and show a 71 THz caption for its top drivers
- ✅ Clicking a Complex in 3D shows its per-electron ATP yield on the pathway map

## Live ATP yields (2026-09-28)
- ✅ `liveAtpPerPair(s, psi, uncoupling)` in reference.ts: ATP cost scales with deltaPsi/160 mV, both yields scale with (1 - uncoupling)
- ✅ EtcEnergyCard and the pathway map complex-yield box show live yields with a "Live yields at X mV, Y% uncoupled" line when sliders differ from defaults; standard-state value shown alongside
- ✅ index.tsx passes `inputs` to all PathwayMap and EtcEnergyCard call sites
- ✅ Verified: raising Mild uncoupling to 25% shows the live line, zero page errors

## P/O ratio readout (2026-09-28)
- ✅ `poRatio(psi, uncoupling, path)` in reference.ts: sums live proton-based step yields, NADH path (CI+CIII+CIV) and FADH2 path (skips Complex I)
- ✅ Steady state grid shows P/O (NADH) and P/O (FADH2) in ATP per O atom
- ✅ Verified: 2.38 at defaults (2.5 x 0.95 coupling), 1.88 at 25% uncoupling, zero page errors

## Compare: per-step ATP yield comparison (live)
- ✅ The "ETC step energetics" table now uses live ATP yields per scenario (scaled by each run's membrane potential and uncoupling via liveAtpPerPair), with separate "A: ATP / pair" and "B: ATP / pair" columns.
- ✅ New "Driver share" column: each step's share of the total ATP rate gap between the two scenarios; the top-driving step is highlighted and marked with *.
- ✅ Verified in preview: RSL3 + 810 nm vs Erastin + chelator, driver shares sum across steps, zero page errors.

## 3D close-up: live eV / ATP labels
- ✅ The Complex close-up eV labels in the 3D viewer now append the live ATP yield per pair (liveAtpPerPair scaled by the Membrane potential and Mild uncoupling sliders), wired through StructureModeler to Cristae3D to Organelle via a new inputs prop.
- ✅ Verified in preview: raising Mild uncoupling to 0.25 dropped the CI Fe-S and CIII Qo labels from 0.95 to 0.75 ATP/pr and ATP flux from 51.7 to 40.8 uM/s, zero page errors.

## Clickable 3D eV labels open step detail
- ✅ Each eV/ATP label in the Complex close-up is clickable (invisible sphere hit area around the sprite); clicking jumps to the Simulator tab and highlights that step in the Electron transport chain energetics card with the same live values (data-testid step-detail).
- ✅ Verified in preview: clicking the CI Fe-S relay label opened the Simulator tab with the highlighted step showing +0.26 eV, 4 H+, 0.95 ATP/pair live, zero page errors.

## Warburg effect knowledge
- ✅ New warburgNotes section in reference.ts (the effect, why ferment with oxygen present, mitochondria not broken, redox/iron consequences, how to explore it with the sliders), rendered as a Warburg effect panel on the Reference tab.
- ✅ Energetics card footer now contrasts the roughly 30 to 32 ATP per glucose from full oxidation with the 2 ATP from glycolysis, and explains that lowering NADH and succinate sliders mimics a Warburg-shifted cell.

## Driver share bar chart in Compare
- ✅ New "Driver share, %" bar chart beside the ETC step energetics table: vertical bars sorted by share, the top-driving step in the primary color and the rest muted, matching the table's highlighted row and * marker.
- ✅ Per-step ATP math extracted from the table row into a shared useMemo (etcRows) so the table and chart always agree.
- ✅ Chart only shows when the two scenarios differ in ATP rate (shares would all be "-"); plain Erastin vs RSL3 (no light) hides it, light presets show it.
- ✅ Verified in preview with RSL3 + 810 nm vs Erastin + 660 nm: Overall NADH to O2 63% (green, top driver), C III Qo 25%, C IV to O2 12%; zero page errors.

## Security practices (standing)
- Scenario storage stays owner-scoped: signed-in users save to Cloud rows with owner-only RLS; signed-out users save to IndexedDB only.
- AI routes keep the gateway key server-side and stay behind the shared in-memory rate limits.
- No secrets are embedded in client code; sliders and presets change client state only.

## Driver share bars colored by direction

Compare's "Driver share, %" chart now colors each bar by direction, not just the top driver: green (var(--primary)) when scenario B raised that step's ATP rate, red (var(--destructive)) when B lowered it. A caption under the chart states the mapping. The top-driving step keeps its table highlight and asterisk. Verified in the preview with Erastin + 660 nm vs RSL3 + 810 nm (all nonzero steps green, +1% B vs A) and the reverse comparison (all red); zero page errors. Note: within the preset set, all nonzero steps of a given pair move in the same direction because per-step ATP rate scales with the shared flux and yield factors, so mixed green/red appears only for comparisons that change flux routing (for example succinate versus NADH pool differences across custom saved runs).
- ✅ Warburg presets: Respiration, Warburg shift (NADH 0.25, succinate 0.2), Glycolysis only (NADH 0.05, succinate 0), each saves a tagged scenario
- ✅ Compare driver shares sent to AI (Interpret ATP drivers button, ATP change drivers section)
- ✅ Warburg link: Reference panel button lights NADH/NAD+ and succinate boxes on the pathway map and outlines their tornado bars with a caption

## 3D labels: live ATP cost in eV
- [x] Complex close-up labels now show eV drop, live ATP per pair, and live ATP cost in eV together (e.g. "CI Fe-S +0.26 eV · 0.95 ATP/pr · 0.52 eV/ATP")
- [x] Verified live: membrane potential 180 mV raises cost to 0.58 eV/ATP; uncoupling 0.25 drops ATP/pr to 0.75; zero page errors

## Security (standing)
- AI keys stay server-side in the gateway routes; AI routes rate-limited in memory per instance
- Scenarios: owner-only RLS when signed in, IndexedDB when signed out; no PII stored
- Before deployment: move rate limits to the database, review RLS policies, run dependency and security scans

## Compare driver chart: signed percent labels
- [x] Each driver share bar now shows the signed B-vs-A percent change next to it (e.g. +1%), and the tooltip shows share plus signed change
- [x] Verified in preview with Erastin + 660 nm vs RSL3 + 810 nm; zero page errors

- ✅ Compare AI payload carries glycolysis vs respiration ATP split (estimate), NADH/succinate direction, and Warburg phenotype per scenario

## Warburg comparison view (2026-09-29)
- [x] Compare header gained a "Warburg view" button: loads the Glycolysis only preset as A and the Respiration preset as B (appears only when both presets are saved).
- [x] New "ATP source split" section in Compare: stacked percent bars of respiration vs glycolysis ATP for A and B, with phenotype labels and the estimate caveat (5% basal floor, not a measured lactate rate).
- [x] Glycolysis/resiration split helpers (atpSplit, phenotype, ATP_DEMAND) moved to module scope, shared by the chart and the AI interpretation payload.
- [x] Driver share chart keeps the green/red direction bars with signed B-vs-A labels; verified with Glycolysis only vs Respiration (Overall NADH to O2 top driver, 51%, +1710%).
- Verified in preview: Warburg view button, split chart (94% vs 5% glycolysis), zero page errors, build OK.

## Glycolysis ATP readout on Simulator (2026-09-29)
- [x] atpSplit / phenotype / ATP_DEMAND moved from Compare.tsx into src/lib/mito/reference.ts so Simulator and Compare share one estimate.
- [x] EtcEnergyCard (Simulator tab) gained a "Glycolysis contribution to total ATP" readout: stacked respiration/glycolysis bar, both fluxes in µM/s, glycolysis % of demand, and a live phenotype label (respiration / Warburg shift / glycolysis only).
- Verified in preview: default state shows 5% glycolysis; the Warburg shift preset flips it to 52% (respiration 24.9 vs glycolysis 26.8 µM/s). Zero page errors, typecheck clean.

## 3D labels: green/amber yield coloring (2026-09-29)
- [x] Label3D gained a tone prop (ok/warn); warn switches the sprite to an amber border, warm dark background, and cream text.
- [x] Complex close-up labels compare live ATP per pair against the standard-state value (atpPerPair): green at or above standard, amber below.
- [x] Legend chip in the 3D viewer bottom bar, shown in Complex close-up only: green dot with "green: live ATP/pr at or above standard", amber dot with "amber: below standard", colors match the label sprites.
- Verified in preview: uncoupling 0.25 flips CI Fe-S, CIII Qo and CIV labels to amber (0.75 vs 0.95 ATP/pr); the uphill CI to Q step stays green. Legend appears in Complex close-up, hides in Whole organelle. Zero page errors, typecheck clean.

## Simulator energetics table: green/amber rows (2026-09-29)
- [x] Each row in the EtcEnergyCard gets a left border in the 3D label tone: green (rgba(78,222,174)) when the live proton-based ATP per pair is at or above standard (atpPerPair), amber (rgba(255,190,92)) below.
- [x] The yield line shows a matching tone dot, the two ATP values in the tone color, and the standard value for reference; a caption under the table explains green vs amber.
- [x] Uses the identical comparison as the 3D labels, so the table and viewer always agree; focused rows from the 3D keep their primary highlight.
- Verified in preview: defaults show amber on pumping rows (live 0.95 < standard 1.00 because of the 5% baseline uncoupling, same as the 3D), uncoupling 0.25 drops values to 0.75 with live yields line. Zero page errors, typecheck clean.
- [x] ✅ Green/amber yield colors now reference the healthy default (160 mV, 5% uncoupling)
- [x] ✅ Compare AI driver reply saved per A/B pair and restored on reopen

## Glycolysis ATP box on the pathway map (2026-09-29)
- [x] New "Glycolysis ATP" box on the pathway map (bottom-left), showing the live glycolysis ATP flux in µM/s from the shared atpSplit estimate, pink accent border matching the readout bar.
- [x] Clicking the box opens the Simulator tab and scrolls to the "Glycolysis contribution to total ATP" readout in the energetics card.
- [x] The Warburg highlight (Reference panel button) now also lights the glycolysis box alongside NADH, succinate and ETC leak.
- [x] Verified in preview: box visible with live value, click scrolls to readout, zero page errors; typecheck clean.

- ✅ Compare AI driver reply saved to the signed-in account (owner-only table driver_ai_replies), browser copy kept as fallback

## Green/amber yield colors on the Compare step table (2026-09-29)
- [x] Each ETC step row in Compare now carries the same green/amber tone as the Simulator energetics table and the 3D labels: green when live ATP per pair is at or above the healthy default (160 mV, 5% uncoupling), amber below it.
- [x] A and B yield cells are colored and dotted individually by their own scenario's uncoupling; the row's left border is amber when either run falls short, green when both are at or above standard.
- [x] Caption under the table explains the tones; the top-driver row keeps its bg-primary/10 highlight and asterisk alongside the border color.
- Verified in preview: Erastin + 660 nm (saved at 25% uncoupling, yields 0.75/0.38/1.88 amber) vs Respiration (default uncoupling, 0.95/0.47/2.38 green). Zero page errors, typecheck clean.
- [x] ✅ Pathway map boxes show a grey standard state value under each live value

## Saved ATP driver reply section in Compare (2026-09-29)
- [x] The AI's ATP driver answer now renders inside a dedicated "Saved ATP driver reply" section with a border, instead of a bare markdown block.
- [x] The section header shows the pair's run labels ("A: Respiration · B: RSL3 + 810 nm"), the account save time when signed in, or "saved in this browser" when signed out.
- [x] loadDriverReply now returns { reply, updatedAt } from the account row so the save time renders; a fresh interpretation switches the header to "Interpreting live" during streaming.
- [x] Verified in preview (signed out): section shows both run labels with the browser fallback note; zero page errors; typecheck clean.

- ✅ Warburg dashboard tab: live glycolysis vs respiration split, driver shares vs healthy baseline (green/red), green/amber ETC step yields, fuel preset buttons, Open in Simulator link.

## 3D labels: amber on high ATP cost (2026-09-29)
- ✅ Complex close-up labels now turn amber when the live energy cost per ATP rises above the standard 0.52 eV (membrane potential above 160 mV), not only when uncoupling drops the yield below the healthy default. Green requires both: yield at or above standard AND cost at or under 0.52 eV/ATP.
- ✅ Legend in the 3D viewer updated to explain both amber conditions.
- ✅ Verified in preview: at 180 mV the labels read 0.58 eV/ATP and tint amber; at defaults they stay green. Zero page errors, typecheck clean.

## Standard state readout (2026-09-29)
- ✅ New StandardStateNote component shows the values the green/amber coloring is compared against: 160 mV membrane potential, 5% uncoupling, 0.52 eV/ATP, next to the live slider values and an "at standard, labels green" indicator.
- ✅ Placed in the Simulator Steady state card and in the 3D viewer legend (Complex close-up), both reading from the shared STD_PSI / STD_UNCOUPLING / ATP_COST_EV constants so they can never drift from the actual comparison.
- ✅ Verified in preview: both readouts show 160 mV / 5% / 0.52 eV/ATP at defaults with live values matching; zero page errors, typecheck clean.

## Compare step table legend (2026-09-29)
- ✅ The Compare step table now has a dot legend matching the 3D viewer legend: a green dot with "live ATP per pair at or above the healthy default (160 mV, 5% uncoupling)" and an amber dot with "below it; a row turns amber when either run falls short". Colors are the same rgba values as the 3D legend (green rgba(78,222,174,0.6), amber rgba(255,190,92,0.75)).
- ✅ Verified in preview with the seeded Respiration vs RSL3 + 810 nm pair: both dots and texts render, zero page errors.

## Warburg summary card on the Simulator (2026-09-29)
- ✅ New "Glycolysis vs respiration" card under Steady state: stacked respiration/glycolysis ATP bar, phenotype badge with glycolysis share %, top 3 driver shares vs the healthy baseline with green/red direction bars
- ✅ Same estimates and baseline as the Warburg dashboard tab, so numbers always match
- ✅ Verified in preview: default 5% glycolysis, Warburg shift preset flips to 52% with driver shares 50/20/20; zero page errors; tsgo clean

- [x] ✅ Standard state readout shows published textbook ranges (membrane potential, proton leak, ATP cost, P/O) with live in/out-of-range coloring
- [x] ✅ ATP driver network map in Compare (nodes sized by gap share, green/red direction, click to highlight table row)
- [x] ✅ Graphics overhaul: 3D translucent lipid membranes with rim light, section caps showing double membrane, grainy matrix, studio lighting, detail by zoom level, leader-line callouts, crisp close-up step tags; illustrated 2D cross section
- [x] ✅ ATP driver network map on Warburg dashboard (healthy run A vs current run B)

## Iron x light reference halos (2026-09-29)
- [x] ✅ Sensitivity iron x light map marks Fe-S intact below 80% and aconitase activity below 63% with red dashed cell halos when that output is selected; each tooltip and legend names the band and count.
- [x] ✅ These are literature-informed visualization cutoffs, not published clinical normal intervals. Scandroglio et al. 2014 report 63–98% inhibition thresholds for aconitase effects on respiration, not a 63% activity normal limit. Model math is unchanged.
- [x] ✅ AI map interpretation receives the selected band and flagged-cell count. Preview verified: default settings flag 0/441 cells for both outputs; with SNAP and minimum antioxidant capacity, Fe-S flags 441/441 and aconitase flags 294/441. No page errors; tsgo clean.
- [ ] ❌ Validate Fe-S and aconitase reference cutoffs against assay-specific datasets before clinical use.

## ATP network live cost halos (2026-09-29)
- [x] ✅ Compare and Warburg network halos flag pumping steps when live effective ATP cost falls outside the shared 0.50 to 0.62 eV/ATP band, as well as when redox eV falls outside its step range.
- [x] ✅ Hover and click details show separate redox and live A/B cost ranges; non-pumping steps are exempt from ATP-cost warnings. Warburg preview: baseline zero halos; 30% uncoupling increases effective cost to 0.71 eV/ATP and flags four pumping/overall nodes with no page errors.
- [ ] ❌ Effective cost under leak is a model proxy, not a measured step-specific interval; validate it against experimental ATP energetics before physiological interpretation.

## AI ATP driver reference flags (2026-09-29)
- [x] ✅ ATP driver interpretations now receive verified step-specific DOI links and publication citations from the shared ETC references; the prompt distinguishes evidence for redox steps from simulated ATP-rate attribution.
- [x] ✅ Saved ATP replies also show a deterministic, clickable paper index for all nine steps, even if the AI omits links. Live Respiration versus Warburg shift check confirmed nine correct DOI links, no page errors, and a clean preview build.
- [x] ✅ Compare sends each step's redox band, effective ATP cost for A and B, and out-of-range flags to the AI interpretation.
- [x] ✅ AI names flagged steps, specifies which run is outside the band, and distinguishes published redox references from the model-derived effective ATP-cost proxy. The overall chain node is identified as a summary, not an independent step.
- [x] ✅ Browser-verified Respiration versus Warburg shift at 30% uncoupling: four map halos, four flagged payload rows, and an AI reply naming CI Fe-S, CIII Qo, CIV to O₂, and the Overall node at 0.71 eV/ATP against 0.50 to 0.62. No page errors; typecheck clean.
- [ ] ❌ Reference bands still require assay-specific validation before physiological or clinical interpretation.

### Security before deployment
- Keep the AI key server-side and retain per-request validation and rate limiting. Review owner-only access to saved interpretations and replace per-instance limits with shared limits before public deployment.

## Warburg network card selection (2026-09-29)
- [x] ✅ Clicking a Warburg ATP network circle highlights its matching ETC step card with the same primary ring used by Compare, while preserving the green/amber ATP-yield edge.
- [x] ✅ Clicking the selected circle again clears the card highlight.

## Physiology tab (2026-09-29)
- [x] ✅ Added a live reference view listing all ETC redox steps, modeled eV drops, reference bands, sources, ATP yields, effective cost and out-of-range flags.
- [x] ✅ Included membrane potential, leak, P/O and ATP-cost comparisons plus Fe-S and aconitase display bands, with explicit limitations for model-derived values.
- [x] ✅ Browser-verified all nine ETC rows and both iron readouts; 30% uncoupling flags four pumping/summary rows, while default settings flag none, with no page errors.
- [ ] ❌ Validate literature-informed bands against tissue- and assay-specific measurements before clinical interpretation.
### Security before deployment
- No new endpoint or data storage. Keep educational-use caveats visible and review source citations before publishing.

## ATP flag cause attribution (2026-09-30)
- [x] ✅ Physiology P/O reference rows show an explicit within/outside status and name membrane potential and uncoupling as the dependent inputs, rather than implying P/O is an adjustable slider.
- [x] ✅ Corrected the FADH₂ P/O path to exclude only Complex I steps; Complex III and IV still contribute to succinate-derived ATP yield.
- [x] ✅ Out-of-range ATP-cost warnings identify membrane potential and uncoupling changes against the healthy reference.
- [x] ✅ Each warning includes the resulting NADH or FADH₂ P/O value and labels P/O as a derived readout, not an independent slider.
- [x] ✅ Physiology, Compare and Warburg network details share the same cause logic; fixed redox flags explicitly state that sliders did not cause them.
- [ ] ❌ Cause labels are model counterfactuals, not experimental causal inference, and require validation before clinical interpretation.
### Security before deployment
- No new endpoint, stored data or user input surface was added.


## Physiology citation audit (2026-09-30)
- [x] ✅ Replaced inferred ETC textbook bands with literature-derived ΔE intervals calculated from cited midpoint potentials.
- [x] ✅ Added a full citation, DOI link and derivation note to every ETC step in Physiology.
- [x] ✅ Removed the unsupported claim that one textbook table published all nine ranges; preparation, pH and active-state uncertainty are now explicit.
- [ ] ❌ The intervals remain comparison envelopes, not clinical normal ranges; validate against the exact tissue, species and assay before clinical interpretation.
### Security before deployment
- No new data collection or network endpoint. Citation links open directly to DOI records and use safe external-link attributes.

## Warburg physiology subtab (2026-09-30)

- [x] ✅ Added healthy/current primary superoxide production, signed site-level ROS gaps, and each distinct site's share of the absolute five-site gap beside the existing ATP breakdown. OGDH appears separately outside the ETC; the repeated CI Q-site and all-site chain summary are excluded from ROS share totals.
- [x] ✅ Verified default and Warburg shift cases at 1280px and 390px: baseline gaps are zero, shift ROS shares sum to 100% including OGDH, nine ATP rows remain present, and no page errors occurred.
- [ ] ❌ These ROS rates and shares are simulated production, not patient measurements; validate with matched site-resolved assays before biological or clinical interpretation.
- [x] ✅ Added Dashboard and Physiology views inside Warburg, preserving the dashboard as the default.
- [x] ✅ Listed all nine electron-transfer rows with literature-derived ΔE values, source links, live ATP per pair, healthy-baseline ATP and ATP flags.
- [x] ✅ Compared named CI IF, CI IQ/RET, CII IIF and CIII Qo superoxide production rates with the same-geometry healthy respiration baseline.
- [x] ✅ Flagged modeled ROS source changes at or beyond ±25%; rows without a direct modeled source are explicitly unassessed.
- [ ] ❌ The ±25% ROS band is a model comparison threshold, not a published physiological range; validate it for the intended tissue and assay before interpretation.

### Feature specification
- User story: as a Warburg modeler, I can inspect each electron-transfer step and see whether ATP energetics or modeled ROS production departs from its stated reference.
- Acceptance: all cited steps show ATP and source details; ROS appears only where the model names a production site; flags update immediately with Warburg settings.

### Testing and deployment
- [x] ✅ Verified both inner Warburg tabs, all nine physiology rows, zero baseline ROS flags and five ROS flags after the Warburg shift preset, with no page errors.
- No new API, storage, authentication or personal-data surface was added. Keep the educational-use caveat and ROS baseline limitation visible before publishing.

## Iron × light human control envelopes (2026-09-30)

- [x] ✅ Replaced the unsupported Fe-S and aconitase display cutoffs with the published platelet mitochondrial ACO2 control envelope, 209.41–541.41 mU/mg protein in 22 healthy controls.
- [x] ✅ Scaled relative model activity to the study mean of 375.41 mU/mg and labeled every value as assay-equivalent, not measured.
- [x] ✅ Map cells outside the study-control envelope receive red dashed flags and report the assay-equivalent value in hover details.
- [x] ✅ Fe-S flags explicitly use ACO2 activity as an Fe-S-dependent proxy because no direct human Fe-S integrity interval exists.
- [x] ✅ AI map interpretation receives the cohort, specimen, assay envelope, flagged-cell count, and proxy status.
- [ ] ❌ This single platelet study is not a universal clinical reference interval; validate against the intended specimen and assay before clinical use.

### Testing, security and compliance
- Verify both Fe-S and aconitase map outputs, flagged counts, citation link, AI payload validation, and narrow-screen horizontal scrolling.
- No new personal data, storage, endpoint, or secret was added. Keep the research-only and non-diagnostic wording visible before deployment.

## ROS + ATP flag dashboard (2026-10-01)
- [x] ✅ Added a side-by-side Physiology view of all nine ATP step flags and eleven modeled ROS source flags, with current and same-geometry simulated-default values.
- [x] ✅ Shows membrane potential and uncoupling separately using one-control-reset simulations, including remaining flags and ATP/ROS effects at each site.
- [x] ✅ Verified at 1280px and 390px: default 0 ATP/0 ROS flags; stressed run 4 ATP/7 ROS flags, reset comparisons update, no page errors. The tab strip now wraps on narrow screens. Typecheck clean.
- [ ] ❌ ROS ±25% is an exploratory change threshold and ATP cost is a model proxy, not a clinical limit; matched tissue-specific validation remains necessary.
### Security before deployment
- The dashboard collects no patient data and adds no endpoint or persistence. Keep the model-only caveats visible and do not use flag counts for diagnosis.

## Profile ROS assay flags (2026-10-01)
- ✅ ROS Physiology shows species-level assay flags from each profile vs healthy control beside model flags
- ❌ Real paired assay data with matched controls

## Clinical interpretation view (2026-10-01)
- ✅ Physiology Interpretation subtab: summary, ranked slider causes, flagged ATP steps and ROS sources, profile assay agreement, optional AI expansion
- ❌ Validated causal attribution needs matched experiments

## Profile ATP assay flags (2026-10-01)
- ✅ ROS + ATP flags tab: profile P/O and ATP-linked OCR vs healthy control beside model ATP flags
- ❌ Real paired assay data with matched controls

## Diagnosis mechanism review (2026-10-01)
- ✅ /diagnosis ranks five mechanisms per synthetic profile from Patient Data, ROS and ATP assay and model flags, with label-fit check
- ❌ Rule weights need validation against real cohorts before any clinical use

## Diagnosis ferritin downweighting (2026-10-01)
- ✅ Ferritin support for iron and Fe-S stress counts at quarter weight for the three acute nonfasting profiles (demo-13 TBI, demo-14 stroke, demo-15 sepsis AKI), since ferritin is an acute-phase reactant.
- ✅ Result: stroke and sepsis AKI now rank coupling loss first (label fit "matches"); TBI moved off iron stress to pyruvate entry block (partly matches). Leigh, PDH, Friedreich, MELAS, iron overload unchanged.
- ✅ Diagnosis page Limits text updated; AGENTS.md rule updated.

## Treatment page (2026-10-02)
- ✅ /treatment: 10 therapy classes mapped to slider moves, simulated ATP/ROS before vs after per synthetic profile, ranked by strong Diagnosis causes, Open in Simulator handoff
- ✅ Linked from Diagnosis, Physiology and Patient Data; verified at 1280 and 390, no page errors
- ❌ Verify citations for remaining therapy classes; therapy combinations; dose-response

## Lab reference ranges (2026-10-02)
- ✅ Six blood tests use Mayo Clinic Laboratories intervals (FERR1 age/sex, LACS1 age, PYR, SFEC, GLURA random for acute nonfasting) plus ADA fasting glucose; L:P ≤25 kept as unverified
- ✅ Percent beyond the nearest limit shown in Patient Data, Patient Comparison and Diagnosis; children now flagged against child ranges
- ✅ Invented sex added; three synthetic pyruvate values raised to fit the real 80-160 µmol/L interval
- ❌ Verify the L:P decision limit source; research assays have no lab ranges

## Real lab data and report uploads (2026-10-02)
- ✅ Each patient value tagged Published, Yours or Synthetic; Diagnosis shows real-data share per profile and per cause.
- ✅ Published values from checked tables: healthy adult ATP-linked OCR 6.4 (Lee 2026 Table 2); Leigh lactate 9.26, L:P 35 (Ching 2013 HKMJ); PDH lactate 9.9, pyruvate 1000 µmol/L, L:P 9.9 (Indian J Pediatr 2021); iron overload ferritin 855, TSAT 70% (Sandnes 2021 Genes Table 4, C282Y/C282Y men).
- ✅ Diagnosis rankings unchanged with these values.
- ✅ "Your lab results" panel on Patient Data and Diagnosis: manual entry, CSV (identifier columns rejected), PDF or photo read by AI (/api/extract-labs), editable review, unit conversion; kept in the tab only, never stored.
- ❌ Published values for the other 14 conditions.
- Security: uploads are sent once to the AI and not logged or saved; the AI is told never to return identifiers; users are warned to crop identifiers first. Before deployment, consider sign-in plus a database rate limit on /api/extract-labs.

## Treatment Plan page (2026-10-02)
- ✅ /treatment-plan: per strong cause therapy options with model doses (slider before to after), combined plan effect; linked from Diagnosis
- ❌ Checked papers for 8 of 10 therapies
- ✅ Simulator "Therapy levers" row: each Treatment therapy applies its slider moves to current settings on click
- ✅ Patient Data "How flags move with published patient values": published tests flagged vs invented value and vs healthy adult (2026-10-02)
- ✅ Treatment: 10 more therapies (3 chelators, 4 antioxidant classes, CoQ/idebenone, SS-31, methylene blue); all model proxies, no checked papers yet
- ✅ L:P cut point 25 now cited to Debray et al. Clin Chem 2007 (PMID 17384007), labeled a published decision cut point, not a lab reference interval

## Lab ranges page (2026-10-02) ✅
- New route /lab-ranges (src/routes/lab-ranges.tsx), linked from the Physiology and Patient Data tabs next to the Diagnosis link.
- Lists all 24 model sliders grouped by settingsGroups with default value, reference range (or "No published range"), status at default, source citation link and note; only membrane potential has a published numeric band (150-180 mV, Zorova 2018).
- Lists all 14 patient metrics grouped by patientGroups with specimen/method, range resolved for the healthy adult profile via referenceFor, kind (Lab vs Research band), source link and note.
- Derived readouts section: effective ATP cost 0.52 vs 0.50-0.62 eV/ATP (Nicholls & Ferguson) and P/O bands from poLiteratureBands (Hinkle 2005).
- Verified with Playwright at 1280 and 390: 24 slider rows, 14 metric rows, no overflow, no page errors; typecheck clean.

## Diagnosis disorder overlap (2026-10-02) ✅
- diagnosis.ts: flagOverlaps(p, pool) maps each flagged value of the selected profile to the disorder profiles flagging the same value in the same direction (metricDirection), excluding healthy profiles and the profile itself; returns perFlag overlaps plus disorders ranked by shared flag count.
- diagnosis.tsx: "Which disorders share these flags" section (test id dx-overlap, rows dx-overlap-row) above the label-fit check; top 6 disorders with shared/total counts and flag lists, collapsible per-flag detail, caveat that overlap is shared flags, not a likelihood.
- Playwright at 1280 and 390: Leigh syndrome (default) overlaps MELAS 7/8, sepsis AKI 7/8, POLG 6/8; healthy adult shows "No flagged values"; no page errors; typecheck clean.

## Membrane potential reading entry (2026-10-02) ✅
- userPatients.ts: updateUserPatientValue(id, key, value) updates one entered value on a tab-only user profile in place.
- New MembranePotentialEntry.tsx on the Patient Data tab (test id membrane-entry): number input 0-300 mV, live band status of the selected profile vs the 150-180 mV research band (Zorova 2018), "Update this profile" for user profiles or "Add as your profile" for demo records (creates a tab-only copy carrying age, sex and fasting state; all other values synthetic fill).
- Feeds the Patient Comparison slider drift check, which previously read "None" for user profiles because membrane potential was healthy synthetic fill.
- Playwright at 1280 and 390: 128 mV creates a profile flagged 15% below the 150 lower limit; 165 mV updates in place to within band; drift check flags "Mitochondrial membrane potential (B)" for the out-of-range profile; no page errors; typecheck clean.

## Run patient in Simulator (2026-10-02) ✅
- patientReference.ts: inputsFromPatient(p) maps a profile's measured values onto Simulator sliders: membranePotential to deltaPsi, labileIron to labileIron, MitoSOX fold to antioxidantCapacity as an inverse proxy (1/fold), each clamped to inputRanges. Notes list the mappings and state that ATP-linked respiration, P/O, peroxide and lipid oxidation have no slider.
- index.tsx: new patient search param; effect finds the profile among user-added then demo profiles, sets sliders from defaults plus the patch, shows a patient-run banner (test id patient-run-banner) naming the profile and the mappings, with a Reset to defaults action.
- diagnosis.tsx: Run in Simulator button (dx-run-sim) links to /?patient=<id>.
- Playwright at 1280 and 390 for demo-04 (Leigh): banner shown, sliders read membrane potential 134 mV, labile iron 3.4 µM, antioxidant capacity 0.633 (1/1.58 MitoSOX), all other sliders at defaults; no page errors; typecheck clean.

## Healthy range column in lab upload (2026-10-02) ✅
- UserLabsPanel review table now shows a Healthy range column per row, resolved with referenceFor against the draft age/sex/fasting: lab ranges for the 7 lab metrics, the 150-180 mV research band for membrane potential (labeled research band, not a lab range), or "no published range".
- Out-of-band values flag inline before adding (e.g. 128 mV shows "15% below the 150 lower limit"); in-band shows "Within range".
- Fixed: changing the test dropdown now resets the unit to that metric's unit (was keeping the previous unit, blocking mV entry).
- Verified at 1280: 128 mV flags below band, 165 mV within band, no page errors; typecheck clean.

## Therapy to disorder links (2026-10-02) ✅
- treatment.ts: therapyTargets(t, all) returns profiles where a therapy matches a strong cause (score >= 1.5), with matched mechanisms and scores.
- Treatment page: each therapy row has a "Which disorders does this target?" toggle listing matching profiles, each linking to /diagnosis?profile=<id>. Labeled model matches, not clinical indications.
- Diagnosis page: new optional profile search param preselects the profile from the link.
- Verified: iron chelation lists Leigh, Friedreich (3.00), POLG, MELAS, TBI; clicking Demo 06 opens /diagnosis?profile=demo-06 with Friedreich preselected. Typecheck clean, no page errors.
- ✅ Treatment therapies stack on the patient's measured baseline (membrane potential, labile iron, inverse MitoSOX) in the Simulator and in Treatment/Plan scoring
- ✅ Run in Simulator banner: model vs measured ATP/ROS (fold healthy) and per-slider effect table
- ✅ /timeline: per-profile visits (baseline, invented follow-ups, tab-only user visits) with lab chart, Diagnosis flags/top mechanism and selected therapies
- ✅ Published readout bands (P/O Hinkle 2005, H2O2 1-100 nM Sies 2017, ATP-linked OCR Lee 2026) on Lab Ranges and in the Patient Comparison drift check

## Run in Simulator on Patient Data tab (2026-10-02) ✅
- PatientData.tsx: Run in Simulator button (patient-run-sim) under the record selector links to /?patient=<selected id>; note explains the three mapped sliders and that unmapped measurements stay at defaults.
- Verified: selecting Demo 04 (Leigh) and clicking loads /?patient=demo-04 with the patient-run banner; no page errors; typecheck clean.
- ✅ Therapy calculator page (/therapy-calculator): ATP/ROS readouts per model dose 0-2x on patient baseline
- ✅ Patient dashboard (/dashboard): all profiles with model ATP/ROS, flag counts, top mechanism, disorder overlap, links to Diagnosis and Simulator
- ✅ Treatment overlap (Treatment page): therapies grouped by shared ATP/superoxide/H2O2 direction at 1x on patient baseline

## Lactate:pyruvate to Simulator
- ✅ L:P maps to the NADH ratio slider (lpMapping), skipped when synthetic or lactate below 2.5 mmol/L
- ✅ Dashboard L:P column with mapped tag; Patient Data note

## Therapy before/after in Simulator banner (2026-10-02) ✅
- PatientRunReadouts.tsx: new "Therapy effect" table (testid therapy-before-after) when a therapy is applied: ATP, superoxide, H2O2 before (patient baseline sliders) vs after (therapy on top), with % change; units shown; 3-significant-digit formatting.
- index.tsx: tracks runTherapy from ?apply=, passes to PatientRunReadouts, Reset clears it.
- Verified Leigh + mitochondrial antioxidant: ATP 60.8→60.8 µM/s (+0%), superoxide 0.00992→0.00884 nM (-11%), H2O2 37.1→27.8 nM (-25%); no page errors; tsgo clean.

## Dashboard sort + CSV (2026-10-02) ✅
- dashboard.tsx: rows sorted by total flag count (lab+assay+model) descending, ties by label; header note says sorted most-flagged first.
- Download CSV button (dash-csv): profile, id, phenotype, age, sex, source, L:P, ATP/superoxide/H2O2 with vs-healthy %, flag counts, top mechanism, top overlaps; footer note that it is a research model, not a diagnosis; downloaded in-browser only.
- Fixed blank sex in profile sublines: demo patients store sex in the sexById map; now uses patientSex(p).
- Verified: order Demo 15 (18 flags) > Demo 04/Demo 08 (15) > Demo 13 ... > Demo 02/03/10 (0); sex shows in rows and CSV; download produced cristae-lab-patient-dashboard.csv; no page errors; tsgo clean.

## Measured peroxide in nM on Patient Data (2026-10-02) ✅
- ✅ Optional "Hydrogen peroxide concentration (nM)" entry (manual, CSV row h2o2Nm, PDF/photo), µM and pM converted to nM
- ✅ Compared with the Sies 2017 band, flagged only above 100 nM, labeled a research band
- ✅ Patient Comparison drift check uses the measured nM value when present; demo profiles show "Not measured" (no invented values)
- ✅ Verified: 150 nM flagged 50% above, 40 nM within band, no page errors

## Published MitoSOX band (2026-10-02) ✅
- ✅ MitoSOX healthy-control spread 0.59-1.5 fold control (Gonzalo 2019 Front Neurosci: CD3+ T-cell control median 192 MFI, IQR 114-287.5, n=24), labeled study-specific research band
- ✅ Shown on Lab Ranges, Patient Data range column, and the Patient Comparison drift check (measured value)
- ✅ Adults only; children show "no pediatric interval"

## Measured peroxide (nM) in Simulator and dashboard (2026-10-03) ✅
- ✅ Simulator patient banner: model and measured H2O2 vs Sies 2017 (flagged above 100 nM); measured value moves no slider
- ✅ Dashboard: H2O2 band column, +1 assay flag when above 100 nM, CSV columns Measured H2O2 (nM) and H2O2 vs Sies 2017
- ✅ Verified: 150 nM profile flagged 50% above in both places (0/1/1 flags); demo profiles show Not measured; model H2O2 18-37 nM never flags

## Dashboard peroxide flag column (2026-10-03) ✅
- New "Peroxide flag" column on /dashboard, between the H2O2 band detail and the lab/assay/model flag counts: "Flagged >100 nM (measured|model)" in red when the Sies 2017 check trips, otherwise "Within" or "Within (model only)".
- CSV download gained a matching "Peroxide flag" column.
- All 18 demo profiles read "Within (model only)" (model peroxide stays 18-37 nM; no demo has a measured nM value). Verified at 1280, no page errors, typecheck clean.

## Peroxide (nM) on the Timeline (2026-10-03) ✅
- Visit type carries optional h2o2Nm; baseline takes the profile's measured value, synthetic follow-ups drift it toward 30 nM when present.
- Timeline metric selector gains "Hydrogen peroxide (measured, nM)": chart plots it with a 100 nM Sies 2017 reference line, gaps for visits without a measurement, and a note that the band is research, not a lab range.
- Add-visit form gains a peroxide field (blank carries over from the latest visit); table shows the value in red above 100 nM or "Not measured".
- Verified: added a 2026-09-01 visit with 150 nM; row shows 150 in date order among synthetic visits, no page errors, typecheck clean.

## MitoSOX band on dashboard + children (2026-10-03) ✅
- referenceFor now applies adult research bands to children with a caution label ("adult band applied to a child; no pediatric interval exists") instead of returning no range; PatientComparison wording updated to match.
- Dashboard assay flag count includes the MitoSOX band check (Gonzalo 2019, 0.59-1.5x control); new "MitoSOX band" column shows Flagged/Within with "(adult band, child)" for minors.
- CSV gains "MitoSOX (fold control)" and "MitoSOX vs Gonzalo 2019" columns.
- Verified: 6 of 18 profiles flag (Leigh age 3, Friedreich 17, MELAS, TBI, sepsis AKI, iron overload); children labeled; no page errors; typecheck clean.

## Therapy comparison page (2026-10-03) ✅
- New /therapy-compare route: pick a patient profile, two therapies and a model dose for each (0-2x); ATP flux, superoxide and H2O2 shown side by side (baseline, A, B, A+B combined) with percent change.
- Dose-response chart overlays both therapies across all doses (A solid, B dashed); shared-slider warning when both therapies move the same slider; per-therapy cards show slider targets, note and evidence status.
- Linked from the Therapy calculator header; search params profile/a/da/b/db.
- Verified at 1280: Leigh baseline vs mitoAntiox 1x vs complex2 1.5x (ATP 61/61/64, superoxide -15%/+10%, H2O2 -35%/+8%); no page errors; typecheck clean.
