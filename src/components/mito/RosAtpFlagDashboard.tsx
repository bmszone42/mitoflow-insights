import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { ATP_COST_TEXTBOOK, atpNetworkRangeFlags, effectiveAtpCost, etcSteps, liveAtpPerPair, poRatio, STD_PSI, STD_UNCOUPLING } from "@/lib/mito/reference";
import { rosFlagPercent, rosSourceRows } from "@/lib/mito/rosPhysiology";

type Snapshot = { inputs: Inputs; out: Outputs };

const atpFlags = (inputs: Inputs) => {
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  return etcSteps.map((step) => {
    const flags = atpNetworkRangeFlags(step, effectiveAtpCost(STD_PSI, STD_UNCOUPLING), cost);
    return flags.evOutside || flags.costBOutside;
  });
};

const displayRate = (value: number) => value === 0 ? "0" : value.toPrecision(3);
const displayEffect = (value: number) => `${value > 0 ? "+" : ""}${displayRate(value)}`;

export function RosAtpFlagDashboard({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const comparison = useMemo(() => {
    const baseline: Snapshot = { inputs: defaultInputs, out: simulate(defaultInputs, geo) };
    const current: Snapshot = { inputs, out };
    const noPsiInputs = { ...inputs, deltaPsi: defaultInputs.deltaPsi };
    const noLeakInputs = { ...inputs, uncoupling: defaultInputs.uncoupling };
    const noPsi: Snapshot = { inputs: noPsiInputs, out: simulate(noPsiInputs, geo) };
    const noLeak: Snapshot = { inputs: noLeakInputs, out: simulate(noLeakInputs, geo) };
    const snapshots = { baseline, current, noPsi, noLeak };
    const ros = rosSourceRows(out, baseline.out, inputs, defaultInputs);
    return { snapshots, ros, rosNoPsi: rosSourceRows(noPsi.out, baseline.out, noPsiInputs, defaultInputs), rosNoLeak: rosSourceRows(noLeak.out, baseline.out, noLeakInputs, defaultInputs), atpCurrent: atpFlags(inputs), atpNoPsi: atpFlags(noPsiInputs), atpNoLeak: atpFlags(noLeakInputs) };
  }, [inputs, geo, out]);
  const { snapshots, ros, rosNoPsi, rosNoLeak, atpCurrent, atpNoPsi, atpNoLeak } = comparison;
  const psiChanged = inputs.deltaPsi !== defaultInputs.deltaPsi;
  const leakChanged = inputs.uncoupling !== defaultInputs.uncoupling;
  const atpCount = atpCurrent.filter(Boolean).length;
  const rosCount = ros.filter((row) => row.flagged).length;
  const states = [
    { label: "Simulated default", snapshot: snapshots.baseline, rosFlags: 0, atpFlags: atpFlags(defaultInputs).filter(Boolean).length },
    { label: "Current", snapshot: snapshots.current, rosFlags: rosCount, atpFlags: atpCount },
    { label: "Reset potential", snapshot: snapshots.noPsi, rosFlags: rosNoPsi.filter((row) => row.flagged).length, atpFlags: atpNoPsi.filter(Boolean).length },
    { label: "Reset uncoupling", snapshot: snapshots.noLeak, rosFlags: rosNoLeak.filter((row) => row.flagged).length, atpFlags: atpNoLeak.filter(Boolean).length },
  ];

  return <section className="space-y-5" data-testid="ros-atp-dashboard" aria-labelledby="ros-atp-heading">
    <div className="border-b border-border pb-4">
      <div className="mono-label">Coupling and redox</div>
      <h2 id="ros-atp-heading" className="mt-1 text-xl font-semibold">ROS + ATP flags</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Same membrane geometry throughout. Reset rows change only one control at a time while every other current setting stays fixed. Differences can interact and must not be added together.</p>
    </div>
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4" aria-label="Setting comparison">
      {states.map(({ label, snapshot, rosFlags, atpFlags: count }) => <div key={label} className="min-w-0 bg-card p-3" data-testid="ros-atp-state">
        <div className="text-xs font-semibold">{label}</div>
        <div className="mt-2 font-mono text-xs">{snapshot.inputs.deltaPsi.toFixed(0)} mV · {(snapshot.inputs.uncoupling * 100).toFixed(0)}% uncoupling</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className={count ? "text-destructive" : "text-primary"}>ATP {count}/{etcSteps.length} flagged</span><span className={rosFlags ? "text-destructive" : "text-primary"}>ROS {rosFlags}/{ros.length} flagged</span></div>
        <div className="mt-1 text-[11px] text-muted-foreground">ATP {snapshot.out.atpFlux.toFixed(1)} µM/s · NADH P/O {poRatio(snapshot.inputs.deltaPsi, snapshot.inputs.uncoupling, "nadh").toFixed(2)}</div>
      </div>)}
    </div>
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <section className="min-w-0" aria-label="ATP step flags">
        <div className="mb-2 flex items-baseline justify-between gap-3"><h3 className="text-sm font-semibold">ATP step flags</h3><span className={`font-mono text-xs ${atpCount ? "text-destructive" : "text-primary"}`}>{atpCount}/{etcSteps.length}</span></div>
        <p className="mb-3 text-[11px] text-muted-foreground">Step redox drops versus cited bands; pumping-step effective cost versus {ATP_COST_TEXTBOOK.lo.toFixed(2)}–{ATP_COST_TEXTBOOK.hi.toFixed(2)} eV/ATP.</p>
        <div className="space-y-0 border-y border-border">{etcSteps.map((step, index) => {
          const flagged = atpCurrent[index];
          const psiCost = psiChanged && flagged && !atpNoPsi[index];
          const leakCost = leakChanged && flagged && !atpNoLeak[index];
          const cause = psiCost && leakCost ? "Both changes contribute" : psiCost ? "Membrane potential" : leakCost ? "Uncoupling" : flagged ? "Combined or fixed redox drop" : "No out-of-band step";
          const currentYield = liveAtpPerPair(step, inputs.deltaPsi, inputs.uncoupling).proton;
          return <div key={step.step} className={`grid gap-2 border-b border-border/60 px-2 py-3 text-xs last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] ${flagged ? "bg-destructive/10" : ""}`} data-testid="ros-atp-atp-row" data-outside={flagged}>
            <div className="min-w-0"><div className="flex items-center gap-2 font-medium">{flagged ? <AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-hidden /> : <CheckCircle2 className="size-3.5 shrink-0 text-primary" aria-hidden />}{step.step}</div><div className="mt-1 pl-5 text-[11px] text-muted-foreground">{cause} · {currentYield.toFixed(2)} ATP/pair</div></div>
            <div className="min-w-0 text-[11px] text-muted-foreground sm:text-right">{psiChanged && <div>Potential effect: {(currentYield - liveAtpPerPair(step, defaultInputs.deltaPsi, inputs.uncoupling).proton).toFixed(2)} ATP/pair · reset {atpNoPsi[index] ? "flagged" : "clear"}</div>}{leakChanged && <div>Uncoupling effect: {(currentYield - liveAtpPerPair(step, inputs.deltaPsi, defaultInputs.uncoupling).proton).toFixed(2)} ATP/pair · reset {atpNoLeak[index] ? "flagged" : "clear"}</div>}</div>
          </div>;
        })}</div>
      </section>
      <section className="min-w-0" aria-label="ROS source flags">
        <div className="mb-2 flex items-baseline justify-between gap-3"><h3 className="text-sm font-semibold">ROS source flags</h3><span className={`font-mono text-xs ${rosCount ? "text-destructive" : "text-primary"}`}>{rosCount}/{ros.length}</span></div>
        <p className="mb-3 text-[11px] text-muted-foreground">Modeled source rates versus same-geometry default; ±{rosFlagPercent}% is an exploratory model-change threshold, not a biological normal range.</p>
        <div className="space-y-0 border-y border-border">{ros.map((row, index) => {
          const psiEffect = psiChanged ? row.live - (rosNoPsi[index]?.live ?? row.live) : 0;
          const leakEffect = leakChanged ? row.live - (rosNoLeak[index]?.live ?? row.live) : 0;
          return <div key={row.label} className={`grid gap-2 border-b border-border/60 px-2 py-3 text-xs last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] ${row.flagged ? "bg-destructive/10" : ""}`} data-testid="ros-atp-ros-row" data-outside={row.flagged}>
            <div className="min-w-0"><div className="flex items-center gap-2 font-medium">{row.flagged ? <AlertTriangle className="size-3.5 shrink-0 text-destructive" aria-hidden /> : <CheckCircle2 className="size-3.5 shrink-0 text-primary" aria-hidden />}{row.label}</div><div className="mt-1 pl-5 text-[11px] text-muted-foreground">{row.species} · {displayRate(row.live)} vs {displayRate(row.base)} µM/s {row.percent === null ? row.live > 0 ? "· newly active" : "" : `· ${row.percent > 0 ? "+" : ""}${row.percent.toFixed(0)}%`}</div></div>
            <div className="min-w-0 text-[11px] text-muted-foreground sm:text-right">{psiChanged && <div>Potential effect: {displayEffect(psiEffect)} µM/s · reset {rosNoPsi[index]?.flagged ? "flagged" : "clear"}</div>}{leakChanged && <div>Uncoupling effect: {displayEffect(leakEffect)} µM/s · reset {rosNoLeak[index]?.flagged ? "flagged" : "clear"}</div>}{row.flagged && !psiChanged && !leakChanged && <div>Neither coupling control changed</div>}</div>
          </div>;
        })}</div>
      </section>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">ATP cost is a model-wide proxy, not a measured step-specific range. ROS production rates and flags are simulated, not assay measurements. An effect from resetting a slider is conditional on the other current settings; a flagged row can also involve other inputs. The Overall NADH to O₂ ATP row summarizes the chain and is not an extra reaction.</p>
  </section>;
}