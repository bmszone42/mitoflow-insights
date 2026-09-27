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
 *  - Mid-IR emission near 71 THz (≈4.22 µm, 2370 cm-1) tracked as a
 *    flux-proportional reporter band (Pokorny; Sahu et al. 2013 ordering
 *    in microtubule/mitochondrial water layers). Treated as a relative
 *    observable, not an absolute radiometric prediction.
 */

export type Inputs = {
  nadhRatio: number; // NADH/(NADH+NAD+), 0-1
  succinate: number; // relative Complex II drive, 0-2
  oxygen: number; // µM O2
  deltaPsi: number; // mV, proton-motive force proxy
  adp: number; // µM ADP (state 3 vs state 4 control)
  labileIron: number; // µM cytosolic/matrix labile Fe2+ pool
  nitricOxide: number; // nM NO
  redDose: number; // J/cm2 at 660 nm
  nirDose: number; // J/cm2 at 810 nm
  antioxidantCapacity: number; // 0-2 scaling of Prx3/GPx/GSH system
  uncoupling: number; // 0-1 UCP/mild uncoupler
  gpx4: number; // 0-2 relative GPx4 activity (0 = RSL3/ML162 inhibited)
  fsp1: number; // 0-2 relative FSP1/CoQ10H2 capacity
  cardiolipinPufa: number; // 0.2-1 fraction of PUFA acyl chains (ACSL4-driven)
};

export const defaultInputs: Inputs = {
  nadhRatio: 0.55,
  succinate: 0.6,
  oxygen: 30,
  deltaPsi: 160,
  adp: 120,
  labileIron: 2,
  nitricOxide: 40,
  redDose: 0,
  nirDose: 0,
  antioxidantCapacity: 1,
  uncoupling: 0.05,
  gpx4: 1,
  fsp1: 1,
  cardiolipinPufa: 0.6,
};

export type FerroptosisState = "Protected" | "Primed" | "Committed";

export type Outputs = {
  fluxCI: number;
  fluxCII: number;
  fluxCIV: number;
  atpFlux: number;
  photonGain: number;
  superoxide: number; // nM steady state
  hydrogenPeroxide: number; // nM
  hydroxylRadical: number; // pM
  peroxynitrite: number; // nM
  singletOxygen: number; // pM (relative)
  lipidPeroxyl: number; // nM
  fesIntact: number; // fraction of [4Fe-4S] clusters intact
  aconitaseActivity: number; // %
  freeIron: number; // µM after cluster loss feedback
  emission71THz: number; // relative units
  emissionSpectrum: { freqTHz: number; intensity: number }[];
  redoxStress: number; // 0-100 composite index
  plooh: number; // nM lumped phospholipid hydroperoxide
  cardiolipinOx: number; // % cardiolipin oxidized
  ferroptosisRisk: number; // 0-100, propagation / removal ratio
  ferroptosisState: FerroptosisState;
  ploohRemoval: { gpx4: number; fsp1: number; basal: number }; // s-1 each
  propagationRatio: number; // Fe-driven propagation / total removal
  rosBudget: RosBudget;
};

// Per-pathway rates (µM/s) for the site-resolved ROS network.
export type RosBudget = {
  superoxideSources: Record<string, number>;
  superoxideSinks: Record<string, number>;
  superoxideIMS: number; // nM, intermembrane space pool
  h2o2Sources: Record<string, number>;
  h2o2Sinks: Record<string, number>;
  prxHyperoxidized: number; // fraction of Prx3 hyperoxidized
  peroxynitriteSinks: Record<string, number>;
  hydroxylSources: Record<string, number>;
  fe2Fraction: number; // Fe2+ share of the labile pool
};

// Keeps lipid peroxyl (and so ferroptosis) on its prior calibration after the ROS rebuild.
const LOO_CAL = 1.15;

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

// Arndt-Schulz biphasic photon response for cytochrome c oxidase.
function photonResponse(redDose: number, nirDose: number) {
  const eff = (dose: number, optimum: number, gainMax: number) => {
    if (dose <= 0) return 0;
    const x = dose / optimum;
    return gainMax * x * Math.exp(1 - x); // peaks at dose = optimum
  };
  // 660 nm: heme a3 / CuA absorption peak, optimum ~ 10 J/cm2
  const red = eff(redDose, 10, 0.28);
  // 810 nm: CuA band, deeper penetration, optimum ~ 20 J/cm2
  const nir = eff(nirDose, 20, 0.22);
  return 1 + red + nir;
}

