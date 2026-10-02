import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { demoPatients } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { doseResponse, moveLabel, therapies, applyTherapyDose, profileInputs } from "@/lib/mito/treatment";
import { inputRanges } from "@/lib/mito/model";

type Search = { profile?: string; therapy?: string };

export const Route = createFileRoute("/therapy-calculator")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    profile: typeof s.profile === "string" ? s.profile : undefined,
    therapy: typeof s.therapy === "string" ? s.therapy : undefined,
  }),
  head: () => ({ meta: [
    { title: "Therapy calculator: ATP and ROS per model dose | Cristae Lab" },
    { name: "description", content: "See how each therapy's slider moves shift simulated ATP flux, superoxide and hydrogen peroxide across model doses, starting from a patient's measured baseline." },
    { property: "og:title", content: "Therapy calculator | Cristae Lab" },
    { property: "og:description", content: "Dose-response of simulated ATP and ROS readouts for each therapy lever, stacked on a patient profile. Research model only." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TherapyCalculator,
});

const pct = (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`;
const num = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2));

function TherapyCalculator() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const users = useUserPatients();
  const all = [...users, ...demoPatients];
  const patient = all.find((p) => p.id === search.profile) ?? demoPatients.find((p) => p.id === "demo-04")!;
  const therapy = therapies.find((t) => t.id === search.therapy) ?? therapies[0];
  const rows = useMemo(() => doseResponse(patient, therapy), [patient, therapy]);
  const base = profileInputs(patient);
  const chart = rows.map((r) => ({ dose: `${r.dose}x`, ATP: Math.round(r.atpChange * 100), Superoxide: Math.round(r.superoxideChange * 100), "H2O2": Math.round(r.h2o2Change * 100) }));

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <Button asChild variant="ghost" size="sm"><Link to="/treatment"><ArrowLeft className="size-4" aria-hidden />Treatment</Link></Button>
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">Therapy calculator</h1>
      <p className="text-sm text-muted-foreground">Each therapy moves one or more Simulator sliders. Model dose scales that move: 0x is the patient's baseline, 1x is the move used on the Treatment page, 2x doubles it. Model dose is a slider value only, never a drug dose. Not medical advice.</p>
    </header>

    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm"><span className="font-medium">Patient profile</span>
        <select aria-label="Patient profile" className="w-full rounded-md border border-input bg-background px-2 py-2" value={patient.id} onChange={(e) => navigate({ search: (s) => ({ ...s, profile: e.target.value }) })}>
          {all.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Therapy</span>
        <select aria-label="Therapy" className="w-full rounded-md border border-input bg-background px-2 py-2" value={therapy.id} onChange={(e) => navigate({ search: (s) => ({ ...s, therapy: e.target.value }) })}>
          {therapies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
    </div>

    <section className="rounded-md border border-border p-3 text-sm">
      <p><span className="font-medium">Slider targets at 1x:</span> {therapy.moves.map(moveLabel).join("; ")}</p>
      <p className="text-muted-foreground">{therapy.note} Evidence: {therapy.status}.</p>
    </section>

    <section aria-label="Dose response chart" className="h-72 rounded-md border border-border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="dose" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis unit="%" stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Legend />
          <Line dataKey="ATP" stroke="var(--primary)" strokeWidth={2} />
          <Line dataKey="Superoxide" stroke="var(--destructive)" strokeWidth={2} />
          <Line dataKey="H2O2" stroke="var(--muted-foreground)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </section>

    <section className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2">Model dose</th>
          {therapy.moves.map((m) => <th key={m.key} className="px-3 py-2">{inputRanges[m.key].label} ({inputRanges[m.key].unit})</th>)}
          <th className="px-3 py-2">ATP flux</th><th className="px-3 py-2">Superoxide</th><th className="px-3 py-2">H2O2</th><th className="px-3 py-2">ATP cost (eV)</th><th className="px-3 py-2">ATP / ROS flags</th><th className="px-3 py-2" />
        </tr></thead>
        <tbody>{rows.map((r) => <tr key={r.dose} data-testid="dose-row" className={`border-t border-border/60 ${r.dose === 1 ? "bg-muted/40" : ""}`}>
          <th scope="row" className="px-3 py-2 font-mono">{r.dose}x</th>
          {therapy.moves.map((m) => <td key={m.key} className="px-3 py-2 font-mono">{num(applyTherapyDose(base, therapy, r.dose)[m.key])}</td>)}
          <td className="px-3 py-2 font-mono">{num(r.atp)} <span className="text-muted-foreground">{pct(r.atpChange)}</span></td>
          <td className="px-3 py-2 font-mono">{num(r.superoxide)} <span className="text-muted-foreground">{pct(r.superoxideChange)}</span></td>
          <td className="px-3 py-2 font-mono">{num(r.h2o2)} <span className="text-muted-foreground">{pct(r.h2o2Change)}</span></td>
          <td className="px-3 py-2 font-mono">{r.cost.toFixed(2)}</td>
          <td className="px-3 py-2 font-mono">{r.atpFlags} / {r.rosFlags}</td>
          <td className="px-3 py-2">{r.dose === 1 && <Link className="text-primary underline-offset-2 hover:underline" to="/" search={{ apply: therapy.id, patient: patient.id }}>Open in Simulator</Link>}</td>
        </tr>)}</tbody>
      </table>
    </section>
    <p className="text-xs text-muted-foreground">Changes are relative to 0x (the patient's measured baseline: membrane potential, labile iron, inverse MitoSOX). Sliders clamp at their limits, so high doses can plateau. Simulated readouts, not clinical predictions.</p>
  </main>;
}
