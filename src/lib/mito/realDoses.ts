import { therapies } from "./treatment";

// Numeric real-world dose anchors taken from each therapy's clinicalDose text.
// The doses are published; the mapping onto the model is assumed:
// top of the published range = 1x model dose, linear, capped at 2x.
export type RealDose = { id: string; drug: string; min: number; max: number; unit: string; step: number };

export const realDoses: RealDose[] = [
  { id: "antioxidant", drug: "MitoQ", min: 20, max: 40, unit: "mg/day", step: 5 },
  { id: "chelation", drug: "Deferiprone", min: 75, max: 100, unit: "mg/kg/day", step: 5 },
  { id: "ferroptosis", drug: "CoQ10", min: 100, max: 300, unit: "mg/day", step: 10 },
  { id: "complex2", drug: "Riboflavin", min: 100, max: 400, unit: "mg/day", step: 10 },
  { id: "nad", drug: "Nicotinamide riboside", min: 300, max: 1000, unit: "mg/day", step: 50 },
  { id: "pyruvate", drug: "DCA", min: 12.5, max: 25, unit: "mg/kg/day", step: 2.5 },
  { id: "pbm", drug: "660/810 nm light", min: 1, max: 10, unit: "J/cm2", step: 0.5 },
  { id: "dfo", drug: "Deferoxamine", min: 20, max: 40, unit: "mg/kg/day", step: 5 },
  { id: "deferasirox", drug: "Deferasirox", min: 20, max: 40, unit: "mg/kg/day", step: 5 },
  { id: "mitoAntiox", drug: "MitoQ", min: 20, max: 40, unit: "mg/day", step: 5 },
  { id: "nac", drug: "NAC", min: 600, max: 1800, unit: "mg/day", step: 100 },
  { id: "selenium", drug: "Selenium", min: 100, max: 200, unit: "micrograms/day", step: 10 },
  { id: "rta", drug: "Vitamin E", min: 400, max: 400, unit: "IU/day", step: 50 },
  { id: "coq", drug: "CoQ10", min: 100, max: 300, unit: "mg/day", step: 10 },
  { id: "cardiolipin", drug: "Elamipretide", min: 40, max: 40, unit: "mg/day", step: 5 },
  { id: "mb", drug: "Methylene blue", min: 1, max: 2, unit: "mg/kg", step: 0.25 },
  { id: "copper", drug: "Copper", min: 1, max: 2, unit: "mg/day", step: 0.25 },
].filter((r) => therapies.some((t) => t.id === r.id));

export const realDoseFor = (id: string) => realDoses.find((r) => r.id === id);

export function realDoseToModel(r: RealDose, dose: number) {
  return Math.min(2, Math.max(0, dose / r.max));
}
