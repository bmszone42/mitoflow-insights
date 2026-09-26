import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  sensitivity,
  sensitivityDrivers,
  sensOutputs,
  sweep,
  type Inputs,
  type SensOutputKey,
} from "@/lib/mito/model";

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
};
const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export function Sensitivity({ inputs }: { inputs: Inputs }) {
  const [delta, setDelta] = useState(0.2);
  const [output, setOutput] = useState<SensOutputKey>("superoxide");
  const [driver, setDriver] = useState<keyof Inputs>("labileIron");

  const sens = useMemo(() => sensitivity(inputs, delta), [inputs, delta]);
  const sweepData = useMemo(
    () =>
      sweep(inputs, driver).map((r) => ({
        ...r,
        fesPct: (r["fesIntact"] ?? 0) * 100,
      })),
    [inputs, driver],
  );

  const tornado = sens
    .map((s) => ({
      name: s.driver.label,
      down: s.down[output],
      up: s.up[output],
      span: Math.abs(s.up[output]) + Math.abs(s.down[output]),
    }))
    .sort((a, b) => b.span - a.span);

  const maxAbs = Math.max(
    1,
    ...sens.flatMap((s) => sensOutputs.map((o) => Math.max(Math.abs(s.up[o.key]), Math.abs(s.down[o.key])))),
  );
  const dDef = sensitivityDrivers.find((d) => d.key === driver)!;
  const outLabel = sensOutputs.find((o) => o.key === output)!.label;

  return (
    <div className="space-y-4">
      <section className="panel flex flex-wrap items-end gap-6 p-4">
        <div className="min-w-[220px] flex-1">
          <div className="mono-label">Perturbation step</div>
          <div className="mt-1 text-sm">
            plus or minus {(delta * 100).toFixed(0)}% of each driver's full range
          </div>
          <Slider
            className="mt-3"
            min={0.05}
            max={0.5}
            step={0.05}
            value={[delta]}
            onValueChange={(v) => setDelta(v[0] ?? 0.2)}
          />
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Baseline is the current Simulator settings. Steps are a share of range, not of baseline, so
          drivers starting at zero (like light dose) still show their effect. Values are clamped to
          the slider limits.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="mono-label">Tornado: what moves {outLabel}</div>
            <Select value={output} onValueChange={(v) => setOutput(v as SensOutputKey)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensOutputs.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <BarChart data={tornado} layout="vertical" stackOffset="sign" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip {...tip} formatter={(v: number, n) => [fmt(v), n === "down" ? "Driver down" : "Driver up"]} />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                {(["down", "up"] as const).map((k) => (
                  <Bar key={k} dataKey={k} stackId="a">
                    {tornado.map((t, i) => (
                      <Cell key={i} fill={t[k] >= 0 ? "var(--accent)" : "var(--primary)"} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pink bars raise the output, green bars lower it. Longest bars matter most.
          </p>
        </section>

        <section className="panel overflow-x-auto p-4">
          <div className="mono-label">Heatmap: driver up by one step</div>
          <table className="mt-3 w-full border-separate border-spacing-1 text-[11px]">
            <thead>
              <tr>
                <th />
                {sensOutputs.map((o) => (
                  <th key={o.key} className="font-mono font-normal text-muted-foreground">
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.map((s) => (
                <tr key={s.driver.key}>
                  <td className="whitespace-nowrap pr-2 text-muted-foreground">{s.driver.label}</td>
                  {sensOutputs.map((o) => {
                    const v = s.up[o.key];
                    const a = Math.min(1, Math.abs(v) / maxAbs);
                    const color = v >= 0 ? "var(--accent)" : "var(--primary)";
                    return (
                      <td
                        key={o.key}
                        title={`${s.driver.label} up: ${o.label} ${fmt(v)} (down: ${fmt(s.down[o.key])})`}
                        className="rounded px-1 py-2 text-center font-mono"
                        style={{
                          background: `color-mix(in oklch, ${color} ${Math.round(a * 85)}%, transparent)`,
                        }}
                      >
                        {Math.abs(v) < 0.05 ? "0" : v.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Percent change in each output. Hover a cell for up and down values.
          </p>
        </section>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono-label">Sweep across full range</div>
          <Select value={driver} onValueChange={(v) => setDriver(v as keyof Inputs)}>
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sensitivityDrivers.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.group}: {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 h-80">
          <ResponsiveContainer>
            <LineChart data={sweepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[dDef.min, dDef.max]}
                tickFormatter={(v) => Number(v).toFixed(1)}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                yAxisId="ros"
                scale="log"
                domain={["auto", "auto"]}
                allowDataOverflow
                tickFormatter={(v) => Number(v).toPrecision(2)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                label={{ value: "ROS nM (log)", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis yAxisId="fe" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tip} formatter={(v: number) => Number(v).toPrecision(3)} labelFormatter={(v) => `${dDef.label} ${Number(v).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="ros" x={inputs[driver]} stroke="var(--foreground)" strokeDasharray="4 4" />
              <Line yAxisId="ros" dataKey="superoxide" name="O2•- nM" stroke="var(--chart-1)" dot={false} />
              <Line yAxisId="ros" dataKey="hydrogenPeroxide" name="H2O2 nM" stroke="var(--chart-2)" dot={false} />
              <Line yAxisId="ros" dataKey="peroxynitrite" name="ONOO- nM" stroke="var(--chart-3)" dot={false} />
              <Line yAxisId="ros" dataKey="lipidPeroxyl" name="LOO• nM" stroke="var(--chart-4)" dot={false} />
              <Line yAxisId="fe" dataKey="fesPct" name="Fe-S intact %" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line yAxisId="fe" dataKey="freeIron" name="Free Fe2+ µM" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Left axis: ROS on a log scale. Right axis: Fe-S intact (%) and free Fe2+ (µM). Dashed line
          marks the current baseline.
        </p>
      </section>
    </div>
  );
}
