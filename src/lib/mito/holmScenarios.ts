import { defaultInputs, type Inputs, type Outputs } from "./model";

/** Holm-style iron-sulfur teaching scenarios. Model settings only, assumed; not clinical cases. */
export const HOLM_SCENARIOS: { key: string; name: string; notes: string; inputs: Partial<Inputs> }[] = [
  { key: "weak", name: "Holm 1: Weak defences (Sod2-like)", notes: "Antioxidant capacity 0.2x. Expect mostly 3-iron clusters: superoxide damage with slow repair.", inputs: { antioxidantCapacity: 0.2 } },
  { key: "iron", name: "Holm 2a: Iron overload (Friedreich-like)", notes: "Labile iron 8 µM, defences 0.7x, no chelator. High free iron, clusters mostly intact.", inputs: { labileIron: 8, antioxidantCapacity: 0.7 } },
  { key: "iron-chel", name: "Holm 2b: Iron overload + 60% chelation", notes: "As 2a with 60% of labile iron chelator-bound. Lower Fenton and lipid damage, slower cluster repair.", inputs: { labileIron: 8, antioxidantCapacity: 0.7, chelatorBound: 0.6 } },
  { key: "ret", name: "Holm 3: Reverse electron flow", notes: "Potential 185 mV, succinate 1.6, NADH 0.8, uncoupling 0.02. Peroxide strips clusters fully.", inputs: { deltaPsi: 185, succinate: 1.6, nadhRatio: 0.8, uncoupling: 0.02 } },
  { key: "cu", name: "Holm 4: Copper-poor complex IV", notes: "Copper 0.3x. Low ATP with intact clusters: a copper-end problem.", inputs: { copperCiv: 0.3 } },
];

export function holmInputs(p: Partial<Inputs>, rirrStrength?: number): Inputs {
  return { ...defaultInputs, ...(rirrStrength != null ? { rirrStrength } : {}), ...p };
}

/** Damage signature from the four Holm patterns, compared with a healthy reference output. Rule-based, not a diagnosis. */
export function damageSignature(o: Outputs, healthy: Outputs): { label: string; tone: "bad" | "warn" | "ok" } {
  const fes = o.fesIntact, f3 = o.fes3Fe ?? 0, apo = o.fesApo ?? 0;
  const clustersHit = fes < healthy.fesIntact - 10;
  if (clustersHit && apo > f3) return { label: "Mostly stripped clusters: peroxide-driven damage", tone: "bad" };
  if (clustersHit) return { label: "Mostly 3-iron clusters: superoxide damage, slow repair", tone: "bad" };
  if (o.freeIron > healthy.freeIron * 2) return { label: "High free iron, clusters intact: iron overload", tone: "warn" };
  if (o.atpFlux < healthy.atpFlux * 0.9) return { label: "Low ATP, clusters intact: copper or oxygen end", tone: "warn" };
  return { label: "No distinct cluster signature", tone: "ok" };
}