// Direct (NO-independent) photon effect on superoxide leak: low-dose signaling
// burst plus a saturating high-dose stress term. Returns a multiplier >= 1.
function photonLeak(redDose: number, nirDose: number) {
  const burst = (d: number, opt: number, a: number) => (d <= 0 ? 0 : a * (d / opt) * Math.exp(1 - d / opt));
  const stress = (d: number, half: number, a: number) => (a * d * d) / (d * d + half * half);
  return 1 + burst(redDose, 3, 0.3) + burst(nirDose, 3, 0.35) + stress(redDose, 35, 0.8) + stress(nirDose, 35, 1.0);
}

// NO photodissociation from the CIV binuclear centre releases inhibition.
function noAfterPhotolysis(no: number, redDose: number, nirDose: number) {
  const released = 1 - 0.55 * (1 - Math.exp(-(redDose + nirDose) / 12));
  return no * released;
}

export function simulate(i: Inputs, geo?: Geometry): Outputs {
  const ge = geometryEffects(geo ?? defaultGeometry);
  const psi = i.deltaPsi + ge.psiShift; // cristae junctions trap protons locally
  const photonGain = photonResponse(i.redDose, i.nirDose);
  const noEff = noAfterPhotolysis(i.nitricOxide, i.redDose, i.nirDose);

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
  const atpFlux = fluxCIV * 2.4 * (1 - i.uncoupling) * (0.5 + 0.5 * adpDrive) * ge.atpEfficiency;

  // --- Superoxide: site-resolved production (Brand 2016; Quinlan et al. 2013) ---
  // Leak rises steeply with deltaPsi (reduced CoQ pool), damped by uncoupling.
  const leakPsi = Math.exp((psi - 150) / 22) * (1 - 0.6 * i.uncoupling);
  const o2Term = i.oxygen / (i.oxygen + 10);
  const pLeak = photonLeak(i.redDose, i.nirDose); // flavin / semiquinone photoexcitation
  // Complex I site IF: reduced FMN, set by NADH/NAD+ ratio (squared, two-electron flavin).
  const vIF = 0.0055 * fluxCI * i.nadhRatio ** 2 * leakPsi * o2Term * pLeak * ge.leak;
  // Complex I site IQ, reverse electron transport: needs succinate-reduced CoQ and high deltaPsi.
  const retDrive = 1 / (1 + Math.exp(-(i.succinate - 0.9) / 0.15));
  const vIQ = 0.012 * fluxCII * retDrive * Math.exp((psi - 160) / 10) * (1 - 0.8 * i.uncoupling) * o2Term;
  // Complex III site IIIQo: unstable semiquinone, backpressure from high deltaPsi; half to IMS.
  const vIIIQo = 0.003 * (fluxCI + fluxCII) * psiBrake * leakPsi * o2Term * pLeak * ge.leak;
  // Complex II site IIF: flavin, highest at low succinate occupancy.
  const vIIF = 0.0015 * fluxCII * (1 - i.succinate / (i.succinate + 0.3)) * o2Term;
  // 2-oxoglutarate dehydrogenase (DLD flavin), NADH driven; ~40% leaves as O2•-, 60% as H2O2.
  const vOGDHtotal = 0.0012 * fluxCI * i.nadhRatio ** 2 * o2Term * pLeak;
  const vOGDH = 0.4 * vOGDHtotal;
  const vMatrixO2 = vIF + vIQ + 0.5 * vIIIQo + vIIF + vOGDH;
  const vImsO2 = 0.5 * vIIIQo;

  // Matrix sinks: SOD2 (2.3e9 M-1 s-1 x 10 µM), NO (1e10 M-1 s-1), aconitase [4Fe-4S] (1e7 M-1 s-1 x ~6 µM).
  const kSod = 1e4 * i.antioxidantCapacity ** 0.3; // s-1
  const kNoO2 = 1e4 * (noEff / 1000); // s-1
  const kAconSink = 10 * 6; // s-1
  const superoxideM = vMatrixO2 / (kSod + kNoO2 + kAconSink); // µM
  // IMS sinks: SOD1 and cytochrome c reoxidation.
  const kSod1 = 5e3 * i.antioxidantCapacity ** 0.3;
  const superoxideIMS = vImsO2 / (kSod1 + 2e3 + kNoO2);

  // --- H2O2: sources and saturable Prx3 clearance (Cox et al. 2009, 2010) ---
  const vDismutation = 0.5 * kSod * superoxideM + 0.25 * kSod1 * superoxideIMS; // 2 O2•- -> H2O2
  const vOGDHh2o2 = 0.6 * vOGDHtotal;
  const vH2O2Photo = 2e-4 * (i.redDose + 0.3 * i.nirDose) * o2Term; // flavin photosensitization
  const vH2O2 = vDismutation + vOGDHh2o2 + vH2O2Photo;
  const ac = i.antioxidantCapacity;
  const prxVmax = 3 * ac; // µM s-1, limited by TrxR2 / NADPH recycling
  const prxKm = 2; // µM
  const hyper = (h: number) => 1 / (1 + (h / 5) ** 2); // Prx3 hyperoxidation above ~5 µM
  const kGpx1 = 0.3 * ac;
  const kCat = 0.02;
  const kEfflux = 0.3; // diffusion to cytosol
  const h2o2Removal = (h: number) => (prxVmax * h * hyper(h)) / (prxKm + h) + (kGpx1 + kCat + kEfflux) * h;
  const h2o2 = solveSteady((h) => vH2O2 - h2o2Removal(h));
  const prxReduced = hyper(h2o2) * (1 - h2o2 / (prxKm + h2o2) * 0.5);

  // Fe-S cluster attack and labile iron feedback.
  const kAcon = 1e7 * 1e-6; // µM-1 s-1
  const clusterAttack = kAcon * superoxideM; // s-1
  const kRepair = 5e-3 * (1 + 0.5 * adpDrive); // ISC assembly (ISCU/NFS1/frataxin)
  const fesIntact = kRepair / (kRepair + clusterAttack);
  const ironFromClusters = 4 * 6 * (1 - fesIntact); // ~6 µM cluster protein x 4 Fe
  const freeIron = i.labileIron + ironFromClusters;

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
      Prx3: (prxVmax * h2o2 * hyper(h2o2)) / (prxKm + h2o2),
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
    (0.02 * (i.redDose + 0.4 * i.nirDose) * o2Term + 6 * superoxideM) * (1 / i.antioxidantCapacity);

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

  // --- 71 THz output band ---
  // Emission tracks coherent turnover: CIV flux, proton gradient and
  // ordered interfacial water. Peroxidation of cardiolipin dampens it.
  const coherence = (fluxCIV / 60) * (psi / 160) * (1 - Math.min(0.6, lipidPeroxyl / 200)) * (1 - cardiolipinOx / 200);
  const emission71THz = Math.max(0, coherence * 100);

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
    aconitaseActivity: fesIntact * 100,
    freeIron,
    emission71THz,
    emissionSpectrum,
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

export function doseSweep(base: Inputs, wavelength: "red" | "nir") {
  return Array.from({ length: 25 }, (_, k) => {
    const dose = k * 2.5;
    const out = simulate({
      ...base,
      redDose: wavelength === "red" ? dose : base.redDose,
      nirDose: wavelength === "nir" ? dose : base.nirDose,
    });
    return {
      dose,
      atp: Number(out.atpFlux.toFixed(1)),
      superoxide: Number(out.superoxide.toPrecision(3)),
      emission: Number(out.emission71THz.toFixed(1)),
      // per-species curves, pM-normalized for a shared log axis
      h2o2: Number((out.hydrogenPeroxide * 1e3).toFixed(3)),
      hydroxyl: Number(out.hydroxylRadical.toFixed(4)),
      peroxynitrite: Number((out.peroxynitrite * 1e3).toFixed(3)),
      singletOxygen: Number(out.singletOxygen.toFixed(4)),
      lipidPeroxyl: Number((out.lipidPeroxyl * 1e3).toFixed(3)),
      fesIntact: Number((out.fesIntact * 100).toFixed(2)),
    };
  });
}

// ---------- Sensitivity analysis ----------
// Drivers are perturbed by a fraction of their full slider range (not of the
// baseline), so zero-baseline inputs such as photon dose still register.
export type DriverDef = { key: keyof Inputs; label: string; min: number; max: number; group: string };
export const sensitivityDrivers: DriverDef[] = [
  { key: "nadhRatio", label: "NADH / NAD+", min: 0, max: 1, group: "Electron flux" },
  { key: "succinate", label: "Succinate drive", min: 0, max: 2, group: "Electron flux" },
  { key: "oxygen", label: "Oxygen", min: 0.5, max: 120, group: "Electron flux" },
  { key: "labileIron", label: "Labile iron", min: 0, max: 20, group: "Iron" },
  { key: "redDose", label: "660 nm dose", min: 0, max: 60, group: "Photon" },
  { key: "nirDose", label: "810 nm dose", min: 0, max: 60, group: "Photon" },
  { key: "gpx4", label: "GPx4 activity", min: 0, max: 2, group: "Ferroptosis" },
  { key: "fsp1", label: "FSP1 / CoQ10H2", min: 0, max: 2, group: "Ferroptosis" },
  { key: "cardiolipinPufa", label: "Cardiolipin PUFA", min: 0.2, max: 1, group: "Ferroptosis" },
];
export type SensOutputKey =
  | "superoxide" | "hydrogenPeroxide" | "hydroxylRadical" | "peroxynitrite"
  | "lipidPeroxyl" | "fesIntact" | "aconitaseActivity" | "freeIron"
  | "plooh" | "cardiolipinOx" | "ferroptosisRisk";
export const sensOutputs: { key: SensOutputKey; label: string }[] = [
  { key: "superoxide", label: "O2•-" },
  { key: "hydrogenPeroxide", label: "H2O2" },
  { key: "hydroxylRadical", label: "•OH" },
  { key: "peroxynitrite", label: "ONOO-" },
  { key: "lipidPeroxyl", label: "LOO•" },
  { key: "fesIntact", label: "Fe-S intact" },
  { key: "aconitaseActivity", label: "Aconitase" },
  { key: "freeIron", label: "Free Fe2+" },
  { key: "plooh", label: "PLOOH" },
  { key: "cardiolipinOx", label: "CL ox %" },
  { key: "ferroptosisRisk", label: "Ferroptosis risk" },
];

const pctChange = (v: number, b: number) => (b === 0 ? 0 : ((v - b) / Math.abs(b)) * 100);

/** Percent change of every output when each driver moves down / up by delta * range. */
export function sensitivity(base: Inputs, delta = 0.2) {
  const b = simulate(base);
  return sensitivityDrivers.map((d) => {
    const step = delta * (d.max - d.min);
    const lo = simulate({ ...base, [d.key]: Math.max(d.min, base[d.key] - step) });
    const hi = simulate({ ...base, [d.key]: Math.min(d.max, base[d.key] + step) });
    const down = {} as Record<SensOutputKey, number>;
    const up = {} as Record<SensOutputKey, number>;
    for (const o of sensOutputs) {
      down[o.key] = pctChange(lo[o.key], b[o.key]);
      up[o.key] = pctChange(hi[o.key], b[o.key]);
    }
    return { driver: d, down, up };
  });
}

/** Sweep one driver across its range, returning all sensitivity outputs. */
export function sweep(base: Inputs, key: keyof Inputs, n = 40) {
  const d = sensitivityDrivers.find((x) => x.key === key)!;
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = d.min + ((d.max - d.min) * i) / n;
    const o = simulate({ ...base, [key]: x });
    const row: Record<string, number> = { x };
    for (const s of sensOutputs) row[s.key] = o[s.key];
    return row;
  });
}

