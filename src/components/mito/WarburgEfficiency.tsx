import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { atpSplit, phenotype, poLiteratureBands, poRatio } from "@/lib/mito/reference";

export function WarburgEfficiency({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const baseline = atpSplit(simulate(defaultInputs, geo));
  const current = atpSplit(out);
  const rows = (["nadh", "fadh2"] as const).map((path) => {
    const band = poLiteratureBands[path];
    const value = poRatio(inputs.deltaPsi, inputs.uncoupling, path);
    return { ...band, value, baseline: poRatio(defaultInputs.deltaPsi, defaultInputs.uncoupling, path), outside: value < band.low || value > band.high };
  });
  const flagged = rows.filter((row) => row.outside).length;
  const couplingChanged = inputs.deltaPsi !== defaultInputs.deltaPsi || inputs.uncoupling !== defaultInputs.uncoupling;

  return <section className="space-y-3 border-y border-border py-4" data-testid="warburg-efficiency" aria-labelledby="warburg-efficiency-title">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div><div className="mono-label">Warburg efficiency comparison</div><h3 id="warburg-efficiency-title" className="mt-1 text-lg font-semibold">P/O against published estimates</h3></div>
      <span className="font-mono text-xs text-muted-foreground" data-testid="warburg-efficiency-count">{flagged} of 2 outside comparison bands</span>
    </div>
    <p className="text-xs text-muted-foreground">{phenotype(inputs)} · Glycolysis share {baseline.glycolysisPct.toFixed(0)}% → {current.glycolysisPct.toFixed(0)}%. P/O is ATP per oxygen atom reduced through the respiratory chain, not whole-cell ATP yield per glucose.</p>
    <div className="divide-y divide-border border-y border-border">
      {rows.map((row) => <div key={row.label} className="grid gap-1 py-3 text-xs sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4" data-testid="warburg-efficiency-row" data-outside={row.outside}>
        <div className="font-semibold">{row.label}</div>
        <div className="font-mono"><span className={row.outside ? "text-destructive" : "text-primary"}>Current {row.value.toFixed(2)} ATP/O</span><br/><span className="text-muted-foreground">Simulated respiration {row.baseline.toFixed(2)} ATP/O</span><br/><span className="text-muted-foreground">Published estimate {row.low.toFixed(1)}–{row.high.toFixed(1)} ATP/O</span></div>
        <div><div className={`flex items-center gap-1 font-medium ${row.outside ? "text-destructive" : "text-primary"}`}>{row.outside ? <AlertTriangle className="size-3.5 shrink-0"/> : <CheckCircle2 className="size-3.5 shrink-0"/>}{row.outside ? "Outside estimate" : "Within estimate"}</div><p className="mt-1 text-[11px] text-muted-foreground">{couplingChanged ? `Derived from ${inputs.deltaPsi} mV membrane potential and ${(inputs.uncoupling * 100).toFixed(0)}% uncoupling (default ${defaultInputs.deltaPsi} mV, ${(defaultInputs.uncoupling * 100).toFixed(0)}%).` : "Membrane potential and uncoupling match the simulated default."}</p></div>
      </div>)}
    </div>
    <p className="text-[11px] leading-relaxed text-muted-foreground"><a href={poLiteratureBands.url} target="_blank" rel="noreferrer" className="text-foreground underline decoration-border underline-offset-2">{poLiteratureBands.source}</a> reviews experimental mitochondrial P/O estimates. Bands are approximate literature comparisons, not clinical or Warburg-specific intervals. Lower NADH or succinate supply changes ATP flux and the modeled glycolysis share, but does not by itself change P/O here; P/O depends on membrane potential and uncoupling.</p>
  </section>;
}