import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import type { Inputs, Outputs } from "@/lib/mito/model";
import { ironLightReferenceBands, poRatio } from "@/lib/mito/reference";

export function MeasuredHealthyBenchmark({ inputs, out }: { inputs: Inputs; out: Outputs }) {
  const aconitase = ironLightReferenceBands.aconitaseActivity;
  const rows = [
    {
      name: "NADH-linked P/O", model: poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh"),
      low: 2.3, high: 2.7, unit: "ATP/O", kind: "Literature estimate",
      source: "Hinkle, BBA (2005)", url: "https://doi.org/10.1016/j.bbabio.2004.09.004",
      limit: "Review of isolated-mitochondria experiments; 2.3–2.7 is an approximate comparison band, not a clinical reference interval. Model P/O is derived from membrane potential and uncoupling.",
    },
    {
      name: "Succinate-linked P/O", model: poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2"),
      low: 1.4, high: 1.7, unit: "ATP/O", kind: "Literature estimate",
      source: "Hinkle, BBA (2005)", url: "https://doi.org/10.1016/j.bbabio.2004.09.004",
      limit: "The review reports about 1.5, with 1.4 also plausible. The band is approximate, not a patient reference interval.",
    },
    {
      name: "Platelet mitochondrial aconitase", model: out.aconitaseActivity / 100 * aconitase.mean,
      low: aconitase.assayLo, high: aconitase.assayHi, unit: aconitase.unit, kind: "Assay-equivalent proxy",
      source: aconitase.source, url: aconitase.sourceUrl,
      limit: `${aconitase.cohort}; ${aconitase.specimen}. Model activity is scaled to the study mean (${aconitase.mean} ${aconitase.unit}); this is not an actual assay or a clinical interval. Fe-S integrity uses the same proxy, not an independent measurement.`,
    },
  ];
  const flagged = rows.filter((row) => row.model < row.low || row.model > row.high);

  return <section className="space-y-3 border-y border-border py-4" data-testid="measured-healthy-benchmark" aria-labelledby="measured-baseline-title">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div><div className="mono-label">Published healthy controls</div><h3 id="measured-baseline-title" className="mt-1 text-lg font-semibold">Measured-data check</h3></div>
      <span className="font-mono text-xs text-muted-foreground" data-testid="measured-benchmark-count">{flagged.length} of {rows.length} outside comparison bands</span>
    </div>
    <p className="text-xs text-muted-foreground">These published values are independent of the simulated healthy default. Only matching readouts are compared; model estimates and assay-scaled proxies are not patient measurements. Flags are research comparisons, not diagnoses.</p>
    <div className="divide-y divide-border border-y border-border">
      {rows.map((row) => {
        const outside = row.model < row.low || row.model > row.high;
        return <div key={row.name} className="grid gap-1 py-3 text-xs sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4" data-testid="measured-benchmark-row" data-outside={outside}>
          <div><div className="font-semibold">{row.name}</div><div className="text-[11px] text-muted-foreground">{row.kind}</div></div>
          <div className="font-mono"><span className={outside ? "text-destructive" : "text-primary"}>Model {row.model.toFixed(2)} {row.unit}</span><br/><span className="text-muted-foreground">Published {row.low}–{row.high} {row.unit}</span></div>
          <div><div className={`flex items-center gap-1 font-medium ${outside ? "text-destructive" : "text-primary"}`}>{outside ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}{outside ? "Outside comparison band" : "Inside comparison band"}</div><a href={row.url} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-2">{row.source}</a><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{row.limit}</p></div>
        </div>;
      })}
    </div>
    <div className="flex items-start gap-2 text-xs text-muted-foreground"><CircleHelp className="mt-0.5 size-3.5 shrink-0"/><p><a href="https://doi.org/10.1371/journal.pone.0336939.t002" target="_blank" rel="noreferrer" className="text-foreground underline decoration-border underline-offset-2">Lee et al. (2026), Table 2</a> measured ATP-linked oxygen consumption in 184 healthy adults’ blood cells (female median 6.4, IQR 3.9–8.8; male median 6.3, IQR 4.5–9.6). It is <strong>not flagged</strong> against model ATP flux in µM/s: oxygen consumption per protein and ATP production per volume are different quantities. ROS, iron and geometry likewise have no transferable universal healthy measurement here.</p></div>
  </section>;
}