/** Two-driver grid: each axis spans the driver's range, each cell runs the full model. */
export function grid2d(base: Inputs, keyX: keyof Inputs, keyY: keyof Inputs, n = 21) {
  const dx = sensitivityDrivers.find((d) => d.key === keyX)!;
  const dy = sensitivityDrivers.find((d) => d.key === keyY)!;
  const xs = Array.from({ length: n }, (_, i) => dx.min + ((dx.max - dx.min) * i) / (n - 1));
  const ys = Array.from({ length: n }, (_, i) => dy.min + ((dy.max - dy.min) * i) / (n - 1));
  const cells = ys.map((y) =>
    xs.map((x) => {
      const o = simulate({ ...base, [keyX]: x, [keyY]: y });
      const row = { x, y } as Record<string, number>;
      for (const s of sensOutputs) row[s.key] = o[s.key];
      return row;
    }),
  );
  return { xs, ys, cells, dx, dy };
}

// Slider ranges for every input: single source for clamping AI suggestions.
export const inputRanges: Record<keyof Inputs, { min: number; max: number; label: string; unit: string }> = {
  nadhRatio: { min: 0, max: 1, label: "NADH / NAD+ pool", unit: "fraction" },
  succinate: { min: 0, max: 2, label: "Succinate drive", unit: "rel" },
  oxygen: { min: 0.5, max: 120, label: "Oxygen", unit: "µM" },
  deltaPsi: { min: 90, max: 210, label: "Membrane potential", unit: "mV" },
  adp: { min: 0, max: 400, label: "ADP", unit: "µM" },
  labileIron: { min: 0, max: 20, label: "Labile iron", unit: "µM" },
  nitricOxide: { min: 0, max: 400, label: "Nitric oxide", unit: "nM" },
  redDose: { min: 0, max: 60, label: "660 nm dose", unit: "J/cm2" },
  nirDose: { min: 0, max: 60, label: "810 nm dose", unit: "J/cm2" },
  antioxidantCapacity: { min: 0.2, max: 2, label: "Antioxidant capacity", unit: "rel" },
  uncoupling: { min: 0, max: 1, label: "Uncoupling", unit: "fraction" },
  gpx4: { min: 0, max: 2, label: "GPx4 activity", unit: "rel" },
  fsp1: { min: 0, max: 2, label: "FSP1 / CoQ10H2 capacity", unit: "rel" },
  cardiolipinPufa: { min: 0.2, max: 1, label: "Cardiolipin PUFA fraction", unit: "fraction" },
};

