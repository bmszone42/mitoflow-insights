import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoPatients } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { diagnoseAll, diagnoseProfile, therapyPlanRows } from "@/lib/mito/diagnosis";
import { buildPlan, modelDoses, profileInputs } from "@/lib/mito/treatment";
import { recordRun } from "@/lib/mito/runs";
import { ScenarioTherapyPlan } from "@/components/mito/ScenarioTherapyPlan";

type Diagnosed = ReturnType<typeof diagnoseProfile>;

export const Route = createFileRoute("/therapy-plan")({
  validateSearch: (s: Record<string, unknown>): { profile?: string | undefined } => ({
    profile: typeof s["profile"] === "string" ? s["profile"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Therapy plan: flagged therapies and projected clearance | Cristae Lab" },
    { name: "description", content: "Flagged model therapies for each profile at a chosen model dose, with ATP and ROS changes and projected MitoSOX and peroxide flag clearance. Research only." },
    { property: "og:title", content: "Therapy plan | Cristae Lab" },
    { property: "og:description", content: "Per-profile flagged therapies, model dose, readout changes and projected flag clearance. Model estimates, not a prescription." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TherapyPlan,
});

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const pc = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;
const status = (measuredOut: boolean, outside: boolean) => measuredOut && !outside ? "flag clears" : outside ? (measuredOut ? "still outside" : "outside") : "within";
const f = (v: number, d = 2) => (Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(1) : v.toFixed(d));
const pctOf = (a: number, b: number) => (a === 0 ? "" : ` (${b >= a ? "+" : ""}${(((b - a) / a) * 100).toFixed(0)}%)`);

function TherapyPlan() {
  const search = Route.useSearch();
  const users = useUserPatients();
  const pool = useMemo(() => [...users, ...demoPatients], [users]);
  const [id, setId] = useState(search.profile ?? "all");
  const [dose, setDose] = useState(1);
  const groups = useMemo(() => pool.filter((p) => id === "all" || p.id === id).map((p) => ({ p, rows: therapyPlanRows(p, dose) })), [pool, id, dose]);
  // Log each profile's flagged-therapy plan to the local run log (Scenario progress page).
  useEffect(() => {
    for (const g of groups) if (g.rows.length) recordRun(g.p.id, "plan", dose, g.rows.map((r) => r.t.id), profileInputs(g.p).rirrStrength);
  }, [groups, dose]);

  const csv = () => {
    const head = ["Profile", "ID", "Therapy", "Model dose", "Real-world dose (1x anchor)", "Dose source", "Targets", "ATP change", "Superoxide change", "H2O2 change", "Measured MitoSOX", "Projected MitoSOX", "MitoSOX status", "Measured H2O2 (nM)", "Projected H2O2 (nM)", "H2O2 status"];
    const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = groups.flatMap(({ p, rows }) => rows.map((r) => [p.label, p.id, r.t.name, `${dose}x`, r.t.clinicalDose, r.t.doseSource ? `${r.t.doseSource.text} (${r.t.doseSource.url})` : "", r.targets, pc(r.atp), pc(r.so), pc(r.h2), p.values.mitosox.toFixed(2), r.ms.value.toFixed(2), status(r.msOut, r.ms.outside), p.h2o2Nm ?? "", r.pH2 ? r.pH2.value.toFixed(0) : "", r.pH2 ? status(r.h2Out, r.pH2.outside) : "not measured"].map(q).join(",")));
    const body = [head.map(q).join(","), ...lines, "", q("Research model only. Model dose is a slider value, never a drug dose; the real-world dose is the published clinical or trial dose the 1x model dose is anchored to, an illustrative link only and never a dosing guide. Dose source names the label, fact sheet or trial listing behind each anchor. Projections scale measured values by model change; not lab results.")].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); a.download = `cristae-lab-therapy-plan-${id}-${dose}x.csv`; a.click();
  };

  return <main className="mx-auto max-w-6xl p-4">
    <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="mr-1 size-4" />Dashboard</Link></Button>
    <h1 className="mt-2 text-xl font-semibold">Therapy plan</h1>
    <p className="mt-1 text-sm text-muted-foreground">Flagged therapies per profile (they target a strong cause and move ATP, superoxide or peroxide by 1% or more at the chosen model dose), with projected flag clearance. Model estimates for research and teaching, not a prescription or diagnosis.</p>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      <label>Profile <select data-testid="plan-profile" className="ml-1 rounded border border-input bg-background px-1 py-0.5" value={id} onChange={(e) => setId(e.target.value)}><option value="all">All profiles</option>{pool.map((p) => <option key={p.id} value={p.id}>{p.label} ({p.phenotype})</option>)}</select></label>
      <label>Model dose <select data-testid="plan-dose" className="ml-1 rounded border border-input bg-background px-1 py-0.5" value={dose} onChange={(e) => setDose(Number(e.target.value))}>{doses.map((d) => <option key={d} value={d}>{d}x</option>)}</select></label>
      <Button size="sm" variant="outline" onClick={csv} data-testid="plan-csv"><Download className="mr-1 size-3.5" />Download CSV</Button>
    </div>
    {groups.map(({ p, rows }) => <section key={p.id} className="mt-4 overflow-x-auto rounded-md border border-border p-3" data-testid="plan-profile-section">
      <h2 className="text-sm font-semibold">{p.label}: {p.phenotype} <span className="font-normal text-muted-foreground">({rows.length} flagged {rows.length === 1 ? "therapy" : "therapies"})</span></h2>
      {rows.length === 0 ? <p className="text-xs text-muted-foreground">No flagged therapies: no strong cause, or no therapy moves a readout at {dose}x.</p> :
      <table className="mt-1 w-full min-w-[720px] text-xs">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy ({dose}x)</th><th>Real-world dose (1x anchor)</th><th>Targets</th><th>ATP</th><th>Superoxide</th><th>H2O2</th><th>Projected MitoSOX</th><th>Projected H2O2</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.t.id} className="border-t border-border" data-testid="plan-row">
          <td className="py-1"><Link className="text-primary hover:underline" to="/therapy-tools" search={{ profile: p.id, therapy: r.t.id }}>{r.t.name}</Link></td>
          <td className="text-muted-foreground">{r.t.clinicalDose}{r.t.doseSource && <a className="block text-[10px] text-primary underline underline-offset-2" href={r.t.doseSource.url} target="_blank" rel="noopener noreferrer" data-testid={`plan-dose-source-${r.t.id}`}>{r.t.doseSource.text}</a>}{dose !== 1 && <span className="block text-[10px]">Model dose {dose}x scales the slider move only, not this dose.</span>}</td>
          <td className="text-muted-foreground">{r.targets}</td>
          <td className="tabular-nums">{pc(r.atp)}</td><td className="tabular-nums">{pc(r.so)}</td><td className="tabular-nums">{pc(r.h2)}</td>
          <td className="tabular-nums">{p.values.mitosox.toFixed(2)}x to {r.ms.value.toFixed(2)}x <Tag s={status(r.msOut, r.ms.outside)} /></td>
          <td className="tabular-nums">{r.pH2 ? <>{p.h2o2Nm!.toFixed(0)} to {r.pH2.value.toFixed(0)} nM <Tag s={status(r.h2Out, r.pH2.outside)} /></> : <span className="text-muted-foreground">Not measured</span>}</td>
        </tr>)}</tbody>
      </table>}
    </section>)}
    {id !== "all" && <PlanByCause d={diagnoseAll(users).find((x) => x.patient.id === id)} />}
    <ScenarioTherapyPlan />
    <p className="mt-3 text-[10px] text-muted-foreground">Sorted by projected flags cleared, then lowest projected MitoSOX. Projections scale the measured MitoSOX fold (Gonzalo 2019 band 0.59-1.5x) and measured peroxide (Sies 2017, flagged above 100 nM) by the model's change; model estimates, not lab results. Model dose is a slider value, never a drug dose. The real-world dose column is the published clinical or trial dose the 1x model dose is anchored to; it is an illustrative link between the model lever and the literature, never a dosing guide, and other model doses do not scale it. Each dose source links to the label, fact sheet or trial listing behind that anchor; links are informational only. Demo profiles are synthetic.</p>
  </main>;
}

