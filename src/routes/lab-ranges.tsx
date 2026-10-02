import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, CheckCircle2, CircleHelp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultGeometry, defaultInputs } from "@/lib/mito/model";
import { modelSettingRows, settingsGroups, type SettingRow } from "@/lib/mito/settingsReference";
import { readoutBands } from "@/lib/mito/patientReference";
import { ATP_COST_EV, ATP_COST_TEXTBOOK, poLiteratureBands } from "@/lib/mito/reference";
import { demoPatients, formatRangeText, patientGroups, patientMetrics, referenceFor, type PatientMetric } from "@/lib/mito/patientReference";

export const Route = createFileRoute("/lab-ranges")({
  head: () => ({ meta: [
    { title: "Lab ranges and slider references | Cristae Lab" },
    { name: "description", content: "Every model slider and patient metric with its published reference range and source citation, so model flags can be compared against real studies." },
    { property: "og:title", content: "Lab ranges and slider references | Cristae Lab" },
    { property: "og:description", content: "Reference ranges with citations for every model slider and patient metric; sliders without a published range are marked context dependent." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LabRangesPage,
});

function SourceLink({ source, url }: { source: string; url: string }) {
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">{source}<ExternalLink className="size-3" aria-hidden /></a>;
}

function SliderSection({ group, rows }: { group: string; rows: SettingRow[] }) {
  return <section aria-label={group} className="overflow-x-auto border-y border-border">
    <h3 className="bg-muted/40 px-3 py-2 text-xs font-semibold">{group} <span className="font-mono font-normal text-muted-foreground">{rows.length}</span></h3>
    <table className="w-full min-w-[820px] text-left text-xs">
      <thead className="text-[10px] uppercase text-muted-foreground"><tr>
        <th className="px-3 py-2 font-medium">Slider</th><th className="px-3 py-2 font-medium">Default</th><th className="px-3 py-2 font-medium">Reference range</th><th className="px-3 py-2 font-medium">Status at default</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Note</th>
      </tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} data-testid="lab-range-slider-row" className="border-t border-border/60">
        <th scope="row" className="px-3 py-2 font-medium">{r.label}</th>
        <td className="px-3 py-2 font-mono">{r.baseline}</td>
        <td className="px-3 py-2">{r.reference}</td>
        <td className="px-3 py-2">{r.status === "Within range"
          ? <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="size-3.5" aria-hidden />Within range</span>
          : r.status === "Outside range"
            ? <span className="text-destructive">Outside range{r.drift ? ` · ${r.drift}` : ""}</span>
            : <span className="inline-flex items-center gap-1 text-muted-foreground"><CircleHelp className="size-3.5" aria-hidden />No published range</span>}</td>
        <td className="px-3 py-2"><SourceLink source={r.source} url={r.url} /></td>
        <td className="max-w-[280px] px-3 py-2 text-[11px] text-muted-foreground">{r.note}</td>
      </tr>)}</tbody>
    </table>
  </section>;
}

function MetricSection({ group, metrics }: { group: string; metrics: PatientMetric[] }) {
  const healthy = demoPatients[0];
  return <section aria-label={group} className="overflow-x-auto border-y border-border">
    <h3 className="bg-muted/40 px-3 py-2 text-xs font-semibold">{group} <span className="font-mono font-normal text-muted-foreground">{metrics.length}</span></h3>
    <table className="w-full min-w-[820px] text-left text-xs">
      <thead className="text-[10px] uppercase text-muted-foreground"><tr>
        <th className="px-3 py-2 font-medium">Measurement</th><th className="px-3 py-2 font-medium">Specimen / method</th><th className="px-3 py-2 font-medium">Range (healthy adult)</th><th className="px-3 py-2 font-medium">Kind</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Note</th>
      </tr></thead>
      <tbody>{metrics.map((m) => {
        const res = referenceFor(healthy, m);
        return <tr key={m.key} data-testid="lab-range-metric-row" className="border-t border-border/60">
          <th scope="row" className="px-3 py-2 font-medium">{m.label}<span className="block text-[10px] font-normal text-muted-foreground">{m.unit}</span></th>
          <td className="px-3 py-2 text-[11px] text-muted-foreground">{m.specimen} · {m.method}</td>
          <td className="px-3 py-2 font-mono">{res.range ? `${formatRangeText(res.range)} ${m.unit === "ratio" ? "" : m.unit}` : <span className="font-sans text-muted-foreground">{res.reason}</span>}
            {res.range ? <span className="block font-sans text-[10px] text-muted-foreground">{res.range.label}</span> : null}</td>
          <td className="px-3 py-2">{res.range ? (res.range.kind === "Lab" ? "Lab range" : "Research band") : "None"}</td>
          <td className="px-3 py-2">{res.range ? <SourceLink source={res.range.source} url={res.range.url} /> : <SourceLink source={m.sourceCitation} url={m.sourceUrl} />}</td>
          <td className="max-w-[280px] px-3 py-2 text-[11px] text-muted-foreground">{m.note}</td>
        </tr>;
      })}</tbody>
    </table>
  </section>;
}

function LabRangesPage() {
  const rows = useMemo(() => modelSettingRows(defaultInputs, defaultGeometry), []);
  const withBand = rows.filter((r) => r.status !== "Context dependent").length;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="lab-ranges-page">
    <div className="flex gap-2"><Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 size-4" aria-hidden />Back to lab</Link></Button></div>
    <header className="border-b border-border pb-4">
      <div className="mono-label">Reference ranges with citations</div>
      <h1 className="mt-1 text-2xl font-semibold">Lab ranges</h1>
      <p className="mt-2 border-l-2 border-destructive pl-3 text-xs leading-relaxed" role="note">Every range below links to its published source. Only {withBand} of {rows.length} model sliders have a published numeric range; the rest are marked "No published range" rather than given a guessed interval. Research and teaching only, not a clinical reference.</p>
    </header>

    <section aria-label="Derived model readouts" className="space-y-2 border border-border p-3 text-xs">
      <h2 className="text-sm font-semibold">Derived model readouts</h2>
      <ul className="space-y-1 text-[11px]">
        <li><span className="font-medium">Effective ATP cost:</span> model {ATP_COST_EV} eV/ATP at standard state; compared with {ATP_COST_TEXTBOOK.lo}-{ATP_COST_TEXTBOOK.hi} eV/ATP. <SourceLink source="Nicholls & Ferguson, Bioenergetics (2013)" url="https://doi.org/10.1016/B978-0-12-388425-1.00003-8" /></li>
        <li><span className="font-medium">NADH-linked P/O:</span> {poLiteratureBands.nadh.low}-{poLiteratureBands.nadh.high} ATP/O; <span className="font-medium">succinate-linked P/O:</span> {poLiteratureBands.fadh2.low}-{poLiteratureBands.fadh2.high} ATP/O. <SourceLink source="Hinkle, Biochim Biophys Acta (2005)" url="https://doi.org/10.1016/j.bbabio.2004.09.004" /></li>
      </ul>
      <h3 className="pt-2 text-xs font-semibold">Readout bands used by the Patient Comparison drift check</h3>
      <ul className="space-y-1 text-[11px]" data-testid="readout-bands">{readoutBands.map((b) => <li key={b.key}><span className="font-medium">{b.label}:</span> {b.lo}-{b.hi} {b.unit}. {b.basis}. {b.note} <SourceLink source={b.source} url={b.url} /></li>)}</ul>
    </section>

    <h2 className="text-sm font-semibold">Model sliders <span className="font-mono text-xs font-normal text-muted-foreground">{rows.length}</span></h2>
    {settingsGroups.map((g) => <SliderSection key={g} group={g} rows={rows.filter((r) => r.group === g)} />)}

    <h2 className="text-sm font-semibold">Patient measurements <span className="font-mono text-xs font-normal text-muted-foreground">{patientMetrics.length}</span></h2>
    <p className="text-[11px] text-muted-foreground">Ranges resolved for the healthy adult profile; age, sex and fasting state change some intervals. Pediatric and acute profiles use their own strata on the Patient Data tab.</p>
    {patientGroups.map((g) => <MetricSection key={g} group={g} metrics={patientMetrics.filter((m) => m.group === g)} />)}
  </main>;
}
