import { defaultGeometry, defaultInputs, simulate } from "./model";
import { demoPatients, isNonfasting, originOf, realShare, outsideText, percentOutside, readoutChecks, referenceFor, patientMetrics, h2o2BandCheck, projectedH2o2, projectedMitoSox, type DemoPatient, type PatientMetricKey } from "./patientReference";
import { atpNetworkRangeFlags, effectiveAtpCost, etcSteps } from "./reference";
import { rosAssayFlag, rosSourceRows } from "./rosPhysiology";
import { atpAssayFlag } from "./atpComparison";
import { therapies, applyTherapyDose, profileInputs, metrics, bestProjectionTherapy } from "./treatment";

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

export function diagnoseProfile(p: DemoPatient, dose = 1, onlyId?: string) {
  const dirs = Object.fromEntries(patientMetrics.map((m) => [m.key, metricDirection(p, m.key)])) as Record<PatientMetricKey, { dir: Direction; basis: string }>;
  // MitoSOX is listed under ROS assay flags (Gonzalo 2019 band), not Patient
  // Data flags, so the band is not counted twice.
  const patientFlags: Evidence[] = patientMetrics.filter((m) => m.key !== "mitosox" && dirs[m.key].dir !== "normal").map((m) => ({ label: `${m.label} ${dirs[m.key].dir}`, type: m.key === "lactatePyruvate" ? "Derived ratio" : "Measured assay", source: "Patient Data", detail: `${p.values[m.key]} ${m.unit} (${dirs[m.key].basis})`, origin: originOf(p, m.key).origin }));

  // ROS and ATP profile assay flags (same logic as the tabs).
  const rosAssays = (["O2•-", "H2O2", "•OH"] as const).map((s) => rosAssayFlag(s, p.values, adultControl.values)).filter((a): a is NonNullable<typeof a> => !!a);
  const msBand = readoutChecks(p).find((b) => b.key === "mitosox")!;
  // Model flags from the profile's membrane potential only, other inputs default.
  const inputs = { ...defaultInputs, deltaPsi: p.values.membranePotential };
  const simOut = simulate(inputs, defaultGeometry);
  // Peroxide band (Sies 2017): measured nM when entered, else the model value.
  const hb = h2o2BandCheck(p, simOut.hydrogenPeroxide);
  const h2o2Src = hb.measured?.outside ? hb.measured : hb.model.outside ? hb.model : null;
  const rosAssayFlags: Evidence[] = [
    ...rosAssays.filter((a) => a.flagged).map((a) => ({ label: `${a.label} ${a.percent > 0 ? "high" : "low"}`, type: "Measured assay" as const, source: "ROS assay" as const, detail: `${a.percent >= 0 ? "+" : ""}${a.percent.toFixed(0)}% vs healthy adult` })),
    ...(msBand.outside ? [{ label: `MitoSOX signal ${msBand.value > msBand.hi ? "high" : "low"}`, type: "Measured assay" as const, source: "ROS assay" as const, detail: `${msBand.text}, research band (Gonzalo 2019)${p.age < 18 ? "; adult band applied to a child" : ""}`, origin: originOf(p, "mitosox").origin }] : []),
    ...(h2o2Src ? [{ label: "Hydrogen peroxide high", type: "Measured assay" as const, source: "ROS assay" as const, detail: `${h2o2Src.text} (${h2o2Src.value.toFixed(0)} nM), research band (Sies 2017)${hb.measured?.outside ? "" : ", model value"}`, ...(hb.measured?.outside ? { origin: originOf(p, "h2o2").origin } : {}) }] : []),
  ];
  const atpAssays = [atpAssayFlag("Complex I", true, p.values, adultControl.values), atpAssayFlag("Overall NADH to O2", false, p.values, adultControl.values)].filter((a): a is NonNullable<typeof a> => !!a);
  const atpAssayFlags: Evidence[] = atpAssays.filter((a) => a.flagged).map((a) => ({ label: `${a.label} ${a.percent > 0 ? "high" : "low"}`, type: "Measured assay", source: "ATP assay", detail: `${a.percent >= 0 ? "+" : ""}${a.percent.toFixed(0)}% vs healthy adult` }));

  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const stdCost = effectiveAtpCost(defaultInputs.deltaPsi, defaultInputs.uncoupling);
  const atpModel = etcSteps.filter((s) => { const f = atpNetworkRangeFlags(s, stdCost, cost); return f.evOutside || f.costBOutside; }).length;
  const rosModel = rosSourceRows(simOut, simulate(defaultInputs, defaultGeometry), inputs, defaultInputs).filter((r) => r.flagged).length;
  // Defences-only gap: same comparison as the dashboard's "Defences only" line.
  // Healthy inputs re-run at the profile's membrane potential, with and without
  // the profile's antioxidant capacity, so only defences (and the ROS-induced
  // ROS release they drive) show in the gap.
  const matchedHealthySo = simulate({ ...defaultInputs, deltaPsi: profileInputs(p).deltaPsi }, defaultGeometry).superoxide;
  const matchedProfileSo = simulate({ ...defaultInputs, deltaPsi: profileInputs(p).deltaPsi, antioxidantCapacity: profileInputs(p).antioxidantCapacity }, defaultGeometry).superoxide;
  const defGap = (matchedProfileSo / matchedHealthySo - 1) * 100;
  const modelFlags: Evidence[] = [
    ...(atpModel ? [{ label: `${atpModel} ATP steps flagged`, type: "Model simulation" as const, source: "Model" as const, detail: `at ${inputs.deltaPsi} mV, cost ${cost.toFixed(2)} eV/ATP` }] : []),
    ...(rosModel ? [{ label: `${rosModel} ROS sources flagged`, type: "Model simulation" as const, source: "Model" as const, detail: `at ${inputs.deltaPsi} mV vs default` }] : []),
    ...(defGap > 0 ? [{ label: "Superoxide high, defences only", type: "Model simulation" as const, source: "Model" as const, detail: `${defGap >= 0 ? "+" : ""}${defGap.toFixed(0)}% vs healthy at the same membrane potential, labile iron and L:P; only antioxidant capacity and ROS-induced ROS release differ` }] : []),
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
    if (mech === "oxidant" && rosModel) supporting.push(modelFlags.find((f) => f.label.endsWith("ROS sources flagged"))!);
    if (mech === "oxidant" && defGap > 0) supporting.push(modelFlags.find((f) => f.label.startsWith("Superoxide high, defences only"))!);
    const score = supporting.reduce((s, e) => s + evWeight(e), 0) - conflicting.reduce((s, e) => s + evWeight(e), 0);
    // ROS probe signals are nonspecific: any primary defect can raise them, so
    // oxidant load counts at half weight as a downstream signal.
    const scaled = mech === "oxidant" ? score * 0.5 : score;
    const measured = supporting.filter((e) => e.origin);
    const real = measured.filter((e) => e.origin !== "synthetic").length;
    return { mechanism: mech, name: mechanismNames[mech], score: Math.max(0, scaled), supporting, conflicting, realEvidence: real, measuredEvidence: measured.length };
  }).sort((a, b) => b.score - a.score || order.indexOf(a.mechanism) - order.indexOf(b.mechanism));

  const strong = causes.filter((c) => c.score >= 1.5);

  // Therapy flags: model therapies that target a strong cause (score >= 1.5)
  // and move ATP, superoxide or peroxide by at least 1% at the chosen model
  // dose on this profile's baseline. Model levers only, never drug doses.
  const strongMechs = new Set(strong.map((c) => c.mechanism));
  const therapyFlags: Evidence[] = strongMechs.size === 0 ? [] : therapies
    .filter((t) => t.mechanisms.some((m) => strongMechs.has(m)))
    .map((t): Evidence | null => {
      const before = profileInputs(p);
      const s = { before: metrics(before), after: metrics(applyTherapyDose(before, t, dose)) };
      const parts: string[] = [];
      const pct = (a: number, b: number) => (a ? (b / a - 1) * 100 : 0);
      const atpPct = pct(s.before.atp, s.after.atp), o2Pct = pct(s.before.superoxide, s.after.superoxide), h2o2Pct = pct(s.before.h2o2, s.after.h2o2);
      if (Math.abs(atpPct) >= 1) parts.push(`ATP ${atpPct >= 0 ? "+" : ""}${atpPct.toFixed(0)}%`);
      if (Math.abs(o2Pct) >= 1) parts.push(`superoxide ${o2Pct >= 0 ? "+" : ""}${o2Pct.toFixed(0)}%`);
      if (Math.abs(h2o2Pct) >= 1) parts.push(`H2O2 ${h2o2Pct >= 0 ? "+" : ""}${h2o2Pct.toFixed(0)}%`);
      return parts.length ? { label: t.name, type: "Model simulation" as const, source: "Model" as const, detail: `${parts.join(", ")} at ${dose}x model dose; targets ${t.mechanisms.filter((m) => strongMechs.has(m)).map((m) => mechanismNames[m]).join(", ")}` } : null;
    })
    .filter((e): e is Evidence => e !== null);

  // Projected flags: the measured MitoSOX fold or peroxide nM scaled by the
  // model's superoxide / peroxide change under the therapy that moves it most
  // at this dose. Model estimates, not measurements; kept out of the flag
  // counts so the measured flags are never double-counted.
  // Shared with the dashboard: best therapy across all therapies at this dose.
  const bestSo = bestProjectionTherapy(p, dose, "so", onlyId);
  const bestH2 = bestProjectionTherapy(p, dose, "h2", onlyId);
  const projectedFlags: Evidence[] = [
    ...(msBand.outside && bestSo ? [(() => { const pr = projectedMitoSox(p.values.mitosox, 1, bestSo.fold); return { label: `MitoSOX signal ${msBand.value > msBand.hi ? "high" : "low"} (projected)`, type: "Model simulation" as const, source: "Model" as const, detail: `${p.values.mitosox.toFixed(2)}x to ${pr.value.toFixed(2)}x with ${bestSo.t.name} at ${dose}x model dose; ${pr.outside ? "still outside band" : "flag clears"}` }; })()] : []),
    ...(hb.measured?.outside && bestH2 ? [(() => { const pr = projectedH2o2(hb.measured!.value, 1, bestH2.fold); return { label: "Hydrogen peroxide high (projected)", type: "Model simulation" as const, source: "Model" as const, detail: `${hb.measured!.value.toFixed(0)} nM to ${pr.value.toFixed(0)} nM with ${bestH2.t.name} at ${dose}x model dose; ${pr.outside ? "still outside band" : "flag clears"}` }; })()] : []),
  ];
  const expected = expectedPattern[p.phenotype] ?? { mechanisms: [], text: "No expected pattern defined." };
  const fit: "matches" | "partly matches" | "does not match" = expected.mechanisms.length === 0
    ? (strong.length === 0 ? "matches" : "does not match")
    : expected.mechanisms.includes(causes[0]!.mechanism) && causes[0]!.score >= 1.5 ? "matches"
    : expected.mechanisms.some((m) => (causes.find((c) => c.mechanism === m)?.score ?? 0) > 0) ? "partly matches" : "does not match";

  return { patient: p, causes, top: strong[0] ?? null, patientFlags, rosAssayFlags, atpAssayFlags, modelFlags, therapyFlags, projectedFlags, expected, fit, realShare: realShare(p) };
}

