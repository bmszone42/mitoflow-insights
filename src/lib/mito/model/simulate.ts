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
import { chainFlux } from "./atp";
import { rosChemistry, hydroxylAndBudget } from "./ros";
import { ironSulfur } from "./fes";



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
  const c = chainFlux(i, ge, pr, qc, psi);
  const { photonGain, adpDrive, fluxCI, fluxCII, fluxCIV, atpFlux } = c;
  const r = rosChemistry(i, ge, pr, qc, psi, c);
  const { o2Term, superoxideM, h2o2, onooM, peroxynitrite } = r;
  const { fesIntact, fes3Fe, fesApo, fesPools, fesReactHalfLifeS, freeIron } = ironSulfur(i, qc, adpDrive, superoxideM, h2o2, onooM);
  const { hydroxyl, rosBudget } = hydroxylAndBudget(i, r, freeIron);

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
  // Fe2+-driven autocatalysis, s-1. Only unbound iron cleaves lipid hydroperoxides;
  // chelator-held iron is excluded (same ligand rule as Fenton in ros.ts, assumed).
  const kProp = 0.004 * freeIron * (1 - (i.chelatorBound ?? 0)) * pufa;
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
    fesReactHalfLifeS,
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
