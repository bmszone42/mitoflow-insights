import { useMemo } from "react";
import { defaultInputs, simulate, type Geometry, type Inputs } from "@/lib/mito/model";
import { demoPatients, inputsFromPatient, type DemoPatient } from "@/lib/mito/patientReference";
import type { Therapy } from "@/lib/mito/treatment";

// Model vs measured, both as fold of a healthy reference: model output / default-input output,
// measured value / healthy demo-01 (MitoSOX and H2O2 are already fold-control signals).
const readouts = [
  { key: "atp", label: "ATP", model: (o: ReturnType<typeof simulate>) => o.atpFlux, measured: (p: DemoPatient, h: DemoPatient) => p.values.atpLinkedOcr / h.values.atpLinkedOcr, measuredLabel: "ATP-linked OCR" },
  { key: "sox", label: "Superoxide", model: (o: ReturnType<typeof simulate>) => o.superoxide, measured: (p: DemoPatient) => p.values.mitosox, measuredLabel: "MitoSOX" },
  { key: "h2o2", label: "H₂O₂", model: (o: ReturnType<typeof simulate>) => o.hydrogenPeroxide, measured: (p: DemoPatient) => p.values.h2o2, measuredLabel: "H₂O₂ probe" },
] as const;

const sliderNames: Record<string, string> = { deltaPsi: "Membrane potential", labileIron: "Labile iron", antioxidantCapacity: "Antioxidant capacity" };

export function PatientRunReadouts({ patient, inputs, geo, therapy }: { patient: DemoPatient; inputs: Inputs; geo: Geometry; therapy?: Therapy | null }) {
  const data = useMemo(() => {
    const healthy = demoPatients.find((p) => p.id === "demo-01")!;
    const base = simulate(defaultInputs, geo);
    const cur = simulate(inputs, geo);
    const rows = readouts.map((r) => {
      const model = r.model(cur) / r.model(base);
      const measured = r.measured(patient, healthy);
      return { ...r, model, measured, gap: (model - measured) / measured };
    });
    // One slider at a time back to default: how much of each model readout that slider carries.
    const keys = Object.keys(inputsFromPatient(patient).patch) as (keyof Inputs)[];
    const effects = keys.map((k) => {
      const out = simulate({ ...inputs, [k]: defaultInputs[k] }, geo);
      return { key: k, value: inputs[k], deltas: readouts.map((r) => (r.model(cur) - r.model(out)) / r.model(base)) };
    });
    // Therapy before/after: patient baseline without the therapy vs current sliders.
    const therapyRows = therapy
      ? (() => {
          const before = simulate({ ...defaultInputs, ...inputsFromPatient(patient).patch }, geo);
          return readouts.map((r) => {
            const b = r.model(before);
            const a = r.model(cur);
            return { ...r, before: b, after: a, change: b === 0 ? 0 : (a - b) / b };
          });
        })()
      : null;
    return { rows, effects, therapyRows };
  }, [patient, inputs, geo, therapy]);
  const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;
  return (
    <div className="mt-2 grid gap-3 md:grid-cols-2" data-testid="patient-run-readouts">
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Readout (fold healthy)</th><th>Model</th><th>Measured</th><th>Gap</th></tr></thead>
        <tbody>{data.rows.map((r) => (
          <tr key={r.key} className="border-t border-border" data-testid="readout-row">
            <td className="py-1">{r.label} <span className="text-muted-foreground">vs {r.measuredLabel}</span></td>
            <td className="tabular-nums">{r.model.toFixed(2)}x</td>
            <td className="tabular-nums">{r.measured.toFixed(2)}x</td>
            <td className={`tabular-nums ${Math.abs(r.gap) > 0.25 ? "text-destructive" : "text-muted-foreground"}`}>{pct(r.gap)}</td>
          </tr>))}</tbody>
      </table>
      <table className="w-full text-[11px]">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Slider effect (vs default)</th>{readouts.map((r) => <th key={r.key}>{r.label}</th>)}</tr></thead>
        <tbody>{data.effects.map((e) => (
          <tr key={e.key} className="border-t border-border" data-testid="slider-effect-row">
            <td className="py-1">{sliderNames[e.key] ?? e.key} <span className="text-muted-foreground tabular-nums">{Number(e.value).toFixed(Math.abs(Number(e.value)) >= 10 ? 0 : 2)}</span></td>
            {e.deltas.map((d, i) => <td key={i} className="tabular-nums">{pct(d)}</td>)}
          </tr>))}</tbody>
      </table>
      {data.therapyRows && therapy && (
        <table className="w-full text-[11px] md:col-span-2" data-testid="therapy-before-after">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy effect: {therapy.name}</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
          <tbody>{data.therapyRows.map((r) => (
            <tr key={r.key} className="border-t border-border" data-testid="therapy-row">
              <td className="py-1">{r.label}</td>
              <td className="tabular-nums">{fmt(r.before)}</td>
              <td className="tabular-nums">{fmt(r.after)}</td>
              <td className={`tabular-nums ${Math.abs(r.change) > 0.05 ? "text-primary" : "text-muted-foreground"}`}>{pct(r.change)}</td>
            </tr>))}</tbody>
        </table>
      )}
      <p className="text-[10px] text-muted-foreground md:col-span-2">Model values are simulated output divided by output at default settings; measured values are divided by the healthy demo profile (probe signals are already fold control). Gaps over 25% are highlighted. Slider effects reset one slider to default at a time and do not add. Therapy before/after compares the patient's baseline sliders with the therapy applied on top. MitoSOX also sets antioxidant capacity, so the superoxide row is partly circular. Model comparison only, not a clinical finding.</p>
    </div>
  );
}