export const diagnoseAll = (extra: DemoPatient[] = [], dose = 1, onlyId?: string) => [...extra, ...demoPatients].map((p) => diagnoseProfile(p, dose, onlyId));

const HEALTHY = new Set(["Healthy adult", "Healthy child", "Healthy older adult"]);

export type FlagOverlap = { key: PatientMetricKey; label: string; dir: Direction; basis: string; matches: { id: string; phenotype: string; label: string }[] };
export type DisorderOverlap = { phenotype: string; shared: number; total: number; flags: string[] };

// For each flagged value of the selected profile, which disorder profiles
// flag the same value in the same direction. Overlap is shared flags, not a
// likelihood ratio; healthy profiles and the profile itself are excluded.
export function flagOverlaps(p: DemoPatient, pool: DemoPatient[] = demoPatients): { perFlag: FlagOverlap[]; ranked: DisorderOverlap[] } {
  const dirs = Object.fromEntries(patientMetrics.map((m) => [m.key, metricDirection(p, m.key)])) as Record<PatientMetricKey, { dir: Direction; basis: string }>;
  const others = pool.filter((o) => o.id !== p.id && !HEALTHY.has(o.phenotype));
  const perFlag: FlagOverlap[] = patientMetrics
    .filter((m) => dirs[m.key].dir !== "normal")
    .map((m) => ({
      key: m.key,
      label: m.label,
      dir: dirs[m.key].dir,
      basis: dirs[m.key].basis,
      matches: others.filter((o) => metricDirection(o, m.key).dir === dirs[m.key].dir).map((o) => ({ id: o.id, phenotype: o.phenotype, label: o.label })),
    }));
  const total = perFlag.length;
  const ranked: DisorderOverlap[] = others.map((o) => {
    const shared = perFlag.filter((f) => f.matches.some((x) => x.id === o.id));
    return { phenotype: o.phenotype, shared: shared.length, total, flags: shared.map((f) => `${f.label} ${f.dir}`) };
  }).filter((r) => r.shared > 0).sort((a, b) => b.shared - a.shared || a.phenotype.localeCompare(b.phenotype));
  return { perFlag, ranked };
}

