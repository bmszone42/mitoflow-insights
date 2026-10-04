import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defaultGeometry, defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";

/*
 * MADE-UP exploratory lever. Oxaloacetate (OAA) supply, e.g. SLC25A34 import or
 * anaplerosis, scales how much NADH the TCA cycle can deliver via a saturating
 * curve f = 1.5 * oaa / (0.5 + oaa) (f = 1 at oaa = 1). No published flux backs it.
 * It never changes the app's inputs, flags, scenarios or diagnosis.
 */
export const oaaFactor = (oaa: number) => (1.5 * oaa) / (0.5 + oaa);

const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

export function OaaSupplyExplorer({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const [oaa, setOaa] = useState(1);
  const nadh = Math.min(1, Math.max(0, inputs.nadhRatio * oaaFactor(oaa)));
  const x = useMemo(() => simulate({ ...inputs, nadhRatio: nadh }, geo), [inputs, geo, nadh]);
  // ATP and superoxide across the full 0-2x lever range, for the chart.
  const curve = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const o = i / 10;
        const n = Math.min(1, Math.max(0, inputs.nadhRatio * oaaFactor(o)));
        const m = simulate({ ...inputs, nadhRatio: n }, geo);
        return { oaa: o, atp: m.atpFlux, so: m.superoxide };
      }),
    [inputs, geo],
  );
  // Healthy-adult superoxide baseline, for the "vs healthy" marker line.
  const healthySo = useMemo(() => simulate(defaultInputs, defaultGeometry).superoxide, []);
  const rows = [
    { k: "NADH / NAD+ pool", a: inputs.nadhRatio, b: nadh, d: 2 },
    { k: "ATP flux (µM/s)", a: out.atpFlux, b: x.atpFlux, d: 1 },
    { k: "Superoxide (nM)", a: out.superoxide, b: x.superoxide, d: 2 },
  ];
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4" data-testid="oaa-explorer">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Oxaloacetate supply (exploratory)</h3>
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">MADE-UP, unvalidated</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Invented lever inspired by the SLC25A34 oxaloacetate carrier (Karavaeva 2026, adipocytes). It scales the NADH pool by a
        made-up saturating curve; 1 = current state. It does not change your sliders, flags, scenarios or diagnosis.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="w-32 text-xs">OAA supply: <span className="font-mono">{oaa.toFixed(2)}x</span></span>
        <Slider aria-label="Oxaloacetate supply (made-up)" min={0} max={2} step={0.05} value={[oaa]} onValueChange={(v) => setOaa(v[0] ?? 1)} className="max-w-xs" />
      </div>
      <table className="mt-3 w-full text-xs">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Readout</th><th>Current</th><th>With OAA lever</th><th>Change</th></tr></thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => <tr key={r.k}><td className="py-1">{r.k}</td><td className="font-mono">{r.a.toFixed(r.d)}</td><td className="font-mono">{r.b.toFixed(r.d)}</td><td className="font-mono">{pct(r.b, r.a) >= 0 ? "+" : ""}{pct(r.b, r.a).toFixed(1)}%</td></tr>)}
        </tbody>
      </table>
      <div className="mt-3 h-44" data-testid="oaa-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="oaa" tickFormatter={(v: number) => `${v.toFixed(1)}x`} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <YAxis yAxisId="atp" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={44} />
            <YAxis yAxisId="so" orientation="right" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={44} />
            <Tooltip
              formatter={(value: number, name: string) => [name === "atp" ? `${value.toFixed(1)} µM/s` : value.toFixed(3), name === "atp" ? "ATP flux" : "Superoxide"]}
              labelFormatter={(v: number) => `OAA supply ${Number(v).toFixed(1)}x`}
            />
            <Line yAxisId="atp" type="monotone" dataKey="atp" stroke="var(--primary)" dot={false} strokeWidth={2} name="atp" />
            <Line yAxisId="so" type="monotone" dataKey="so" stroke="var(--destructive)" dot={false} strokeWidth={2} name="so" />
            <ReferenceDot yAxisId="atp" x={Math.round(oaa * 10) / 10} y={x.atpFlux} r={4} fill="var(--primary)" stroke="none" />
            <ReferenceLine
              yAxisId="so"
              y={healthySo}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: `healthy ${healthySo.toFixed(3)} nM`, position: "insideTopRight", fontSize: 9, fill: "var(--muted-foreground)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        ATP flux (left axis) and superoxide (right axis) across the full 0 to 2x range; the dot marks the current lever setting.
        The dashed line is the healthy-adult superoxide level: if the red curve sits above it, ROS is high for this profile.
      </p>
    </div>
  );
}
