import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type GapRow = { date: string; so: number; atp: number; fe: number };

// Per-visit gaps vs the healthy adult (model defaults), as %. Superoxide and
// free iron are bad when above healthy; ATP is bad when below healthy.
const bad = (metric: "so" | "atp" | "fe", v: number) => (metric === "atp" ? v < 0 : v > 0);
const color = (metric: "so" | "atp" | "fe", v: number) => (bad(metric, v) ? "var(--destructive)" : "var(--primary)");

export default function TimelineGapChart({ rows }: { rows: GapRow[] }) {
  const sorted = [...rows].sort((a, b) => b.so - a.so);
  return (
    <div className="h-64 w-full" data-testid="tl-gap-chart">
      <ResponsiveContainer>
        <BarChart data={sorted} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}%`} />
          <Tooltip formatter={(v: number, name: string) => [`${v > 0 ? "+" : ""}${v.toFixed(1)}%`, name]} labelClassName="text-foreground" />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
          <Bar dataKey="so" name="Superoxide gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("so", r.so)} />)}
          </Bar>
          <Bar dataKey="atp" name="ATP gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("atp", r.atp)} />)}
          </Bar>
          <Bar dataKey="fe" name="Free iron gap">
            {sorted.map((r, i) => <Cell key={i} fill={color("fe", r.fe)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
