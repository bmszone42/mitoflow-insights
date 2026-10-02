## Synthetic profiles vs healthy baseline (2026-10-01)
- [x] Add a dedicated profile comparison page reachable from Physiology and Patient Data, listing all 18 invented records.
- [x] Flag only directly mapped and age-applicable membrane potential against its cited adult band; mark other sliders unknown.
- [x] Show nine conditional ATP step flags from each profile's potential with all other settings at model defaults, retaining cited redox versus modeled cost distinctions.
- [ ] Real patient ATP attribution needs paired calibrated measurements of coupling, geometry and flux; synthetic values do not establish these.

- [x] Link ROS Physiology to all synthetic profiles using only their illustrative membrane potential as a modeled comparison state.
- [x] Keep profile assay signals and published mechanisms separate from source-specific rate flags; no disorder-specific textbook ROS intervals are available.
- [ ] Validated disorder- and assay-specific site-rate ranges would require matched experiments before any textbook or clinical flag can be offered.

- [x] Compare two synthetic patient profiles side by side in Physiology, separating directly comparable sliders from derived and assay-specific measurements.
- [x] Apply published bands only when age and sampling context allow, with unflagged status where no transferable range exists.

- [x] Add a searchable ROS References view for all eleven modeled sources with verified full-paper citation spans.
- [ ] Check claim-specific page numbers in primary papers before attributing specific kinetic or model values to pages; full publication spans are shown instead.

- [x] Add a cited biochemical ledger separating measured reaction constants from assumed mitochondrial concentrations and effective rates.
- [x] Use measured purified-human Prx3 peroxide kinetics in the modeled clearance term, retaining an explicitly assumed reduced pool and recycling cap.
- [x] Route simulated ATP yield by NADH and succinate supply using literature P/O stoichiometry rather than one blanket yield.
- [ ] Calibrate all matrix concentrations, effective ROS sink pools, flux capacities and light/Fe-S multipliers to matched tissue-specific experiments before interpreting absolute µM/s as measurements.
# Roadmap
## Cited ROS physiology and high-uncoupling check (2026-10-01)
- [x] Show full verified paper citations next to all 11 modeled ROS sources, with explicit absence of transferable µM/s ranges.
- [x] Check 40% uncoupling against the same-geometry simulated default: two of 11 sources cross the model-only ±25% change threshold.
- [ ] Experimental range flags require a matched tissue, substrate, protein-to-volume conversion and assay calibration; no source is classifiable against a cited normal range yet.


- [x] Show cited PBMC ROS assay control measurements separately from invented patient values.
- [x] Flag entered ROS assay results only against matched local control limits, with probe-specific direction and no saved patient data.
- [ ] Clinical ROS comparison requires a performing laboratory's assay-matched controls and validated intervals; none are supplied by these method papers.

- [x] Link eleven modeled ROS sources to upstream input effects, including indirect effects.
- [x] Attribute ROS flags with one-input-at-a-time comparisons and link selected sources to table rows on desktop and mobile.

- [x] Verify published platelet ACO2 control statistics and expose current model study-control status on the iron × light map.
- [ ] Clinical reference intervals for Fe-S and this model-derived aconitase estimate require assay-matched validation; no universal interval is available.

- [x] Highlight out-of-band ETC steps in the ATP step list and Warburg flowchart using the existing Physiology flag rules.
- [x] Verify the flagged steps agree across both views at baseline and high uncoupling on desktop and mobile.

- [x] Show Warburg respiration-versus-current P/O efficiency with cited literature bands in Physiology.
- [x] Verify fuel-supply shifts do not falsely change P/O and altered coupling correctly changes flags.

- [x] Add site-level ROS rate gaps and contribution shares beside the Warburg ATP gap breakdown, without counting shared or aggregate sources twice.
- [x] Verify Warburg baseline and shifted settings show consistent ROS and ATP site shares on desktop and narrow screens.

- [x] Link each named ETC step in the ATP driver interpretation to its verified paper, distinguishing published redox evidence from simulated ATP-rate changes.

- [x] Expand synthetic Patient Data to varied ages and at least 10 named mitochondrial-dysfunction conditions including neurodegeneration, traumatic brain injury, acute kidney injury, and stroke.
- [x] Keep clinical collection context and age-dependent reference limitations visible; verify the expanded cohort and flags in the live view.

- [x] Add a separate ROS Physiology view for each modeled source with live and same-geometry default production rates.
- [x] Show cited mechanism or kinetic context and label model-only change flags without implying textbook normal-rate intervals.
- [ ] Validate source-specific ROS rates against matched experimental preparations before treating rate flags as physiological abnormalities; matched assays unavailable.

- [x] Add a searchable Physiology study index with verified full citations and publication locators.
- [x] Map each verified study to the model settings, ETC steps, assays, or benchmark it supports.
- [x] Separate unresolved citation fragments from verified bibliography records and correct mismatched DOI links.

- [x] Compare live healthy default with independent published P/O estimates and platelet aconitase controls as an explicitly scaled proxy.
- [x] Distinguish simulated ATP network baseline from measured controls; never flag ATP flux against oxygen-consumption units.
- [ ] Clinical validation requires matched specimen, assay, calibration and actual patient measurements; unavailable here.

- [x] Flag NADH and FADH2 P/O as derived efficiencies in Physiology and name membrane potential and uncoupling as their inputs.

- [x] Show all 24 live input and geometry controls in the Physiology settings reference dashboard.
- [x] Summarize outside-range, within-range, and context-dependent settings with cited limits and boundary distances.
- [x] Keep slider limits separate from literature bands and leave the non-comparable uncoupling control unflagged.

- [x] Build reusable iron × light map shared by Sensitivity and Physiology.
- [x] Add shared ATP comparison rows and both baseline modes.
- [x] Compose Physiology overview with linked network and ETC rows.
- [x] Update project documentation and architecture rules.
- [x] Verify desktop, narrow layout, saved-scenario empty state, and current preview health.
- [x] Show per-step slider cause attribution on Warburg ATP networks and Physiology flags.

- [x] Add a side-by-side ROS and ATP flag dashboard in Physiology with membrane potential and uncoupling reset comparisons.
- [x] Validate the new dashboard at baseline and stressed settings on desktop and narrow screens.

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
- ✅ Ferritin counts at quarter weight in acute profiles (TBI, stroke, sepsis AKI) since it is an acute-phase marker; stroke and AKI now rank coupling loss first
- ❌ Rule weights need validation against real cohorts before any clinical use

- [x] Treatment page linking Diagnosis mechanisms to therapy slider targets
- [ ] Verified citations for every therapy class

- [x] Real lab reference ranges with percent outside in Patient Data
- [ ] Verified L:P ratio decision limit

- ✅ Real lab data: published values for 4 profiles, user uploads (CSV, PDF, photo via AI), synthetic fill marked
- ❌ Published values for the other 14 conditions (no checked open source found yet)
- [x] Lab ranges page listing every slider and metric range with citations
- [x] Diagnosis page: disorder overlap per flagged lab value
- [x] Membrane potential reading entry on Patient Data feeding the comparison drift check
- [x] Run patient in Simulator: Diagnosis button maps membrane potential, labile iron and MitoSOX onto sliders
- [x] Upload review table shows the healthy range per value, with inline out-of-band flags (membrane potential uses the 150-180 mV research band)
