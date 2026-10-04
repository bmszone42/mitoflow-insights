/*
 * Dose-anchored exploratory levers. The dose range comes from published human
 * trials; the effect size (maxFactor at maxDose, linear from 1x at 0) is an
 * ASSUMPTION, because no trial reports a rate the model can use. Local state
 * only: never enters Inputs, flags, scenarios or Diagnosis.
 */
export type DoseSource = { label: string; url: string };
export type DoseAnchor = {
  id: "oaa" | "urolithinA";
  label: string;
  unit: string;
  maxDose: number;
  step: number;
  maxFactor: number;
  lever: string;
  finding: string;
  sources: DoseSource[];
};

export const doseAnchors: Record<DoseAnchor["id"], DoseAnchor> = {
  oaa: {
    id: "oaa",
    label: "Oxaloacetate (oral)",
    unit: "g/day",
    maxDose: 2,
    step: 0.1,
    maxFactor: 1.15,
    lever: "NADH / NAD+ pool",
    finding: "1 and 2 g/day were safe in Alzheimer's patients; brain energy markers changed only slightly.",
    sources: [
      { label: "Vidoni 2021, Alzheimer's & Dementia 17(1):7-17", url: "https://doi.org/10.1002/alz.12156" },
      { label: "TOAD trial NCT02593318", url: "https://clinicaltrials.gov/study/NCT02593318" },
    ],
  },
  urolithinA: {
    id: "urolithinA",
    label: "Urolithin A (mitophagy activator)",
    unit: "mg/day",
    maxDose: 1000,
    step: 50,
    maxFactor: 1.3,
    lever: "mitophagy rate",
    finding: "500 and 1000 mg/day raised mitochondrial and mitophagy-related markers in muscle.",
    sources: [
      { label: "Andreux 2019, Nature Metabolism 1(6):595-603", url: "https://doi.org/10.1038/s42255-019-0073-4" },
      { label: "Singh 2022, Cell Reports Medicine 3(5):100633", url: "https://doi.org/10.1016/j.xcrm.2022.100633" },
    ],
  },
};

export function doseToFactor(a: DoseAnchor, dose: number) {
  const d = Math.min(a.maxDose, Math.max(0, dose));
  return 1 + (a.maxFactor - 1) * (d / a.maxDose);
}
