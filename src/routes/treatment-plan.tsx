import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diagnoseAll } from "@/lib/mito/diagnosis";
import { buildPlan, modelDoses, profileInputs } from "@/lib/mito/treatment";

export const Route = createFileRoute("/treatment-plan")({
  validateSearch: (s) => z.object({ profile: z.string().optional() }).parse(s),
  head: () => ({ meta: [
    { title: "Treatment Plan: causes to model slider changes | Cristae Lab" },
    { name: "description", content: "Combine Diagnosis causes with each therapy's model dose and expected ATP and ROS slider changes for synthetic profiles. Research only, not medical advice." },
    { property: "og:title", content: "Treatment Plan: causes to model slider changes | Cristae Lab" },
    { property: "og:description", content: "Per-cause therapy options with model doses, expected slider changes and combined plan effects. Not a prescription." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PlanPage,
});

const f = (v: number, d = 2) => (Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(1) : v.toFixed(d));
const pct = (a: number, b: number) => (a === 0 ? "" : ` (${b >= a ? "+" : ""}${(((b - a) / a) * 100).toFixed(0)}%)`);

function PlanPage() {
  const search = Route.useSearch();
  const all = useMemo(() => diagnoseAll(), []);
  const [id, setId] = useState(search.profile ?? "demo-04");
  const d = all.find((x) => x.patient.id === id) ?? all[0]!;
  const plan = useMemo(() => buildPlan(d), [d]);
  const start = profileInputs(d.patient);

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 size-4" aria-hidden />Back to lab</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/diagnosis">Diagnosis</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/treatment" search={{ profile: id }}>Treatment</Link></Button>
    </div>
    <header className="border-b border-border pb-4">
      <div className="mono-label">Diagnosis to model levers</div>
      <h1 className="mt-1 text-2xl font-semibold">Treatment Plan</h1>
      <p className="mt-2 border-l-2 border-destructive pl-3 text-xs leading-relaxed" role="note" data-testid="plan-banner">Synthetic data, research only. "Model dose" means the slider setting in this simulation, never a drug, supplement, light or oxygen dose for a person. Not a prescription or medical advice.</p>
    </header>

    <section className="space-y-2">
      <label className="block text-xs font-medium" htmlFor="plan-select">Profile</label>
      <Select value={id} onValueChange={setId}>
        <SelectTrigger id="plan-select" aria-label="Profile" className="w-full max-w-md" data-testid="plan-select"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-[min(70vh,440px)]">{all.map((x) => <SelectItem key={x.patient.id} value={x.patient.id}>{x.patient.label} · {x.patient.age}y · {x.patient.phenotype}</SelectItem>)}</SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Starting state: {start.deltaPsi} mV membrane potential, other sliders at default. Label fit: {d.fit}.</p>
    </section>

    {plan.steps.length === 0 ? <p className="border border-border p-3 text-xs" data-testid="plan-none">No strong cause (score 1.5 or more) for this profile, so the plan is empty.</p> : <>
      <section aria-label="Plan by cause" className="space-y-4">
        <h2 className="text-sm font-semibold">Plan by cause</h2>
        {plan.steps.map((s, si) => <article key={s.cause.mechanism} className="border border-border p-3 text-xs" data-testid="plan-cause">
          <h3 className="font-medium"><span className="font-mono text-primary">{si + 1}.</span> {s.cause.name} <span className="font-mono text-muted-foreground">score {s.cause.score.toFixed(2)}</span></h3>
          <p className="mt-1 text-muted-foreground">Evidence: {s.cause.supporting.map((e) => e.label).join("; ") || "none"}</p>
          <ul className="mt-2 space-y-2">{s.options.map((o) => { const chosen = plan.chosen.includes(o.therapy); return <li key={o.therapy.id} className={`border p-2 ${chosen ? "border-primary bg-primary/5" : "border-border"}`} data-testid="plan-option">
            <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{o.therapy.name} <span className="font-normal text-muted-foreground">· {o.therapy.examples}</span></span><span className="font-mono text-[10px] uppercase text-muted-foreground">{chosen ? "In plan · " : ""}{o.therapy.status}</span></div>
            <table className="mt-2 w-full font-mono text-[11px]"><thead><tr className="text-left text-muted-foreground"><th className="font-normal">Slider</th><th className="font-normal">Model dose</th></tr></thead>
              <tbody>{modelDoses(start, o.therapy).map((m) => <tr key={m.key} data-testid="plan-dose"><td className="pr-2">{m.label}</td><td>{f(m.before)} to {f(m.after)} {m.unit}{m.clamped ? " (slider limit)" : ""}</td></tr>)}</tbody></table>
            <p className="mt-1 font-mono text-[11px]">ATP {f(o.sim.before.atp, 1)} to {f(o.sim.after.atp, 1)} µM/s{pct(o.sim.before.atp, o.sim.after.atp)} · O2•- {f(o.sim.before.superoxide)} to {f(o.sim.after.superoxide)} nM{pct(o.sim.before.superoxide, o.sim.after.superoxide)} · flags {o.sim.before.atpFlags + o.sim.before.rosFlags} to {o.sim.after.atpFlags + o.sim.after.rosFlags}</p>
          </li>; })}</ul>
        </article>)}
      </section>

      <section aria-label="Combined plan" className="border border-primary p-3 text-xs" data-testid="plan-combined">
        <h2 className="text-sm font-semibold">Combined plan</h2>
        <p className="mt-1">{plan.chosen.map((t) => t.name).join(" + ")}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-3">
          <span>ATP {f(plan.before.atp, 1)} to {f(plan.after.atp, 1)} µM/s{pct(plan.before.atp, plan.after.atp)}</span>
          <span>Cost {f(plan.before.cost)} to {f(plan.after.cost)} eV</span>
          <span>O2•- {f(plan.before.superoxide)} to {f(plan.after.superoxide)} nM{pct(plan.before.superoxide, plan.after.superoxide)}</span>
          <span>H2O2 {f(plan.before.h2o2)} to {f(plan.after.h2o2)} nM{pct(plan.before.h2o2, plan.after.h2o2)}</span>
          <span>ATP flags {plan.before.atpFlags} to {plan.after.atpFlags}</span>
          <span>ROS flags {plan.before.rosFlags} to {plan.after.rosFlags}</span>
        </div>
      </section>
    </>}

    <section aria-label="Limits" className="text-xs leading-relaxed text-muted-foreground">
      <h2 className="text-sm font-semibold text-foreground">Limits</h2>
      <p className="mt-1">One therapy per strong Diagnosis cause, picked by the Treatment ranking, skipping repeats. Combined effects apply each slider change once in order and are simulated together, so they do not equal the sum of single effects. Model doses are illustrative slider settings with no pharmacokinetics, timing or interactions. Profiles are invented; scores are rankings, not probabilities.</p>
    </section>
  </main>;
}
