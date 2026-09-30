import { AlertTriangle, CheckCircle2, Minus } from "lucide-react";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import {
  atpCostFlagCause,
  atpFlagContext,
  atpNetworkRangeFlags,
  effectiveAtpCost,
  etcSteps,
  liveAtpPerPair,
} from "@/lib/mito/reference";

const ROS_FLAG_PERCENT = 25;

type RosMapping = {
  label: string;
  current: number;
  baseline: number;
};

const pctChange = (current: number, baseline: number) =>
  baseline > 0 ? ((current - baseline) / baseline) * 100 : current === 0 ? 0 : Number.POSITIVE_INFINITY;

function sourceValue(out: Outputs, key: string) {
  return out.rosBudget.superoxideSources[key] ?? 0;
}

function rosForStep(index: number, current: Outputs, baseline: Outputs): RosMapping | null {
  const source = (label: string, keys: string[]): RosMapping => ({
    label,
    current: keys.reduce((sum, key) => sum + sourceValue(current, key), 0),
    baseline: keys.reduce((sum, key) => sum + sourceValue(baseline, key), 0),
  });

  if (index === 0) return source("CI flavin site IF", ["CI IF"]);
  if (index === 1 || index === 2) return source("CI Q-site / RET", ["CI IQ (RET)"]);
  if (index === 3) return source("CII flavin site IIF", ["CII IIF"]);
  if (index === 4) return source("CIII Qo site", ["CIII Qo"]);
  if (index === 8) {
    const keys = Object.keys(current.rosBudget.superoxideSources);
    return source("All modeled O2•- sources", keys);
  }
  return null;
}

