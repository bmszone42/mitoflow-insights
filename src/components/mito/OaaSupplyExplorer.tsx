import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defaultGeometry, defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { doseAnchors, doseToFactor } from "@/lib/mito/doseAnchors";
import { DoseAnchorNote, DoseBadge } from "./DoseAnchorNote";

const A = doseAnchors.oaa;
const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
const nadhAt = (base: number, dose: number) => Math.min(1, Math.max(0, base * doseToFactor(A, dose)));

export function OaaSupplyExplorer({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const [dose, setDose] = useState(0);
  const nadh = nadhAt(inputs.nadhRatio, dose);
  const x = useMemo(() => simulate({ ...inputs, nadhRatio: nadh }, geo), [inputs, geo, nadh]);
  const curve = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const d = (i / 20) * A.maxDose;
        const m = simulate({ ...inputs, nadhRatio: nadhAt(inputs.nadhRatio, d) }, geo);
        return { dose: Math.round(d * 10) / 10, atp: m.atpFlux, so: m.superoxide };
      }),
    [inputs, geo],
  );
  const healthySo = useMemo(() => simulate(defaultInputs, defaultGeometry).superoxide, []);
  const rows = [
    { k: "NADH / NAD+ pool", a: inputs.nadhRatio, b: nadh, d: 2 },
    { k: "ATP flux (µM/s)", a: out.atpFlux, b: x.atpFlux, d: 1 },
    { k: "Superoxide (nM)", a: out.superoxide, b: x.superoxide, d: 4 },
  ];
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-card p-4" data-testid="oaa-explorer">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{A.label}</h3>
        <DoseBadge />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-xs">Dose: <span className="font-mono">{dose.toFixed(1)} {A.unit}</span></span>
        <Slider aria-label="Oxaloacetate dose" min={0} max={A.maxDose} step={A.step} value={[dose]} onValueChange={(v) => setDose(v[0] ?? 0)} className="max-w-xs" />
      </div>
      <DoseAnchorNote a={A} />
      <table className="w-full text-xs">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Readout</th><th>Current</th><th>With dose</th><th>Change</th></tr></thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => <tr key={r.k}><td className="py-1">{r.k}</td><td className="font-mono">{r.a.toFixed(r.d)}</td><td className="font-mono">{r.b.toFixed(r.d)}</td><td className="font-mono">{pct(r.b, r.a) >= 0 ? "+" : ""}{pct(r.b, r.a).toFixed(1)}%</td></tr>)}
        </tbody>
      </table>
      <div className="h-44" data-testid="oaa-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="dose" tickFormatter={(v: number) => `${v}g`} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <YAxis yAxisId="atp" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={44} />
            <YAxis yAxisId="so" orientation="right" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={44} />
            <Tooltip
              formatter={(value: any, name: any) => [name === "atp" ? `${value.toFixed(1)} µM/s` : value.toFixed(4), name === "atp" ? "ATP flux" : "Superoxide"]}
              labelFormatter={(v: any) => `${v} ${A.unit}`}
            />
            <Line yAxisId="atp" type="monotone" dataKey="atp" stroke="var(--primary)" dot={false} strokeWidth={2} name="atp" />
            <Line yAxisId="so" type="monotone" dataKey="so" stroke="var(--destructive)" dot={false} strokeWidth={2} name="so" />
            <ReferenceDot yAxisId="atp" x={Math.round(dose * 10) / 10} y={x.atpFlux} r={4} fill="var(--primary)" stroke="none" />
            <ReferenceLine yAxisId="so" y={healthySo} stroke="var(--muted-foreground)" strokeDasharray="4 4"
              label={{ value: `healthy ${healthySo.toFixed(3)} nM`, position: "insideTopRight", fontSize: 9, fill: "var(--muted-foreground)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">ATP (left) and superoxide (right) across 0 to {A.maxDose} {A.unit}; dot marks the current dose; dashed line is healthy-adult superoxide.</p>
    </div>
  );
}
