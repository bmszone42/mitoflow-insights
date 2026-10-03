import { useMemo } from "react";
import { defaultInputs, simulate, type Geometry, type Inputs } from "@/lib/mito/model";
import { inputsFromPatient, type DemoPatient } from "@/lib/mito/patientReference";
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
    return rows.map((r) => {
      const b = r.model(before);
      const a = r.model(cur);
      return { ...r, before: b, after: a, change: b === 0 ? 0 : (a - b) / b };
    });
  }, [patient, inputs, geo]);
  return (
    <table className="w-full text-[11px] md:col-span-2" data-testid="therapy-before-after">
      <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy effect: {therapy.name}</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
      <tbody>{data.map((r) => (
        <tr key={r.key} className="border-t border-border" data-testid="therapy-row">
          <td className="py-1">{r.label}</td>
          <td className="tabular-nums">{fmt(r.before)} {r.unit}</td>
          <td className="tabular-nums">{fmt(r.after)} {r.unit}</td>
          <td className={`tabular-nums ${Math.abs(r.change) > 0.05 ? "text-primary" : "text-muted-foreground"}`}>{pct(r.change)}</td>
        </tr>))}</tbody>
    </table>
  );
}
