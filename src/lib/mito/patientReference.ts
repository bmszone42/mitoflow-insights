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

export type ValueOrigin = { origin: "published" | "user" | "synthetic"; citation?: string | undefined; url?: string | undefined; locator?: string | undefined };
export type DemoPatient = {
  id: string; label: string; age: number; phenotype: string; description: string; context: string; values: Record<PatientMetricKey, number>;
  /** Invented values before published replacement, kept to show how flags move. */
  inventedValues?: Record<PatientMetricKey, number>;
  sex?: "F" | "M"; nonfasting?: boolean; source?: "synthetic" | "published-case" | "user";
  origins?: Partial<Record<PatientMetricKey, ValueOrigin>>;
};

const defaultOut = simulate(defaultInputs);

export const patientMetrics: PatientMetric[] = [
  { key: "membranePotential", group: "Bioenergetics", label: "Mitochondrial membrane potential", unit: "mV", specimen: "Live cells", method: "Potential-sensitive fluorophore", reference: { lo: 150, hi: 180, label: "Approximate physiological band" }, decimals: 0, sourceCitation: "Zorova et al., Anal Biochem (2018)", sourceUrl: "https://doi.org/10.1016/j.ab.2017.07.009", note: "Absolute values depend strongly on probe calibration, cell type, and preparation.", modelValue: (inputs) => inputs.deltaPsi, modelLabel: "Direct model state" },
  { key: "poNadh", group: "Bioenergetics", label: "NADH-linked P/O ratio", unit: "ATP/O", specimen: "Isolated mitochondria", method: "Oxygen and ATP stoichiometry", reference: { lo: 2.3, hi: 2.7, label: "Accepted central estimate around 2.5" }, decimals: 2, sourceCitation: "Hinkle, Biochim Biophys Acta (2005)", sourceUrl: "https://doi.org/10.1016/j.bbabio.2004.09.004", note: "P/O varies with substrate, preparation, leak, and coupling state.", modelValue: (inputs) => poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh"), modelLabel: "Derived model readout" },
  { key: "atpLinkedOcr", group: "Bioenergetics", label: "ATP-linked respiration", unit: "pmol/min/µg protein", specimen: "Fresh PBMCs", method: "Seahorse XF96 Mito Stress Test", reference: { lo: 3.9, hi: 9.6, label: "Healthy adult sex-stratified IQR span" }, decimals: 1, sourceCitation: "Lee et al., PLOS One (2026), Table 2", sourceUrl: "https://doi.org/10.1371/journal.pone.0336939.t002", note: "Adult healthy-cohort IQR, not a clinical reference interval. No conversion from model ATP flux (µM/s) to OCR per µg protein is justified." },
  { key: "mitosox", group: "ROS and redox", label: "MitoSOX signal", unit: "fold control", specimen: "PBMCs", method: "MitoSOX flow cytometry", decimals: 2, sourceCitation: "Kauffman et al., React Oxyg Species (2016)", sourceUrl: "https://doi.org/10.20455/ros.2016.865", note: "No transferable clinical interval exists. Signal depends on loading, oxidation, cell type, and instrument settings.", modelValue: (_inputs, out) => out.superoxide / defaultOut.superoxide, modelLabel: "Normalized O₂•⁻ proxy" },
  { key: "h2o2", group: "ROS and redox", label: "Hydrogen peroxide signal", unit: "fold control", specimen: "PBMCs", method: "Fluorescent redox probe", decimals: 2, sourceCitation: "Murphy et al., Nat Metab (2022)", sourceUrl: "https://doi.org/10.1038/s42255-022-00591-z", note: "Probe signals are operational measurements; there is no universal clinical H₂O₂ interval.", modelValue: (_inputs, out) => out.hydrogenPeroxide / defaultOut.hydrogenPeroxide, modelLabel: "Normalized H₂O₂ proxy" },
  { key: "lipidPeroxidation", group: "ROS and redox", label: "Lipid peroxidation", unit: "% control", specimen: "PBMCs", method: "C11-BODIPY oxidation", decimals: 0, sourceCitation: "Drummen et al., Free Radic Biol Med (2002)", sourceUrl: "https://doi.org/10.1016/S0891-5849(02)00848-1", note: "Relative fluorescence is assay-specific and has no universal clinical interval.", modelValue: (_inputs, out) => (out.cardiolipinOx / defaultOut.cardiolipinOx) * 100, modelLabel: "Oxidized cardiolipin proxy" },
  { key: "aconitase", group: "Iron and Fe-S", label: "Aconitase activity", unit: "% control", specimen: "PBMC lysate", method: "Enzyme activity assay", decimals: 0, sourceCitation: "González-Mingot et al., J Clin Med (2023)", sourceUrl: "https://doi.org/10.3390/jcm12103560", note: "The cited platelet-mitochondrial assay uses mU/mg, not PBMC % control. No transferable clinical interval exists; the model is only a normalized proxy.", modelValue: (_inputs, out) => out.aconitaseActivity, modelLabel: "Model Fe-S proxy, not an assay" },
  { key: "labileIron", group: "Iron and Fe-S", label: "Labile iron pool", unit: "µM", specimen: "PBMCs", method: "Calcein dequenching", decimals: 1, sourceCitation: "Kakhlon and Cabantchik, Free Radic Biol Med (2002)", sourceUrl: "https://doi.org/10.1016/S0891-5849(02)01006-7", note: "Calibration and compartment differ by assay, so cohort statistics are shown without a universal interval.", modelValue: (_inputs, out) => out.freeIron, modelLabel: "Model free Fe²⁺ pool" },
  { key: "ferritin", group: "Iron and Fe-S", label: "Ferritin", unit: "µg/L", specimen: "Serum", method: "Immunoassay", decimals: 0, sourceCitation: "WHO ferritin guideline (2020)", sourceUrl: "https://www.who.int/publications/i/item/9789240000124", note: "Interpretation depends on sex, age, inflammation, and local laboratory intervals. No single range is applied here." },
  { key: "transferrinSaturation", group: "Iron and Fe-S", label: "Transferrin saturation", unit: "%", specimen: "Serum", method: "Calculated from iron and transferrin", reference: { lo: 20, hi: 50, label: "General adult interval" }, decimals: 0, sourceCitation: "Merck Manual, Iron Deficiency Anemia", sourceUrl: "https://www.merckmanuals.com/professional/hematology-and-oncology/anemias-caused-by-deficient-erythropoiesis/iron-deficiency-anemia", note: "Use the reporting laboratory's age- and sex-specific interval for clinical interpretation." },
  { key: "lactate", group: "Clinical labs", label: "Lactate", unit: "mmol/L", specimen: "Venous plasma", method: "Enzymatic", reference: { lo: 0.5, hi: 2.2, label: "Common resting venous interval" }, decimals: 1, sourceCitation: "Mayo Clinic Laboratories, Lactate", sourceUrl: "https://www.mayocliniclabs.com/test-catalog/Overview/8316", note: "Tourniquet time, exertion, collection, and processing can materially change lactate." },
  { key: "pyruvate", group: "Clinical labs", label: "Pyruvate", unit: "µmol/L", specimen: "Venous blood", method: "Special chemistry", reference: { lo: 30, hi: 100, label: "Venous blood interval" }, decimals: 0, sourceCitation: "Alberta Precision Laboratories", sourceUrl: "https://www.albertahealthservices.ca/webapps/labservices/indexAPL.asp?details=true&id=9335&tests=&zoneid=1", note: "Collection and immediate stabilization are critical; use the performing laboratory's interval." },
  { key: "lactatePyruvate", group: "Clinical labs", label: "Lactate:pyruvate ratio", unit: "ratio", specimen: "Matched blood samples", method: "Calculated", reference: { hi: 25, label: "Laboratory decision limit" }, decimals: 1, sourceCitation: "Alberta Precision Laboratories", sourceUrl: "https://www.albertahealthservices.ca/webapps/labservices/indexAPL.asp?details=true&id=9335&tests=&zoneid=1", note: "Useful only when both analytes are collected correctly at the same time; supportive, not diagnostic." },
  { key: "glucose", group: "Clinical labs", label: "Fasting glucose", unit: "mmol/L", specimen: "Plasma", method: "Hexokinase", reference: { lo: 3.9, hi: 5.5, label: "Adult fasting interval" }, decimals: 1, sourceCitation: "ADA Standards of Care (2026)", sourceUrl: "https://diabetesjournals.org/care/issue/49/Supplement_1", note: "This is screening context; diagnosis requires clinical criteria and repeat testing where indicated." },
];

// Illustrative cross-sectional observations, not sampled or fitted patients. PBMC fluorescence and
// enzyme percentages are hypothetical within-assay controls, not cross-laboratory biomarkers.
// Lactate:pyruvate is calculated from the paired venous analytes (mmol/L vs µmol/L).
const record = (id: string, age: number, phenotype: string, description: string, context: string, values: Omit<DemoPatient["values"], "lactatePyruvate">): DemoPatient => ({
  id, label: `Demo ${id.slice(-2)}`, age, phenotype, description, context,
  values: { ...values, lactatePyruvate: Number((values.lactate * 1000 / values.pyruvate).toFixed(1)) },
});

export const demoPatients: [DemoPatient, ...DemoPatient[]] = [
  record("demo-01", 32, "Healthy adult", "Resting, fasting, reference-like profile.", "Stable outpatient; paired venous lactate and pyruvate; hypothetical fresh PBMC assay.", { membranePotential: 163, poNadh: 2.48, atpLinkedOcr: 6.5, mitosox: 1.02, h2o2: 0.96, lipidPeroxidation: 102, aconitase: 88, labileIron: 2.2, ferritin: 94, transferrinSaturation: 31, lactate: 1.3, pyruvate: 84, glucose: 4.8 }),
  record("demo-02", 9, "Healthy child", "Healthy pediatric comparator; adult reference bands do not transfer automatically.", "Stable outpatient; paired venous samples; illustrative PBMC values. Pediatric clinical intervals must be checked locally.", { membranePotential: 160, poNadh: 2.42, atpLinkedOcr: 6.8, mitosox: 0.98, h2o2: 1.04, lipidPeroxidation: 99, aconitase: 92, labileIron: 2.0, ferritin: 56, transferrinSaturation: 28, lactate: 1.2, pyruvate: 82, glucose: 4.7 }),
  record("demo-03", 76, "Healthy older adult", "Preserved function in an older adult; age alone is not mitochondrial disease.", "Stable outpatient; paired venous samples and illustrative fresh PBMC assay.", { membranePotential: 158, poNadh: 2.37, atpLinkedOcr: 5.1, mitosox: 1.12, h2o2: 1.08, lipidPeroxidation: 111, aconitase: 83, labileIron: 2.5, ferritin: 117, transferrinSaturation: 30, lactate: 1.4, pyruvate: 83, glucose: 5.1 }),
  record("demo-04", 3, "Leigh syndrome", "Illustrative respiratory-chain disease with systemic lactate elevation; genotype and severity vary.", "Stable assessment after a symptomatic episode, not an acute crisis; venous blood and hypothetical PBMC assay.", { membranePotential: 134, poNadh: 1.86, atpLinkedOcr: 3.2, mitosox: 1.58, h2o2: 1.43, lipidPeroxidation: 143, aconitase: 70, labileIron: 3.4, ferritin: 68, transferrinSaturation: 26, lactate: 4.2, pyruvate: 135, glucose: 4.6 }),
  record("demo-05", 6, "PDH deficiency", "Pyruvate-entry defect: lactate and pyruvate rise together, while their ratio can remain near normal.", "Stable outpatient; paired venous analytes collected together. Mitochondrial assay values are illustrative, not PDH tests.", { membranePotential: 154, poNadh: 2.35, atpLinkedOcr: 5.0, mitosox: 1.08, h2o2: 1.12, lipidPeroxidation: 108, aconitase: 86, labileIron: 2.3, ferritin: 64, transferrinSaturation: 27, lactate: 3.2, pyruvate: 205, glucose: 4.4 }),
  record("demo-06", 17, "Friedreich ataxia", "Frataxin-associated Fe-S stress; normal serum iron indices do not rule out tissue iron dysregulation.", "Stable outpatient, resting venous draw and hypothetical PBMC assay; tissue iron not measured.", { membranePotential: 151, poNadh: 2.26, atpLinkedOcr: 4.8, mitosox: 1.62, h2o2: 1.45, lipidPeroxidation: 139, aconitase: 65, labileIron: 3.9, ferritin: 88, transferrinSaturation: 29, lactate: 1.8, pyruvate: 90, glucose: 4.9 }),
  record("demo-07", 12, "POLG-related disease", "Mitochondrial DNA maintenance disorder, with variable multisystem impairment.", "Stable outpatient without active liver failure or seizure; paired venous sample and illustrative PBMC values.", { membranePotential: 143, poNadh: 2.08, atpLinkedOcr: 4.0, mitosox: 1.49, h2o2: 1.37, lipidPeroxidation: 128, aconitase: 76, labileIron: 3.0, ferritin: 106, transferrinSaturation: 30, lactate: 2.7, pyruvate: 112, glucose: 4.2 }),
  record("demo-08", 27, "MELAS", "Mitochondrial encephalomyopathy outside an acute stroke-like episode.", "Stable outpatient; venous blood is not a CSF or brain-tissue measurement; hypothetical PBMC assay.", { membranePotential: 142, poNadh: 2.02, atpLinkedOcr: 3.8, mitosox: 1.52, h2o2: 1.44, lipidPeroxidation: 132, aconitase: 73, labileIron: 3.1, ferritin: 82, transferrinSaturation: 28, lactate: 3.5, pyruvate: 118, glucose: 5.0 }),
  record("demo-09", 68, "Parkinson disease", "Illustrative modest peripheral mitochondrial stress; nigral iron cannot be inferred from serum ferritin.", "Stable outpatient, fasting venous draw and hypothetical PBMC assay; no brain specimen.", { membranePotential: 156, poNadh: 2.34, atpLinkedOcr: 5.1, mitosox: 1.29, h2o2: 1.22, lipidPeroxidation: 119, aconitase: 81, labileIron: 2.7, ferritin: 135, transferrinSaturation: 32, lactate: 1.5, pyruvate: 81, glucose: 5.0 }),
  record("demo-10", 79, "Alzheimer disease", "Peripheral values may remain near normal despite regional brain metabolic changes.", "Stable outpatient; venous glucose is not cerebral FDG uptake, and serum iron is not brain iron.", { membranePotential: 159, poNadh: 2.38, atpLinkedOcr: 5.2, mitosox: 1.19, h2o2: 1.15, lipidPeroxidation: 117, aconitase: 82, labileIron: 2.4, ferritin: 119, transferrinSaturation: 30, lactate: 1.4, pyruvate: 84, glucose: 5.1 }),
  record("demo-11", 55, "ALS", "Illustrative mild peripheral redox shift; no blood analyte here diagnoses motor-neuron disease.", "Stable outpatient; hypothetical PBMC assay and paired venous analytes, not motor-neuron measurements.", { membranePotential: 153, poNadh: 2.28, atpLinkedOcr: 4.9, mitosox: 1.37, h2o2: 1.29, lipidPeroxidation: 126, aconitase: 78, labileIron: 2.8, ferritin: 128, transferrinSaturation: 29, lactate: 1.6, pyruvate: 82, glucose: 4.9 }),
  record("demo-12", 46, "Huntington disease", "Illustrative small systemic changes; striatal metabolism is not measured in peripheral blood.", "Stable outpatient; paired venous blood and hypothetical PBMC assay.", { membranePotential: 155, poNadh: 2.31, atpLinkedOcr: 5.0, mitosox: 1.24, h2o2: 1.20, lipidPeroxidation: 121, aconitase: 80, labileIron: 2.5, ferritin: 108, transferrinSaturation: 31, lactate: 1.5, pyruvate: 87, glucose: 4.7 }),
  record("demo-13", 34, "Traumatic brain injury", "Early post-injury peripheral profile; venous L:P can be normal despite cerebral metabolic crisis.", "24 hours after moderate TBI; venous blood, not intracerebral microdialysate; fasting glucose assumption is not valid.", { membranePotential: 148, poNadh: 2.22, atpLinkedOcr: 4.6, mitosox: 1.54, h2o2: 1.41, lipidPeroxidation: 136, aconitase: 74, labileIron: 3.2, ferritin: 179, transferrinSaturation: 26, lactate: 2.3, pyruvate: 111, glucose: 6.7 }),
  record("demo-14", 72, "Ischemic stroke", "Acute reperfusion setting; venous lactate does not quantify infarct-core lactate.", "36 hours after treated ischemic stroke; venous blood and illustrative PBMC assay, no brain sampling; nonfasting.", { membranePotential: 149, poNadh: 2.24, atpLinkedOcr: 4.7, mitosox: 1.48, h2o2: 1.40, lipidPeroxidation: 133, aconitase: 77, labileIron: 3.0, ferritin: 198, transferrinSaturation: 25, lactate: 1.9, pyruvate: 93, glucose: 7.0 }),
  record("demo-15", 61, "Sepsis-associated AKI", "Acute kidney injury with systemic inflammatory stress; raised lactate is not specific to renal mitochondria.", "24 hours after AKI diagnosis; paired venous analytes, nonfasting glucose; hypothetical PBMC measures, not kidney biopsy.", { membranePotential: 136, poNadh: 1.95, atpLinkedOcr: 3.5, mitosox: 1.72, h2o2: 1.68, lipidPeroxidation: 159, aconitase: 64, labileIron: 4.1, ferritin: 415, transferrinSaturation: 17, lactate: 4.1, pyruvate: 184, glucose: 8.1 }),
  record("demo-16", 64, "Heart failure", "Chronic stable heart failure with plausible peripheral bioenergetic impairment.", "Stable compensated outpatient; venous blood and hypothetical PBMC assay, not cardiomyocyte biopsy.", { membranePotential: 152, poNadh: 2.28, atpLinkedOcr: 4.7, mitosox: 1.30, h2o2: 1.24, lipidPeroxidation: 122, aconitase: 79, labileIron: 2.7, ferritin: 90, transferrinSaturation: 23, lactate: 1.7, pyruvate: 91, glucose: 5.2 }),
  record("demo-17", 84, "Sarcopenia", "Reduced muscle reserve does not imply severe abnormalities in resting blood assays.", "Stable older outpatient; peripheral blood and PBMCs, not skeletal-muscle respirometry.", { membranePotential: 157, poNadh: 2.36, atpLinkedOcr: 5.0, mitosox: 1.18, h2o2: 1.17, lipidPeroxidation: 116, aconitase: 83, labileIron: 2.3, ferritin: 102, transferrinSaturation: 28, lactate: 1.4, pyruvate: 82, glucose: 5.2 }),
  record("demo-18", 51, "Iron overload", "Elevated circulating iron indices with illustrative cellular oxidative stress; etiology unspecified.", "Stable outpatient; fasting venous sample and hypothetical PBMC measurements; tissue iron unmeasured.", { membranePotential: 154, poNadh: 2.32, atpLinkedOcr: 4.8, mitosox: 1.56, h2o2: 1.48, lipidPeroxidation: 151, aconitase: 69, labileIron: 4.5, ferritin: 510, transferrinSaturation: 66, lactate: 1.7, pyruvate: 87, glucose: 5.0 }),
];

// Published values replace invented ones only where a checked paper reports
// the same analyte and unit. Everything else stays synthetic fill.
type Pub = { value: number; locator: string };
const published: Record<string, { citation: string; url: string; values: Partial<Record<PatientMetricKey, Pub>> }> = {
  "demo-01": { citation: "Lee et al., PLOS One (2026)", url: "https://doi.org/10.1371/journal.pone.0336939.t002", values: {
    atpLinkedOcr: { value: 6.4, locator: "Table 2, healthy female median (cohort of 184 adults)" } } },
  "demo-04": { citation: "Ching et al., Hong Kong Med J 19:357-61 (2013)", url: "https://doi.org/10.12809/hkmj133673", values: {
    lactate: { value: 9.26, locator: "Abstract, peak of persistent hyperlactataemia 3.34-9.26 mmol/L (single infant case)" },
    lactatePyruvate: { value: 35, locator: "Abstract, serum L:P up to 35; may not be the same sample as peak lactate" } } },
  "demo-05": { citation: "Indian J Pediatr 88:88 (2021), PDHA1 case letter", url: "https://doi.org/10.1007/s12098-020-03394-w", values: {
    lactate: { value: 9.9, locator: "Letter text, admission lactate (45-day-old infant)" },
    pyruvate: { value: 1000, locator: "Letter text, pyruvate 1 mmol/L" },
    lactatePyruvate: { value: 9.9, locator: "Letter text, L:P 9.9" } } },
  "demo-18": { citation: "Sandnes et al., Genes 12:1162 (2021)", url: "https://doi.org/10.3390/genes12081162", values: {
    ferritin: { value: 855, locator: "Table 4, C282Y/C282Y men median (n = 95)" },
    transferrinSaturation: { value: 70, locator: "Table 4, C282Y/C282Y men median (n = 95)" } } },
};
for (const p of demoPatients) {
  const pub = published[p.id];
  if (!pub) continue;
  p.inventedValues = { ...p.values };
  p.origins = {};
  for (const [k, v] of Object.entries(pub.values) as [PatientMetricKey, Pub][]) {
    p.values[k] = v.value;
    p.origins[k] = { origin: "published", citation: pub.citation, url: pub.url, locator: v.locator };
  }
  // Keep L:P consistent: back-calculate the missing partner as synthetic fill.
  if (pub.values.lactatePyruvate && !pub.values.pyruvate) p.values.pyruvate = Math.round(p.values.lactate * 1000 / p.values.lactatePyruvate);
  else if (!pub.values.lactatePyruvate) p.values.lactatePyruvate = Number((p.values.lactate * 1000 / p.values.pyruvate).toFixed(1));
  p.source = "published-case";
}

export const originOf = (p: DemoPatient, k: PatientMetricKey): ValueOrigin => p.origins?.[k] ?? { origin: p.source === "user" ? "user" : "synthetic" };
export const realShare = (p: DemoPatient) => {
  const keys = Object.keys(p.values) as PatientMetricKey[];
  return keys.filter((k) => originOf(p, k).origin !== "synthetic").length / keys.length;
};

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

// Real laboratory reference intervals (Mayo Clinic Laboratories test catalog, checked 2026-10-02)
// for the blood tests only. Research assays have no lab interval and are never given one.
export type Sex = "F" | "M";
const sexById: Record<string, Sex> = { "demo-01": "F", "demo-02": "M", "demo-03": "F", "demo-04": "M", "demo-05": "F", "demo-06": "M", "demo-07": "F", "demo-08": "F", "demo-09": "M", "demo-10": "F", "demo-11": "M", "demo-12": "M", "demo-13": "M", "demo-14": "F", "demo-15": "M", "demo-16": "M", "demo-17": "F", "demo-18": "M" };
export const patientSex = (p: DemoPatient): Sex => p.sex ?? sexById[p.id] ?? "F";
export const NONFASTING_IDS = ["demo-13", "demo-14", "demo-15"];
export const isNonfasting = (p: DemoPatient) => p.nonfasting ?? NONFASTING_IDS.includes(p.id);

export type ResolvedRange = { lo?: number; hi?: number; label: string; kind: "Lab" | "Research"; source: string; url: string; verified: boolean };
export type RangeResult = { range: ResolvedRange; reason?: undefined } | { range: null; reason: string };
const mayo = (code: string, url: string) => ({ source: `Mayo Clinic Laboratories, ${code}`, url, verified: true, kind: "Lab" as const });
const FERR = mayo("FERR1 Ferritin, Serum", "https://www.testcatalog.org/show/FERR1");
const LACT = mayo("LACS1 Lactate, Plasma", "https://www.testcatalog.org/show/LACS1");
const PYR = mayo("PYR Pyruvic Acid, Blood", "https://genetics.testcatalog.org/show/PYR");
const SAT = mayo("SFEC Percent Saturation", "https://www.testcatalog.org/show/SFEC");
const GLUR = mayo("GLURA Glucose, Random (70-140 mg/dL)", "https://www.testcatalog.org/show/GLURA");

export const labMetricKeys: PatientMetricKey[] = ["ferritin", "transferrinSaturation", "lactate", "pyruvate", "lactatePyruvate", "glucose"];

function labRange(p: DemoPatient, key: PatientMetricKey): RangeResult {
  const a = p.age; const sex = patientSex(p);
  switch (key) {
    case "ferritin":
      if (sex === "M") return { range: a >= 18 ? { lo: 31, hi: 409, label: "Male, 18 y and older", ...FERR } : a >= 10 ? { lo: 15, hi: 201, label: "Male, 10-17 y", ...FERR } : { lo: 6, hi: 111, label: "Male, 6 mo-9 y", ...FERR } };
      return { range: a >= 51 ? { lo: 11, hi: 328, label: "Female, 51 y and older", ...FERR } : a >= 18 ? { lo: 6, hi: 175, label: "Female, 18-50 y", ...FERR } : { lo: 8, hi: 115, label: "Female, 6 mo-17 y", ...FERR } };
    case "transferrinSaturation": return { range: { lo: 14, hi: 50, label: "Single interval, no age or sex strata published", ...SAT } };
    case "lactate": return { range: a >= 18 ? { lo: 0.5, hi: 2.0, label: "18 y and older", ...LACT } : a > 2 ? { hi: 2.2, label: "25 mo-17 y", ...LACT } : { hi: 3.1, label: "3-24 mo", ...LACT } };
    case "pyruvate": return { range: { lo: 80, hi: 160, label: "Whole blood, 0.08-0.16 mmol/L, no age strata published", ...PYR } };
    case "lactatePyruvate": return { range: { hi: 25, label: "Laboratory decision limit; source page could not be re-checked", kind: "Lab", source: "Alberta Precision Laboratories", url: "https://www.albertahealthservices.ca/webapps/labservices/indexAPL.asp?details=true&id=9335&tests=&zoneid=1", verified: false } };
    case "glucose":
      if (isNonfasting(p)) return { range: { lo: 3.9, hi: 7.8, label: "Random (nonfasting) interval", ...GLUR } };
      return { range: { lo: 3.9, hi: 5.5, label: "Fasting, normal below 100 mg/dL", kind: "Lab", source: "ADA Standards of Care (2026)", url: "https://diabetesjournals.org/care/issue/49/Supplement_1", verified: true } };
    default: return { range: null, reason: "No lab reference range" };
  }
}

/** Lab interval for blood tests; adult-only research band otherwise; null with reason when none applies. */
export function referenceFor(p: DemoPatient, metric: PatientMetric): RangeResult {
  if (labMetricKeys.includes(metric.key)) return labRange(p, metric.key);
  if (!metric.reference) return { range: null, reason: "No lab reference range" };
  if (p.age < 18) return { range: null, reason: "Adult research band; no pediatric interval" };
  return { range: { ...metric.reference, kind: "Research", source: metric.sourceCitation, url: metric.sourceUrl, verified: true } };
}

/** Signed percent beyond the nearest limit (positive above, negative below); 0 when inside. */
export function percentOutside(value: number, r: { lo?: number; hi?: number }) {
  if (r.hi !== undefined && value > r.hi) return ((value - r.hi) / r.hi) * 100;
  if (r.lo !== undefined && value < r.lo) return ((value - r.lo) / r.lo) * 100;
  return 0;
}

export const formatRangeText = (r: { lo?: number; hi?: number }) => r.lo === undefined ? `≤ ${r.hi}` : r.hi === undefined ? `≥ ${r.lo}` : `${r.lo}-${r.hi}`;
export const outsideText = (value: number, r: { lo?: number; hi?: number }) => {
  const pct = percentOutside(value, r);
  if (pct === 0) return null;
  return pct > 0 ? `${pct.toFixed(0)}% above the ${r.hi} upper limit` : `${Math.abs(pct).toFixed(0)}% below the ${r.lo} lower limit`;
};
