import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Slider } from "@/components/ui/slider";
import { defaultGeometry, defaultInputs, simulate, type Geometry, type Inputs } from "@/lib/mito/model";
import { mitophagyReadout } from "@/lib/mito/mitophagy";
import { doseAnchors, doseToFactor } from "@/lib/mito/doseAnchors";
import { DoseAnchorNote, DoseBadge } from "./DoseAnchorNote";

const MitophagyChart = lazy(() => import("./MitophagyChart"));
const A = doseAnchors.urolithinA;
const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

export function MitophagyExplorer({ inputs, geo }: { inputs: Inputs; geo: Geometry }) {
  const [dose, setDose] = useState(0);
  const before = useMemo(() => mitophagyReadout(inputs, geo, 1), [inputs, geo]);
  const after = useMemo(() => mitophagyReadout(inputs, geo, doseToFactor(A, dose)), [inputs, geo, dose]);
  const curve = useMemo(
    () => Array.from({ length: 21 }, (_, k) => { const d = (k / 20) * A.maxDose; const x = mitophagyReadout(inputs, geo, doseToFactor(A, d)); return { r: d, atp: x.atp, so: x.so }; }),
    [inputs, geo],
  );
  const healthySo = useMemo(() => simulate(defaultInputs, defaultGeometry).superoxide, []);
  const rows = [
    { k: "Membrane potential (mV)", a: before.psi, b: after.psi, d: 0 },
    { k: "Labile iron (µM)", a: before.iron, b: after.iron, d: 2 },
    { k: "ATP flux (µM/s)", a: before.atp, b: after.atp, d: 1 },
    { k: "Superoxide (nM)", a: before.so, b: after.so, d: 4 },
    { k: "Peroxide (nM)", a: before.h2, b: after.h2, d: 1 },
    { k: "Fe-S intact (fraction)", a: before.fes, b: after.fes, d: 3 },
  ];
  return (
    <div className="panel space-y-3 rounded-lg border border-dashed border-border p-4" data-testid="mitophagy-explorer">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{A.label}</h3>
        <div className="flex gap-2 text-[11px]">
          <Link to="/references" className="rounded bg-muted px-2 py-0.5 text-muted-foreground underline">Behaviors level (Monzel 2023)</Link>
          <DoseBadge />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Slider aria-label="Urolithin A dose" min={0} max={A.maxDose} step={A.step} value={[dose]} onValueChange={(v) => setDose(v[0] ?? 0)} className="flex-1" />
        <span className="w-24 text-right font-mono text-xs" data-testid="mitophagy-rate">{dose} {A.unit}</span>
      </div>
      <DoseAnchorNote a={A} />
      <table className="w-full text-xs" data-testid="mitophagy-readout">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Readout</th><th>Current</th><th>With dose</th><th>Change</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-t border-border">
              <td className="py-1">{r.k}</td><td className="font-mono">{r.a.toFixed(r.d)}</td><td className="font-mono">{r.b.toFixed(r.d)}</td>
              <td className="font-mono">{pct(r.b, r.a) >= 0 ? "+" : ""}{pct(r.b, r.a).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Suspense fallback={<div className="h-56 text-xs text-muted-foreground">Loading chart…</div>}>
        <MitophagyChart data={curve} at={{ r: Math.round(dose / 50) * 50, atp: after.atp }} healthySo={healthySo} />
      </Suspense>
    </div>
  );
}
