import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { demoPatients } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { applyTherapyDose, calculatorDoses, doseResponse, moveLabel, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, inputRanges, simulate } from "@/lib/mito/model";

type Search = { profile?: string | undefined; a?: string | undefined; da?: number | undefined; b?: string | undefined; db?: number | undefined };

export const Route = createFileRoute("/therapy-compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    profile: typeof s["profile"] === "string" ? s["profile"] : undefined,
    a: typeof s["a"] === "string" ? s["a"] : undefined,
    da: typeof s["da"] === "number" ? s["da"] : undefined,
    b: typeof s["b"] === "string" ? s["b"] : undefined,
    db: typeof s["db"] === "number" ? s["db"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Therapy comparison: ATP and ROS side by side | Cristae Lab" },
    { name: "description", content: "Pick two therapies and model doses, then compare simulated ATP flux, superoxide and hydrogen peroxide side by side on a patient's measured baseline." },
    { property: "og:title", content: "Therapy comparison | Cristae Lab" },
    { property: "og:description", content: "Side-by-side simulated ATP and ROS readouts for two therapy levers at chosen model doses. Research model only." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TherapyCompare,
});

const pct = (v: number, b: number) => { const d = b ? v / b - 1 : 0; return `${d >= 0 ? "+" : ""}${Math.round(d * 100)}%`; };
const num = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : Number(v.toPrecision(3)).toString());

