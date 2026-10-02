import { defaultGeometry, defaultInputs, simulate } from "./model";
import { demoPatients, isNonfasting, originOf, realShare, outsideText, percentOutside, referenceFor, patientMetrics, type DemoPatient, type PatientMetricKey } from "./patientReference";
import { atpNetworkRangeFlags, effectiveAtpCost, etcSteps } from "./reference";
import { rosAssayFlag, rosSourceRows } from "./rosPhysiology";
import { atpAssayFlag } from "./atpComparison";

// Mechanism pattern review. Fixed rules map existing flags to mechanisms.
// Scores are weighted flag counts, never probabilities or diagnoses.
export type Mechanism = "respiratory" | "pyruvate" | "coupling" | "iron" | "oxidant";
export const mechanismNames: Record<Mechanism, string> = {
  respiratory: "Respiratory-chain block",
  pyruvate: "Pyruvate entry block",
  coupling: "Coupling loss",
  iron: "Iron and Fe-S stress",
  oxidant: "Oxidant load",
};
const order: Mechanism[] = ["respiratory", "pyruvate", "coupling", "iron", "oxidant"];

export type EvidenceType = "Measured assay" | "Derived ratio" | "Model simulation";
const weight: Record<EvidenceType, number> = { "Measured assay": 1, "Derived ratio": 0.75, "Model simulation": 0.5 };
export type Evidence = { label: string; type: EvidenceType; source: "Patient Data" | "ROS assay" | "ATP assay" | "Model"; detail: string; origin?: "published" | "user" | "synthetic" };

const adultControl = demoPatients.find((p) => p.id === "demo-01")!;
const childControl = demoPatients.find((p) => p.id === "demo-02")!;
const CONTROL_PERCENT = 25;

type Direction = "high" | "low" | "normal";

