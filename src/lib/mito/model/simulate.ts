/**
 * Literature-parameterized lumped model of mitochondrial redox, ROS,
 * Fe-S / labile iron handling, photon input and mid-IR (71 THz) output.
 *
 * Units: concentrations in µM (matrix volume basis), rates in µM/s,
 * fluxes in µM/s of electron pairs, time in s. Membrane potential in mV.
 *
 * Parameter sources (rounded, order-of-magnitude consistent):
 *  - Electron leak fraction at Complex I/III: 0.1-2% of electron flux
 *    (Chance & Boveri 1979; St-Pierre et al. 2002 JBC 277:44784).
 *  - SOD2 (MnSOD) matrix activity: k ~ 2.3e9 M-1 s-1, [SOD2] ~ 10 µM
 *    (Fridovich 1995) -> pseudo-first-order ~ 1e4 s-1.
 *  - Catalase/peroxiredoxin-3 + GPx1 H2O2 removal: Prx3 k ~ 2e7 M-1 s-1,
 *    Prx3 ~ 60 µM (Cox et al. 2009 Biochem J 425:313).
 *  - Fenton: Fe2+ + H2O2, k ~ 1e2-1e3 M-1 s-1 (Koppenol 2001).
 *  - NO + O2•- -> peroxynitrite, k ~ 1e10 M-1 s-1 (Kissner et al. 1997).
 *  - Aconitase-2 [4Fe-4S] inactivation by O2•-, k ~ 1e7 M-1 s-1
 *    (Gardner & Fridovich 1991 JBC 266:19328).
 *  - ISCU/NFS1 Fe-S assembly turnover, minutes timescale
 *    (Lill 2009 Nature 460:831) -> k_assembly ~ 5e-3 s-1.
 *  - Cytochrome c oxidase 660 nm / 810 nm absorption and NO photolysis
 *    (Karu 2010; Lane 2006 Nature 443:901) -> CIV rate gain up to ~1.4x
 *    at ~10-30 J/cm2, biphasic above ~60 J/cm2 (Arndt-Schulz behaviour).
 *  - Direct photon ROS: 810 nm raises mitochondrial ROS independently of NO,
 *    a modest burst peaking at ~3 J/cm2 (Chen et al. 2011 PLoS One 6:e22453)
 *    and a larger stress-type rise with MMP loss at >=30 J/cm2
 *    (Huang et al. 2013 J Biophotonics 6:829). Red light yields H2O2 directly
 *    via flavin photosensitization (Hockberger et al. 1999 PNAS 96:6255).
 *  - Site-resolved O2•- production: CI sites IF and IQ (reverse electron
 *    transport), CIII site IIIQo (half to IMS), CII site IIF, OGDH
 *    (Brand 2016 Free Radic Biol Med 100:14; Quinlan et al. 2013 JBC 288:27103).
 *    SOD1 in IMS, SOD2 in matrix. H2O2 cleared by saturable Prx3 with
 *    hyperoxidation above ~5 µM (Cox et al. 2010 Antioxid Redox Signal 12:311),
 *    GPx1, catalase and efflux. ONOO- sinks: CO2 (4.6e4 M-1 s-1 x 1.3 mM),
 *    Prx3, GPx, thiols, ONOOH homolysis ~30% •OH yield (Radi 2013 Acc Chem Res
 *    46:550). •OH from Fenton with an Fe2+ fraction set by reductants and O2•-
 *    (Haber-Weiss recycling) plus ONOOH homolysis. Site rates are scaled
 *    estimates matched to total leak ~0.2% of flux, not fitted values.
 *  - Ferroptosis: GPx4 reduces phospholipid hydroperoxides (PLOOH) with GSH,
 *    k ~ 1e7 M-1 s-1 (Ursini et al. 1985 BBA 839:62); FSP1 regenerates
 *    CoQ10H2 as a GPx4-independent radical-trapping antioxidant
 *    (Bersuker et al. 2019 Nature 575:688; Doll et al. 2019 Nature 575:693).
 *    Fe2+-catalysed PLOOH decomposition makes propagation autocatalytic;
 *    commitment when it outpaces removal (Dixon et al. 2012 Cell 149:1060).
 *    Cardiolipin peroxidation above ~10% primes cytochrome c release
 *    (Kagan et al. 2005 Nat Chem Biol 1:223). Rate scaling here is lumped.
 *  - Photoreceptor model (replaces fitted dose curves): fluence at depth
 *    = dose x exp(-mu_eff x depth), mu_eff ~0.35/mm at 660 nm and ~0.2/mm at
 *    810 nm in soft tissue (Jacques 2013 Phys Med Biol 58:R37). Relative
 *    absorption of CCO chromophores from the Karu action spectrum bands at
 *    620/680/760/820 nm (Karu 1999 J Photochem Photobiol B 49:1): heme a/a3
 *    dominates at 660 nm, CuA at 810 nm. Flavin (FMN) and porphyrin tails
 *    absorb 660 nm only weakly and 810 nm hardly at all. Photon use saturates
 *    with irradiance (reciprocity breakdown, Huang et al. 2009 Dose Response
 *    7:358). NO photodissociation from heme a3-CuB, quantum yield ~0.1-0.3
 *    (Lane 2006). CIV activation raises the local proton gradient
 *    (Passarella 1984 FEBS Lett 175:95), which raises leak. Flavin
 *    excitation yields H2O2 and CI IF superoxide (Hockberger 1999). High dose
 *    CIV photoinhibition with MMP loss (Huang et al. 2013). Heating ~0.02
 *    K per mW/cm2 at steady state for thin samples. Coefficients are our own
 *    estimates; the sources set shapes and relative sizes, not fitted values.
 *  - 71 THz coherence: Frohlich-type pumped mode (Frohlich 1968 Int J Quantum
 *    Chem 2:641). Pump = CIV flux x membrane potential plus a share of
 *    absorbed photon energy; losses = baseline damping plus lipid peroxyl,
 *    oxidized cardiolipin and heat. The coherent fraction switches on above
 *    pump/loss = 1. Hypothetical and relative, not radiometric.
 *  - Mid-IR emission near 71 THz (≈4.22 µm, 2370 cm-1) tracked as a
 *    flux-proportional reporter band (Pokorny; Sahu et al. 2013 ordering
 *    in microtubule/mitochondrial water layers). Treated as a relative
 *    observable, not an absolute radiometric prediction.
 */