// Structure view geometry (SVG units, roughly nm-scaled). Source of ranges for the Structure
// sliders and for clamping micrograph-derived AI suggestions.
export type Geometry = {
  swelling: number; // outer-to-inner boundary membrane gap, nm
  cristaeShape: number; // 0 lamellar, 1 tubular
  tipCurvature: number; // 0 flat, 1 tightly curved (ATP synthase dimer rows)
  cristaeCount: number;
  cristaeDepth: number;
  junctionWidth: number;
  matrixWidth: number;
  length: number;
};
export const defaultGeometry: Geometry = {
  swelling: 20,
  cristaeShape: 0.2,
  tipCurvature: 0.6,
  cristaeCount: 9,
  cristaeDepth: 62,
  junctionWidth: 10,
  matrixWidth: 150,
  length: 420,
};
export const geometryRanges: Record<keyof Geometry, { min: number; max: number; step: number; label: string }> = {
  cristaeCount: { min: 2, max: 22, step: 1, label: "Cristae count" },
  cristaeDepth: { min: 20, max: 110, step: 1, label: "Crista depth" },
  junctionWidth: { min: 4, max: 34, step: 1, label: "Junction width" },
  matrixWidth: { min: 110, max: 230, step: 1, label: "Matrix width" },
  length: { min: 240, max: 620, step: 10, label: "Organelle length" },
  swelling: { min: 10, max: 60, step: 1, label: "Outer membrane swelling" },
  cristaeShape: { min: 0, max: 1, step: 0.05, label: "Cristae shape (lamellar to tubular)" },
  tipCurvature: { min: 0, max: 1, step: 0.05, label: "Cristae tip curvature" },
};

