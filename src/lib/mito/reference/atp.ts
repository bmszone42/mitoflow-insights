import { defaultInputs, simulate, type Inputs, type Outputs } from "../model";
import { type EtcStep } from "./etc";
export const H_PER_ATP = 4;
export const ATP_COST_EV = 0.52;
// Literature-informed ATP synthesis energy band (eV/ATP), used as a visual
// reference for the network. Effective cost under leak is a model proxy, not
// a directly measured step-specific textbook interval.
export const ATP_COST_TEXTBOOK = { lo: 0.5, hi: 0.62 } as const;
export function effectiveAtpCost(psi: number, uncoupling: number): number {
  return ATP_COST_EV * (psi / STD_PSI) * (1 - STD_UNCOUPLING) / Math.max(1 - uncoupling, 1e-6);
}
export function atpNetworkRangeFlags(
  step: Pick<EtcStep, "ev" | "tbLo" | "tbHi" | "protons">,
  costA: number,
  costB: number,
) {
  const outsideCost = (cost: number) => step.protons > 0 &&
    (cost < ATP_COST_TEXTBOOK.lo - 1e-9 || cost > ATP_COST_TEXTBOOK.hi + 1e-9);
  return {
    evOutside: step.ev < step.tbLo - 1e-9 || step.ev > step.tbHi + 1e-9,
    costAOutside: outsideCost(costA),
    costBOutside: outsideCost(costB),
  };
}

export type AtpFlagContext = {
  psi: number;
  uncoupling: number;
  poNadh: number;
  poFadh2: number;
};

export function atpFlagContext(psi: number, uncoupling: number): AtpFlagContext {
  return {
    psi,
    uncoupling,
    poNadh: poRatio(psi, uncoupling, "nadh"),
    poFadh2: poRatio(psi, uncoupling, "fadh2"),
  };
}

export function atpCostFlagCause(
  step: Pick<EtcStep, "step" | "protons">,
  context: AtpFlagContext,
): string | null {
  if (step.protons <= 0) return null;
  const cost = effectiveAtpCost(context.psi, context.uncoupling);
  const high = cost > ATP_COST_TEXTBOOK.hi + 1e-9;
  const low = cost < ATP_COST_TEXTBOOK.lo - 1e-9;
  if (!high && !low) return null;

  const drivers: string[] = [];
  if ((high && context.psi > STD_PSI) || (low && context.psi < STD_PSI)) {
    drivers.push(`membrane potential ${context.psi.toFixed(0)} mV vs ${STD_PSI} mV`);
  }
  if ((high && context.uncoupling > STD_UNCOUPLING) || (low && context.uncoupling < STD_UNCOUPLING)) {
    drivers.push(`uncoupling ${(context.uncoupling * 100).toFixed(0)}% vs ${(STD_UNCOUPLING * 100).toFixed(0)}%`);
  }
  if (drivers.length === 0) {
    drivers.push(`combined membrane potential ${context.psi.toFixed(0)} mV and uncoupling ${(context.uncoupling * 100).toFixed(0)}%`);
  }

  const fadhPath = step.step.includes("II (FADH2)");
  const po = fadhPath ? context.poFadh2 : context.poNadh;
  const stdPo = poRatio(STD_PSI, STD_UNCOUPLING, fadhPath ? "fadh2" : "nadh");
  return `${drivers.join(" + ")}; resulting ${fadhPath ? "FADH2" : "NADH"} P/O ${po.toFixed(2)} vs ${stdPo.toFixed(2)}`;
}
export function atpPerPair(s: EtcStep): { proton: number; energy: number } {
  return {
    proton: s.protons / H_PER_ATP,
    energy: Math.max(0, (s.ev * 2) / ATP_COST_EV),
  };
}

/*
 * Live in-situ yield: scales the standard-state estimate with membrane
 * potential and uncoupling. A higher deltaPsi raises the free-energy cost of
 * making ATP (cost scales with psi / 160 mV reference), so the energy-based
 * yield falls; uncoupling bleeds protons past the synthase, so both yields
 * scale with (1 - uncoupling). Proton stoichiometry itself is fixed.
 */
export function liveAtpPerPair(s: EtcStep, psi: number, uncoupling: number): { proton: number; energy: number; costEv: number } {
  const costEv = ATP_COST_EV * (psi / 160);
  const coup = Math.max(0, 1 - uncoupling);
  return {
    proton: (s.protons / H_PER_ATP) * coup,
    energy: Math.max(0, (s.ev * 2) / costEv) * coup,
    costEv,
  };
}

/*
 * P/O ratio: ATP made per oxygen atom reduced (one electron pair reduces one
 * O atom, half an O2). Summed from the live proton-based step yields.
 * NADH path pumps at Complexes I, III and IV; the succinate (FADH2) path
 * enters at Complex II and skips the Complex I steps. Standard state gives
 * the classic 2.5 and 1.5.
 */
export function poRatio(psi: number, uncoupling: number, path: "nadh" | "fadh2"): number {
  return etcSteps
    .filter((s) => !s.step.startsWith("Overall") && !(path === "fadh2" && s.step.startsWith("Complex I ")))
    .reduce((acc, s) => acc + liveAtpPerPair(s, psi, uncoupling).proton, 0);
}

// Approximate experimental P/O estimates summarized by Hinkle, not clinical
// intervals. Keep the Physiology benchmark and Warburg view on the same bands.
export const poLiteratureBands = {
  nadh: { label: "NADH-linked P/O", low: 2.3, high: 2.7 },
  fadh2: { label: "Succinate-linked P/O", low: 1.4, high: 1.7 },
  source: "Hinkle, Biochim Biophys Acta. 2005;1706:1–11",
  url: "https://doi.org/10.1016/j.bbabio.2004.09.004",
} as const;

/*
 * Glycolysis vs respiration ATP split. Estimate: glycolysis covers any
 * shortfall below the default-condition ATP demand, with a 5% basal floor.
 * Not a measured lactate rate.
 */
export const ATP_DEMAND = simulate(defaultInputs).atpFlux;
export function atpSplit(o: Outputs): { respiration: number; glycolysis: number; glycolysisPct: number } {
  const glyco = Math.max(0.05 * ATP_DEMAND, ATP_DEMAND - o.atpFlux);
  const tot = glyco + o.atpFlux;
  return { respiration: o.atpFlux, glycolysis: glyco, glycolysisPct: tot > 0 ? (glyco / tot) * 100 : 0 };
}
export function phenotype(i: Inputs): "glycolysis only" | "Warburg shift" | "respiration" {
  return i.nadhRatio <= 0.1 && i.succinate <= 0.05 ? "glycolysis only" : i.nadhRatio < 0.4 && i.succinate < 0.4 ? "Warburg shift" : "respiration";
}

export const STD_PSI = 160;
export const STD_UNCOUPLING = 0.05;
export function stdAtpPerPair(s: EtcStep): { proton: number; energy: number } {
  const y = liveAtpPerPair(s, STD_PSI, STD_UNCOUPLING);
  return { proton: y.proton, energy: y.energy };
}
