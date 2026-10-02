import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diagnoseAll, flagOverlaps, type Evidence } from "@/lib/mito/diagnosis";
import { UserLabsPanel } from "@/components/mito/UserLabsPanel";
import { useUserPatients } from "@/lib/mito/userPatients";

export const Route = createFileRoute("/diagnosis")({
  head: () => ({ meta: [
    { title: "Diagnosis: mechanism pattern review | Cristae Lab" },
    { name: "description", content: "Rank likely mitochondrial mechanisms for each synthetic profile by combining Patient Data, ROS and ATP flags. Research and teaching only." },
    { property: "og:title", content: "Diagnosis: mechanism pattern review | Cristae Lab" },
    { property: "og:description", content: "Synthetic profiles ranked by likely mechanism: respiratory-chain block, pyruvate entry, coupling loss, iron stress and oxidant load." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DiagnosisPage,
});

const fitStyle = { matches: "text-primary", "partly matches": "text-foreground", "does not match": "text-destructive" } as const;

function EvidenceList({ title, items, empty }: { title: string; items: Evidence[]; empty: string }) {
  return <div className="min-w-0 border-t border-border pt-3">
    <h4 className="text-xs font-semibold">{title} <span className="font-mono text-muted-foreground">{items.length}</span></h4>
    {items.length === 0 ? <p className="mt-1 text-[11px] text-muted-foreground">{empty}</p> :
      <ul className="mt-1 space-y-1 text-[11px]">{items.map((e) => <li key={e.label + e.detail}><span className="font-medium">{e.label}</span> <span className="text-muted-foreground">· {e.detail} · {e.type}{e.origin ? ` · ${e.origin === "synthetic" ? "synthetic value" : e.origin === "published" ? "published value" : "your value"}` : ""}</span></li>)}</ul>}
  </div>;
}

function DiagnosisPage() {
  const users = useUserPatients();
  const all = useMemo(() => diagnoseAll(users), [users]);
  const [id, setId] = useState("demo-04");
  const d = all.find((x) => x.patient.id === id) ?? all[0]!;

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <div className="flex gap-2"><Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 size-4" aria-hidden />Back to lab</Link></Button><Button variant="outline" size="sm" asChild><Link to="/treatment" search={{ profile: id }} data-testid="dx-treatment">See therapy targets</Link></Button><Button variant="outline" size="sm" asChild><Link to="/treatment-plan" search={{ profile: id }} data-testid="dx-plan">Treatment plan</Link></Button></div>
    <header className="border-b border-border pb-4">
      <div className="mono-label">Mechanism pattern review</div>
      <h1 className="mt-1 text-2xl font-semibold">Diagnosis</h1>
      <p className="mt-2 border-l-2 border-destructive pl-3 text-xs leading-relaxed" role="note" data-testid="dx-banner">Mostly synthetic data; values from published cases or your own results are labeled. For research and teaching only, not a medical diagnosis. Causes are mitochondrial mechanisms ranked from model and assay flags; nothing here confirms a disease.</p>
    </header>

    <section aria-label="All profiles" className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2 font-medium">Profile</th><th className="px-3 py-2 font-medium">Patient Data</th><th className="px-3 py-2 font-medium">ROS assay</th><th className="px-3 py-2 font-medium">ATP assay</th><th className="px-3 py-2 font-medium">Model</th><th className="px-3 py-2 font-medium">Top cause</th><th className="px-3 py-2 font-medium">Label fit</th>
        </tr></thead>
        <tbody>{all.map((x) => <tr key={x.patient.id} data-testid="dx-row" onClick={() => setId(x.patient.id)} className={`cursor-pointer border-t border-border/60 hover:bg-muted/30 ${x.patient.id === id ? "bg-primary/10" : ""}`}>
          <th scope="row" className="px-3 py-2 font-medium">{x.patient.phenotype}<span className="block text-[10px] font-normal text-muted-foreground">{x.patient.label} · {x.patient.age}y · {Math.round(x.realShare * 100)}% real data</span></th>
          <td className="px-3 py-2 font-mono">{x.patientFlags.length}</td><td className="px-3 py-2 font-mono">{x.rosAssayFlags.length}</td><td className="px-3 py-2 font-mono">{x.atpAssayFlags.length}</td><td className="px-3 py-2 font-mono">{x.modelFlags.length}</td>
          <td className="px-3 py-2" data-testid="dx-top">{x.top ? `${x.top.name} (${x.top.score.toFixed(2)})` : <span className="text-muted-foreground">No strong cause</span>}</td>
          <td className={`px-3 py-2 ${x.patient.source === "user" ? "text-muted-foreground" : fitStyle[x.fit]}`}>{x.patient.source === "user" ? "no label to check" : x.fit}</td>
        </tr>)}</tbody>
      </table>
    </section>

    <UserLabsPanel onAdded={setId} />

    <section aria-label="Selected profile" className="space-y-5">
      <div>
        <label className="block text-xs font-medium" htmlFor="dx-select">Profile</label>
        <Select value={id} onValueChange={setId}>
          <SelectTrigger id="dx-select" aria-label="Profile" className="mt-2 w-full max-w-md" data-testid="dx-select"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-[min(70vh,440px)]">{all.map((x) => <SelectItem key={x.patient.id} value={x.patient.id}>{x.patient.label} · {x.patient.age}y · {x.patient.phenotype}</SelectItem>)}</SelectContent>
        </Select>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground">{d.patient.description} {d.patient.context}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Likely causes</h2>
        <ol className="mt-2 space-y-3">{d.causes.map((c, i) => <li key={c.mechanism} className="border-b border-border/60 pb-3 text-xs last:border-b-0" data-testid="dx-cause">
          <div className="flex flex-wrap items-center gap-2 font-medium">{c.score >= 1.5 ? <AlertTriangle className="size-3.5 text-destructive" aria-hidden /> : c.score > 0 ? <CircleHelp className="size-3.5 text-muted-foreground" aria-hidden /> : <CheckCircle2 className="size-3.5 text-primary" aria-hidden />}<span className="font-mono text-primary">{i + 1}.</span>{c.name}<span className="font-mono text-muted-foreground">score {c.score.toFixed(2)}</span></div>
          <p className="pl-5 text-[11px] text-muted-foreground" data-testid="dx-real">{c.measuredEvidence ? `${c.realEvidence} of ${c.measuredEvidence} supporting measurements are real (published or yours)${c.realEvidence === 0 ? "; backed only by synthetic fill" : ""}` : "No supporting measurements"}</p>
          {c.supporting.length > 0 && <p className="mt-1 pl-5 text-muted-foreground"><span className="text-foreground">Supports:</span> {c.supporting.map((e) => `${e.label} (${e.detail}; ${e.type})`).join("; ")}</p>}
          {c.conflicting.length > 0 && <p className="mt-1 pl-5 text-muted-foreground"><span className="text-destructive">Conflicts:</span> {c.conflicting.map((e) => `${e.label} (${e.detail})`).join("; ")}</p>}
          {c.mechanism === "oxidant" && c.score > 0 && <p className="mt-1 pl-5 text-[11px] text-muted-foreground">Half weight: ROS probe signals are nonspecific and can follow any primary defect.</p>}
        </li>)}</ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EvidenceList title="Patient Data flags" items={d.patientFlags} empty="No measurement outside its cited band or ±25% of the age-matched healthy profile." />
        <EvidenceList title="ROS assay flags" items={d.rosAssayFlags} empty="MitoSOX, H₂O₂ and lipid oxidation within ±25% of healthy." />
        <EvidenceList title="ATP assay flags" items={d.atpAssayFlags} empty="P/O and ATP-linked respiration within ±25% of healthy." />
        <EvidenceList title="Model flags" items={d.modelFlags} empty="No model ATP or ROS flag at this profile's membrane potential." />
      </div>

      <div data-testid="dx-overlap">
        <h2 className="text-sm font-semibold">Which disorders share these flags</h2>
        {overlap.perFlag.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">No flagged values, so no disorder overlap to show.</p> : <>
          <ol className="mt-2 space-y-2 text-xs">{overlap.ranked.slice(0, 6).map((r, i) => <li key={r.phenotype} data-testid="dx-overlap-row" className="border-b border-border/60 pb-2 last:border-b-0">
            <span className="font-mono text-primary">{i + 1}.</span> <span className="font-medium">{r.phenotype}</span> <span className="font-mono text-muted-foreground">shares {r.shared} of {r.total} flags</span>
            <span className="block pl-5 text-[11px] text-muted-foreground">{r.flags.join("; ")}</span>
          </li>)}</ol>
          <details className="mt-2 text-xs"><summary className="cursor-pointer text-muted-foreground">Per flagged value</summary>
            <ul className="mt-1 space-y-1 pl-4 text-[11px]">{overlap.perFlag.map((f) => <li key={f.key}><span className="font-medium">{f.label} {f.dir}</span> <span className="text-muted-foreground">({f.basis})</span>{f.matches.length ? <span className="text-muted-foreground"> · also flagged in: {f.matches.map((m) => m.phenotype).join(", ")}</span> : <span className="text-muted-foreground"> · no disorder profile flags this value</span>}</li>)}</ul>
          </details>
        </>}
        <p className="mt-2 text-[11px] text-muted-foreground">Overlap counts shared flags only. It is not a likelihood and does not rank diseases; most values are synthetic.</p>
      </div>

      <div className="border-l-2 border-border pl-3 text-xs" data-testid="dx-fit">
        <h2 className="text-sm font-semibold">Does the label fit?</h2>
        {d.patient.source === "user" ? <p className="mt-1 text-muted-foreground">Your results carry no condition label, so there is nothing to check against.</p> : <p className="mt-1"><span className={`font-medium ${fitStyle[d.fit]}`}>{d.fit}</span>. Pattern this profile was written to show: {d.expected.text}</p>}
      </div>
    </section>

    <section aria-label="Limits" className="text-xs leading-relaxed text-muted-foreground">
      <h2 className="text-sm font-semibold text-foreground">Limits</h2>
      <p className="mt-1">Score = supporting flags weighted by evidence type (measured assay 1, derived ratio 0.75, model simulation 0.5) minus conflicting flags; 1.5 or more counts as a strong cause. Scores are not probabilities. Cited bands apply only to adults, and fasting glucose bands skip acute nonfasting samples; otherwise values are compared with the age-matched healthy synthetic profile at ±25%. Proxies such as PBMC probes are not tissue assays. Ferritin is also an acute-phase marker, so in acute illness (brain injury, stroke, sepsis) its support for iron stress counts at quarter weight. Model flags use only the profile's membrane potential.</p>
    </section>
  </main>;
}
