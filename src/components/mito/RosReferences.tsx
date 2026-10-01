import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { rosSources } from "@/lib/mito/rosPhysiology";
import { studyReferences } from "@/lib/mito/studyReferences";

const rosStudies = studyReferences.filter((study) => rosSources.some((source) => source.url === study.url));

export function RosReferences() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => rosSources.map((source) => ({
    source,
    study: rosStudies.find((candidate) => candidate.url === source.url),
  })).filter(({ source, study }) => [source.species, source.label, source.mechanism, source.literatureValue, study?.authors, study?.title, study?.doi].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return <section className="space-y-5" data-testid="ros-references" aria-labelledby="ros-references-title">
    <div className="border-b border-border pb-4">
      <div className="mono-label">Source index</div>
      <h2 id="ros-references-title" className="mt-1 text-xl font-semibold">ROS references</h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">The publications cited for each of the eleven modeled sources. Page spans identify whole papers, not verified pages for individual claims. Kinetic estimates, site partitions and radical yields identified as model assumptions are not measured reference intervals.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search ROS references" placeholder="Search sources or papers" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>
      <span className="font-mono text-xs text-muted-foreground">{filtered.length} of {rosSources.length} sources · {rosStudies.length} publications</span>
    </div>
    <div className="divide-y divide-border border-y border-border">
      {filtered.map(({ source, study }, index) => <article key={`${source.species}-${source.label}`} className="grid gap-3 py-4 text-xs md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:gap-6" data-testid="ros-reference-source">
        <div className="min-w-0">
          <div className="font-mono text-[10px] text-primary">{source.species} · {source.label}</div>
          <p className="mt-1 leading-relaxed text-foreground">{source.mechanism}</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">{source.literatureValue}</p>
        </div>
        <div className="min-w-0">
          {study ? <>
            <p className="leading-relaxed text-foreground">{study.authors} ({study.year}). {study.title}. <cite>{study.journal}</cite>, {study.location}.</p>
            <a href={study.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-primary underline decoration-border underline-offset-2 hover:text-foreground" aria-label={`Open publication for ${source.label}`}>
              {study.doi}<ExternalLink className="size-3 shrink-0" />
            </a>
          </> : <p className="text-destructive">Full publication metadata unverified. <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">Check cited link</a>.</p>}
        </div>
      </article>)}
    </div>
    {filtered.length === 0 && <p className="text-sm text-muted-foreground">No ROS sources match your search.</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">These four publications are shared across sources. Their mechanisms do not validate the model's source-specific µM/s rates or its ±25% change flags. The Radi paper focuses on protein tyrosine nitration; it is context for reactive nitrogen chemistry, not a direct measurement of the model's ONOOH radical yield.</p>
  </section>;
}