export function WarburgPhysiology({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const baseline = simulate(defaultInputs, geo);
  const liveCost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const baselineCost = effectiveAtpCost(defaultInputs.deltaPsi, defaultInputs.uncoupling);
  const flagContext = atpFlagContext(inputs.deltaPsi, inputs.uncoupling);
  const fluxForStep = (outputs: Outputs, index: number) =>
    index <= 2 ? outputs.fluxCI : index === 3 ? outputs.fluxCII : outputs.fluxCIV;

  const rows = etcSteps.map((step, index) => {
    const atp = liveAtpPerPair(step, inputs.deltaPsi, inputs.uncoupling).proton;
    const atpBaseline = liveAtpPerPair(step, defaultInputs.deltaPsi, defaultInputs.uncoupling).proton;
    const atpDelta = pctChange(atp, atpBaseline);
    const atpRate = (atp * fluxForStep(out, index)) / 2;
    const atpRateBaseline = (atpBaseline * fluxForStep(baseline, index)) / 2;
    const atpRateGap = atpRate - atpRateBaseline;
    const flags = atpNetworkRangeFlags(step, baselineCost, liveCost);
    const atpFlagged = flags.evOutside || flags.costBOutside;
    const atpCause = flags.costBOutside ? atpCostFlagCause(step, flagContext) : null;
    const ros = rosForStep(index, out, baseline);
    const rosDelta = ros ? pctChange(ros.current, ros.baseline) : null;
    const rosFlagged = rosDelta !== null && Math.abs(rosDelta) >= ROS_FLAG_PERCENT;
    return { step, atp, atpBaseline, atpDelta, atpRate, atpRateBaseline, atpRateGap, atpFlagged, atpCause, flags, ros, rosDelta, rosFlagged };
  });

  const independentRows = rows.slice(0, -1);
  const totalIndependentGap = independentRows.reduce((sum, row) => sum + Math.abs(row.atpRateGap), 0);
  const atpFlags = rows.filter((row) => row.atpFlagged).length;
  const rosFlags = rows.filter((row) => row.rosFlagged).length;
  const wholeChainGap = out.atpFlux - baseline.atpFlux;

  return (
    <div className="space-y-4" data-testid="warburg-physiology">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="mono-label">Warburg reference comparison</div>
          <h2 className="mt-1 text-xl font-semibold">ATP and ROS physiology</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Current Warburg settings against cited electron-transfer values and the healthy respiration baseline.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-xs" role="status">
          <FlagSummary label="ATP" count={atpFlags} />
          <FlagSummary label="ROS" count={rosFlags} />
        </div>
      </div>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-3" data-testid="warburg-atp-gap-summary">
        <GapMetric label="Healthy ATP flux" value={baseline.atpFlux} />
        <GapMetric label="Current ATP flux" value={out.atpFlux} />
        <GapMetric label="Whole-chain gap" value={wholeChainGap} signed />
      </div>

      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[1480px] text-left text-xs" data-testid="warburg-physiology-steps">
          <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium">Step / electron path</th>
              <th scope="col" className="px-3 py-3 font-medium">Textbook ΔE</th>
              <th scope="col" className="px-3 py-3 font-medium">ATP / pair</th>
              <th scope="col" className="px-3 py-3 font-medium">Healthy ATP rate</th>
              <th scope="col" className="px-3 py-3 font-medium">Current ATP rate</th>
              <th scope="col" className="px-3 py-3 font-medium">ATP rate gap</th>
              <th scope="col" className="px-3 py-3 font-medium">Gap contribution</th>
              <th scope="col" className="px-3 py-3 font-medium">ATP status</th>
              <th scope="col" className="px-3 py-3 font-medium">Modeled ROS source</th>
              <th scope="col" className="px-3 py-3 font-medium">ROS status</th>
              <th scope="col" className="px-3 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.step.step}
                data-testid="warburg-physiology-step"
                data-atp-outside={row.atpFlagged}
                data-ros-outside={row.rosFlagged}
                className={`border-t border-border/60 ${row.atpFlagged || row.rosFlagged ? "bg-destructive/10" : ""}`}
              >
                <th scope="row" className="px-3 py-3 font-medium text-foreground">
                  {row.step.step}
                  <span className="mt-0.5 block font-normal text-muted-foreground">{row.step.donor} → {row.step.acceptor}</span>
                </th>
                <td className={`px-3 py-3 font-mono ${row.flags.evOutside ? "text-destructive" : "text-primary"}`}>
                  {row.step.tbLo.toFixed(2)}–{row.step.tbHi.toFixed(2)} eV
                  <span className="block text-[10px] text-muted-foreground">model {row.step.ev.toFixed(3)} eV</span>
                </td>
                <td className="px-3 py-3 font-mono">
                  {row.atp.toFixed(2)}
                  <span className="block text-[10px] text-muted-foreground">
                    healthy {row.atpBaseline.toFixed(2)} · {formatDelta(row.atpDelta)}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono">{formatRate(row.atpRateBaseline)}</td>
                <td className="px-3 py-3 font-mono">{formatRate(row.atpRate)}</td>
                <td
                  className={`px-3 py-3 font-mono ${row.atpRateGap < 0 ? "text-destructive" : row.atpRateGap > 0 ? "text-primary" : "text-muted-foreground"}`}
                  data-testid="warburg-atp-rate-gap"
                >
                  {formatSignedRate(row.atpRateGap)}
                </td>
                <td className="px-3 py-3 font-mono" data-testid="warburg-atp-gap-share">
                  {row === rows[rows.length - 1]
                    ? <span className="font-sans text-[10px] text-muted-foreground">Chain summary</span>
                    : totalIndependentGap > 0
                      ? `${((Math.abs(row.atpRateGap) / totalIndependentGap) * 100).toFixed(1)}%`
                      : "0.0%"}
                </td>
                <td className={`max-w-[230px] px-3 py-3 font-medium ${row.atpFlagged ? "text-destructive" : "text-primary"}`}>
                  {row.atpFlagged ? <AlertTriangle className="mr-1 inline size-3.5" aria-hidden /> : <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden />}
                  {row.flags.evOutside && row.flags.costBOutside ? "Drop + cost outside" : row.flags.evOutside ? "Drop outside" : row.flags.costBOutside ? "Cost outside" : "Within range"}
                  {row.atpCause && <span className="mt-1 block text-[10px] font-normal leading-relaxed" data-testid="warburg-physiology-flag-cause">Slider cause: {row.atpCause}</span>}
                  {row.flags.evOutside && <span className="mt-1 block text-[10px] font-normal leading-relaxed">Model parameter: fixed redox drop, not a slider change.</span>}
                </td>
                <td className="px-3 py-3">
                  {row.ros ? (
                    <>
                      <span className="font-medium">{row.ros.label}</span>
                      <span className="mt-0.5 block font-mono text-muted-foreground">
                        {row.ros.current.toPrecision(3)} µM/s · healthy {row.ros.baseline.toPrecision(3)}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No direct source in model</span>
                  )}
                </td>
                <td className={`px-3 py-3 font-medium ${row.rosFlagged ? "text-destructive" : row.ros ? "text-primary" : "text-muted-foreground"}`}>
                  {row.ros ? (
                    <>
                      {row.rosFlagged ? <AlertTriangle className="mr-1 inline size-3.5" aria-hidden /> : <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden />}
                      {formatDelta(row.rosDelta ?? 0)} vs healthy
                      <span className="block text-[10px] font-normal">{row.rosFlagged ? `Outside ±${ROS_FLAG_PERCENT}% baseline band` : `Within ±${ROS_FLAG_PERCENT}% baseline band`}</span>
                    </>
                  ) : (
                    <><Minus className="mr-1 inline size-3.5" aria-hidden />Not assessed</>
                  )}
                </td>
                <td className="max-w-[300px] px-3 py-3 text-muted-foreground">
                  <a href={row.step.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary">
                    {row.step.sourceCitation}
                  </a>
                  <span className="mt-1 block text-[10px] leading-relaxed">{row.step.rangeBasis}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        ATP rate = ATP per pair × routed electron flux ÷ 2, in relative units. Gap contribution is each independent step's absolute share of the independent-step rate gap; Overall NADH to O2 is a chain summary and is excluded to prevent double-counting. ATP flags use the cited redox intervals and the shared 0.50–0.62 eV/ATP effective-cost proxy. ROS values are site-resolved superoxide production rates, not concentrations. Their ±{ROS_FLAG_PERCENT}% flag band is a model comparison with the healthy default run, not a published normal range. Carrier and Complex IV rows remain unassessed where the model has no direct ROS source.
      </p>
    </div>
  );
}

function FlagSummary({ label, count }: { label: string; count: number }) {
  return (
    <span className={`flex items-center gap-1.5 ${count ? "text-destructive" : "text-primary"}`}>
      {count ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
      {label}: {count} flagged
    </span>
  );
}

function formatDelta(value: number) {
  if (!Number.isFinite(value)) return "+∞%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function formatRate(value: number) {
  return Number(value.toPrecision(3));
}

function formatSignedRate(value: number) {
  const formatted = formatRate(Math.abs(value));
  return value > 0 ? `+${formatted}` : value < 0 ? `−${formatted}` : "0";
}

function GapMetric({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  const displayed = signed ? formatSignedRate(value) : formatRate(value);
  return (
    <div className="bg-background px-4 py-3">
      <div className="mono-label">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${signed ? value < 0 ? "text-destructive" : "text-primary" : "text-foreground"}`}>
        {displayed} <span className="text-xs font-normal text-muted-foreground">µM/s</span>
      </div>
    </div>
  );
}