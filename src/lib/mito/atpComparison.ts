import type { Inputs, Outputs } from "./model";
import {
  atpFlagContext,
  effectiveAtpCost,
  etcSteps,
  liveAtpPerPair,
} from "./reference";

export type AtpComparisonRow = {
  s: (typeof etcSteps)[number];
  ya: number;
  yb: number;
  ra: number;
  rb: number;
  diff: number;
  costA: number;
  costB: number;
  contextA: ReturnType<typeof atpFlagContext>;
  contextB: ReturnType<typeof atpFlagContext>;
};

const fluxAt = (out: Outputs, index: number) =>
  index <= 2 ? out.fluxCI : index === 3 ? out.fluxCII : out.fluxCIV;

export function atpComparisonRows(
  baselineInputs: Inputs,
  baselineOutputs: Outputs,
  currentInputs: Inputs,
  currentOutputs: Outputs,
) {
  const rows: AtpComparisonRow[] = etcSteps.map((s, index) => {
    const ya = liveAtpPerPair(s, baselineInputs.deltaPsi, baselineInputs.uncoupling).proton;
    const yb = liveAtpPerPair(s, currentInputs.deltaPsi, currentInputs.uncoupling).proton;
    const ra = (ya * fluxAt(baselineOutputs, index)) / 2;
    const rb = (yb * fluxAt(currentOutputs, index)) / 2;
    return {
      s,
      ya,
      yb,
      ra,
      rb,
      diff: rb - ra,
      costA: effectiveAtpCost(baselineInputs.deltaPsi, baselineInputs.uncoupling),
      costB: effectiveAtpCost(currentInputs.deltaPsi, currentInputs.uncoupling),
      contextA: atpFlagContext(baselineInputs.deltaPsi, baselineInputs.uncoupling),
      contextB: atpFlagContext(currentInputs.deltaPsi, currentInputs.uncoupling),
    };
  });
  return {
    rows,
    totalAbs: rows.reduce((sum, row) => sum + Math.abs(row.diff), 0),
    top: rows.reduce((best, row) => Math.abs(row.diff) > Math.abs(best.diff) ? row : best, rows[0]),
  };
}