// Cited band when applicable (adult, fasting rules from Patient Data), else
// ±25% versus the age-matched healthy synthetic control.
export function metricDirection(p: DemoPatient, key: PatientMetricKey): { dir: Direction; basis: string } {
  const metric = patientMetrics.find((m) => m.key === key)!;
  const value = p.values[key];
  const ref = referenceFor(p, metric);
  if (ref.range) {
    const basis = ref.range.kind === "Lab" ? "lab range" : "research band";
    const pct = percentOutside(value, ref.range);
    if (pct === 0) return { dir: "normal", basis };
    return { dir: pct > 0 ? "high" : "low", basis: `${outsideText(value, ref.range)}, ${basis}` };
  }
  const control = (p.age < 18 ? childControl : adultControl).values[key];
  const pct = (value / control - 1) * 100;
  return { dir: Math.abs(pct) < CONTROL_PERCENT ? "normal" : pct > 0 ? "high" : "low", basis: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs ${p.age < 18 ? "healthy child" : "healthy adult"}` };
}

type Rule = { key: PatientMetricKey; dir: Exclude<Direction, "normal">; type: EvidenceType };
const support: Record<Mechanism, Rule[]> = {
  respiratory: [{ key: "lactatePyruvate", dir: "high", type: "Derived ratio" }, { key: "lactate", dir: "high", type: "Measured assay" }, { key: "poNadh", dir: "low", type: "Measured assay" }, { key: "atpLinkedOcr", dir: "low", type: "Measured assay" }],
  pyruvate: [{ key: "lactate", dir: "high", type: "Measured assay" }, { key: "pyruvate", dir: "high", type: "Measured assay" }],
  coupling: [{ key: "poNadh", dir: "low", type: "Measured assay" }, { key: "atpLinkedOcr", dir: "low", type: "Measured assay" }, { key: "membranePotential", dir: "low", type: "Measured assay" }],
  iron: [{ key: "labileIron", dir: "high", type: "Measured assay" }, { key: "aconitase", dir: "low", type: "Measured assay" }, { key: "ferritin", dir: "high", type: "Measured assay" }, { key: "transferrinSaturation", dir: "high", type: "Measured assay" }, { key: "lipidPeroxidation", dir: "high", type: "Measured assay" }],
  oxidant: [{ key: "mitosox", dir: "high", type: "Measured assay" }, { key: "h2o2", dir: "high", type: "Measured assay" }, { key: "lipidPeroxidation", dir: "high", type: "Measured assay" }],
};

export const expectedPattern: Record<string, { mechanisms: Mechanism[]; text: string }> = {
  "Healthy adult": { mechanisms: [], text: "No mechanism should stand out." },
  "Healthy child": { mechanisms: [], text: "No mechanism should stand out." },
  "Healthy older adult": { mechanisms: [], text: "Mild drift with age, no strong mechanism." },
  "Leigh syndrome": { mechanisms: ["respiratory"], text: "High lactate with a high lactate:pyruvate ratio and low coupling." },
  "PDH deficiency": { mechanisms: ["pyruvate"], text: "High lactate and pyruvate together with a normal ratio." },
  "Friedreich ataxia": { mechanisms: ["iron", "oxidant"], text: "Fe-S stress with low aconitase and raised oxidant signals." },
  "POLG-related disease": { mechanisms: ["respiratory", "coupling"], text: "Respiratory-chain impairment from mtDNA loss." },
  MELAS: { mechanisms: ["respiratory"], text: "High lactate:pyruvate ratio with reduced coupling." },
  "Parkinson disease": { mechanisms: ["oxidant", "coupling"], text: "Modest oxidant load and coupling change." },
  "Alzheimer disease": { mechanisms: ["oxidant"], text: "Mild peripheral oxidant change; often near normal." },
  ALS: { mechanisms: ["oxidant", "coupling"], text: "Mild oxidant and coupling shift." },
  "Huntington disease": { mechanisms: ["oxidant", "coupling"], text: "Small systemic oxidant and coupling changes." },
  "Traumatic brain injury": { mechanisms: ["oxidant", "coupling"], text: "Acute oxidant load and depolarization." },
  "Ischemic stroke": { mechanisms: ["oxidant", "coupling"], text: "Reperfusion oxidant load and depolarization." },
  "Sepsis-associated AKI": { mechanisms: ["coupling", "oxidant", "respiratory"], text: "Systemic coupling loss, oxidant load and raised lactate." },
  "Heart failure": { mechanisms: ["coupling"], text: "Reduced coupling and ATP-linked respiration." },
  Sarcopenia: { mechanisms: ["coupling"], text: "Reduced ATP-linked respiration with mild coupling change." },
  "Iron overload": { mechanisms: ["iron"], text: "High iron indices with lipid oxidation." },
};

export function diagnoseProfile(p: DemoPatient) {
  const dirs = Object.fromEntries(patientMetrics.map((m) => [m.key, metricDirection(p, m.key)])) as Record<PatientMetricKey, { dir: Direction; basis: string }>;
  const patientFlags: Evidence[] = patientMetrics.filter((m) => dirs[m.key].dir !== "normal").map((m) => ({ label: `${m.label} ${dirs[m.key].dir}`, type: m.key === "lactatePyruvate" ? "Derived ratio" : "Measured assay", source: "Patient Data", detail: `${p.values[m.key]} ${m.unit} (${dirs[m.key].basis})`, origin: originOf(p, m.key).origin }));

  // ROS and ATP profile assay flags (same logic as the tabs).
  const rosAssays = (["O2•-", "H2O2", "•OH"] as const).map((s) => rosAssayFlag(s, p.values, adultControl.values)).filter((a): a is NonNullable<typeof a> => !!a);
  const rosAssayFlags: Evidence[] = rosAssays.filter((a) => a.flagged).map((a) => ({ label: `${a.label} ${a.percent > 0 ? "high" : "low"}`, type: "Measured assay", source: "ROS assay", detail: `${a.percent >= 0 ? "+" : ""}${a.percent.toFixed(0)}% vs healthy adult` }));
  const atpAssays = [atpAssayFlag("Complex I", true, p.values, adultControl.values), atpAssayFlag("Overall NADH to O2", false, p.values, adultControl.values)].filter((a): a is NonNullable<typeof a> => !!a);
  const atpAssayFlags: Evidence[] = atpAssays.filter((a) => a.flagged).map((a) => ({ label: `${a.label} ${a.percent > 0 ? "high" : "low"}`, type: "Measured assay", source: "ATP assay", detail: `${a.percent >= 0 ? "+" : ""}${a.percent.toFixed(0)}% vs healthy adult` }));

  // Model flags from the profile's membrane potential only, other inputs default.
  const inputs = { ...defaultInputs, deltaPsi: p.values.membranePotential };
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const stdCost = effectiveAtpCost(defaultInputs.deltaPsi, defaultInputs.uncoupling);
  const atpModel = etcSteps.filter((s) => { const f = atpNetworkRangeFlags(s, stdCost, cost); return f.evOutside || f.costBOutside; }).length;
  const rosModel = rosSourceRows(simulate(inputs, defaultGeometry), simulate(defaultInputs, defaultGeometry), inputs, defaultInputs).filter((r) => r.flagged).length;
  const modelFlags: Evidence[] = [
    ...(atpModel ? [{ label: `${atpModel} ATP steps flagged`, type: "Model simulation" as const, source: "Model" as const, detail: `at ${inputs.deltaPsi} mV, cost ${cost.toFixed(2)} eV/ATP` }] : []),
    ...(rosModel ? [{ label: `${rosModel} ROS sources flagged`, type: "Model simulation" as const, source: "Model" as const, detail: `at ${inputs.deltaPsi} mV vs default` }] : []),
  ];

  const causes = order.map((mech) => {
    const supporting: Evidence[] = []; const conflicting: Evidence[] = [];
    for (const r of support[mech]) {
      const d = dirs[r.key];
      const m = patientMetrics.find((x) => x.key === r.key)!;
      const ev: Evidence = { label: `${m.label} ${d.dir}`, type: r.type, source: "Patient Data", detail: `${p.values[r.key]} ${m.unit} (${d.basis})`, origin: originOf(p, r.key).origin };
      if (d.dir === r.dir) supporting.push(ev);
    }
    // Ferritin is an acute-phase reactant: in acute illness (TBI, stroke,
    // sepsis) a raised ferritin often reflects inflammation, not iron stress,
    // so it counts at quarter weight for those profiles.
    const acute = isNonfasting(p);
    const evWeight = (e: Evidence) =>
      acute && mech === "iron" && e.label.startsWith("Ferritin") ? weight[e.type] * 0.25 : weight[e.type];
    // Discriminating conflicts between respiratory and pyruvate-entry patterns.
    const lp = dirs.lactatePyruvate;
    const lpEv: Evidence = { label: `Lactate:pyruvate ratio ${lp.dir}`, type: "Derived ratio", source: "Patient Data", detail: `${p.values.lactatePyruvate} (${lp.basis})`, origin: originOf(p, "lactatePyruvate").origin };
    if (mech === "pyruvate" && supporting.length) { if (lp.dir === "high") conflicting.push(lpEv); else supporting.push({ ...lpEv, label: "Lactate:pyruvate ratio normal" }); }
    if (mech === "respiratory" && dirs.lactate.dir === "high" && lp.dir !== "high") conflicting.push({ ...lpEv, label: "Lactate:pyruvate ratio normal" });
    if (mech === "coupling" && atpModel) supporting.push(modelFlags[0]!);
    if (mech === "oxidant" && rosModel) supporting.push(modelFlags[modelFlags.length - 1]!);
    const score = supporting.reduce((s, e) => s + evWeight(e), 0) - conflicting.reduce((s, e) => s + evWeight(e), 0);
    // ROS probe signals are nonspecific: any primary defect can raise them, so
    // oxidant load counts at half weight as a downstream signal.
    const scaled = mech === "oxidant" ? score * 0.5 : score;
    const measured = supporting.filter((e) => e.origin);
    const real = measured.filter((e) => e.origin !== "synthetic").length;
    return { mechanism: mech, name: mechanismNames[mech], score: Math.max(0, scaled), supporting, conflicting, realEvidence: real, measuredEvidence: measured.length };
  }).sort((a, b) => b.score - a.score || order.indexOf(a.mechanism) - order.indexOf(b.mechanism));

  const strong = causes.filter((c) => c.score >= 1.5);
  const expected = expectedPattern[p.phenotype] ?? { mechanisms: [], text: "No expected pattern defined." };
  const fit: "matches" | "partly matches" | "does not match" = expected.mechanisms.length === 0
    ? (strong.length === 0 ? "matches" : "does not match")
    : expected.mechanisms.includes(causes[0]!.mechanism) && causes[0]!.score >= 1.5 ? "matches"
    : expected.mechanisms.some((m) => (causes.find((c) => c.mechanism === m)?.score ?? 0) > 0) ? "partly matches" : "does not match";

  return { patient: p, causes, top: strong[0] ?? null, patientFlags, rosAssayFlags, atpAssayFlags, modelFlags, expected, fit, realShare: realShare(p) };
}

export const diagnoseAll = (extra: DemoPatient[] = []) => [...extra, ...demoPatients].map(diagnoseProfile);
