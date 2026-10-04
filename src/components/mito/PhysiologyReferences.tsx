import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { studyReferences, studySections, unresolvedModelCitations } from "@/lib/mito/studyReferences";
import { etcSteps, mitoCarriers } from "@/lib/mito/reference";
import { modelSettingRows } from "@/lib/mito/settingsReference";
import { patientMetrics } from "@/lib/mito/patientReference";
import { defaultGeometry, defaultInputs } from "@/lib/mito/model";

const sourceUse = new Map<string, string[]>();
const addUse = (url: string, label: string) => {
  const doi = url.match(/doi\.org\/(.+)/)?.[1]?.replace(/\.t\d+$/, "");
  if (!doi) return;
  const uses = sourceUse.get(doi) ?? [];
  if (!uses.includes(label)) uses.push(label);
  sourceUse.set(doi, uses);
};
etcSteps.forEach((step) => {
  addUse(step.sourceUrl, step.step);
  // One ETC row cites Ramsay alongside Lucas; keep both discoverable.
  if (step.step === "Complex IV CuA / heme a") addUse("https://doi.org/10.1007/s40828-019-0085-4", step.step);
});
modelSettingRows(defaultInputs, defaultGeometry).forEach((row) => addUse(row.url, row.label));
patientMetrics.forEach((row) => addUse(row.sourceUrl, row.label));
addUse("https://doi.org/10.3390/jcm12103560", "Platelet aconitase and Fe-S assay proxy");
addUse("https://doi.org/10.1016/j.bbabio.2004.09.004", "Published P/O check");
addUse("https://doi.org/10.1126/science.adz4797", "SLC25A34 oxaloacetate carrier");

export function PhysiologyReferences() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => studyReferences.filter((ref) => {
    const uses = sourceUse.get(ref.doi) ?? [];
    return [ref.authors, ref.title, ref.journal, ref.year, ref.doi, ...uses].join(" ").toLowerCase().includes(query.trim().toLowerCase());
  }), [query]);

  return <section className="space-y-6" data-testid="physiology-references" aria-labelledby="physiology-references-title">
    <div className="border-b border-border pb-4">
      <div className="mono-label">Source index</div>
      <h2 id="physiology-references-title" className="mt-1 text-xl font-semibold">Physiology references</h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Full publication details and printed page spans or article numbers for the linked model studies. A span identifies the publication, not the exact page supporting each model value. Named tables are shown when cited. Model-derived bands and proxies are not measured textbook intervals. The 2026 cohort paper is a published measurement, not a textbook source.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search studies" placeholder="Search studies or model terms" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>
      <span className="font-mono text-xs text-muted-foreground">{filtered.length} of {studyReferences.length} verified records</span>
    </div>
    {studySections.map((section) => {
      const records = filtered.filter((ref) => ref.section === section);
      if (records.length === 0) return null;
      return <div key={section} className="space-y-2">
        <h3 className="border-b border-border pb-2 text-sm font-semibold">{section} <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{records.length}</span></h3>
        <div className="divide-y divide-border">
          {records.map((ref) => <article key={ref.doi} className="grid gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(165px,0.32fr)] sm:gap-6" data-testid="reference-study">
            <div className="min-w-0 space-y-1">
              <p className="font-medium leading-relaxed text-foreground">{ref.authors} ({ref.year}). {ref.title}. <cite className="font-normal">{ref.journal}</cite>, {ref.location}.</p>
              <p className="text-muted-foreground">Used for: {(sourceUse.get(ref.doi) ?? ["Model source note"]).join(" · ")}{ref.locator ? ` · ${ref.locator}` : ""}</p>
            </div>
            <div className="min-w-0 sm:text-right">
              <div className="font-mono text-[11px] text-muted-foreground">{ref.location}</div>
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-primary underline decoration-border underline-offset-2 hover:text-foreground" aria-label={`Open source for ${ref.title}`}>
                {ref.doi}<ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </article>)}
        </div>
      </div>;
    })}
    <div className="space-y-2" data-testid="mito-carriers">
      <h3 className="border-b border-border pb-2 text-sm font-semibold">Mitochondrial carriers (SLC25)</h3>
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-4">Gene</th><th className="pr-4">Carrier</th><th className="pr-4">Cargo</th><th className="pr-4">Model link</th><th>Source</th></tr></thead>
      <tbody className="divide-y divide-border">{mitoCarriers.map((c) => <tr key={c.gene}><td className="py-2 pr-4 font-mono">{c.gene}</td><td className="pr-4">{c.name}</td><td className="pr-4">{c.cargo}</td><td className="pr-4 text-muted-foreground">{c.modelLink}</td><td>{c.sourceUrl ? <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{"sourceLabel" in c && c.sourceLabel ? c.sourceLabel : "DOI"}</a> : <span className="text-muted-foreground">Textbook</span>}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">Qualitative: neither carrier is a slider, and the SLC25A34 adipocyte findings are not transferred as a rate.</p>
    </div>
    {filtered.length === 0 && <p className="py-6 text-sm text-muted-foreground">No studies match your search.</p>}
    <div className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Additional source notes needing verification</h3>
      <p className="mt-1 text-xs text-muted-foreground">These names appear in model notes or comparison labels, but a full matching publication or claim-specific page could not be established. They are not presented as verified citations.</p>
      <ul className="mt-3 grid gap-2 text-xs text-muted-foreground lg:grid-cols-2">{unresolvedModelCitations.map((citation) => <li key={citation} className="border-l-2 border-border pl-3">{citation}</li>)}</ul>
      <p className="mt-4 text-xs text-muted-foreground">Clinical catalog pages cited in Patient Data are online resources without printed page numbers; follow their links there for current laboratory guidance.</p>
    </div>
  </section>;
}