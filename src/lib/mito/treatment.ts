import { defaultGeometry, defaultInputs, inputRanges, simulate, type Inputs } from "./model";
import { atpNetworkRangeFlags, effectiveAtpCost, etcSteps } from "./reference";
import { rosSourceRows } from "./rosPhysiology";
import type { DemoPatient } from "./patientReference";
import type { Mechanism, diagnoseProfile } from "./diagnosis";

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
  note: string;
  citation?: { text: string; url: string };
};

export const therapies: Therapy[] = [
  { id: "antioxidant", name: "Mitochondrial antioxidant support", examples: "MitoQ, N-acetylcysteine", mechanisms: ["oxidant"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.5 }], status: "Clinical trials", note: "Raises the lumped Prx3/GPx/GSH sink; does not fix the upstream source." },
  { id: "chelation", name: "Iron chelation", examples: "Deferiprone", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.5 }], status: "Approved for other uses", note: "Lowers labile Fe2+, which feeds Fenton chemistry and Fe-S damage." },
  { id: "ferroptosis", name: "Ferroptosis protection", examples: "GPx4 / FSP1 support, CoQ10, PUFA restriction", mechanisms: ["iron", "oxidant"], moves: [{ key: "gpx4", mode: "times", value: 1.4 }, { key: "fsp1", mode: "times", value: 1.4 }, { key: "cardiolipinPufa", mode: "times", value: 0.85 }], status: "Preclinical", note: "Raises lipid hydroperoxide removal and lowers peroxidizable substrate.", citation: { text: "Dixon et al. 2012, Cell 149:1060-1072", url: "https://doi.org/10.1016/j.cell.2012.03.042" } },
  { id: "uncoupling", name: "Mild uncoupling", examples: "UCP activation, controlled-release uncouplers", mechanisms: ["oxidant"], moves: [{ key: "uncoupling", mode: "plus", value: 0.1 }], status: "Preclinical", note: "Lowers high-potential reverse electron transport ROS but raises ATP cost. Worsens coupling loss." },
  { id: "complex2", name: "Complex II / succinate bypass", examples: "Succinate prodrugs, riboflavin", mechanisms: ["respiratory"], moves: [{ key: "succinate", mode: "times", value: 1.5 }], status: "Preclinical", note: "Feeds electrons past a Complex I block." },
  { id: "nad", name: "NAD+ precursors", examples: "Nicotinamide riboside, NMN", mechanisms: ["respiratory", "pyruvate"], moves: [{ key: "nadhRatio", mode: "times", value: 1.15 }], status: "Clinical trials", note: "Model proxy: shifts the NADH pool supplied to Complex I." },
  { id: "pyruvate", name: "Pyruvate entry support", examples: "Dichloroacetate, ketogenic diet", mechanisms: ["pyruvate"], moves: [{ key: "nadhRatio", mode: "times", value: 1.1 }, { key: "succinate", mode: "times", value: 1.2 }], status: "Clinical trials", note: "DCA activates PDH; ketones bypass it. Both mapped to fuel supply, not P/O." },
  { id: "pbm", name: "Photobiomodulation", examples: "660 nm red, 810 nm near-infrared", mechanisms: ["respiratory", "coupling"], moves: [{ key: "redDose", mode: "set", value: 3 }, { key: "nirDose", mode: "set", value: 3 }], status: "Clinical trials", note: "Raises cytochrome c oxidase turnover and releases bound NO at low dose; high dose inhibits.", citation: { text: "Hamblin 2017, AIMS Biophys 4:337-361", url: "https://doi.org/10.3934/biophy.2017.3.337" } },
  { id: "no", name: "Nitric oxide reduction", examples: "NOS modulation (research)", mechanisms: ["respiratory"], moves: [{ key: "nitricOxide", mode: "times", value: 0.5 }], status: "Model lever only", note: "Relieves NO competition with O2 at Complex IV." },
  { id: "oxygen", name: "Oxygen support", examples: "Reperfusion, supplemental oxygen", mechanisms: ["respiratory", "coupling"], moves: [{ key: "oxygen", mode: "times", value: 1.5 }], status: "Approved for other uses", note: "Relevant to acute ischemia; reoxygenation can also raise ROS." },
  { id: "dfo", name: "Deferoxamine chelation", examples: "Deferoxamine (DFO)", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.4 }], status: "Approved for other uses", note: "Strong Fe3+ chelator; model lowers labile iron more than deferiprone. Poor cell entry in vivo is not modeled." },
  { id: "deferasirox", name: "Oral chelation (deferasirox)", examples: "Deferasirox", mechanisms: ["iron"], moves: [{ key: "labileIron", mode: "times", value: 0.65 }], status: "Approved for other uses", note: "Milder labile iron drop in the model; mainly lowers body iron stores." },
  { id: "mitoChelator", name: "Mitochondria-targeted chelator", examples: "mitoDFO and related research compounds", mechanisms: ["iron", "oxidant"], moves: [{ key: "labileIron", mode: "times", value: 0.3 }], status: "Preclinical", note: "Targets the matrix labile iron pool that feeds Fe-S damage and Fenton chemistry." },
  { id: "mitoAntiox", name: "Mitochondria-targeted antioxidant", examples: "SkQ1, MitoQ", mechanisms: ["oxidant"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.8 }], status: "Clinical trials", note: "Larger rise in the lumped matrix sink than general antioxidants; source rates unchanged." },
  { id: "nac", name: "Glutathione precursor", examples: "N-acetylcysteine", mechanisms: ["oxidant", "iron"], moves: [{ key: "antioxidantCapacity", mode: "times", value: 1.3 }, { key: "gpx4", mode: "times", value: 1.15 }], status: "Approved for other uses", note: "Supplies cysteine for glutathione, which supports peroxide removal and GPx4." },
  { id: "selenium", name: "GPx4 cofactor support", examples: "Selenium", mechanisms: ["iron", "oxidant"], moves: [{ key: "gpx4", mode: "times", value: 1.3 }], status: "Clinical trials", note: "GPx4 is a selenoprotein; model raises GPx4 activity only." },
  { id: "rta", name: "Lipid radical-trapping antioxidants", examples: "Vitamin E, ferrostatin-1, liproxstatin-1", mechanisms: ["iron", "oxidant"], moves: [{ key: "fsp1", mode: "times", value: 1.3 }], status: "Preclinical", note: "Model proxy: raises the lipid radical-trapping capacity lumped with FSP1 / CoQ10H2." },
  { id: "coq", name: "Quinone electron carriers", examples: "CoQ10, idebenone", mechanisms: ["respiratory", "oxidant"], moves: [{ key: "fsp1", mode: "times", value: 1.25 }, { key: "succinate", mode: "times", value: 1.1 }], status: "Clinical trials", note: "Model proxy: more reduced quinone for lipid protection and slightly more Q-pool electron supply." },
  { id: "cardiolipin", name: "Cardiolipin protection", examples: "Elamipretide (SS-31)", mechanisms: ["coupling", "oxidant"], moves: [{ key: "cardiolipinPufa", mode: "times", value: 0.9 }, { key: "antioxidantCapacity", mode: "times", value: 1.1 }], status: "Clinical trials", note: "Model proxy: less peroxidizable cardiolipin and a small sink rise; cristae shape effects are not modeled." },
  { id: "mb", name: "Alternative electron carrier", examples: "Methylene blue", mechanisms: ["respiratory"], moves: [{ key: "succinate", mode: "times", value: 1.25 }], status: "Approved for other uses", note: "Model proxy: extra electron supply past a Complex I block; high doses can generate ROS (not modeled)." },
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
function metrics(inputs: Inputs) {
  const out = simulate(inputs, defaultGeometry);
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const atpFlags = etcSteps.filter((s) => { const f = atpNetworkRangeFlags(s, stdCost, cost); return f.evOutside || f.costBOutside; }).length;
  const rosFlags = rosSourceRows(out, simulate(defaultInputs, defaultGeometry), inputs, defaultInputs).filter((r) => r.flagged).length;
  return { atp: out.atpFlux, cost, superoxide: out.superoxide, h2o2: out.hydrogenPeroxide, atpFlags, rosFlags };
}

/** Profile state = its membrane potential, other inputs default (same rule as Diagnosis). */
export const profileInputs = (p: DemoPatient): Inputs => ({ ...defaultInputs, deltaPsi: p.values.membranePotential });

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

/** Model dose = the slider value a therapy sets, shown as before to after. Never a drug dose. */
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
