import { useState } from "react";
import { AlertTriangle, CheckCircle2, Minus } from "lucide-react";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { rosDriverAttributions, rosFlagPercent, rosInputNames, rosSourceRows } from "@/lib/mito/rosPhysiology";
import { RosDriverNetwork } from "./RosDriverNetwork";

function rate(value: number) {
  return value === 0 ? "0" : value.toPrecision(3);
}

export function RosPhysiology({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const [focus, setFocus] = useState<number | null>(null);
  const baseline = simulate(defaultInputs, geo);
  const rows = rosSourceRows(out, baseline, inputs, defaultInputs);
  const attributions = rosDriverAttributions(rows, inputs, defaultInputs, geo);
  const flagged = rows.filter((row) => row.flagged);

  return <section className="space-y-5" data-testid="ros-physiology">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div>
        <div className="mono-label">Source-resolved redox comparison</div>
        <h2 className="mt-1 text-xl font-semibold">ROS physiology</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Modeled production rates versus the default inputs at the current membrane geometry. Source citations describe mechanisms and kinetic context, not normal production-rate ranges.</p>
      </div>
      <span className={`flex items-center gap-2 font-mono text-sm ${flagged.length ? "text-destructive" : "text-primary"}`} role="status" data-testid="ros-flag-count">
        {flagged.length ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
        {flagged.length} / {rows.length} changed beyond model band
      </span>
    </div>

    {flagged.length > 0 && <div className="border-l-2 border-destructive py-1 pl-3 text-xs" data-testid="ros-flag-summary">
      <span className="font-semibold">Flagged sources: </span>{flagged.map((row) => row.label).join(" · ")}
    </div>}

    <RosDriverNetwork rows={rows} attributions={attributions} inputs={inputs} focus={focus} onFocus={setFocus} />

    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[930px] text-left text-xs">
        <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr>
          <th scope="col" className="px-3 py-3 font-medium">ROS / source</th>
          <th scope="col" className="px-3 py-3 font-medium">Default rate</th>
          <th scope="col" className="px-3 py-3 font-medium">Current rate</th>
          <th scope="col" className="px-3 py-3 font-medium">Model flag / drivers</th>
          <th scope="col" className="px-3 py-3 font-medium">Published context / source</th>
        </tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.species}-${row.label}`} data-testid="ros-source-row" data-ros-source-index={index} data-selected={focus === index} data-outside={row.flagged} className={`border-t border-border/60 align-top ${row.flagged ? "bg-destructive/10" : ""} ${focus === index ? "ring-1 ring-inset ring-primary bg-primary/10" : ""}`}>
          <th scope="row" className="px-3 py-3 font-medium"><span className="font-mono text-primary">{row.species}</span><span className="mt-1 block">{row.label}</span><span className="mt-1 block max-w-[200px] text-[10px] font-normal leading-relaxed text-muted-foreground">{row.mechanism}</span></th>
          <td className="px-3 py-3 font-mono tabular-nums">{rate(row.base)} <span className="block text-[10px] text-muted-foreground">µM/s</span></td>
          <td className="px-3 py-3 font-mono tabular-nums">{rate(row.live)} <span className="block text-[10px] text-muted-foreground">µM/s</span></td>
          <td className={`max-w-[240px] px-3 py-3 ${row.flagged ? "text-destructive" : "text-primary"}`}>
            {row.flagged ? <AlertTriangle className="mr-1 inline size-3.5" aria-hidden /> : <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden />}
            {row.base === 0 ? row.live > 0 ? "Newly active" : "Inactive in both runs" : `${row.percent !== null && row.percent >= 0 ? "+" : ""}${row.percent?.toFixed(0)}% vs default`}
            <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{row.base > 0 ? `Flag at ±${rosFlagPercent}% of simulated default.` : "Zero baseline: flag if source becomes active."}</span>
            {row.changedDrivers.length > 0 && <span className="mt-1 block text-[10px] leading-relaxed text-foreground">Changed relevant settings: {row.changedDrivers.map((key) => rosInputNames[key]).join(", ")}. These are possible drivers, not isolated causal effects.</span>}
            {row.flagged && attributions[index]?.length ? <span className="mt-1 block text-[10px] leading-relaxed text-destructive" data-testid="ros-flag-cause">Largest modeled input effect: {rosInputNames[attributions[index][0].key]} ({attributions[index][0].delta > 0 ? "+" : ""}{rate(attributions[index][0].delta)} µM/s when changed). See network for all input effects.</span> : null}
          </td>
          <td className="max-w-[280px] px-3 py-3 text-muted-foreground"><span className="block leading-relaxed">{row.literatureValue}</span><a href={row.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-foreground underline decoration-border underline-offset-2 hover:text-primary">{row.citation}</a></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">All rates are model estimates in µM/s, not measured concentrations. The ±{rosFlagPercent}% flag threshold is an exploratory change from the simulated default, not a textbook or clinical normal interval. A zero default is flagged when a source activates. Literature values are reaction constants, qualitative site observations, or labeled model assumptions, never substituted for source-specific rate bands. The model also estimates singlet oxygen and lipid peroxyl concentrations as lumped outputs, but does not expose their source-resolved rates, so they cannot be flagged here. <Minus className="inline size-3" aria-hidden /> No claim of clinical abnormality.</p>
  </section>;
}