function Tag({ s }: { s: string }) {
  return <span className={s === "flag clears" ? "font-medium text-primary" : s === "within" ? "text-muted-foreground" : "text-destructive"}>{s}</span>;
}

function PlanByCause({ d }: { d: Diagnosed | undefined }) {
  const plan = useMemo(() => (d ? buildPlan(d) : null), [d]);
  if (!d || !plan) return null;
  const start = profileInputs(d.patient);
  return <section aria-label="Plan by cause" className="mt-6 space-y-4 rounded-md border border-border p-3" data-testid="plan-by-cause">
    <h2 className="text-sm font-semibold">Plan by cause: {d.patient.label}</h2>
    <p className="text-xs text-muted-foreground">One therapy per strong Diagnosis cause (score 1.5 or more), picked by the Treatment ranking, skipping repeats. Starting state: {start.deltaPsi} mV membrane potential, other sliders at default. Label fit: {d.fit}.</p>
    {plan.steps.length === 0 ? <p className="border border-border p-3 text-xs" data-testid="plan-none">No strong cause (score 1.5 or more) for this profile, so the plan is empty.</p> : <>
      {plan.steps.map((s, si) => <article key={s.cause.mechanism} className="border border-border p-3 text-xs" data-testid="plan-cause">
        <h3 className="font-medium"><span className="font-mono text-primary">{si + 1}.</span> {s.cause.name} <span className="font-mono text-muted-foreground">score {s.cause.score.toFixed(2)}</span></h3>
        <p className="mt-1 text-muted-foreground">Evidence: {s.cause.supporting.map((e) => e.label).join("; ") || "none"}</p>
        <ul className="mt-2 space-y-2">{s.options.map((o) => { const chosen = plan.chosen.includes(o.therapy); return <li key={o.therapy.id} className={`border p-2 ${chosen ? "border-primary bg-primary/5" : "border-border"}`} data-testid="plan-option">
          <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{o.therapy.name} <span className="font-normal text-muted-foreground">· {o.therapy.examples}</span></span><span className="font-mono text-[10px] uppercase text-muted-foreground">{chosen ? "In plan · " : ""}{o.therapy.status}</span></div>
          <table className="mt-2 w-full font-mono text-[11px]"><thead><tr className="text-left text-muted-foreground"><th className="font-normal">Slider</th><th className="font-normal">Model dose</th></tr></thead>
            <tbody>{modelDoses(start, o.therapy).map((m) => <tr key={m.key} data-testid="plan-dose"><td className="pr-2">{m.label}</td><td>{f(m.before)} to {f(m.after)} {m.unit}{m.clamped ? " (slider limit)" : ""}</td></tr>)}</tbody></table>
          <p className="mt-1 font-mono text-[11px]">ATP {f(o.sim.before.atp, 1)} to {f(o.sim.after.atp, 1)} µM/s{pctOf(o.sim.before.atp, o.sim.after.atp)} · O2•- {f(o.sim.before.superoxide)} to {f(o.sim.after.superoxide)} nM{pctOf(o.sim.before.superoxide, o.sim.after.superoxide)} · flags {o.sim.before.atpFlags + o.sim.before.rosFlags} to {o.sim.after.atpFlags + o.sim.after.rosFlags}</p>
        </li>; })}</ul>
      </article>)}
      <section aria-label="Combined plan" className="border border-primary p-3 text-xs" data-testid="plan-combined">
        <h3 className="text-sm font-semibold">Combined plan</h3>
        <p className="mt-1">{plan.chosen.map((t) => t.name).join(" + ")}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-3">
          <span>ATP {f(plan.before.atp, 1)} to {f(plan.after.atp, 1)} µM/s{pctOf(plan.before.atp, plan.after.atp)}</span>
          <span>Cost {f(plan.before.cost)} to {f(plan.after.cost)} eV</span>
          <span>O2•- {f(plan.before.superoxide)} to {f(plan.after.superoxide)} nM{pctOf(plan.before.superoxide, plan.after.superoxide)}</span>
          <span>H2O2 {f(plan.before.h2o2)} to {f(plan.after.h2o2)} nM{pctOf(plan.before.h2o2, plan.after.h2o2)}</span>
          <span>ATP flags {plan.before.atpFlags} to {plan.after.atpFlags}</span>
          <span>ROS flags {plan.before.rosFlags} to {plan.after.rosFlags}</span>
        </div>
      </section>
      <p className="text-xs leading-relaxed text-muted-foreground">Combined effects apply each slider change once in order and are simulated together, so they do not equal the sum of single effects. Model doses are illustrative slider settings with no pharmacokinetics, timing or interactions. Profiles are invented; scores are rankings, not probabilities.</p>
    </>}
  </section>;
}
