import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type GapRow = { date: string; so: number; atp: number; fe: number; strength: number };

// Per-visit gaps vs the healthy adult (model defaults), as %. Superoxide and
// free iron are bad when above healthy; ATP is bad when below healthy.
const bad = (metric: "so" | "atp" | "fe", v: number) => (metric === "atp" ? v < 0 : v > 0);
const color = (metric: "so" | "atp" | "fe", v: number) => (bad(metric, v) ? "var(--destructive)" : "var(--primary)");

export default function TimelineGapChart({ rows }: { rows: GapRow[] }) {
  const sorted = [...rows].sort((a, b) => b.so - a.so);
  return (
    <div className="h-64 w-full" data-testid="tl-gap-chart">
      <ResponsiveContainer>
        <ComposedChart data={sorted} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis yAxisId="gap" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}%`} />
          <YAxis yAxisId="str" orientation="right" domain={[0, 2]} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}x`} />
          <Tooltip
            formatter={(v: number, name: string) => (name === "Therapy strength" ? [`${v.toFixed(2)}x`, name] : [`${v > 0 ? "+" : ""}${v.toFixed(1)}%`, name])}
            labelClassName="text-foreground"
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine yAxisId="gap" y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Bar yAxisId="gap" dataKey="so" name="Superoxide gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("so", r.so)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="atp" name="ATP gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("atp", r.atp)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="fe" name="Free iron gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("fe", r.fe)} />)}
          </Bar>
          <Line yAxisId="str" type="monotone" dataKey="strength" name="Therapy strength" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
