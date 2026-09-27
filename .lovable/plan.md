# Replace lumped ROS math with site-resolved mitochondrial pathways

## What changes for you
Superoxide, H2O2, peroxynitrite and hydroxyl radical will be computed from named biological sources and sinks instead of single lumped formulas. The Simulator gains a "ROS sources and sinks" breakdown showing which site produces each species and what removes it. Sensitivity is then re-run and the before/after table reported.

## Superoxide (O2•-)
Sources, each with its own driver:
- Complex I site IF (flavin): NADH/NAD+ redox state, deltaPsi.
- Complex I site IQ reverse electron transport: succinate drive x deltaPsi (steep above ~150 mV), suppressed by uncoupling.
- Complex III site IIIQo: semiquinone lifetime, rises with deltaPsi and with antimycin-like backpressure; half released to the intermembrane space.
- Complex II site IIF and 2-oxoglutarate dehydrogenase (OGDH): succinate and NADH driven.
- Direct photon term (existing burst plus stress, kept).
Sinks: SOD2 in matrix, SOD1 in IMS, reaction with NO, attack on aconitase [4Fe-4S].
Matrix and IMS pools tracked separately (Wong et al. 2017; Brand 2016; Quinlan et al. 2013).

## H2O2
Sources: SOD2 plus SOD1 dismutation, OGDH direct H2O2, flavin photosensitization (existing).
Sinks: Prx3 (dominant, saturable with Srx/TrxR2 recycling), GPx1/GSH, catalase (minor), diffusion out to cytosol. Prx3 hyperoxidation above ~5 µM H2O2 reduces clearance (Cox et al. 2010).

## Peroxynitrite (ONOO-)
Formation at k ~ 1e10 M-1 s-1 from O2•- and NO (NO after photolysis, kept). Sinks: CO2 adduct (dominant, ~46 µM-1 s-1 x 1.3 mM CO2), Prx3 and GPx reduction, matrix protein thiols. Output nitrating and hydroxyl-like radical yield (Radi 2013).

## Hydroxyl radical (•OH)
Sources: Fenton (Fe2+ + H2O2, k ~ 1e3 M-1 s-1), Haber-Weiss iron recycling (O2•- reduces Fe3+ back to Fe2+, raising the Fe2+ fraction), ONOO- homolysis (~30% of CO2-independent decay). Sink: diffusion-limited reaction with any molecule (~1e9 s-1).

## Kept as is
Singlet oxygen, lipid peroxyl, ferroptosis, Fe-S, 71 THz, all inputs and slider ranges. Output names unchanged, so Compare, CSV, AI routes and saved scenarios keep working.

## Verification
- Typecheck, then re-run sensitivity at defaults and at 12 J/cm2 light, report old vs new percentages.
- Check baseline values stay in the published range (matrix O2•- ~10-200 pM, H2O2 ~5-100 nM).
- Browser check Simulator and Sensitivity tabs load with no errors.
- Update progress.md, AGENTS.md rule if structure changes, model citation block.

## Technical details
- All math stays in `simulate` in `src/lib/mito/model.ts`; new exported `rosBudget` object on Outputs (per-site rates in µM/s) feeds the new Simulator panel.
- `reference.ts` gets short site notes for the ROS panel.
- Parameter magnitudes are literature-order estimates; rescaling may shift absolute numbers shown today, which I will report.