import type { Inputs, Outputs, FerroptosisState, Coherence, RosBudget } from "./types";
import { defaultInputs, THZ_CAL } from "./types";

// Keeps lipid peroxyl (and so ferroptosis) on its prior calibration after the ROS rebuild.
const LOO_CAL = 1.15;
import { photoreceptor } from "./photoreceptor";
import { geometryEffects, defaultGeometry, type Geometry } from "./geometry";


// Smallest positive root of a steady-state balance f(x) = production - removal.
function solveSteady(f: (x: number) => number) {
  let lo = 0;
  let hi = 1e-7;
  while (f(hi) > 0 && hi < 1e6) {
    lo = hi;
    hi *= 1.5;
  }
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const MITO_DAMAGED_AT_DEFAULT = 0.1;
export function qualityControl(halfLife: number) {
  const t = Number.isFinite(halfLife) && halfLife > 0 ? halfLife : 17.2; // old scenarios lack the field
  const kt0 = Math.LN2 / 17.2;
  const kd = (kt0 * MITO_DAMAGED_AT_DEFAULT) / (1 - MITO_DAMAGED_AT_DEFAULT);
  const kt = Math.LN2 / t;
  const damaged = kd / (kd + kt);
  const dD = Math.max(-0.1, Math.min(0.6, damaged - MITO_DAMAGED_AT_DEFAULT));
  return { damaged, dD, leak: 1 + 2 * dD, iron: 1 + 1.5 * dD, atp: (1 - damaged) / (1 - MITO_DAMAGED_AT_DEFAULT) };
}

export function simulate(i: Inputs, geo?: Geometry): Outputs {
  const ge = geometryEffects(geo ?? defaultGeometry);
  const pr = photoreceptor(i);
  // Mitochondrial quality control (turnover half-life, Kim 2012 / Stauch 2023).
  // kt = ln2 / t1/2 is published; the damage rate is calibrated (assumption) so
  // 10% of mitochondria are damaged at the default 17.2 d, making dD = 0 there.
  const qc = qualityControl(i.mitoHalfLife);
  const psi = i.deltaPsi + ge.psiShift + pr.psiShift - 15 * qc.dD; // damaged mitochondria are depolarized
  const photonGain = 1 + pr.civGain;
  const noEff = i.nitricOxide * (1 - pr.noReleased);

  // --- Electron transport (lumped Michaelis-Menten with backpressure) ---
  const psiBrake = 1 / (1 + Math.exp((psi - 175) / 12)); // Q-cycle reverse pressure
  const adpDrive = i.adp / (i.adp + 40); // ANT/ATP synthase control
  const o2Sat = i.oxygen / (i.oxygen + 0.8); // CIV Km ~ 0.5-1 µM O2
  const noInhib = 1 / (1 + noEff / 120); // competitive NO inhibition of CIV

  const vmaxCI = 55;
  const fluxCI = vmaxCI * ge.capacity * i.nadhRatio * (0.35 + 0.65 * adpDrive);
  const fluxCII = 30 * ge.capacity * (i.succinate / (i.succinate + 0.5));
  const fluxCIV =
    Math.min(fluxCI + fluxCII, 80 * ge.capacity) * ge.cytcRetention * o2Sat * noInhib * photonGain * (0.4 + 0.6 * adpDrive);
  // Hinkle 2005: 10 H+ per NADH and 6 H+ per succinate-derived electron pair;
  // 4 H+ per ATP including transport -> 2.5 and 1.5 P/O respectively.
  // Route the CIV electron-pair flux proportionally to CI/CII supply after
  // oxygen/NO inhibition, rather than assigning NADH yield to every pair.
  const chainSupply = fluxCI + fluxCII;
  const mixedPo = chainSupply > 0 ? (fluxCI * 2.5 + fluxCII * 1.5) / chainSupply : 0;
  // ADP / geometry multipliers remain unfitted: this is not a measured rate.
  const atpFlux = fluxCIV * mixedPo * (1 - i.uncoupling) * (0.5 + 0.5 * adpDrive) * ge.atpEfficiency * qc.atp;

  // --- Superoxide: site-resolved production (Brand 2016; Quinlan et al. 2013) ---
  // Leak rises steeply with deltaPsi (reduced CoQ pool), damped by uncoupling.
  const leakPsi = Math.exp((psi - 150) / 22) * (1 - 0.6 * i.uncoupling) * pr.heatLeak * qc.leak;
  const o2Term = i.oxygen / (i.oxygen + 10);
  // Complex I site IF: reduced FMN, set by NADH/NAD+ ratio (squared, two-electron flavin).
  const vIF = 0.0055 * fluxCI * i.nadhRatio ** 2 * leakPsi * o2Term * pr.flavinLeak * ge.leak;
  // Complex I site IQ, reverse electron transport: needs succinate-reduced CoQ and high deltaPsi.
  const retDrive = 1 / (1 + Math.exp(-(i.succinate - 0.9) / 0.15));
  const vIQ = 0.012 * fluxCII * retDrive * Math.exp((psi - 160) / 10) * (1 - 0.8 * i.uncoupling) * o2Term;
  // Complex III site IIIQo: unstable semiquinone, backpressure from high deltaPsi; half to IMS.
  const vIIIQo = 0.003 * (fluxCI + fluxCII) * psiBrake * leakPsi * o2Term * pr.semiquinoneLeak * ge.leak;
  // Complex II site IIF: flavin, highest at low succinate occupancy.
  const vIIF = 0.0015 * fluxCII * (1 - i.succinate / (i.succinate + 0.3)) * o2Term;
  // 2-oxoglutarate dehydrogenase (DLD flavin), NADH driven; ~40% leaves as O2•-, 60% as H2O2.
  const vOGDHtotal = 0.0012 * fluxCI * i.nadhRatio ** 2 * o2Term * pr.flavinLeak;
  const vOGDH = 0.4 * vOGDHtotal;
  // ROS-induced ROS release (Zorov 2014): weak thiol defenses let oxidized
  // Complex I/III leak more. Model tuning exponent; 1x capacity = no change.
  // Strength is user-tunable (rirrStrength, default 1.0 fitted to Melov 1999 Sod2-null brain aconitase 24-33% of control); legacy states lack it and keep 0.5.
  const redoxFb = i.antioxidantCapacity ** -(i.rirrStrength ?? 0.5);
  const vMatrixO2 = redoxFb * (vIF + vIQ + 0.5 * vIIIQo + vIIF + vOGDH);
  const vImsO2 = redoxFb * 0.5 * vIIIQo;

  // Matrix sinks: SOD2 (2.3e9 M-1 s-1 x 10 µM), NO (1e10 M-1 s-1), aconitase [4Fe-4S] (1e7 M-1 s-1 x ~6 µM).
  // SOD_AC_EXP: how strongly antioxidant capacity scales SOD clearance. Model tuning
  // choice (no tissue-general published value); 1x capacity is unaffected by it.
  const SOD_AC_EXP = 1.0;
  const kSod = 1e4 * i.antioxidantCapacity ** SOD_AC_EXP; // s-1
  const kNoO2 = 1e4 * (noEff / 1000); // s-1
  const kAconSink = 10 * 6; // s-1
  const superoxideM = vMatrixO2 / (kSod + kNoO2 + kAconSink); // µM
  // IMS sinks: SOD1 and cytochrome c reoxidation.
  const kSod1 = 5e3 * i.antioxidantCapacity ** SOD_AC_EXP;
  const superoxideIMS = vImsO2 / (kSod1 + 2e3 + kNoO2);

  // --- H2O2: sources and reduced-Prx3-dependent clearance ---
  const vDismutation = 0.5 * kSod * superoxideM + 0.25 * kSod1 * superoxideIMS; // 2 O2•- -> H2O2
  const vOGDHh2o2 = 0.6 * vOGDHtotal;
  const vH2O2Photo = pr.h2o2Direct * o2Term; // flavin photosensitization
  const vH2O2 = vDismutation + vOGDHh2o2 + vH2O2Photo;
  const ac = i.antioxidantCapacity;
  // Cox et al. Biochemistry 2009, doi:10.1021/bi900558g measured
  // k(Prx3 + H2O2) = 2e7 M-1 s-1 in purified human protein.
  // Active reduced Prx3 (0.075 µM here) is an unfitted accessible-pool
  // assumption, NOT a measured whole-matrix Prx3 concentration.
  // 2e7 M-1 s-1 * 1e-6 M/µM * 0.075 µM = 1.5 s-1.
  const prx3SecondOrder = 2e7 * 1e-6; // µM-1 s-1
  const prx3Accessible = 0.075 * ac; // µM, effective reduced pool (assumed)
  const prxVmax = 3 * ac; // µM/s, assumed recycling cap from TrxR2 / NADPH
  const prxKm = 2; // µM, effective cap transition (assumed)
  const hyper = (h: number) => 1 / (1 + (h / 5) ** 2); // Prx3 hyperoxidation above ~5 µM
  const kGpx1 = 0.3 * ac;
  const kCat = 0.02;
  const kEfflux = 0.3; // diffusion to cytosol
  // GPx4 also reduces H2O2 weakly (it is primarily a lipid peroxidase),
  // so the GPx4 slider modulates matrix H2O2 and thereby Fe-S attack.
  const kGpx4h2o2 = 0.2 * i.gpx4;
  const prx3Removal = (h: number) => Math.min(prx3SecondOrder * prx3Accessible * h, prxVmax * h / (prxKm + h)) * hyper(h);
  const h2o2Removal = (h: number) => prx3Removal(h) + (kGpx1 + kGpx4h2o2 + kCat + kEfflux) * h;
  const h2o2 = solveSteady((h) => vH2O2 - h2o2Removal(h));
  const prxReduced = hyper(h2o2) * (1 - h2o2 / (prxKm + h2o2) * 0.5);


  // --- Peroxynitrite: formation and competing sinks (Radi 2013) ---
  const vPN = kNoO2 * superoxideM; // µM s-1
  const kPnCO2 = 0.046 * 1300; // 4.6e4 M-1 s-1 x 1.3 mM CO2
  const kPnPrx = 300 * ac * prxReduced;
  const kPnGpx = 10 * ac;
  const kPnThiol = 30;
  const kPnHomolysis = 0.9; // ONOOH isomerization / homolysis
  const kPnTotal = kPnCO2 + kPnPrx + kPnGpx + kPnThiol + kPnHomolysis;
  const onooM = vPN / kPnTotal; // µM
  const peroxynitrite = onooM * 1e3; // nM

  // Fe-S cluster attack and labile iron feedback.
  // Superoxide term: effective rate for attack on aconitase (Flint 1993,
  // ~1e7 M-1 s-1), strengthened 3.5x so light-driven superoxide visibly
  // erodes clusters at photobiomodulation doses.
  // H2O2 term: measured attack on dehydratase [4Fe-4S] clusters is
  // ~5e3 M-1 s-1 (Jang & Imlay 2007); scaled up here as an effective rate
  // for the wider cluster pool so antioxidant capacity (Prx3, GPx1, GPx4)
  // modulates cluster loss.
  // Peroxynitrite term: ONOO- oxidizes and inactivates aconitase [4Fe-4S]
  // with k ~1e5 M-1 s-1 (Castro 1994, Hausladen & Fridovich 1994); used
  // here as an effective rate on the cluster pool so NO availability
  // modulates cluster loss through the ONOO- branch. All terms unfitted;
  // shapes follow Imlay 2003 and Radi 2013.
  const kAcon = 3.5e7 * 1e-6; // µM-1 s-1 effective
  const kH2o2Fes = 1e4 * 1e-6; // µM-1 s-1 effective, H2O2-specific
  const kOnooFes = 1e7 * 1e-6; // µM-1 s-1 effective, ONOO- specific (scaled up: model ONOO- steady state is nM-scale)
  const clusterAttack = kAcon * superoxideM + kH2o2Fes * h2o2 + kOnooFes * onooM; // s-1
  // Three cluster states. Cluster conversion chemistry cited from:
  //   Holm & Lo 2016, Chem Rev, doi:10.1021/acs.chemrev.6b00276
  //     ([4Fe-4S] <-> [3Fe-4S] conversion, single Fe loss and re-insertion)
  //   Beinert, Holm & Munck 1997, Science, doi:10.1126/science.277.5326.653
  //     (cluster types, aconitase [3Fe-4S] inactive form)
  // Rates from Flint 1993, Gardner & Fridovich 1992, Gardner 1995:
  // superoxide and ONOO- oxidize [4Fe-4S] to [3Fe-4S]+, releasing ONE Fe;
  // the 3Fe cluster is reactivated fast (~1 min t1/2, rounded assumption)
  // or degraded further by H2O2 to apo (all 4 Fe lost), rebuilt slowly by ISC.
  const kRepair = 5e-3 * (1 + 0.5 * adpDrive); // apo -> [4Fe-4S], ISCU/NFS1/frataxin
  // Reactivation needs Fe2+ and a reductant (Holm & Lo 2016; Beinert 1997):
  // scale with labile iron and antioxidant (GSH/ascorbate) supply, both
  // normalized so the healthy defaults keep the ~1 min rate. Assumed shape.
  const reactSupply = Math.max(0.1, Math.sqrt((i.labileIron / 2) * i.antioxidantCapacity));
  const kReact = 1.2e-2 * reactSupply; // [3Fe-4S] -> [4Fe-4S], fast reactivation
  const a3 = kAcon * superoxideM + kOnooFes * onooM; // [4Fe-4S] -> [3Fe-4S] + 1 Fe
  const aApo = kH2o2Fes * h2o2; // [4Fe-4S] -> apo + 4 Fe
  const d3 = kH2o2Fes * h2o2; // [3Fe-4S] -> apo + 3 Fe
  const t3PerI = a3 / (kReact + d3);
  const apoPerI = (aApo + d3 * t3PerI) / kRepair;
  const fesIntact = 1 / (1 + t3PerI + apoPerI);
  const fes3Fe = fesIntact * t3PerI;
  const fesApo = fesIntact * apoPerI;
  void clusterAttack;
  // Separate pools (Beinert, Holm & Munck 1997): aconitase's cluster is
  // solvent-exposed with a free Fe site; respiratory-chain clusters are
  // buried in protein. Relative exposure factors are ASSUMED, not fitted;
  // aconitase uses factor 1 so the shared readouts above stay unchanged.
  const pool = (exposure: number) => {
    const t = (a3 * exposure) / (kReact + d3 * exposure);
    const apo = (aApo * exposure + d3 * exposure * t) / kRepair;
    const intact = 1 / (1 + t + apo);
    return { intact, threeFe: intact * t, apo: intact * apo };
  };
  const fesPools = {
    aconitase: { intact: fesIntact, threeFe: fes3Fe, apo: fesApo },
    complexI: pool(0.15),
    complexII: pool(0.3),
    complexIII: pool(0.05),
  };
  // ~6 µM cluster protein: 1 Fe freed per 3Fe cluster, 4 Fe per apo protein
  const ironFromClusters = 6 * (fes3Fe + 4 * fesApo);
  const freeIron = i.labileIron * qc.iron + ironFromClusters;


  // --- Hydroxyl radical: Fenton, Haber-Weiss recycling, ONOOH homolysis ---
  const kFeRed = 0.5 * ac + 1 * superoxideM * 1e3; // ascorbate/GSH + O2•- reduction of Fe3+
  const kFeOx = 0.05 * (i.oxygen / 30);
  const kFenton = 1e-3; // µM-1 s-1 (1e3 M-1 s-1)
  const fe2Fraction = kFeRed / (kFeRed + kFeOx + kFenton * h2o2);
  const vFenton = kFenton * freeIron * fe2Fraction * h2o2;
  const vOHfromPN = 0.3 * kPnHomolysis * onooM;
  const vOH = vFenton + vOHfromPN;
  const hydroxyl = vOH / 1e9; // µM, quenched within ~1 ns diffusion radius

  const rosBudget: RosBudget = {
    superoxideSources: { "CI IF": vIF, "CI IQ (RET)": vIQ, "CIII Qo": vIIIQo, "CII IIF": vIIF, OGDH: vOGDH },
    superoxideSinks: {
      SOD2: kSod * superoxideM,
      "NO (to ONOO-)": kNoO2 * superoxideM,
      "Aconitase Fe-S": kAconSink * superoxideM,
    },
    superoxideIMS: superoxideIMS * 1e3,
    h2o2Sources: { Dismutation: vDismutation, OGDH: vOGDHh2o2, "Flavin photo": vH2O2Photo },
    h2o2Sinks: {
      Prx3: prx3Removal(h2o2),
      GPx1: kGpx1 * h2o2,
      Catalase: kCat * h2o2,
      Efflux: kEfflux * h2o2,
    },
    prxHyperoxidized: 1 - hyper(h2o2),
    peroxynitriteSinks: {
      CO2: kPnCO2 * onooM,
      Prx3: kPnPrx * onooM,
      GPx: kPnGpx * onooM,
      Thiols: kPnThiol * onooM,
      Homolysis: kPnHomolysis * onooM,
    },
    hydroxylSources: { Fenton: vFenton, "ONOOH homolysis": vOHfromPN },
    fe2Fraction,
  };

  // Singlet oxygen: photosensitized (porphyrin/flavin) plus O2•- recombination.
  const singlet =
    (pr.singletDirect * o2Term + 6 * superoxideM) * (1 / i.antioxidantCapacity);

  // Lipid peroxyl radicals / cardiolipin chain propagation.
  const lipidPeroxyl = (LOO_CAL * (40 * hydroxyl * 1e6 + 0.15 * peroxynitrite)) / i.antioxidantCapacity;

  // --- Ferroptosis: PLOOH balance with GPx4 / FSP1 removal ---
  const pufa = i.cardiolipinPufa;
  const vInit = pufa * 2500 * lipidPeroxyl; // nM s-1, LOO• chain initiation (lumped)
  const kGpx4 = 0.05 * i.gpx4 * Math.sqrt(i.antioxidantCapacity); // needs GSH
  const kFsp1 = 0.03 * i.fsp1;
  const kBasal = 0.01; // vitamin E, other scavengers
  const kRemove = kGpx4 + kFsp1 + kBasal;
  const kProp = 0.004 * freeIron * pufa; // Fe2+-driven autocatalysis, s-1
  const propagationRatio = kProp / kRemove;
  const plooh = vInit / Math.max(kRemove - kProp, 0.02 * kRemove);
  const cardiolipinOx = (100 * plooh * pufa) / (plooh * pufa + 400);
  const ferroptosisRisk = Math.min(100, 100 * Math.max(propagationRatio / 0.8, cardiolipinOx / 30));
  const ferroptosisState: FerroptosisState =
    propagationRatio >= 0.8 || cardiolipinOx >= 30
      ? "Committed"
      : propagationRatio >= 0.4 || cardiolipinOx >= 10
        ? "Primed"
        : "Protected";

  // --- 71 THz output band: Frohlich-type pumped coherent mode ---
  const pumpMetabolic = (fluxCIV / 60) * (psi / 160);
  const pump = pumpMetabolic + pr.photonPump;
  const lossBase = 0.4;
  const lossLipid = Math.min(0.5, lipidPeroxyl / 100);
  const lossCardiolipin = cardiolipinOx / 60;
  const lossHeat = 0.05 * pr.tempRise;
  const loss = lossBase + lossLipid + lossCardiolipin + lossHeat;
  const pumpRatio = pump / loss;
  const coherentFraction = 1 / (1 + Math.exp(-(pumpRatio - 1) / 0.12));
  const emission71THz = Math.max(0, THZ_CAL * pump * (0.3 + 0.7 * coherentFraction));
  const coherence: Coherence = {
    pumpMetabolic, pumpPhoton: pr.photonPump, lossBase, lossLipid, lossCardiolipin, lossHeat, pumpRatio, coherentFraction,
  };

  const emissionSpectrum = Array.from({ length: 61 }, (_, k) => {
    const freqTHz = 60 + k * 0.5; // 60-90 THz window
    const peak = (f: number, centre: number, width: number, amp: number) =>
      amp * Math.exp(-((f - centre) ** 2) / (2 * width ** 2));
    return {
      freqTHz,
      intensity:
        peak(freqTHz, 71, 0.9, emission71THz) + // primary reporter band
        peak(freqTHz, 75.5, 1.6, emission71THz * 0.35) + // shoulder
        peak(freqTHz, 65, 2.2, emission71THz * 0.2 + lipidPeroxyl * 0.05) + // oxidation band
        1.5,
    };
  });

  const redoxStress = Math.min(
    100,
    superoxideM * 1e3 * 8 + h2o2 * 1e3 * 0.4 + peroxynitrite * 2 + (1 - fesIntact) * 60,
  );

  return {
    fluxCI,
    fluxCII,
    fluxCIV,
    atpFlux,
    photonGain,
    superoxide: superoxideM * 1e3,
    hydrogenPeroxide: h2o2 * 1e3,
    hydroxylRadical: hydroxyl * 1e6,
    peroxynitrite,
    singletOxygen: singlet * 1e3,
    lipidPeroxyl,
    fesIntact,
    fes3Fe,
    fesApo,
    fesPools,
    aconitaseActivity: fesIntact * 100,
    freeIron,
    emission71THz,
    emissionSpectrum,
    coherentFraction,
    coherence,
    tempRise: pr.tempRise,
    noReleased: pr.noReleased * 100,
    photoreceptor: pr,
    redoxStress,
    plooh,
    cardiolipinOx,
    ferroptosisRisk,
    ferroptosisState,
    ploohRemoval: { gpx4: kGpx4, fsp1: kFsp1, basal: kBasal },
    propagationRatio,
    rosBudget,
  };
}
