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
    top: rows.reduce<AtpComparisonRow | undefined>((best, row) => !best || Math.abs(row.diff) > Math.abs(best.diff) ? row : best, undefined),
  };
}
// Profile ATP assay flags: a synthetic profile's own P/O and ATP-linked OCR
// versus the healthy control profile (±25%). Assays are whole-chain readouts,
// so one flag is shared by every proton-pumping step; OCR applies to the chain
// summary only. Never a step-specific measurement.
export const atpAssayFlagPercent = 25;
type AtpAssayValues = { poNadh: number; atpLinkedOcr: number };
export function atpAssayFlag(stepName: string, pumping: boolean, profile: AtpAssayValues | undefined, control: AtpAssayValues) {
  if (!profile) return null;
  const overall = stepName.startsWith("Overall");
  if (!pumping && !overall) return null;
  const metric: keyof AtpAssayValues = overall ? "atpLinkedOcr" : "poNadh";
  const percent = (profile[metric] / control[metric] - 1) * 100;
  return { metric, label: overall ? "ATP-linked OCR" : "NADH P/O", unit: overall ? "pmol/min/µg" : "", value: profile[metric], control: control[metric], percent, flagged: Math.abs(percent) >= atpAssayFlagPercent };
}
