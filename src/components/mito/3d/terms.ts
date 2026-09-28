import type { PartId } from "./info";

// Which Pathway map terms each clickable 3D part feeds. Kept free of three.js so SSR can import it.
export const PART_TERMS: Partial<Record<PartId, string[]>> = {
  ci: ["etc", "onoo"],
  cii: ["etc"],
  ciii: ["etc", "h2o2"],
  civ: ["light", "onoo"],
  q: ["etc"],
  cytc: ["etc"],
  ros: ["etc", "h2o2", "onoo", "oh"],
  photon: ["light", "etc"],
  fes: ["fes", "fe", "oh"],
  tca: ["fes", "fe"],
  inner: ["lipid", "ferro"],
  crista: ["lipid", "ferro"],
};

export const termsFor = (id: PartId | null): string[] => (id ? (PART_TERMS[id] ?? []) : []);

/** Tornado driver key to the 3D part it acts on most directly (teaching shortcut, not derived from the math). */
export const DRIVER_PART: Record<string, PartId> = {
  nadhRatio: "ci", succinate: "cii", oxygen: "civ", labileIron: "fes", nitricOxide: "civ",
  redDose: "photon", nirDose: "photon", irradiance: "photon", tissueDepth: "photon",
  gpx4: "inner", fsp1: "q", cardiolipinPufa: "crista", deltaPsi: "crista", uncoupling: "inner",
};
