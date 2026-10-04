import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { libraryRows } from "@/lib/mito/referenceLibrary";
import { studySections } from "@/lib/mito/studyReferences";

export const Route = createFileRoute("/references")({
  head: () => ({
    meta: [
      { title: "Reference library - Cristae Lab" },
      { name: "description", content: "Every study the Cristae Lab model cites, with a one-line synopsis and a 0-100 relevance, evidence and usability score." },
      { property: "og:title", content: "Reference library - Cristae Lab" },
      { property: "og:description", content: "Scored library of the studies behind the mitochondrial model." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReferencesPage,
});

function ReferencesPage() {
  const all = useMemo(() => libraryRows(), []);
  const [section, setSection] = useState("all");
  const [q, setQ] = useState("");
  const rows = all.filter((r) => (section === "all" || r.section === section) && (q === "" || `${r.title} ${r.authors} ${r.entry?.synopsis ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Reference library</h1>
      <p className="text-sm text-muted-foreground">Score out of 100 = relevance to this model (40) + evidence strength (30) + usable numbers for the model (30). It is an appraisal for prioritising sources, not a journal metric.</p>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <select value={section} onChange={(e) => setSection(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          <option value="all">All sections</option>
          {studySections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="self-center font-mono text-xs text-muted-foreground" data-testid="refs-count">{rows.length} of {all.length}</span>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm" data-testid="refs-table">
          <thead className="bg-muted/50 text-left text-xs"><tr><th className="p-2">Score</th><th className="p-2">Study</th><th className="p-2">Synopsis</th><th className="p-2">Used for</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.doi} className="border-t border-border/60 align-top" data-testid="refs-row">
              <td className="p-2 font-mono">{r.score ?? "n/a"}<span className="text-muted-foreground">/100</span>{r.entry && <div className="text-[10px] text-muted-foreground">R{r.entry.relevance} E{r.entry.evidence} U{r.entry.usability}</div>}</td>
              <td className="p-2"><a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{r.title}</a><div className="text-xs text-muted-foreground">{r.authors.split(",").slice(0, 3).join(",")}{r.authors.split(",").length > 3 ? ", et al." : ""} · {r.journal} ({r.year}) · {r.section}</div></td>
              <td className="p-2">{r.entry?.synopsis ?? "Not yet appraised"}</td>
              <td className="p-2 text-xs text-muted-foreground">{r.entry?.usedFor ?? ""}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