/*
 * Geometry to bioenergetics coupling. All multipliers equal 1 at defaultGeometry.
 * Strengths are our own estimates, bounded to ~0.5x-1.8x, shaped after:
 *  - Cogliati et al. 2013 (Cell): cristae shape sets supercomplex assembly and respiratory efficiency.
 *  - Frezza et al. 2006 (Cell): OPA1-dependent tight junctions retain cytochrome c.
 *  - Paumard et al. 2002 (EMBO J): ATP synthase dimers bend cristae tips.
 *  - Strauss et al. 2008 (EMBO J): tip curvature concentrates protons near ATP synthase.
 */
export type GeometryEffects = {
  capacity: number; // Complex I-IV capacity from inner membrane area
  psiShift: number; // mV added to local membrane potential
  cytcRetention: number; // CIV electron supply from cyt c trapped in cristae
  atpEfficiency: number;
  leak: number; // superoxide leak multiplier
  area: number; // relative inner membrane area
};
const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function geometryEffects(g: Geometry): GeometryEffects {
  const d = defaultGeometry;
  const shape = g.cristaeShape ?? d.cristaeShape;
  const curv = g.tipCurvature ?? d.tipCurvature;
  const swell = g.swelling ?? d.swelling;
  const area = ((g.cristaeCount * g.cristaeDepth) / (d.cristaeCount * d.cristaeDepth)) * (1 - 0.25 * (shape - d.cristaeShape));
  const capacity = clampN(Math.sqrt(Math.max(area, 0.01)), 0.5, 1.8);
  const psiShift = clampN(8 * Math.log(d.junctionWidth / g.junctionWidth) + 6 * (curv - d.tipCurvature), -15, 15);
  const cytcRetention = clampN((d.junctionWidth / g.junctionWidth) ** 0.3 * (1 - 0.006 * (swell - d.swelling)), 0.5, 1.3);
  const atpEfficiency = clampN(0.6 + (0.4 / d.tipCurvature) * curv, 0.6, 1.3);
  const leak = clampN(1 + 0.012 * (swell - d.swelling) + 0.3 * (shape - d.cristaeShape), 0.7, 1.8);
  return { capacity, psiShift, cytcRetention, atpEfficiency, leak, area };
}
