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
