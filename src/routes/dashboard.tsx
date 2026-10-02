import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { demoPatients, lpMapping, patientSex } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { diagnoseProfile, flagOverlaps } from "@/lib/mito/diagnosis";
import { profileInputs } from "@/lib/mito/treatment";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Patient dashboard: ATP, ROS and flags | Cristae Lab" },
    { name: "description", content: "Every patient profile with simulated ATP and ROS readouts, flag counts, top mechanism and overlapping disorders, linked to Diagnosis and the Simulator." },
    { property: "og:title", content: "Patient dashboard | Cristae Lab" },
    { property: "og:description", content: "One table of all profiles: model ATP and ROS, flags, top mechanism and disorder overlap. Research model only." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : Number(v.toPrecision(3)).toString());
const pct = (v: number, b: number) => { const d = b ? v / b - 1 : 0; return `${d >= 0 ? "+" : ""}${Math.round(d * 100)}%`; };

function Dashboard() {
  const users = useUserPatients();
  const rows = useMemo(() => {
    const pool = [...users, ...demoPatients];
    const healthy = simulate(profileInputs(demoPatients.find((p) => p.id === "demo-01")!), defaultGeometry);
    return pool.map((p) => {
      const out = simulate(profileInputs(p), defaultGeometry);
      const d = diagnoseProfile(p);
      return {
        p, out, healthy, top: d.top, lp: lpMapping(p),
        labFlags: d.patientFlags.length, assayFlags: d.rosAssayFlags.length + d.atpAssayFlags.length, modelFlags: d.modelFlags.length,
        overlap: flagOverlaps(p, pool).ranked.slice(0, 3),
      };
    });
  }, [users]);

  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
    <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="size-4" aria-hidden />Back to lab</Link></Button>
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">Patient dashboard</h1>
      <p className="text-sm text-muted-foreground">Each profile run through the model from its measured baseline (membrane potential, labile iron, inverse MitoSOX, and lactate:pyruvate as the NADH ratio when lactate is at least 2.5 mmol/L and the ratio is measured). Percentages compare with the healthy adult (demo-01). Top disorders are profiles sharing the most same-direction flags, not likelihoods. Research model, not a diagnosis. Synthetic values are invented.</p>
    </header>
    <section className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[1100px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2">Profile</th><th className="px-3 py-2">L:P ratio</th><th className="px-3 py-2">ATP flux</th><th className="px-3 py-2">Superoxide</th><th className="px-3 py-2">H2O2 (nM)</th>
          <th className="px-3 py-2">Flags: lab / assay / model</th><th className="px-3 py-2">Top mechanism</th><th className="px-3 py-2">Top overlapping disorders</th><th className="px-3 py-2">Open</th>
        </tr></thead>
        <tbody>{rows.map((r) => <tr key={r.p.id} data-testid="dash-row" className="border-t border-border/60 align-top">
          <th scope="row" className="px-3 py-2 font-medium">{r.p.label}<div className="font-normal text-muted-foreground">{r.p.phenotype} · {r.p.age}y {r.p.sex}</div></th>
          <td className="px-3 py-2 font-mono" data-testid="dash-lp"><span className={r.p.values.lactatePyruvate > 25 ? "text-destructive" : ""}>{r.p.values.lactatePyruvate.toFixed(1)}</span><div className="font-sans text-[10px] text-muted-foreground" title={r.lp.note}>{r.lp.nadhRatio !== undefined ? `Mapped: NADH ${r.lp.nadhRatio.toFixed(2)}` : "Not mapped"}</div></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.atpFlux)} <span className="text-muted-foreground">{pct(r.out.atpFlux, r.healthy.atpFlux)}</span></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.superoxide)} <span className="text-muted-foreground">{pct(r.out.superoxide, r.healthy.superoxide)}</span></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.hydrogenPeroxide)} <span className="text-muted-foreground">{pct(r.out.hydrogenPeroxide, r.healthy.hydrogenPeroxide)}</span></td>
          <td className="px-3 py-2 font-mono">{r.labFlags} / {r.assayFlags} / {r.modelFlags}</td>
          <td className="px-3 py-2">{r.top ? <>{r.top.name} <span className="font-mono text-muted-foreground">{r.top.score.toFixed(2)}</span></> : <span className="text-muted-foreground">No strong cause</span>}</td>
          <td className="px-3 py-2">{r.overlap.length ? r.overlap.map((o) => <div key={o.phenotype}>{o.phenotype} <span className="font-mono text-muted-foreground">{o.shared}/{o.total}</span></div>) : <span className="text-muted-foreground">None</span>}</td>
          <td className="space-y-1 px-3 py-2">
            <Link className="block text-primary underline-offset-2 hover:underline" to="/diagnosis" search={{ profile: r.p.id }}>Diagnosis</Link>
            <Link className="block text-primary underline-offset-2 hover:underline" to="/" search={{ patient: r.p.id }}>Simulator</Link>
          </td>
        </tr>)}</tbody>
      </table>
    </section>
  </main>;
}
