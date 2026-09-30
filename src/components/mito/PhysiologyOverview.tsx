import { useEffect, useMemo, useState } from "react";
import { Activity, Atom, Gauge, Zap } from "lucide-react";
import { AtpDriverNetwork } from "./AtpDriverNetwork";
import { IronLightMap } from "./IronLightMap";
import { Physiology } from "./Physiology";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { atpComparisonRows } from "@/lib/mito/atpComparison";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { listScenarios, scenarioGeometry, type Scenario } from "@/lib/mito/scenarios";
import { poRatio } from "@/lib/mito/reference";

export function PhysiologyOverview({ inputs, geo, out, refreshKey }: { inputs: Inputs; geo: Geometry; out: Outputs; refreshKey: number }) {
  const [mode, setMode] = useState<"healthy" | "saved">("healthy");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioId, setScenarioId] = useState("");
  const [focus, setFocus] = useState<number | null>(null);
  useEffect(() => { listScenarios().then((items) => { setScenarios(items); setScenarioId((id) => items.some((s) => s.id === id) ? id : items[0]?.id ?? ""); }).catch(() => setScenarios([])); }, [refreshKey]);
  const selected = scenarios.find((scenario) => scenario.id === scenarioId);
  const baselineInputs = mode === "saved" && selected ? { ...defaultInputs, ...selected.inputs } : defaultInputs;
  const baselineOut = useMemo(() => simulate(baselineInputs, mode === "saved" && selected ? scenarioGeometry(selected) : geo), [baselineInputs, geo, mode, selected]);
  const comparison = useMemo(() => atpComparisonRows(baselineInputs, baselineOut, inputs, out), [baselineInputs, baselineOut, inputs, out]);
  const baselineLabel = mode === "saved" && selected ? selected.name : "Healthy reference";
  const selectFocus = (index: number | null) => {
    setFocus(index);
    if (index !== null) requestAnimationFrame(() => document.querySelector(`[data-physiology-step-index="${index}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  const metrics = [
    { label: "ATP flux", value: `${out.atpFlux.toFixed(1)} µM/s`, icon: Zap },
    { label: "NADH P/O", value: poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh").toFixed(2), icon: Gauge },
    { label: "Fe-S intact", value: `${(out.fesIntact * 100).toFixed(1)}%`, icon: Atom },
    { label: "Aconitase", value: `${out.aconitaseActivity.toFixed(1)}%`, icon: Activity },
  ];
  return <div className="space-y-6" data-testid="physiology-overview">
    <div className="border-b border-border pb-4"><div className="mono-label">Integrated reference view</div><h2 className="mt-1 text-xl font-semibold">Physiology overview</h2><p className="mt-1 text-xs text-muted-foreground">Live energetics, cited physiological bands, and iron-light stress in one coordinated view.</p></div>
    <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="bg-card p-3"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5" /><span className="text-[10px] uppercase">{label}</span></div><div className="mt-1 font-mono text-lg">{value}</div></div>)}</div>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="mono-label">ATP gap attribution</div><p className="mt-1 text-xs text-muted-foreground">A = {baselineLabel}; B = current model</p></div><div className="flex flex-wrap gap-2"><Select value={mode} onValueChange={(value) => setMode(value as "healthy" | "saved")}><SelectTrigger className="h-8 w-[155px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="healthy">Healthy reference</SelectItem><SelectItem value="saved" disabled={scenarios.length === 0}>Saved scenario</SelectItem></SelectContent></Select>{mode === "saved" && scenarios.length > 0 && <Select value={scenarioId} onValueChange={setScenarioId}><SelectTrigger className="h-8 w-[190px]"><SelectValue placeholder="Choose scenario" /></SelectTrigger><SelectContent>{scenarios.map((scenario) => <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>)}</SelectContent></Select>}</div></div>
        {comparison.totalAbs > 0 ? <div className="mt-3"><AtpDriverNetwork rows={comparison.rows} totalAbs={comparison.totalAbs} focus={focus} onFocus={selectFocus} /></div> : <p className="mt-6 text-xs text-muted-foreground">The current ATP rates match this baseline. Change a Simulator setting or choose another saved scenario.</p>}
        {scenarios.length === 0 && <p className="mt-3 text-[11px] text-muted-foreground">No saved scenarios yet. Save one in Simulator to enable that comparison mode.</p>}
      </section>
      <IronLightMap inputs={inputs} geo={geo} compact />
    </div>
    <Physiology inputs={inputs} out={out} focusStep={focus} />
  </div>;
}