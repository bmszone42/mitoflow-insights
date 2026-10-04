import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoPatients } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { therapyPlanRows } from "@/lib/mito/diagnosis";

export const Route = createFileRoute("/therapy-plan")({
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

function TherapyPlan() {
  const users = useUserPatients();
  const pool = useMemo(() => [...users, ...demoPatients], [users]);
  const [id, setId] = useState("all");
  const [dose, setDose] = useState(1);
  const groups = useMemo(() => pool.filter((p) => id === "all" || p.id === id).map((p) => ({ p, rows: therapyPlanRows(p, dose) })), [pool, id, dose]);

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
          <td className="py-1"><Link className="text-primary hover:underline" to="/therapy-calculator" search={{ profile: p.id, therapy: r.t.id }}>{r.t.name}</Link></td>
          <td className="text-muted-foreground">{r.t.clinicalDose}{r.t.doseSource && <a className="block text-[10px] text-primary underline underline-offset-2" href={r.t.doseSource.url} target="_blank" rel="noopener noreferrer" data-testid={`plan-dose-source-${r.t.id}`}>{r.t.doseSource.text}</a>}{dose !== 1 && <span className="block text-[10px]">Model dose {dose}x scales the slider move only, not this dose.</span>}</td>
          <td className="text-muted-foreground">{r.targets}</td>
          <td className="tabular-nums">{pc(r.atp)}</td><td className="tabular-nums">{pc(r.so)}</td><td className="tabular-nums">{pc(r.h2)}</td>
          <td className="tabular-nums">{p.values.mitosox.toFixed(2)}x to {r.ms.value.toFixed(2)}x <Tag s={status(r.msOut, r.ms.outside)} /></td>
          <td className="tabular-nums">{r.pH2 ? <>{p.h2o2Nm!.toFixed(0)} to {r.pH2.value.toFixed(0)} nM <Tag s={status(r.h2Out, r.pH2.outside)} /></> : <span className="text-muted-foreground">Not measured</span>}</td>
        </tr>)}</tbody>
      </table>}
    </section>)}
    <p className="mt-3 text-[10px] text-muted-foreground">Sorted by projected flags cleared, then lowest projected MitoSOX. Projections scale the measured MitoSOX fold (Gonzalo 2019 band 0.59-1.5x) and measured peroxide (Sies 2017, flagged above 100 nM) by the model's change; model estimates, not lab results. Model dose is a slider value, never a drug dose. The real-world dose column is the published clinical or trial dose the 1x model dose is anchored to; it is an illustrative link between the model lever and the literature, never a dosing guide, and other model doses do not scale it. Each dose source links to the label, fact sheet or trial listing behind that anchor; links are informational only. Demo profiles are synthetic.</p>
  </main>;
}

function Tag({ s }: { s: string }) {
  return <span className={s === "flag clears" ? "font-medium text-primary" : s === "within" ? "text-muted-foreground" : "text-destructive"}>{s}</span>;
}
