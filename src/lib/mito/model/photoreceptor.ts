import type { Inputs } from "./types";

// ---------- Photoreceptor model ----------
// Relative absorption per J/cm2 at the mitochondrion, by chromophore and wavelength.
export const chromophores = {
  cuA: { label: "CuA", red: 0.4, nir: 1.0 },
  hemeA: { label: "Heme a/a3", red: 1.0, nir: 0.3 },
  flavin: { label: "Flavins (FMN)", red: 0.25, nir: 0.02 },
  porphyrin: { label: "Porphyrins", red: 0.3, nir: 0.03 },
} as const;
export type ChromophoreKey = keyof typeof chromophores;
const MU_EFF = { red: 0.35, nir: 0.2 }; // mm-1
const I_SAT = 120; // mW/cm2, half-saturation of photon use

export type Photoreceptor = {
  fluence: { red: number; nir: number }; // J/cm2 reaching the mitochondria
  exposureTime: number; // s, longest of the two exposures
  absorbed: Record<ChromophoreKey, number>; // effective absorbed dose, rel
  saturation: number; // 0-1 share of photons wasted by saturation
  noReleased: number; // fraction of CIV-bound NO released
  civGain: number; // net fractional CIV rate gain
  civActivation: number; // gain before photoinhibition and heat
  photoinhibition: number; // multiplier <= 1
  psiShift: number; // mV local rise from CIV activation
  flavinLeak: number; // CI IF / OGDH superoxide multiplier
  semiquinoneLeak: number; // CIII Qo superoxide multiplier
  heatLeak: number; // leak multiplier from heating
  tempRise: number; // K
  h2o2Direct: number; // µM/s flavin-photosensitized H2O2 (before O2 term)
  singletDirect: number; // porphyrin-sensitized 1O2 source, rel
  photonPump: number; // share of absorbed energy feeding the 71 THz mode
};

export function photoreceptor(i: Inputs): Photoreceptor {
  const depth = i.tissueDepth ?? 0;
  const I0 = i.irradiance ?? 50;
  const att = { red: Math.exp(-MU_EFF.red * depth), nir: Math.exp(-MU_EFF.nir * depth) };
  const fluence = { red: i.redDose * att.red, nir: i.nirDose * att.nir };
  const exposureTime = Math.max(i.redDose, i.nirDose) > 0 ? (1000 * Math.max(i.redDose, i.nirDose)) / I0 : 0;
  const irrAt = { red: i.redDose > 0 ? I0 * att.red : 0, nir: i.nirDose > 0 ? I0 * att.nir : 0 };

  const absorbed = {} as Record<ChromophoreKey, number>;
  let wasted = 0;
  let total = 0;
  for (const k of Object.keys(chromophores) as ChromophoreKey[]) {
    const c = chromophores[k];
    const rate = c.red * irrAt.red + c.nir * irrAt.nir; // excitation rate, rel
    const sat = 1 / (1 + rate / I_SAT); // excited-state saturation
    const raw = c.red * fluence.red + c.nir * fluence.nir;
    absorbed[k] = raw * sat;
    wasted += raw * (1 - sat);
    total += raw;
  }
  const saturation = total > 0 ? wasted / total : 0;

  const ccoAbs = absorbed.cuA + absorbed.hemeA;
  const noReleased = 0.6 * (1 - Math.exp(-(0.6 * absorbed.hemeA + 0.5 * absorbed.cuA) / 8));
  const civActivation = 0.4 * (1 - Math.exp(-(absorbed.cuA + 0.6 * absorbed.hemeA) / 9));
  const photoinhibition = Math.exp(-ccoAbs / 90);
  const tempRise = 0.02 * (irrAt.red + irrAt.nir) * (1 - Math.exp(-exposureTime / 120));
  const heatLeak = 1 + 0.25 * Math.max(0, tempRise - 1);
  const civGain = Math.max(-0.5, civActivation * photoinhibition - 0.04 * Math.max(0, tempRise - 1));
  const psiShift = 20 * civGain; // mV, CIV activation pumps more protons
  const flavinLeak = 1 + 0.5 * (1 - Math.exp(-absorbed.flavin / 3));
  const semiquinoneLeak = 1 + (0.9 * ccoAbs ** 2) / (ccoAbs ** 2 + 40 ** 2);
  const h2o2Direct = 8e-4 * absorbed.flavin;
  const singletDirect = 0.07 * absorbed.porphyrin;
  const photonPump = 0.15 * (1 - Math.exp(-ccoAbs / 20));
  return {
    fluence, exposureTime, absorbed, saturation, noReleased, civGain, civActivation, photoinhibition,
    psiShift, flavinLeak, semiquinoneLeak, heatLeak, tempRise, h2o2Direct, singletDirect, photonPump,
  };
}