function TherapyCompare() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const users = useUserPatients();
  const all = [...users, ...demoPatients];
  const patient = all.find((p) => p.id === search.profile) ?? demoPatients.find((p) => p.id === "demo-04")!;
  const ta = therapies.find((t) => t.id === search.a) ?? therapies[0]!;
  const tb = therapies.find((t) => t.id === search.b) ?? therapies.find((t) => t.id !== ta.id)!;
  const da = search.da !== undefined && calculatorDoses.includes(search.da) ? search.da : 1;
  const db = search.db !== undefined && calculatorDoses.includes(search.db) ? search.db : 1;

  const base = useMemo(() => profileInputs(patient), [patient]);
  const baseOut = useMemo(() => simulate(base, defaultGeometry), [base]);
  const outA = useMemo(() => simulate(applyTherapyDose(base, ta, da), defaultGeometry), [base, ta, da]);
  const outB = useMemo(() => simulate(applyTherapyDose(base, tb, db), defaultGeometry), [base, tb, db]);
  const shared = ta.moves.map((m) => m.key).filter((k) => tb.moves.some((m) => m.key === k));
  const combined = useMemo(() => simulate(applyTherapyDose(applyTherapyDose(base, ta, da), tb, db), defaultGeometry), [base, ta, da, tb, db]);

  const readouts = [
    { key: "atpFlux" as const, label: "ATP flux", unit: "µM/s" },
    { key: "superoxide" as const, label: "Superoxide", unit: "nM" },
    { key: "hydrogenPeroxide" as const, label: "H₂O₂", unit: "nM" },
  ];

  const chart = useMemo(() => {
    const ra = doseResponse(patient, ta);
    const rb = doseResponse(patient, tb);
    return calculatorDoses.map((d, i) => ({
      dose: `${d}x`,
      [`A ATP`]: Math.round(ra[i]!.atpChange * 100), [`B ATP`]: Math.round(rb[i]!.atpChange * 100),
      [`A superoxide`]: Math.round(ra[i]!.superoxideChange * 100), [`B superoxide`]: Math.round(rb[i]!.superoxideChange * 100),
      [`A H2O2`]: Math.round(ra[i]!.h2o2Change * 100), [`B H2O2`]: Math.round(rb[i]!.h2o2Change * 100),
    }));
  }, [patient, ta, tb]);

  const [csvScope, setCsvScope] = useState<"one" | "all">("one");

  const downloadCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    if (csvScope === "all") {
      const header = ["Profile", "ID", "Baseline ATP (µM/s)", "Baseline superoxide (nM)", "Baseline H2O2 (nM)",
        `A: ${ta.name} (${da}x) ATP`, "A ATP vs baseline", "A superoxide", "A superoxide vs baseline", "A H2O2", "A H2O2 vs baseline",
        `B: ${tb.name} (${db}x) ATP`, "B ATP vs baseline", "B superoxide", "B superoxide vs baseline", "B H2O2", "B H2O2 vs baseline",
        "A+B ATP", "A+B ATP vs baseline", "A+B superoxide", "A+B superoxide vs baseline", "A+B H2O2", "A+B H2O2 vs baseline"];
      const lines = [header.join(",")];
      for (const p of all) {
        const pb = profileInputs(p);
        const pBase = simulate(pb, defaultGeometry);
        const pA = simulate(applyTherapyDose(pb, ta, da), defaultGeometry);
        const pB = simulate(applyTherapyDose(pb, tb, db), defaultGeometry);
        const pC = simulate(applyTherapyDose(applyTherapyDose(pb, ta, da), tb, db), defaultGeometry);
        lines.push([esc(p.label), p.id,
          num(pBase.atpFlux), num(pBase.superoxide), num(pBase.hydrogenPeroxide),
          num(pA.atpFlux), pct(pA.atpFlux, pBase.atpFlux), num(pA.superoxide), pct(pA.superoxide, pBase.superoxide), num(pA.hydrogenPeroxide), pct(pA.hydrogenPeroxide, pBase.hydrogenPeroxide),
          num(pB.atpFlux), pct(pB.atpFlux, pBase.atpFlux), num(pB.superoxide), pct(pB.superoxide, pBase.superoxide), num(pB.hydrogenPeroxide), pct(pB.hydrogenPeroxide, pBase.hydrogenPeroxide),
          num(pC.atpFlux), pct(pC.atpFlux, pBase.atpFlux), num(pC.superoxide), pct(pC.superoxide, pBase.superoxide), num(pC.hydrogenPeroxide), pct(pC.hydrogenPeroxide, pBase.hydrogenPeroxide),
        ].join(","));
      }
      lines.push("");
      lines.push([esc("Therapy A"), esc(`${ta.name} at ${da}x (model dose)`), esc(`Slider targets at 1x: ${ta.moves.map(moveLabel).join("; ")}`)].join(","));
      lines.push([esc("Therapy B"), esc(`${tb.name} at ${db}x (model dose)`), esc(`Slider targets at 1x: ${tb.moves.map(moveLabel).join("; ")}`)].join(","));
      lines.push([esc("Shared sliders"), esc(shared.length > 0 ? shared.map((k) => inputRanges[k].label).join(" and ") : "None")].join(","));
      lines.push(esc("Generated by Cristae Lab. Research model, not a diagnosis. Each profile's changes are relative to its own measured baseline; model dose is a slider value only, never a drug dose. Demo profile values are synthetic or published case values; user-added values stay in this browser tab."));
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cristae-lab-therapy-compare-all-profiles.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const header = ["Readout (unit)", `Baseline ${patient.label}`, `A: ${ta.name} (${da}x)`, "A vs baseline", `B: ${tb.name} (${db}x)`, "B vs baseline", "A + B combined", "Combined vs baseline"];
    const lines = [header.join(",")];
    for (const r of readouts) {
      lines.push([
        esc(`${r.label} (${r.unit})`),
        num(baseOut[r.key]),
        num(outA[r.key]), pct(outA[r.key], baseOut[r.key]),
        num(outB[r.key]), pct(outB[r.key], baseOut[r.key]),
        num(combined[r.key]), pct(combined[r.key], baseOut[r.key]),
      ].join(","));
    }
    lines.push("");
    lines.push([esc("Patient profile"), esc(patient.id), esc(patient.label)].join(","));
    lines.push([esc("Therapy A"), esc(`${ta.name} at ${da}x (model dose)`), esc(`Slider targets at 1x: ${ta.moves.map(moveLabel).join("; ")}`), esc(`${ta.note} Evidence: ${ta.status}.`)].join(","));
    lines.push([esc("Therapy B"), esc(`${tb.name} at ${db}x (model dose)`), esc(`Slider targets at 1x: ${tb.moves.map(moveLabel).join("; ")}`), esc(`${tb.note} Evidence: ${tb.status}.`)].join(","));
    lines.push([esc("Shared sliders"), esc(shared.length > 0 ? shared.map((k) => inputRanges[k].label).join(" and ") : "None")].join(","));
    lines.push("");
    lines.push(esc("Generated by Cristae Lab. Research model, not a diagnosis. Changes are relative to the patient's measured baseline; model dose is a slider value only, never a drug dose. Demo profile values are synthetic or published case values; user-added values stay in this browser tab."));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cristae-lab-therapy-compare-${patient.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const doseSelect = (label: string, value: number, key: "da" | "db") => (
    <select aria-label={label} className="w-full rounded-md border border-input bg-background px-2 py-2" value={value} onChange={(e) => set({ [key]: Number(e.target.value) })}>
      {calculatorDoses.map((d) => <option key={d} value={d}>{d}x</option>)}
    </select>
  );

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <Button asChild variant="ghost" size="sm"><Link to="/therapy-calculator"><ArrowLeft className="size-4" aria-hidden />Therapy calculator</Link></Button>
    <header className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Therapy comparison</h1>
        <div className="flex items-center gap-2">
          <select aria-label="CSV scope" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={csvScope} onChange={(e) => setCsvScope(e.target.value as "one" | "all")} data-testid="cmp-csv-scope">
            <option value="one">CSV: this profile</option>
            <option value="all">CSV: all profiles</option>
          </select>
          <Button variant="outline" size="sm" onClick={downloadCsv} data-testid="cmp-csv"><Download className="size-4" aria-hidden />Download CSV</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pick two therapies and a model dose for each; both are stacked on the patient's measured baseline and simulated side by side. Model dose is a slider value only, never a drug dose. Not medical advice.</p>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1 text-sm"><span className="font-medium">Patient profile</span>
        <select aria-label="Patient profile" className="w-full rounded-md border border-input bg-background px-2 py-2" value={patient.id} onChange={(e) => set({ profile: e.target.value })}>
          {all.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Therapy A</span>
        <select aria-label="Therapy A" className="w-full rounded-md border border-input bg-background px-2 py-2" value={ta.id} onChange={(e) => set({ a: e.target.value })}>
          {therapies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">Therapy B</span>
        <select aria-label="Therapy B" className="w-full rounded-md border border-input bg-background px-2 py-2" value={tb.id} onChange={(e) => set({ b: e.target.value })}>
          {therapies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
      <div />
      <label className="space-y-1 text-sm"><span className="font-medium">Dose A (model)</span>{doseSelect("Dose A", da, "da")}</label>
      <label className="space-y-1 text-sm"><span className="font-medium">Dose B (model)</span>{doseSelect("Dose B", db, "db")}</label>
    </div>

    {shared.length > 0 && <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">Both therapies move {shared.map((k) => inputRanges[k].label).join(" and ")}; in the model their moves multiply on the same slider, so the combined column is not the sum of the two separate effects.</p>}

    <section className="overflow-x-auto border-y border-border" aria-label="Side by side readouts">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2">Readout</th>
          <th className="px-3 py-2">Baseline ({patient.label})</th>
          <th className="px-3 py-2">A: {ta.name} ({da}x)</th>
          <th className="px-3 py-2">B: {tb.name} ({db}x)</th>
          <th className="px-3 py-2">A + B combined</th>
        </tr></thead>
        <tbody>{readouts.map((r) => <tr key={r.key} data-testid={`cmp-${r.key}`} className="border-t border-border/60">
          <th scope="row" className="px-3 py-2 font-medium">{r.label} <span className="font-normal text-muted-foreground">({r.unit})</span></th>
          <td className="px-3 py-2 font-mono">{num(baseOut[r.key])}</td>
          <td className="px-3 py-2 font-mono">{num(outA[r.key])} <span className="text-muted-foreground">{pct(outA[r.key], baseOut[r.key])}</span></td>
          <td className="px-3 py-2 font-mono">{num(outB[r.key])} <span className="text-muted-foreground">{pct(outB[r.key], baseOut[r.key])}</span></td>
          <td className="px-3 py-2 font-mono">{num(combined[r.key])} <span className="text-muted-foreground">{pct(combined[r.key], baseOut[r.key])}</span></td>
        </tr>)}</tbody>
      </table>
    </section>

    <section className="grid gap-3 text-sm sm:grid-cols-2">
      {[{ t: ta, d: da, tag: "A" }, { t: tb, d: db, tag: "B" }].map(({ t, d, tag }) => <div key={tag} className="rounded-md border border-border p-3">
        <p className="font-medium">{tag}: {t.name} <span className="font-normal text-muted-foreground">at {d}x</span></p>
        <p className="text-muted-foreground">Slider targets at 1x: {t.moves.map(moveLabel).join("; ")}</p>
        <p className="text-muted-foreground">{t.note} Evidence: {t.status}.</p>
      </div>)}
    </section>

    <section aria-label="Dose response comparison chart" className="h-72 rounded-md border border-border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="dose" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis unit="%" stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Legend />
          <Line dataKey="A ATP" stroke="var(--primary)" strokeWidth={2} />
          <Line dataKey="B ATP" stroke="var(--primary)" strokeWidth={2} strokeDasharray="6 3" />
          <Line dataKey="A superoxide" stroke="var(--destructive)" strokeWidth={2} />
          <Line dataKey="B superoxide" stroke="var(--destructive)" strokeWidth={2} strokeDasharray="6 3" />
          <Line dataKey="A H2O2" stroke="var(--muted-foreground)" strokeWidth={2} />
          <Line dataKey="B H2O2" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="6 3" />
        </LineChart>
      </ResponsiveContainer>
    </section>

    <p className="text-xs text-muted-foreground">Changes are relative to the patient's measured baseline (membrane potential, labile iron, inverse MitoSOX, and the NADH ratio when the lactate:pyruvate ratio maps). Sliders clamp at their limits, so high doses can plateau. Simulated readouts, not clinical predictions.</p>
  </main>;
}
