import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoPatients, patientMetrics, type PatientMetricKey } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { therapies } from "@/lib/mito/treatment";
import { addVisit, addPlan, diagnoseVisit, visitReadouts, visitProjection, patientTimeline, removeVisit, useVisits, withDerived } from "@/lib/mito/timeline";

const TimelineChart = lazy(() => import("@/components/mito/TimelineChart"));

export const Route = createFileRoute("/timeline")({
  validateSearch: (s) => z.object({ profile: z.string().optional() }).parse(s),
  head: () => ({ meta: [
    { title: "Timeline: lab results, flags and therapies | Cristae Lab" },
    { name: "description", content: "Track each profile's lab results, Diagnosis flags and selected model therapies across visits. Research and teaching only." },
    { property: "og:title", content: "Timeline: lab results, flags and therapies | Cristae Lab" },
    { property: "og:description", content: "Follow lab values, mechanism scores and therapy choices over time for synthetic and tab-only profiles." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TimelinePage,
});

type SimKey = "simAtp" | "simSuperoxide" | "simH2o2";
const simKeys = [{ key: "simAtp", r: "atp", label: "ATP flux (simulated)", unit: "µM/s" }, { key: "simSuperoxide", r: "superoxide", label: "Superoxide (simulated)", unit: "nM" }, { key: "simH2o2", r: "h2o2", label: "Hydrogen peroxide (simulated)", unit: "nM" }] as const;
const fmt = (x: number) => (Math.abs(x) >= 10 ? x.toFixed(1) : Number(x.toPrecision(3)).toString());
const originText = { baseline: "Profile values", synthetic: "Invented follow-up", user: "Your visit", plan: "Plan (no new labs)", real: "Real-world visit" } as const;

function TimelinePage() {
  const users = useUserPatients();
  const visits = useVisits();
  const all = useMemo(() => [...users, ...demoPatients], [users]);
  const [id, setId] = useState(Route.useSearch().profile ?? "demo-04");
  const p = all.find((x) => x.id === id) ?? all[0]!;
  // Projected-flag therapy pick: "visit" uses each visit's own therapies; a therapy id pins the Diagnosis projection, matching the dashboard's Batch therapy choice.
  const [projTherapy, setProjTherapy] = useState("visit");
  const onlyId = projTherapy === "visit" ? undefined : projTherapy;
  const timeline = useMemo(() => patientTimeline(p, visits).map((v) => ({ v, d: diagnoseVisit(p, v, onlyId), r: visitReadouts(p, v), pj: visitProjection(p, v) })), [p, visits, onlyId]);
  const [metric, setMetric] = useState<PatientMetricKey | "h2o2Nm" | SimKey>("lactate");
  const isH2o2 = metric === "h2o2Nm";
  const isMitosox = metric === "mitosox";
  const sim = simKeys.find((s) => s.key === metric);
  const m = patientMetrics.find((x) => x.key === metric);
  const mLabel = sim ? sim.label : isH2o2 ? "Hydrogen peroxide (measured)" : m!.label;
  const mUnit = sim ? sim.unit : isH2o2 ? "nM" : m!.unit;
  const cell = (v: (typeof timeline)[number]["v"], r: (typeof timeline)[number]["r"]): number | null => sim ? r[sim.r] : isH2o2 ? (v.h2o2Nm ?? null) : v.values[metric as PatientMetricKey];
  const chart = timeline.map(({ v, d, r }) => { const value = cell(v, r); return { date: v.date, value, top: d.causes[0]!.score, real: v.origin === "real" ? value : null, plan: v.origin === "plan" ? value : null }; });

  const last = timeline[timeline.length - 1]!.v;
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [doses, setDoses] = useState<Record<string, number>>({});
  const [kind, setKind] = useState<"user" | "real">("user");
  const [actual, setActual] = useState<Record<string, string>>({});
  const save = () => {
    const values = { ...last.values };
    for (const x of patientMetrics) { const n = Number(draft[x.key]); if (draft[x.key] !== undefined && draft[x.key] !== "" && Number.isFinite(n)) values[x.key] = n; }
    const h2n = Number(draft["h2o2Nm"]);
    const h2o2Nm = draft["h2o2Nm"] !== undefined && draft["h2o2Nm"] !== "" && Number.isFinite(h2n) ? h2n : last.h2o2Nm;
    const actualDoses = kind === "real" ? Object.fromEntries(picked.filter((t) => actual[t]?.trim()).map((t) => [t, actual[t]!.trim()])) : undefined;
    addVisit({ patientId: p.id, date, values: withDerived(values), h2o2Nm, therapies: picked, doses: Object.fromEntries(picked.map((t) => [t, doses[t] ?? 1])), actualDoses }, kind);
    setDraft({}); setPicked([]); setDoses({}); setActual({});
  };
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [planPicked, setPlanPicked] = useState<string[]>([]);
  const [planDoses, setPlanDoses] = useState<Record<string, number>>({});
  const savePlan = () => {
    addPlan({ patientId: p.id, date: planDate, therapies: planPicked, doses: Object.fromEntries(planPicked.map((t) => [t, planDoses[t] ?? 1])) });
    setPlanPicked([]); setPlanDoses({});
  };
  const convertPlan = (v: (typeof timeline)[number]["v"]) => {
    setDate(v.date);
    setPicked([...v.therapies]);
    setDoses({ ...(v.doses ?? {}) });
    document.getElementById("timeline-add")?.scrollIntoView({ behavior: "smooth" });
  };
  const tName = (tid: string) => therapies.find((t) => t.id === tid)?.name ?? tid;

  return <main className="mx-auto max-w-6xl px-4 py-6">
    <div className="mb-4 flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 size-4" aria-hidden />Back to lab</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/diagnosis" search={{ profile: p.id }}>Diagnosis</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/treatment">Treatment</Link></Button>
    </div>
    <h1 className="text-2xl font-semibold">Timeline</h1>
    <p className="mt-1 text-sm text-muted-foreground">Lab results, Diagnosis flags and selected model therapies per visit. Follow-ups for demo profiles are invented to show how tracking works. Your visits stay in this tab only and are never saved. Research and teaching only, not a diagnosis or treatment record.</p>

    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Select value={p.id} onValueChange={setId}><SelectTrigger className="w-72" aria-label="Profile"><SelectValue /></SelectTrigger>
        <SelectContent>{all.map((x) => <SelectItem key={x.id} value={x.id}>{x.label} · {x.phenotype}</SelectItem>)}</SelectContent></Select>
      <Select value={metric} onValueChange={(v) => setMetric(v as PatientMetricKey | SimKey)}><SelectTrigger className="w-64" aria-label="Lab value"><SelectValue /></SelectTrigger>
        <SelectContent>{patientMetrics.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}<SelectItem value="h2o2Nm">Hydrogen peroxide (measured, nM)</SelectItem>{simKeys.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent></Select>
      <label className="flex items-center gap-2 text-xs" data-testid="tl-proj-therapy-label">Projected flag therapy
        <select value={projTherapy} onChange={(e) => setProjTherapy(e.target.value)} data-testid="tl-proj-therapy" className="max-w-[220px] rounded border border-border bg-background px-1.5 py-0.5 text-xs">
          <option value="visit">Each visit's own therapies</option>
          {therapies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
    </div>

    <section className="mt-4 rounded-md border border-border p-3" data-testid="timeline-chart">
      <h2 className="text-sm font-semibold">{mLabel} <span className="font-normal text-muted-foreground">({mUnit})</span> and top mechanism score</h2>
      {sim && <p className="text-[11px] text-muted-foreground">Simulated from each visit's labs mapped to sliders, plus that visit's therapies at their model doses. Model dose is a slider value, never a drug dose. Not a clinical prediction.</p>}
      {isH2o2 && <p className="text-[11px] text-muted-foreground">Sies 2017: 1-10 nM signaling, 10-100 nM adaptive stress, above 100 nM distress. Research band, not a lab range. Visits without a measured value show a gap.</p>}
      {isMitosox && <p className="text-[11px] text-muted-foreground">Gonzalo et al., Front Neurosci 2019: 0.59-1.5 fold of the healthy-control median, one study's healthy-control spread. Research band, not a lab range; for children the adult band is applied with caution.</p>}
      <Suspense fallback={<div className="flex h-56 items-center justify-center text-xs text-muted-foreground">Loading chart…</div>}>
        <TimelineChart chart={chart} mLabel={mLabel} isH2o2={isH2o2} isMitosox={isMitosox} />
      </Suspense>
    </section>

    <section className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] text-xs" data-testid="timeline-table">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Date</th><th>Source</th><th>{mLabel}</th><th>Flags</th><th>Top mechanism</th><th>ATP (µM/s)</th><th>Superoxide (nM)</th><th>H2O2 sim (nM)</th><th>Therapies (model dose)</th><th>Projected flag</th><th /></tr></thead>
        <tbody>{timeline.map(({ v, d, r, pj }) => {
          const flags = d.patientFlags.length + d.rosAssayFlags.length + d.atpAssayFlags.length + d.modelFlags.length;
          return <tr key={v.id} className="border-t border-border align-top" data-testid="timeline-row">
            <td className="py-1.5 font-mono">{v.date}</td>
            <td>{originText[v.origin]}</td>
            <td className="tabular-nums">{sim ? fmt(r[sim.r]) : isH2o2 ? (v.h2o2Nm !== undefined ? <span className={v.h2o2Nm > 100 ? "text-destructive" : ""}>{v.h2o2Nm.toFixed(0)}</span> : <span className="text-muted-foreground">Not measured</span>) : v.values[metric as PatientMetricKey].toFixed(m!.decimals)}</td>
            <td title={d.patientFlags.map((f) => f.label).join(", ")}>{flags}</td>
            <td>{d.top ? `${d.top.name} (${d.top.score.toFixed(2)})` : "None strong"}</td>
            <td className="tabular-nums" data-testid="tl-atp">{fmt(r.atp)}</td><td className="tabular-nums">{fmt(r.superoxide)}</td><td className="tabular-nums">{fmt(r.h2o2)}</td>
            <td>{v.therapies.length ? v.therapies.map((t) => `${tName(t)} ${v.doses?.[t] ?? 1}x${v.actualDoses?.[t] ? ` (taken: ${v.actualDoses[t]})` : ""}`).join(", ") : "None"}</td>
            <td data-testid="tl-projected">{onlyId ? (d.projectedFlags.length ? <div className="space-y-0.5">{d.projectedFlags.map((f) => <div key={f.label}>{f.label.replace(" (projected)", "")}: {f.detail}</div>)}</div> : <span className="text-muted-foreground">No measured band flag</span>) : !pj ? <span className="text-muted-foreground">No therapy</span> : <div className="space-y-0.5">
              <div>MitoSOX {v.values.mitosox.toFixed(2)}x to {pj.ms.value.toFixed(2)}x {pj.msMeasuredOut && !pj.ms.outside ? <span className="font-medium text-primary">flag clears</span> : pj.ms.outside ? <span className="text-destructive">{pj.msMeasuredOut ? "still outside" : "outside band"}</span> : <span className="text-muted-foreground">within</span>}</div>
              {pj.h2 && v.h2o2Nm !== undefined && <div>H2O2 {v.h2o2Nm.toFixed(0)} to {pj.h2.value.toFixed(0)} nM {pj.h2MeasuredOut && !pj.h2.outside ? <span className="font-medium text-primary">flag clears</span> : pj.h2.outside ? <span className="text-destructive">{pj.h2MeasuredOut ? "still flagged" : "flagged"}</span> : <span className="text-muted-foreground">within</span>}</div>}
            </div>}</td>
            <td><div className="flex items-center gap-1.5">
              {v.origin === "plan" && <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" data-testid="tl-convert-plan" onClick={() => convertPlan(v)}>Convert to visit</Button>}
              {(v.origin === "user" || v.origin === "plan" || v.origin === "real") && <button type="button" aria-label="Remove visit" onClick={() => removeVisit(v.id)}><Trash2 className="size-3.5 text-muted-foreground" /></button>}
            </div></td>
          </tr>;
        })}</tbody>
      </table>
      <p className="mt-1 text-[10px] text-muted-foreground">Flags combine lab, ROS assay, ATP assay and model flags using the Diagnosis rules. Scores are rankings, not probabilities. Projected flag scales the visit's measured MitoSOX (and peroxide, if entered) by the model's change from that visit's therapies at their model doses; a model estimate, not a lab result, and not counted in Flags. With a therapy picked in the Projected flag therapy menu, the column instead shows the Diagnosis projection for that therapy at the 1x model dose, the same pick as the dashboard's Batch therapy, so the pages agree.</p>
    </section>

    <section id="timeline-add" className="mt-6 rounded-md border border-border p-3" data-testid="timeline-add">
      <h2 className="text-sm font-semibold">Add a visit</h2>
      <p className="text-[11px] text-muted-foreground">Blank fields carry over from the latest visit. Lactate:pyruvate is recalculated.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2"><label className="text-xs" htmlFor="tl-date">Date</label><Input id="tl-date" type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="ml-3 text-xs" htmlFor="tl-kind">Visit type</label>
        <select id="tl-kind" data-testid="tl-kind" className="h-8 rounded border border-input bg-background px-2 text-xs" value={kind} onChange={(e) => setKind(e.target.value as "user" | "real")}><option value="user">Model visit</option><option value="real">Real-world visit (actual labs and doses)</option></select></div>
      {kind === "real" && <p className="mt-1 text-[11px] text-muted-foreground">Enter the labs actually measured and the dose actually taken for each therapy. The actual dose is recorded only; the model still uses the model dose you pick. Kept in this tab only, never saved or sent anywhere.</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{patientMetrics.filter((x) => x.key !== "lactatePyruvate").map((x) =>
        <label key={x.key} className="text-[11px]">{x.label} <span className="text-muted-foreground">({x.unit})</span>
          <Input inputMode="decimal" placeholder={String(last.values[x.key])} value={draft[x.key] ?? ""} onChange={(e) => setDraft({ ...draft, [x.key]: e.target.value })} className="mt-0.5 h-8" /></label>)}
        <label className="text-[11px]">Hydrogen peroxide (measured) <span className="text-muted-foreground">(nM)</span>
          <Input inputMode="decimal" placeholder={last.h2o2Nm !== undefined ? String(last.h2o2Nm) : "Not measured"} value={draft["h2o2Nm"] ?? ""} onChange={(e) => setDraft({ ...draft, h2o2Nm: e.target.value })} className="mt-0.5 h-8" /></label></div>
      <h3 className="mt-3 text-xs font-semibold">Selected therapies and model doses (slider moves only, never drug doses)</h3>
      <div className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{therapies.map((t) =>
        <div key={t.id} className="flex flex-wrap items-center gap-2 text-[11px]"><label className="flex flex-1 items-center gap-2"><Checkbox checked={picked.includes(t.id)} onCheckedChange={(c) => setPicked(c ? [...picked, t.id] : picked.filter((x) => x !== t.id))} />{t.name}</label>
          {picked.includes(t.id) && <select aria-label={`${t.name} model dose`} className="rounded border border-input bg-background px-1 py-0.5" value={doses[t.id] ?? 1} onChange={(e) => setDoses({ ...doses, [t.id]: Number(e.target.value) })}>{[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((d) => <option key={d} value={d}>{d}x</option>)}</select>}
          {kind === "real" && picked.includes(t.id) && <Input aria-label={`${t.name} actual dose`} data-testid={`tl-actual-${t.id}`} className="h-7 w-full" placeholder={`Actual dose, e.g. ${t.clinicalDose}`} value={actual[t.id] ?? ""} onChange={(e) => setActual({ ...actual, [t.id]: e.target.value })} />}</div>)}</div>
      <Button size="sm" className="mt-3" onClick={save} disabled={!date}>Add visit</Button>
    </section>

    <section className="mt-6 rounded-md border border-border p-3" data-testid="timeline-plan">
      <h2 className="text-sm font-semibold">Add a plan row</h2>
      <p className="text-[11px] text-muted-foreground">A plan row saves therapies and model doses without new lab results. It reuses the latest earlier visit's labs, so the table and the Projected flag column show how the plan's clearance would look over time. A model dose is a slider value, never a drug dose; projections are model estimates, not lab results.</p>
      <div className="mt-2 flex items-center gap-2"><label className="text-xs" htmlFor="tl-plan-date">Date</label><Input id="tl-plan-date" type="date" className="w-44" value={planDate} onChange={(e) => setPlanDate(e.target.value)} /></div>
      <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{therapies.map((t) =>
        <div key={t.id} className="flex items-center gap-2 text-[11px]"><label className="flex flex-1 items-center gap-2"><Checkbox checked={planPicked.includes(t.id)} onCheckedChange={(c) => setPlanPicked(c ? [...planPicked, t.id] : planPicked.filter((x) => x !== t.id))} />{t.name}</label>
          {planPicked.includes(t.id) && <select aria-label={`${t.name} plan model dose`} className="rounded border border-input bg-background px-1 py-0.5" value={planDoses[t.id] ?? 1} onChange={(e) => setPlanDoses({ ...planDoses, [t.id]: Number(e.target.value) })}>{[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((d) => <option key={d} value={d}>{d}x</option>)}</select>}</div>)}</div>
      <Button size="sm" className="mt-3" onClick={savePlan} disabled={!planDate || !planPicked.length}>Add plan row</Button>
    </section>
  </main>;
}
