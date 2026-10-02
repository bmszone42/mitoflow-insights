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
  const flagged = new Set(d.causes.filter((c) => c.score > 0).map((c) => c.mechanism));
  return therapies.map((t) => {
    const sim = simulateTherapy(d.patient, t);
    const targeted = t.mechanisms.filter((m) => flagged.has(m));
    const flagDrop = sim.before.atpFlags + sim.before.rosFlags - sim.after.atpFlags - sim.after.rosFlags;
    const matchScore = t.mechanisms.reduce((s, m) => s + (d.causes.find((c) => c.mechanism === m)?.score ?? 0), 0);
    return { therapy: t, sim, targeted, flagDrop, matchScore };
  }).sort((a, b) => b.targeted.length - a.targeted.length || b.matchScore - a.matchScore || b.flagDrop - a.flagDrop);
}
