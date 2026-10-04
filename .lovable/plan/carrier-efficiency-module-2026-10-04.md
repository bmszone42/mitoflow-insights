# Carrier efficiency module

## What you get
- A new **Carriers** page (top nav) with one slider per mitochondrial carrier (0 to 2x transport rate, 1x = current run).
- Live readout per change: NADH pool, ATP flux, superoxide, peroxide, labile iron, current run vs carrier-adjusted run, with percent change, plus a chart across 0 to 2x for the selected carrier.
- A reference table on the same page: gene, carrier, cargo, what the slider moves in the model, evidence status, cited source (from the reference library, with synopsis and score).
- Profile picker so you can run it on any demo profile or Timeline visit.

## Carriers covered
| Carrier | Cargo | Model link | Status |
|---|---|---|---|
| Mitoferrin-1/2 (SLC25A37/28) | Fe2+ in | scales labile iron | cited mechanism, made-up rate |
| SLC25A34 | oxaloacetate in | existing invented NADH curve | MADE-UP |
| ANT1/2 (SLC25A4/5) | ADP in / ATP out | caps ATP export flux | made-up rate |
| Phosphate carrier (SLC25A3) | Pi in | caps ATP synthase step | made-up rate |
| MPC1/2 (pyruvate carrier) | pyruvate in | scales fuel supply / NADH | made-up rate |
| UCP1 (SLC25A7) | H+ leak | scales uncoupling slider | made-up rate |

Each new source gets assessed, logged in studyReferences and the reference library with synopsis and score /100.

## Guardrails
- Every slider labeled MADE-UP, unvalidated; no published transport rates are claimed.
- Carrier settings stay on this page only: never change Simulator inputs, flags, Diagnosis, scenarios or CSV flag counts.
- Not a diagnosis; model estimates only.

## Technical details
- `src/lib/mito/carriers.ts`: carrier list + `applyCarriers(inputs, rates)` mapping each rate to existing `Inputs` keys (clamped with `inputRanges`), then `simulate`.
- `src/routes/carriers.tsx` with own head(); chart lazy-loaded behind Suspense.
- Extend `mitoCarriers` in `reference.ts`; nav link in `__root.tsx`; AGENTS.md rule; progress.md update.