/**
 * Therapy plan rows: each flagged therapy (same rule as Therapy flags) on one
 * profile at a model dose, with readout changes and projected MitoSOX /
 * peroxide clearance via bestProjectionTherapy. Model estimates only.
 */
export function therapyPlanRows(p: DemoPatient, dose = 1) {
  const d = diagnoseProfile(p, dose);
  const msOut = readoutChecks(p).find((b) => b.key === "mitosox")!.outside;
  const h2 = p.h2o2Nm;
  return d.therapyFlags.map((f) => {
    const t = therapies.find((x) => x.name === f.label)!;
    const b = metrics(profileInputs(p)); const a = metrics(applyTherapyDose(profileInputs(p), t, dose));
    const ch = (x: number, y: number) => (x ? y / x - 1 : 0);
    const so = bestProjectionTherapy(p, dose, "so", t.id)!; const hh = bestProjectionTherapy(p, dose, "h2", t.id)!;
    const ms = projectedMitoSox(p.values.mitosox, 1, so.fold);
    const pH2 = h2 === undefined ? null : projectedH2o2(h2, 1, hh.fold);
    const clears = (msOut && !ms.outside ? 1 : 0) + (h2 !== undefined && h2 > 100 && pH2 && !pH2.outside ? 1 : 0);
    return { t, targets: f.detail.split("targets ")[1] ?? "", atp: ch(b.atp, a.atp), so: ch(b.superoxide, a.superoxide), h2: ch(b.h2o2, a.h2o2), ms, msOut, pH2, h2Out: h2 !== undefined && h2 > 100, clears };
  }).sort((x, y) => y.clears - x.clears || x.ms.value - y.ms.value);
}
