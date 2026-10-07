import { useSelectedProfile } from "@/lib/mito/selectedProfile";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TherapyOverlap } from "@/components/mito/TherapyOverlap";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diagnoseAll, mechanismNames } from "@/lib/mito/diagnosis";
import { moveLabel, rankTherapies, therapyTargets } from "@/lib/mito/treatment";

export const Route = createFileRoute("/treatment")({
  validateSearch: (s) => z.object({ profile: z.string().optional() }).parse(s),
  head: () => ({ meta: [
    { title: "Treatment: therapy targets in the model | Cristae Lab" },
    { name: "description", content: "Map research therapy classes to the ATP and ROS sliders they move, and simulate their effect on each synthetic profile. Not medical advice." },
    { property: "og:title", content: "Treatment: therapy targets in the model | Cristae Lab" },
    { property: "og:description", content: "From mechanism to model lever: which sliders antioxidants, chelation, photobiomodulation and other therapy classes target." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TreatmentPage,
});

const fmt = (v: number, d = 2) => (Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(1) : v.toFixed(d));
const delta = (a: number, b: number) => (a === 0 ? "" : ` (${b >= a ? "+" : ""}${(((b - a) / a) * 100).toFixed(0)}%)`);

function TreatmentPage() {
  const search = Route.useSearch();
  const all = useMemo(() => diagnoseAll(), []);
  const [id, setId] = useSelectedProfile("demo-04", search.profile);
  const [openTx, setOpenTx] = useState<string | null>(null);
  const d = all.find((x) => x.patient.id === id) ?? all[0]!;
  const ranked = useMemo(() => rankTherapies(d), [d]);

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 size-4" aria-hidden />Back to lab</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/diagnosis">Diagnosis</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/therapy-tools">Therapy tools</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Dashboard</Link></Button>
    </div>
    <header className="border-b border-border pb-4">
      <div className="mono-label">Therapy targets in the model</div>
      <h1 className="mt-1 text-2xl font-semibold">Treatment</h1>
      <p className="mt-2 border-l-2 border-destructive pl-3 text-xs leading-relaxed" role="note" data-testid="tx-banner">Synthetic data. Model levers, not prescriptions, and not medical advice. Each therapy class is mapped to the sliders it plausibly moves; slider sizes are illustrative, not doses.</p>
    </header>

    <section className="space-y-2">
      <label className="block text-xs font-medium" htmlFor="tx-select">Profile</label>
      <Select value={id} onValueChange={setId}>
        <SelectTrigger id="tx-select" aria-label="Profile" className="w-full max-w-md" data-testid="tx-select"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-[min(70vh,440px)]">{all.map((x) => <SelectItem key={x.patient.id} value={x.patient.id}>{x.patient.label} · {x.patient.age}y · {x.patient.phenotype}</SelectItem>)}</SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Mechanisms with any support: {d.causes.filter((c) => c.score > 0).map((c) => `${c.name} (${c.score.toFixed(2)})`).join(", ") || "none"}. Starting state: {d.patient.values.membranePotential} mV, other sliders at default.</p>
    </section>

    <section aria-label="Therapies" className="space-y-3">
      <h2 className="text-sm font-semibold">Ranked for this profile</h2>{!d.top && <p className="text-xs text-muted-foreground" data-testid="tx-none">No strong cause for this profile, so no therapy is targeted. Rows below show model effects only.</p>}
      <ol className="space-y-3">{ranked.map(({ therapy: t, sim, targeted, flagDrop }, i) => <li key={t.id} data-testid="tx-row" className={`border border-border p-3 text-xs ${targeted.length ? "bg-primary/5" : "opacity-80"}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-medium"><span className="font-mono text-primary">{i + 1}.</span> {t.name} <span className="font-normal text-muted-foreground">· {t.examples}</span></div>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{t.status}</span>
        </div>
        <p className="mt-1"><span className="text-muted-foreground">Targets:</span> {t.mechanisms.map((m) => mechanismNames[m]).join(", ")} {targeted.length ? <span className="text-primary">· matches {targeted.length} strong cause{targeted.length > 1 ? "s" : ""}</span> : <span className="text-muted-foreground">· no strong cause targeted</span>}</p>
        <p className="mt-1"><span className="text-muted-foreground">Sliders:</span> {t.moves.map(moveLabel).join("; ")}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-3">
          <span>ATP {fmt(sim.before.atp, 1)} to {fmt(sim.after.atp, 1)} µM/s{delta(sim.before.atp, sim.after.atp)}</span>
          <span>Cost {fmt(sim.before.cost)} to {fmt(sim.after.cost)} eV</span>
          <span>O2•- {fmt(sim.before.superoxide)} to {fmt(sim.after.superoxide)} nM{delta(sim.before.superoxide, sim.after.superoxide)}</span>
          <span>H2O2 {fmt(sim.before.h2o2)} to {fmt(sim.after.h2o2)} nM{delta(sim.before.h2o2, sim.after.h2o2)}</span>
          <span>ATP flags {sim.before.atpFlags} to {sim.after.atpFlags}</span>
          <span>ROS flags {sim.before.rosFlags} to {sim.after.rosFlags} {flagDrop > 0 ? "(fewer)" : flagDrop < 0 ? "(more)" : ""}</span>
        </div>
        <p className="mt-2 text-muted-foreground">{t.note} {t.citation && <a className="text-primary underline underline-offset-2" href={t.citation.url} target="_blank" rel="noopener noreferrer">{t.citation.text}</a>}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild><Link to="/" search={{ apply: t.id, patient: d.patient.id }}>Open in Simulator</Link></Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenTx(openTx === t.id ? null : t.id)} data-testid={`tx-targets-${t.id}`}>{openTx === t.id ? "Hide targeted disorders" : "Which disorders does this target?"}</Button>
        </div>
        {openTx === t.id && (() => { const hits = therapyTargets(t, all); return <div className="mt-2 border-t border-border pt-2" data-testid="tx-targets-list">
          <p className="text-[11px] text-muted-foreground">Profiles where this therapy matches a strong cause in the model. Synthetic data; a model match is not a clinical indication.</p>
          {hits.length === 0 ? <p className="mt-1 text-[11px] text-muted-foreground">No profile has a strong cause this therapy targets.</p> :
            <ul className="mt-1 space-y-1">{hits.map((h) => <li key={h.patient.id} className="text-[11px]"><Link to="/diagnosis" search={{ profile: h.patient.id }} className="font-medium text-primary underline underline-offset-2">{h.patient.label}</Link> <span className="text-muted-foreground">· {h.patient.phenotype} · matches {h.matched.map((c) => `${c.name} (${c.score.toFixed(2)})`).join(", ")}</span></li>)}</ul>}
        </div>; })()}
      </li>)}</ol>
    </section>

    <section aria-label="Limits" className="text-xs leading-relaxed text-muted-foreground">
      <h2 className="text-sm font-semibold text-foreground">Limits</h2>
      <p className="mt-1">Ranking: number of the profile's supported mechanisms a therapy targets, then their Diagnosis scores, then modeled flag reduction. It is not a ranking of clinical benefit. Each therapy is one set of slider moves from the profile's membrane potential with all other inputs at defaults; no pharmacokinetics, dosing, interactions or combined therapies. The model has no disease-specific defect inputs, so effects on a block are indirect. ROS flags are ±25% model comparisons; ATP flags use cited step bands. Profiles are invented.</p>
    </section>
    <TherapyOverlap patient={d.patient} />
  </main>;
}
