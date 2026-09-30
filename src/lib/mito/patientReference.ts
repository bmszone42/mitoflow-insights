import { defaultInputs, simulate, type Inputs, type Outputs } from "./model";
import { poRatio } from "./reference";

export type PatientGroup = "Bioenergetics" | "ROS and redox" | "Iron and Fe-S" | "Clinical labs";
export type PatientMetricKey = "membranePotential" | "poNadh" | "atpLinkedOcr" | "mitosox" | "h2o2" | "lipidPeroxidation" | "aconitase" | "labileIron" | "ferritin" | "transferrinSaturation" | "lactate" | "pyruvate" | "lactatePyruvate" | "glucose";

export type PatientMetric = {
  key: PatientMetricKey; group: PatientGroup; label: string; unit: string; specimen: string; method: string;
  reference?: { lo?: number; hi?: number; label: string };
  sourceCitation: string; sourceUrl: string; note: string; decimals: number;
  modelValue?: (inputs: Inputs, out: Outputs) => number; modelLabel?: string;
};

export type DemoPatient = { id: string; label: string; phenotype: string; description: string; values: Record<PatientMetricKey, number> };

const defaultOut = simulate(defaultInputs);

export const patientMetrics: PatientMetric[] = [
  { key: "membranePotential", group: "Bioenergetics", label: "Mitochondrial membrane potential", unit: "mV", specimen: "Live cells", method: "Potential-sensitive fluorophore", reference: { lo: 150, hi: 180, label: "Approximate physiological band" }, decimals: 0, sourceCitation: "Zorova et al., Anal Biochem (2018)", sourceUrl: "https://doi.org/10.1016/j.ab.2017.07.009", note: "Absolute values depend strongly on probe calibration, cell type, and preparation.", modelValue: (inputs) => inputs.deltaPsi, modelLabel: "Direct model state" },
  { key: "poNadh", group: "Bioenergetics", label: "NADH-linked P/O ratio", unit: "ATP/O", specimen: "Isolated mitochondria", method: "Oxygen and ATP stoichiometry", reference: { lo: 2.3, hi: 2.7, label: "Accepted central estimate around 2.5" }, decimals: 2, sourceCitation: "Hinkle, Biochim Biophys Acta (2005)", sourceUrl: "https://doi.org/10.1016/j.bbabio.2004.09.004", note: "P/O varies with substrate, preparation, leak, and coupling state.", modelValue: (inputs) => poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh"), modelLabel: "Derived model readout" },
  { key: "atpLinkedOcr", group: "Bioenergetics", label: "ATP-linked respiration", unit: "pmol/min/µg protein", specimen: "Fresh PBMCs", method: "Seahorse XF96 Mito Stress Test", reference: { lo: 3.9, hi: 9.6, label: "Healthy adult sex-stratified IQR span" }, decimals: 1, sourceCitation: "Lee et al., PLOS One (2026), Table 2", sourceUrl: "https://doi.org/10.1371/journal.pone.0336939.t002", note: "The study reports an observed healthy cohort distribution, not a clinical reference interval.", modelValue: (_inputs, out) => (out.atpFlux / defaultOut.atpFlux) * 6.4, modelLabel: "Normalized model proxy" },
  { key: "mitosox", group: "ROS and redox", label: "MitoSOX signal", unit: "fold control", specimen: "PBMCs", method: "MitoSOX flow cytometry", decimals: 2, sourceCitation: "Kauffman et al., React Oxyg Species (2016)", sourceUrl: "https://doi.org/10.20455/ros.2016.865", note: "No transferable clinical interval exists. Signal depends on loading, oxidation, cell type, and instrument settings.", modelValue: (_inputs, out) => out.superoxide / defaultOut.superoxide, modelLabel: "Normalized O₂•⁻ proxy" },
  { key: "h2o2", group: "ROS and redox", label: "Hydrogen peroxide signal", unit: "fold control", specimen: "PBMCs", method: "Fluorescent redox probe", decimals: 2, sourceCitation: "Murphy et al., Nat Metab (2022)", sourceUrl: "https://doi.org/10.1038/s42255-022-00591-z", note: "Probe signals are operational measurements; there is no universal clinical H₂O₂ interval.", modelValue: (_inputs, out) => out.hydrogenPeroxide / defaultOut.hydrogenPeroxide, modelLabel: "Normalized H₂O₂ proxy" },
  { key: "lipidPeroxidation", group: "ROS and redox", label: "Lipid peroxidation", unit: "% control", specimen: "PBMCs", method: "C11-BODIPY oxidation", decimals: 0, sourceCitation: "Drummen et al., Free Radic Biol Med (2002)", sourceUrl: "https://doi.org/10.1016/S0891-5849(02)00848-1", note: "Relative fluorescence is assay-specific and has no universal clinical interval.", modelValue: (_inputs, out) => (out.cardiolipinOx / defaultOut.cardiolipinOx) * 100, modelLabel: "Oxidized cardiolipin proxy" },
  { key: "aconitase", group: "Iron and Fe-S", label: "Aconitase activity", unit: "% control", specimen: "PBMC lysate", method: "Enzyme activity assay", reference: { lo: 63, hi: 100, label: "Model display cutoff, not clinical RI" }, decimals: 0, sourceCitation: "Scandroglio et al., Free Radic Res (2014)", sourceUrl: "https://doi.org/10.3109/10715762.2014.902105", note: "Activity is tissue- and assay-dependent. The lower bound is a conservative model cutoff.", modelValue: (_inputs, out) => out.aconitaseActivity, modelLabel: "Direct model output" },
  { key: "labileIron", group: "Iron and Fe-S", label: "Labile iron pool", unit: "µM", specimen: "PBMCs", method: "Calcein dequenching", decimals: 1, sourceCitation: "Kakhlon and Cabantchik, Free Radic Biol Med (2002)", sourceUrl: "https://doi.org/10.1016/S0891-5849(02)01006-7", note: "Calibration and compartment differ by assay, so cohort statistics are shown without a universal interval.", modelValue: (_inputs, out) => out.freeIron, modelLabel: "Model free Fe²⁺ pool" },
  { key: "ferritin", group: "Iron and Fe-S", label: "Ferritin", unit: "µg/L", specimen: "Serum", method: "Immunoassay", decimals: 0, sourceCitation: "WHO ferritin guideline (2020)", sourceUrl: "https://www.who.int/publications/i/item/9789240000124", note: "Interpretation depends on sex, age, inflammation, and local laboratory intervals. No single range is applied here." },
  { key: "transferrinSaturation", group: "Iron and Fe-S", label: "Transferrin saturation", unit: "%", specimen: "Serum", method: "Calculated from iron and transferrin", reference: { lo: 20, hi: 50, label: "General adult interval" }, decimals: 0, sourceCitation: "Merck Manual, Iron Deficiency Anemia", sourceUrl: "https://www.merckmanuals.com/professional/hematology-and-oncology/anemias-caused-by-deficient-erythropoiesis/iron-deficiency-anemia", note: "Use the reporting laboratory's age- and sex-specific interval for clinical interpretation." },
  { key: "lactate", group: "Clinical labs", label: "Lactate", unit: "mmol/L", specimen: "Venous plasma", method: "Enzymatic", reference: { lo: 0.5, hi: 2.2, label: "Common resting venous interval" }, decimals: 1, sourceCitation: "Mayo Clinic Laboratories, Lactate", sourceUrl: "https://www.mayocliniclabs.com/test-catalog/Overview/8316", note: "Tourniquet time, exertion, collection, and processing can materially change lactate." },
  { key: "pyruvate", group: "Clinical labs", label: "Pyruvate", unit: "µmol/L", specimen: "Venous blood", method: "Special chemistry", reference: { lo: 30, hi: 100, label: "Venous blood interval" }, decimals: 0, sourceCitation: "Alberta Precision Laboratories", sourceUrl: "https://www.albertahealthservices.ca/webapps/labservices/indexAPL.asp?details=true&id=9335&tests=&zoneid=1", note: "Collection and immediate stabilization are critical; use the performing laboratory's interval." },
  { key: "lactatePyruvate", group: "Clinical labs", label: "Lactate:pyruvate ratio", unit: "ratio", specimen: "Matched blood samples", method: "Calculated", reference: { hi: 25, label: "Laboratory decision limit" }, decimals: 1, sourceCitation: "Alberta Precision Laboratories", sourceUrl: "https://www.albertahealthservices.ca/webapps/labservices/indexAPL.asp?details=true&id=9335&tests=&zoneid=1", note: "Useful only when both analytes are collected correctly at the same time; supportive, not diagnostic." },
  { key: "glucose", group: "Clinical labs", label: "Fasting glucose", unit: "mmol/L", specimen: "Plasma", method: "Hexokinase", reference: { lo: 3.9, hi: 5.5, label: "Adult fasting interval" }, decimals: 1, sourceCitation: "ADA Standards of Care (2026)", sourceUrl: "https://diabetesjournals.org/care/issue/49/Supplement_1", note: "This is screening context; diagnosis requires clinical criteria and repeat testing where indicated." },
];

export const demoPatients: [DemoPatient, ...DemoPatient[]] = [
  { id: "demo-01", label: "Demo 01", phenotype: "Reference-like", description: "Synthetic adult profile centered near the demo cohort.", values: { membranePotential: 163, poNadh: 2.48, atpLinkedOcr: 6.5, mitosox: 1.02, h2o2: 0.96, lipidPeroxidation: 102, aconitase: 88, labileIron: 2.2, ferritin: 94, transferrinSaturation: 31, lactate: 1.3, pyruvate: 72, lactatePyruvate: 18.1, glucose: 4.8 } },
  { id: "demo-02", label: "Demo 02", phenotype: "Coupling deficit", description: "Synthetic low-potential, low-P/O profile with reduced ATP-linked respiration.", values: { membranePotential: 126, poNadh: 1.61, atpLinkedOcr: 2.5, mitosox: 1.31, h2o2: 1.42, lipidPeroxidation: 137, aconitase: 68, labileIron: 3.8, ferritin: 72, transferrinSaturation: 24, lactate: 3.8, pyruvate: 92, lactatePyruvate: 41.3, glucose: 5.2 } },
  { id: "demo-03", label: "Demo 03", phenotype: "Oxidative stress", description: "Synthetic ROS-high profile with Fe-S injury and an expanded labile iron pool.", values: { membranePotential: 178, poNadh: 2.29, atpLinkedOcr: 5.2, mitosox: 2.44, h2o2: 2.18, lipidPeroxidation: 194, aconitase: 48, labileIron: 7.4, ferritin: 310, transferrinSaturation: 57, lactate: 2.0, pyruvate: 66, lactatePyruvate: 30.3, glucose: 5.4 } },
  { id: "demo-04", label: "Demo 04", phenotype: "Glycolytic shift", description: "Synthetic high-lactate profile with low respiratory ATP production.", values: { membranePotential: 145, poNadh: 1.92, atpLinkedOcr: 3.1, mitosox: 0.72, h2o2: 0.78, lipidPeroxidation: 84, aconitase: 81, labileIron: 2.8, ferritin: 121, transferrinSaturation: 29, lactate: 5.6, pyruvate: 118, lactatePyruvate: 47.5, glucose: 7.2 } },
  { id: "demo-05", label: "Demo 05", phenotype: "Iron loading", description: "Synthetic high-iron profile with lipid oxidation and reduced aconitase activity.", values: { membranePotential: 156, poNadh: 2.34, atpLinkedOcr: 4.7, mitosox: 1.68, h2o2: 1.55, lipidPeroxidation: 171, aconitase: 56, labileIron: 8.9, ferritin: 520, transferrinSaturation: 68, lactate: 2.4, pyruvate: 84, lactatePyruvate: 28.6, glucose: 5.1 } },
  { id: "demo-06", label: "Demo 06", phenotype: "Respiratory reserve", description: "Synthetic high-respiration profile with preserved redox and iron measures.", values: { membranePotential: 171, poNadh: 2.62, atpLinkedOcr: 9.1, mitosox: 0.89, h2o2: 0.91, lipidPeroxidation: 91, aconitase: 94, labileIron: 1.7, ferritin: 138, transferrinSaturation: 36, lactate: 1.0, pyruvate: 58, lactatePyruvate: 17.2, glucose: 4.5 } },
];

export const patientGroups: PatientGroup[] = ["Bioenergetics", "ROS and redox", "Iron and Fe-S", "Clinical labs"];

export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const first = sorted[0];
  if (first === undefined) return 0;
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? first;
  const lower = sorted[middle - 1] ?? upper;
  return sorted.length % 2 ? upper : (lower + upper) / 2;
}

export function cohortStats(key: PatientMetricKey) {
  const values = demoPatients.map((patient) => patient.values[key]);
  const centre = median(values);
  const mad = median(values.map((value) => Math.abs(value - centre)));
  return { median: centre, min: Math.min(...values), max: Math.max(...values), mad };
}

export function isCohortOutlier(value: number, key: PatientMetricKey) {
  const { median: centre, mad, min, max } = cohortStats(key);
  if (mad === 0) return value < min || value > max;
  return Math.abs((0.6745 * (value - centre)) / mad) > 3.5;
}

export function isReferenceOutlier(value: number, metric: PatientMetric) {
  if (!metric.reference) return false;
  return (metric.reference.lo !== undefined && value < metric.reference.lo) || (metric.reference.hi !== undefined && value > metric.reference.hi);
}