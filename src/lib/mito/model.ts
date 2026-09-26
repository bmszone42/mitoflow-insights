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
};

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
};

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

// NO photodissociation from the CIV binuclear centre releases inhibition.
function noAfterPhotolysis(no: number, redDose: number, nirDose: number) {
  const released = 1 - 0.55 * (1 - Math.exp(-(redDose + nirDose) / 12));
  return no * released;
}

export function simulate(i: Inputs): Outputs {
  const photonGain = photonResponse(i.redDose, i.nirDose);
  const noEff = noAfterPhotolysis(i.nitricOxide, i.redDose, i.nirDose);

  // --- Electron transport (lumped Michaelis-Menten with backpressure) ---
  const psiBrake = 1 / (1 + Math.exp((i.deltaPsi - 175) / 12)); // Q-cycle reverse pressure
  const adpDrive = i.adp / (i.adp + 40); // ANT/ATP synthase control
  const o2Sat = i.oxygen / (i.oxygen + 0.8); // CIV Km ~ 0.5-1 µM O2
  const noInhib = 1 / (1 + noEff / 120); // competitive NO inhibition of CIV

  const vmaxCI = 55;
  const fluxCI = vmaxCI * i.nadhRatio * (0.35 + 0.65 * adpDrive);
  const fluxCII = 30 * (i.succinate / (i.succinate + 0.5));
  const fluxCIV =
    Math.min(fluxCI + fluxCII, 80) * o2Sat * noInhib * photonGain * (0.4 + 0.6 * adpDrive);
  const atpFlux = fluxCIV * 2.4 * (1 - i.uncoupling) * (0.5 + 0.5 * adpDrive);

  // --- Superoxide generation: site IQ / IF of CI, Qo of CIII ---
  // Leak fraction rises steeply with deltaPsi and with reduced CoQ pool.
  const leakPsi = Math.exp((i.deltaPsi - 150) / 22) * (1 - 0.6 * i.uncoupling);
  const leakCI = 0.004 * fluxCI * i.nadhRatio * leakPsi;
  const res = i.succinate > 1.0 ? 1 + 1.8 * (i.succinate - 1.0) : 1; // reverse electron transport
  const leakCIII = 0.003 * (fluxCI + fluxCII) * psiBrake * leakPsi;
  const o2Term = i.oxygen / (i.oxygen + 10);
  const vO2minus = (leakCI * res + leakCIII) * o2Term;

  // --- Dismutation and downstream ROS ---
  const kSod = 1e4 * i.antioxidantCapacity ** 0.3; // s-1 pseudo-first-order
  const superoxideM = vO2minus / kSod; // µM steady state
  const kPrx = 1.2 * i.antioxidantCapacity; // s-1 effective H2O2 removal
  const h2o2 = (0.9 * kSod * superoxideM) / (kPrx + 1e-6);

  // Fenton chemistry with the labile iron pool (feedback from cluster loss).
  const kAcon = 1e7 * 1e-6; // µM-1 s-1
  const clusterAttack = kAcon * superoxideM; // s-1
  const kRepair = 5e-3 * (1 + 0.5 * adpDrive); // ISC assembly (ISCU/NFS1/frataxin)
  const fesIntact = kRepair / (kRepair + clusterAttack);
  const ironFromClusters = 4 * 6 * (1 - fesIntact); // ~6 µM cluster protein x 4 Fe
  const freeIron = i.labileIron + ironFromClusters;

  const kFenton = 1e-3; // µM-1 s-1 (1e3 M-1 s-1)
  const vOH = kFenton * freeIron * h2o2;
  const hydroxyl = vOH / 1e9; // µM, quenched within ~1 ns diffusion radius

  const kPN = 1e4; // µM-1 s-1 (1e10 M-1 s-1)
  const peroxynitrite = (kPN * superoxideM * (noEff / 1000)) / 0.5;

  // Singlet oxygen: photosensitized (porphyrin/flavin) plus O2•- recombination.
  const singlet =
    (0.02 * (i.redDose + 0.4 * i.nirDose) * o2Term + 6 * superoxideM) * (1 / i.antioxidantCapacity);

  // Lipid peroxyl radicals / cardiolipin chain propagation.
  const lipidPeroxyl = (40 * hydroxyl * 1e6 + 0.15 * peroxynitrite) / i.antioxidantCapacity;

  // --- 71 THz output band ---
  // Emission tracks coherent turnover: CIV flux, proton gradient and
  // ordered interfacial water. Peroxidation of cardiolipin dampens it.
  const coherence = (fluxCIV / 60) * (i.deltaPsi / 160) * (1 - Math.min(0.6, lipidPeroxyl / 200));
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
      superoxide: Number(out.superoxide.toFixed(2)),
      emission: Number(out.emission71THz.toFixed(1)),
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
];
export type SensOutputKey =
  | "superoxide" | "hydrogenPeroxide" | "hydroxylRadical" | "peroxynitrite"
  | "lipidPeroxyl" | "fesIntact" | "aconitaseActivity" | "freeIron";
export const sensOutputs: { key: SensOutputKey; label: string }[] = [
  { key: "superoxide", label: "O2•-" },
  { key: "hydrogenPeroxide", label: "H2O2" },
  { key: "hydroxylRadical", label: "•OH" },
  { key: "peroxynitrite", label: "ONOO-" },
  { key: "lipidPeroxyl", label: "LOO•" },
  { key: "fesIntact", label: "Fe-S intact" },
  { key: "aconitaseActivity", label: "Aconitase" },
  { key: "freeIron", label: "Free Fe2+" },
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
};
