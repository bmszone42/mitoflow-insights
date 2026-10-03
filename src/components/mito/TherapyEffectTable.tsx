import { useMemo } from "react";
import { defaultInputs, simulate, type Geometry, type Inputs } from "@/lib/mito/model";
import { h2o2NmBand, inputsFromPatient, mitoSoxBand, projectedH2o2, projectedMitoSox, type DemoPatient } from "@/lib/mito/patientReference";
import type { Therapy } from "@/lib/mito/treatment";

type Out = ReturnType<typeof simulate>;
const rows = [
  { key: "atp", label: "ATP", unit: "µM/s", model: (o: Out) => o.atpFlux },
  { key: "sox", label: "Superoxide", unit: "nM", model: (o: Out) => o.superoxide },
  { key: "h2o2", label: "H₂O₂", unit: "nM", model: (o: Out) => o.hydrogenPeroxide },
] as const;

// Three significant digits so small superoxide values don't collapse to 0.00.
const fmt = (v: number) => (v === 0 ? "0" : Math.abs(v) >= 100 ? v.toFixed(0) : v.toPrecision(3));
const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;

// Therapy before/after: patient baseline sliders without the therapy vs current sliders.
export function TherapyEffectTable({ patient, inputs, geo, therapy }: { patient: DemoPatient; inputs: Inputs; geo: Geometry; therapy: Therapy }) {
  const data = useMemo(() => {
    const before = simulate({ ...defaultInputs, ...inputsFromPatient(patient).patch }, geo);
    const cur = simulate(inputs, geo);
    const rs = rows.map((r) => {
      const b = r.model(before);
      const a = r.model(cur);
      return { ...r, before: b, after: a, change: b === 0 ? 0 : (a - b) / b };
    });
    const proj = patient.h2o2Nm === undefined ? null : projectedH2o2(patient.h2o2Nm, before.hydrogenPeroxide, cur.hydrogenPeroxide);
    const projMs = projectedMitoSox(patient.values.mitosox, before.superoxide, cur.superoxide);
    return { rs, proj, projMs };
  }, [patient, inputs, geo]);
  const m = patient.h2o2Nm;
  return (
    <table className="w-full text-[11px] md:col-span-2" data-testid="therapy-before-after">
      <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy effect: {therapy.name}</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
      <tbody>{data.rs.map((r) => (
        <tr key={r.key} className="border-t border-border" data-testid="therapy-row">
          <td className="py-1">{r.label}</td>
          <td className="tabular-nums">{fmt(r.before)} {r.unit}</td>
          <td className="tabular-nums">{fmt(r.after)} {r.unit}</td>
          <td className={`tabular-nums ${Math.abs(r.change) > 0.05 ? "text-primary" : "text-muted-foreground"}`}>{pct(r.change)}</td>
        </tr>))}
        {data.proj && m !== undefined && (
          <tr className="border-t border-border" data-testid="therapy-projected-h2o2">
            <td className="py-1">Projected H₂O₂ <span className="text-muted-foreground">(measured x model change)</span></td>
            <td className={`tabular-nums ${m > h2o2NmBand.hi ? "text-destructive" : ""}`}>{fmt(m)} nM</td>
            <td className={`tabular-nums ${data.proj.outside ? "text-destructive" : ""}`}>{fmt(data.proj.value)} nM</td>
            <td className="tabular-nums">{m > h2o2NmBand.hi && !data.proj.outside ? <span className="font-medium text-primary">Flag clears</span> : data.proj.outside ? <span className="text-destructive">Flagged &gt;{h2o2NmBand.hi} nM</span> : <span className="text-muted-foreground">Within</span>}</td>
          </tr>
        )}
      </tbody>
      {data.proj && <caption className="caption-bottom pt-1 text-left text-[10px] text-muted-foreground">Projected peroxide scales the measured value by the model's peroxide change. A model estimate, not a measurement; the measured flag on Diagnosis is unchanged.</caption>}
    </table>
  );
}
