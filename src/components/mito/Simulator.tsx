import { Suspense, lazy } from "react";
import { Badge } from "@/components/ui/badge";
import { poRatio } from "@/lib/mito/reference";
import type { Geometry, Inputs, Outputs } from "@/lib/mito/model";
import { SliderPanel } from "./SliderPanel";
import { StandardStateNote } from "./StandardState";
import { PhotoreceptorPanel } from "./PhotoreceptorPanel";
import { RosBudgetPanel } from "./RosBudgetPanel";
import { WarburgSummaryCard } from "./WarburgSummaryCard";
import { Metric } from "./SimulatorShared";
import { MitophagyExplorer } from "./MitophagyExplorer";
import { StartHereCard } from "./StartHereCard";

// Charts (and the recharts library) load only after the page is up.
const SimulatorCharts = lazy(() =>
  import("./SimulatorCharts").then((m) => ({ default: m.SimulatorCharts })),
);

function ChartsFallback() {
  return (
    <div className="panel p-4 text-xs text-muted-foreground">Loading charts…</div>
  );
}

export function Simulator({
  inputs,
  setInputs,
  geo,
  out,
  onSaved,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  geo: Geometry;
  out: Outputs;
  onSaved?: () => void;
}) {
  return (
    <div className="space-y-4">
      <StartHereCard inputs={inputs} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <SliderPanel inputs={inputs} setInputs={setInputs} geo={geo} onSaved={onSaved} />

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Steady state</h2>
              <Badge variant="outline" className="font-mono text-[11px]">
                photon gain x{out.photonGain.toFixed(2)}
              </Badge>
            </div>
            <div className="mt-2">
              <StandardStateNote
                psi={inputs.deltaPsi}
                uncoupling={inputs.uncoupling}
                poNadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh")}
                poFadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2")}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              <Metric label="ATP flux" value={out.atpFlux.toFixed(1)} unit="µM/s" />
              <Metric
                label="P/O ratio (NADH)"
                value={poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh").toFixed(2)}
                unit="ATP/O"
              />
              <Metric
                label="P/O ratio (FADH2)"
                value={poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2").toFixed(2)}
                unit="ATP/O"
              />
              <Metric label="Complex IV flux" value={out.fluxCIV.toFixed(1)} unit="µM/s" />
              <Metric
                label="71 THz output"
                value={out.emission71THz.toFixed(1)}
                unit="rel"
                tone="accent"
              />
              <Metric
                label="Redox stress"
                value={out.redoxStress.toFixed(0)}
                unit="/100"
                tone="warning"
              />
              <Metric label="Superoxide" value={out.superoxide.toFixed(2)} unit="nM" />
              <Metric label="H2O2" value={out.hydrogenPeroxide.toFixed(1)} unit="nM" />
              <Metric
                label="Fe-S intact"
                value={(out.fesIntact * 100).toFixed(1)}
                unit="%"
                tone="accent"
              />
              <Metric
                label="Free Fe2+"
                value={out.freeIron.toFixed(2)}
                unit="µM"
                tone="warning"
              />
            </div>
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 text-xs">
              <div className="mb-1 font-medium text-foreground">
                Cluster states: {(out.fes3Fe * 100).toFixed(2)}% 3-iron (1 Fe lost, fast repair), {(out.fesApo * 100).toFixed(2)}% stripped (4 Fe lost)
              </div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground sm:grid-cols-4">
                {([["aconitase", "Aconitase"], ["complexI", "Complex I"], ["complexII", "Complex II"], ["complexIII", "Complex III (Rieske)"]] as const).map(([k, l]) => (
                  <span key={k}>{l}: {(out.fesPools[k].intact * 100).toFixed(1)}% intact, {(out.fesPools[k].threeFe * 100).toFixed(2)}% 3-iron</span>
                ))}
              </div>
              <div className="mt-1 font-medium text-foreground">
                3-iron reactivation half-life: {out.fesReactHalfLifeS < 60 ? `${out.fesReactHalfLifeS.toFixed(1)} s` : `${(out.fesReactHalfLifeS / 60).toFixed(2)} min`}
                <span className="font-normal text-muted-foreground"> — labile iron and antioxidant supply speed it up; peroxide steals 3-iron clusters for stripping instead of repair.</span>
              </div>
              <p className="mt-1 text-muted-foreground">Exposure of each enzyme's cluster is assumed (aconitase exposed, chain clusters buried), after Beinert, Holm and Münck 1997.</p>
            </div>
          </div>

          <WarburgSummaryCard inputs={inputs} out={out} geo={geo} />

          <RosBudgetPanel out={out} />

          <PhotoreceptorPanel out={out} />

          <MitophagyExplorer inputs={inputs} geo={geo} />

          <Suspense fallback={<ChartsFallback />}>
            <SimulatorCharts inputs={inputs} out={out} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
