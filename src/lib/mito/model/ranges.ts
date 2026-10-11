import type { Inputs } from "./types";


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
  irradiance: { min: 1, max: 200, label: "Irradiance", unit: "mW/cm2" },
  tissueDepth: { min: 0, max: 20, label: "Tissue depth", unit: "mm" },
  antioxidantCapacity: { min: 0.2, max: 2, label: "Antioxidant capacity", unit: "rel" },
  uncoupling: { min: 0, max: 1, label: "Uncoupling", unit: "fraction" },
  gpx4: { min: 0, max: 2, label: "GPx4 activity", unit: "rel" },
  fsp1: { min: 0, max: 2, label: "FSP1 / CoQ10H2 capacity", unit: "rel" },
  cardiolipinPufa: { min: 0.2, max: 1, label: "Cardiolipin PUFA fraction", unit: "fraction" },
  mitoHalfLife: { min: 2, max: 60, label: "Mitochondrial turnover half-life", unit: "days" },
  fesExposureCI: { min: 0, max: 1, label: "Complex I cluster exposure (assumed)", unit: "x aconitase" },
  fesExposureCII: { min: 0, max: 1, label: "Complex II cluster exposure (assumed)", unit: "x aconitase" },
  fesExposureCIII: { min: 0, max: 1, label: "Complex III cluster exposure (assumed)", unit: "x aconitase" },
  rirrStrength: { min: 0, max: 1.5, label: "ROS-induced ROS release strength", unit: "exponent" },
};
