import { defaultGeometry, defaultInputs, inputRanges, simulate, type Inputs } from "./model";
import { atpNetworkRangeFlags, effectiveAtpCost, etcSteps } from "./reference";
import { rosSourceRows } from "./rosPhysiology";
import { inputsFromPatient, type DemoPatient } from "./patientReference";
import type { Mechanism, diagnoseProfile } from "./diagnosis";
import { activeRirr } from "./rirrDefault";

// Therapy classes mapped to existing model sliders. Research levers only:
// slider moves are illustrative, never doses or recommendations.
export type EvidenceStatus = "Approved for other uses" | "Clinical trials" | "Preclinical" | "Model lever only";
export type Therapy = {
  id: string;
  name: string;
  examples: string;
  mechanisms: Mechanism[];
  /** Relative (×) or absolute (=) change per slider. */
  moves: { key: keyof Inputs; mode: "times" | "set" | "plus"; value: number }[];
  status: EvidenceStatus;
  /** Published clinical or trial dose that the 1x model dose is anchored to. Illustrative link only, never a dosing guide. */
  clinicalDose: string;
  /** Source (label, fact sheet or trial listing) for the real-world dose anchor. */
  doseSource?: { text: string; url: string };
  note: string;
  citation?: { text: string; url: string };
};

export const therapies: Therapy[] = [
  { id: "antioxidant", name: "Mitochondrial antioxidant support", examples: "MitoQ, N-acetylcysteine", mechanisms: ["oxidant"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.5 }], clinicalDose: "MitoQ 20-40 mg/day, NAC 600-1800 mg/day (trial doses)", status: "Clinical trials", doseSource: { text: "MitoQ and NAC trial doses (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=mitoquinone" }, note: "Raises the lumped Prx3/GPx/GSH sink; does not fix the upstream source." },
  { id: "chelation", name: "Iron chelation", examples: "Deferiprone", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.5 }], clinicalDose: "Deferiprone 75-100 mg/kg/day in 3 divided doses (iron overload label)", status: "Approved for other uses", doseSource: { text: "Ferriprox (deferiprone) EMA label", url: "https://www.ema.europa.eu/en/medicines/human/EPAR/ferriprox" }, note: "Lowers labile Fe2+, which feeds Fenton chemistry and Fe-S damage." },
  { id: "ferroptosis", name: "Ferroptosis protection", examples: "GPx4 / FSP1 support, CoQ10, PUFA restriction", mechanisms: ["iron", "oxidant"], moves: [{ key: "gpx4", mode: "times", value: 1.4 }, { key: "fsp1", mode: "times", value: 1.4 }, { key: "cardiolipinPufa", mode: "times", value: 0.85 }], clinicalDose: "CoQ10 100-300 mg/day (trials); PUFA restriction is dietary, no fixed dose", status: "Preclinical", doseSource: { text: "CoQ10 fact sheet (NIH Office of Dietary Supplements)", url: "https://ods.od.nih.gov/factsheets/CoenzymeQ10-HealthProfessional/" }, note: "Raises lipid hydroperoxide removal and lowers peroxidizable substrate.", citation: { text: "Dixon et al. 2012, Cell 149:1060-1072", url: "https://doi.org/10.1016/j.cell.2012.03.042" } },
  { id: "uncoupling", name: "Mild uncoupling", examples: "UCP activation, controlled-release uncouplers", mechanisms: ["oxidant"], moves: [{ key: "uncoupling", mode: "plus", value: 0.1 }], clinicalDose: "No approved dose; research compounds only", status: "Preclinical", note: "Lowers high-potential reverse electron transport ROS but raises ATP cost. Worsens coupling loss." },
  { id: "complex2", name: "Complex II / succinate bypass", examples: "Succinate prodrugs, riboflavin", mechanisms: ["respiratory"], moves: [{ key: "succinate", mode: "times", value: 1.5 }], clinicalDose: "Riboflavin 100-400 mg/day (mitochondrial disease reports)", status: "Preclinical", doseSource: { text: "Riboflavin fact sheet (NIH Office of Dietary Supplements)", url: "https://ods.od.nih.gov/factsheets/Riboflavin-HealthProfessional/" }, note: "Feeds electrons past a Complex I block." },
  { id: "nad", name: "NAD+ precursors", examples: "Nicotinamide riboside, NMN", mechanisms: ["respiratory", "pyruvate"], moves: [{ key: "nadhRatio", mode: "times", value: 1.15 }], clinicalDose: "Nicotinamide riboside 300-1000 mg/day (trial doses)", status: "Clinical trials", doseSource: { text: "Nicotinamide riboside trials (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=nicotinamide%20riboside" }, note: "Model proxy: shifts the NADH pool supplied to Complex I." },
  { id: "pyruvate", name: "Pyruvate entry support", examples: "Dichloroacetate, ketogenic diet", mechanisms: ["pyruvate"], moves: [{ key: "nadhRatio", mode: "times", value: 1.1 }, { key: "succinate", mode: "times", value: 1.2 }], clinicalDose: "DCA 12.5-25 mg/kg/day (trials); ketogenic diet classically 4:1", status: "Clinical trials", doseSource: { text: "Dichloroacetate trials (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=dichloroacetate" }, note: "DCA activates PDH; ketones bypass it. Both mapped to fuel supply, not P/O." },
  { id: "pbm", name: "Photobiomodulation", examples: "660 nm red, 810 nm near-infrared", mechanisms: ["respiratory", "coupling"], moves: [{ key: "redDose", mode: "set", value: 3 }, { key: "nirDose", mode: "set", value: 3 }], clinicalDose: "660/810 nm, about 1-10 J/cm2 per session (trial protocols)", status: "Clinical trials", doseSource: { text: "Photobiomodulation trial protocols (Hamblin 2017)", url: "https://doi.org/10.3934/biophy.2017.3.337" }, note: "Raises cytochrome c oxidase turnover and releases bound NO at low dose; high dose inhibits.", citation: { text: "Hamblin 2017, AIMS Biophys 4:337-361", url: "https://doi.org/10.3934/biophy.2017.3.337" } },
  { id: "no", name: "Nitric oxide reduction", examples: "NOS modulation (research)", mechanisms: ["respiratory"], moves: [{ key: "nitricOxide", mode: "times", value: 0.5 }], clinicalDose: "No clinical dose; model lever only", status: "Model lever only", note: "Relieves NO competition with O2 at Complex IV." },
  { id: "oxygen", name: "Oxygen support", examples: "Reperfusion, supplemental oxygen", mechanisms: ["respiratory", "coupling"], moves: [{ key: "oxygen", mode: "times", value: 1.5 }], clinicalDose: "Supplemental O2 titrated to oxygen saturation (clinical standard)", status: "Approved for other uses", doseSource: { text: "Oxygen therapy overview (MedlinePlus)", url: "https://medlineplus.gov/oxygentherapy.html" }, note: "Relevant to acute ischemia; reoxygenation can also raise ROS." },
  { id: "dfo", name: "Deferoxamine chelation", examples: "Deferoxamine (DFO)", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.4 }], clinicalDose: "Deferoxamine 20-40 mg/kg/day subcutaneous infusion (label)", status: "Approved for other uses", doseSource: { text: "Desferal (deferoxamine) label (DailyMed)", url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=deferoxamine" }, note: "Strong Fe3+ chelator; model lowers labile iron more than deferiprone. Poor cell entry in vivo is not modeled." },
  { id: "deferasirox", name: "Oral chelation (deferasirox)", examples: "Deferasirox", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.65 }], clinicalDose: "Deferasirox 20-40 mg/kg/day oral (label)", status: "Approved for other uses", doseSource: { text: "Exjade (deferasirox) EMA label", url: "https://www.ema.europa.eu/en/medicines/human/EPAR/exjade" }, note: "Milder labile iron drop in the model; mainly lowers body iron stores." },
  { id: "mitoChelator", name: "Mitochondria-targeted chelator", examples: "mitoDFO and related research compounds", mechanisms: ["iron", "oxidant"], moves: [{ key: "labileIron", mode: "times", value: 0.3 }], clinicalDose: "No clinical dose; preclinical compounds", status: "Preclinical", note: "Targets the matrix labile iron pool that feeds Fe-S damage and Fenton chemistry." },
  { id: "mitoAntiox", name: "Mitochondria-targeted antioxidant", examples: "SkQ1, MitoQ", mechanisms: ["oxidant"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.8 }], clinicalDose: "MitoQ 20-40 mg/day (trials); SkQ1 studied mainly topically", status: "Clinical trials", doseSource: { text: "MitoQ trials (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=mitoquinone" }, note: "Larger rise in the lumped matrix sink than general antioxidants; source rates unchanged." },
  { id: "nac", name: "Glutathione precursor", examples: "N-acetylcysteine", mechanisms: ["oxidant", "iron"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.3 }, { key: "gpx4", mode: "times", value: 1.15 }], clinicalDose: "NAC 600-1800 mg/day oral (common trial doses)", status: "Approved for other uses", doseSource: { text: "N-acetylcysteine trial doses (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=N-acetylcysteine" }, note: "Supplies cysteine for glutathione, which supports peroxide removal and GPx4." },
  { id: "selenium", name: "GPx4 cofactor support", examples: "Selenium", mechanisms: ["iron", "oxidant"], moves: [{ key: "gpx4", mode: "times", value: 1.3 }], clinicalDose: "Selenium 100-200 micrograms/day (supplement trials)", status: "Clinical trials", doseSource: { text: "Selenium fact sheet (NIH Office of Dietary Supplements)", url: "https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/" }, note: "GPx4 is a selenoprotein; model raises GPx4 activity only." },
  { id: "rta", name: "Lipid radical-trapping antioxidants", examples: "Vitamin E, ferrostatin-1, liproxstatin-1", mechanisms: ["iron", "oxidant"], moves: [{ key: "fsp1", mode: "times", value: 1.3 }], clinicalDose: "Vitamin E 400 IU/day (trials); ferrostatin-1 and liproxstatin-1 preclinical only", status: "Preclinical", doseSource: { text: "Vitamin E fact sheet (NIH Office of Dietary Supplements)", url: "https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/" }, note: "Model proxy: raises the lipid radical-trapping capacity lumped with FSP1 / CoQ10H2." },
  { id: "coq", name: "Quinone electron carriers", examples: "CoQ10, idebenone", mechanisms: ["respiratory", "oxidant"], moves: [{ key: "fsp1", mode: "times", value: 1.25 }, { key: "succinate", mode: "times", value: 1.1 }], clinicalDose: "CoQ10 100-300 mg/day; idebenone 300-900 mg/day (trials)", status: "Clinical trials", doseSource: { text: "CoQ10 fact sheet (NIH Office of Dietary Supplements)", url: "https://ods.od.nih.gov/factsheets/CoenzymeQ10-HealthProfessional/" }, note: "Model proxy: more reduced quinone for lipid protection and slightly more Q-pool electron supply." },
  { id: "cardiolipin", name: "Cardiolipin protection", examples: "Elamipretide (SS-31)", mechanisms: ["coupling", "oxidant"], moves: [{ key: "cardiolipinPufa", mode: "times", value: 0.9 }, { key: "antioxidantCapacity", mode: "times", value: 1.1 }], clinicalDose: "Elamipretide 40 mg/day subcutaneous (trial dose)", status: "Clinical trials", doseSource: { text: "Elamipretide trials (ClinicalTrials.gov)", url: "https://clinicaltrials.gov/search?term=elamipretide" }, note: "Model proxy: less peroxidizable cardiolipin and a small sink rise; cristae shape effects are not modeled." },
  { id: "mb", name: "Alternative electron carrier", examples: "Methylene blue", mechanisms: ["respiratory"], moves: [{ key: "succinate", mode: "times", value: 1.25 }], clinicalDose: "Methylene blue 1-2 mg/kg IV (approved uses); low-dose oral use is research only", status: "Approved for other uses", doseSource: { text: "Methylene blue label (DailyMed)", url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=methylene+blue" }, note: "Model proxy: extra electron supply past a Complex I block; high doses can generate ROS (not modeled)." },
];

export function applyTherapy(base: Inputs, t: Therapy): Inputs {
  const next = { ...base };
  for (const m of t.moves) {
    const r = inputRanges[m.key];
    const v = m.mode === "times" ? base[m.key] * m.value : m.mode === "plus" ? base[m.key] + m.value : m.value;
    next[m.key] = Math.min(r.max, Math.max(r.min, v));
  }
  return next;
}

export const moveLabel = (m: Therapy["moves"][number]) => {
  const r = inputRanges[m.key];
  if (m.mode === "times") return `${r.label} ${m.value >= 1 ? "+" : ""}${Math.round((m.value - 1) * 100)}%`;
  if (m.mode === "plus") return `${r.label} +${m.value} ${r.unit}`;
  return `${r.label} set to ${m.value} ${r.unit}`;
};

const stdCost = effectiveAtpCost(defaultInputs.deltaPsi, defaultInputs.uncoupling);
export function metrics(inputs: Inputs) {
  const out = simulate(inputs, defaultGeometry);
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const atpFlags = etcSteps.filter((s) => { const f = atpNetworkRangeFlags(s, stdCost, cost); return f.evOutside || f.costBOutside; }).length;
  const rosFlags = rosSourceRows(out, simulate(defaultInputs, defaultGeometry), inputs, defaultInputs).filter((r) => r.flagged).length;
  return { atp: out.atpFlux, cost, superoxide: out.superoxide, h2o2: out.hydrogenPeroxide, atpFlags, rosFlags };
}

/** Profile state = measured baseline (membrane potential, labile iron, inverse MitoSOX), same mapping as "Run in Simulator". */
export const profileInputs = (p: DemoPatient): Inputs => {
  const own = profileRirr(p.id);
  const s = own !== null ? own : activeRirr();
  return { ...defaultInputs, ...inputsFromPatient(p).patch, ...(s !== null ? { rirrStrength: s } : {}) };
};

export function simulateTherapy(p: DemoPatient, t: Therapy) {
  const before = profileInputs(p);
  const after = applyTherapy(before, t);
  return { before: metrics(before), after: metrics(after), inputs: after };
}

export function rankTherapies(d: ReturnType<typeof diagnoseProfile>) {
  // Only strong causes (score >= 1.5, same cutoff as Diagnosis) count as targets.
  const flagged = new Set(d.causes.filter((c) => c.score >= 1.5).map((c) => c.mechanism));
  return therapies.map((t) => {
    const sim = simulateTherapy(d.patient, t);
    const targeted = t.mechanisms.filter((m) => flagged.has(m));
    const flagDrop = sim.before.atpFlags + sim.before.rosFlags - sim.after.atpFlags - sim.after.rosFlags;
    const matchScore = Math.max(0, ...targeted.map((m) => d.causes.find((c) => c.mechanism === m)?.score ?? 0));
    return { therapy: t, sim, targeted, flagDrop, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore || a.therapy.mechanisms.length - b.therapy.mechanisms.length || b.targeted.length - a.targeted.length || b.flagDrop - a.flagDrop);
}

/** Profiles where this therapy matches a strong cause (score >= 1.5), for the Treatment page's disorder list. */
export function therapyTargets(t: Therapy, all: ReturnType<typeof diagnoseProfile>[]) {
  return all.map((d) => {
    const matched = d.causes.filter((c) => c.score >= 1.5 && t.mechanisms.includes(c.mechanism));
    return matched.length ? { patient: d.patient, matched } : null;
  }).filter((x) => x !== null);
}
export function modelDoses(base: Inputs, t: Therapy) {
  const after = applyTherapy(base, t);
  return t.moves.map((m) => ({ key: m.key, label: inputRanges[m.key].label, unit: inputRanges[m.key].unit, before: base[m.key], after: after[m.key], clamped: after[m.key] !== (m.mode === "times" ? base[m.key] * m.value : m.mode === "plus" ? base[m.key] + m.value : m.value) }));
}

/** Plan: per strong cause, the best-ranked therapy targeting it; combined effect applies each once, in order. */
export function buildPlan(d: ReturnType<typeof diagnoseProfile>) {
  const ranked = rankTherapies(d);
  const strong = d.causes.filter((c) => c.score >= 1.5);
  const steps = strong.map((c) => ({ cause: c, options: ranked.filter((r) => r.therapy.mechanisms.includes(c.mechanism)) }));
  const chosen: Therapy[] = [];
  for (const s of steps) { const pick = s.options.find((o) => !chosen.includes(o.therapy)); if (pick) chosen.push(pick.therapy); }
  const before = profileInputs(d.patient);
  const after = chosen.reduce((acc, t) => applyTherapy(acc, t), before);
  return { steps, chosen, before: metrics(before), after: metrics(after), inputs: after, startInputs: before };
}

/** Model dose = fraction of the therapy's slider move (0 = none, 1 = Treatment page move, 2 = double). Never a drug dose. */
export function applyTherapyDose(base: Inputs, t: Therapy, dose: number): Inputs {
  const next = { ...base };
  for (const m of t.moves) {
    const r = inputRanges[m.key];
    const b = base[m.key];
    const v = m.mode === "times" ? b * Math.max(0, 1 + (m.value - 1) * dose) : m.mode === "plus" ? b + m.value * dose : b + (m.value - b) * dose;
    next[m.key] = Math.min(r.max, Math.max(r.min, v));
  }
  return next;
}

export const calculatorDoses = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** ATP and ROS readouts across model doses, stacked on the patient's measured baseline. */
export function doseResponse(p: DemoPatient, t: Therapy, doses = calculatorDoses) {
  const base = profileInputs(p);
  const zero = metrics(base);
  return doses.map((dose) => {
    const inputs = applyTherapyDose(base, t, dose);
    const m = metrics(inputs);
    return { dose, inputs, ...m, atpChange: zero.atp ? m.atp / zero.atp - 1 : 0, superoxideChange: zero.superoxide ? m.superoxide / zero.superoxide - 1 : 0, h2o2Change: zero.h2o2 ? m.h2o2 / zero.h2o2 - 1 : 0 };
  });
}

export type TargetDir = "up" | "down" | "flat";
export const overlapReadouts = [{ key: "atp", label: "ATP flux" }, { key: "superoxide", label: "Superoxide" }, { key: "h2o2", label: "H2O2" }] as const;
const dirOf = (a: number, b: number): TargetDir => { const c = a ? b / a - 1 : 0; return c > 0.01 ? "up" : c < -0.01 ? "down" : "flat"; };

/** Which therapies move ATP and ROS readouts the same way (±1% at 1x) on this patient's baseline. Shared targets, not equivalence. */
export function therapyOverlap(p: DemoPatient) {
  const items = therapies.map((t) => {
    const s = simulateTherapy(p, t);
    const dirs = { atp: dirOf(s.before.atp, s.after.atp), superoxide: dirOf(s.before.superoxide, s.after.superoxide), h2o2: dirOf(s.before.h2o2, s.after.h2o2) };
    return { therapy: t, dirs, sliders: t.moves.map((m) => m.key) };
  });
  const sig = (d: Record<string, TargetDir>) => overlapReadouts.map((r) => `${r.label} ${d[r.key]}`).join(", ");
  const groups = new Map<string, typeof items>();
  for (const i of items) groups.set(sig(i.dirs), [...(groups.get(sig(i.dirs)) ?? []), i]);
  const perTherapy = items.map((i) => {
    const moved = overlapReadouts.filter((r) => i.dirs[r.key] !== "flat");
    const partners = items.filter((o) => o !== i).map((o) => ({
      therapy: o.therapy,
      shared: moved.filter((r) => o.dirs[r.key] === i.dirs[r.key]).map((r) => `${r.label} ${i.dirs[r.key]}`),
      sliders: i.sliders.filter((k) => o.sliders.includes(k)),
    })).filter((x) => x.shared.length).sort((a, b) => b.shared.length - a.shared.length || b.sliders.length - a.sliders.length);
    return { ...i, total: moved.length, partners };
  });
  return { groups: [...groups.entries()].map(([signature, members]) => ({ signature, members })).sort((a, b) => b.members.length - a.members.length), perTherapy };
}

/**
 * Single source of truth for projected flag clearance: the therapy that lowers
 * the model's superoxide ("so") or peroxide ("h2") the most on this profile at
 * the given model dose. Searches every therapy unless `onlyId` names one.
 * Returns the after/before fold, used to scale the measured value.
 */
export function bestProjectionTherapy(p: DemoPatient, dose: number, readout: "so" | "h2", onlyId?: string): { t: Therapy; fold: number } | null {
  const b = metrics(profileInputs(p));
  const base = readout === "so" ? b.superoxide : b.h2o2;
  const pool = onlyId ? therapies.filter((t) => t.id === onlyId) : therapies;
  const scored = pool.map((t) => {
    const a = metrics(applyTherapyDose(profileInputs(p), t, dose));
    return { t, fold: base > 0 ? (readout === "so" ? a.superoxide : a.h2o2) / base : 1 };
  });
  return scored.sort((x, y) => x.fold - y.fold)[0] ?? null;
}
