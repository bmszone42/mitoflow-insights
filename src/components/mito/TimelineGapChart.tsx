import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { therapies } from "@/lib/mito/treatment";

export type GapRow = { date: string; so: number; atp: number; fe: number; doses: Record<string, number> };

// Per-visit gaps vs the healthy adult (model defaults), as %. Superoxide and
// free iron are bad when above healthy; ATP is bad when below healthy.
const bad = (metric: "so" | "atp" | "fe", v: number) => (metric === "atp" ? v < 0 : v > 0);
const color = (metric: "so" | "atp" | "fe", v: number) => (bad(metric, v) ? "var(--destructive)" : "var(--primary)");
// Therapy lines cycle the theme's chart palette.
const lineColor = (i: number) => `var(--chart-${(i % 5) + 1})`;

export default function TimelineGapChart({ rows }: { rows: GapRow[] }) {
  const sorted = [...rows].sort((a, b) => b.so - a.so);
  // One line per therapy that appears in any visit; null where not given so the line breaks.
  const used = therapies.filter((t) => sorted.some((r) => r.doses[t.id] != null));
  const data = sorted.map((r) => ({
    ...r,
    ...Object.fromEntries(used.map((t) => [t.id, r.doses[t.id] ?? null])),
  }));
  // Last non-null point per therapy, where the line's name label is drawn.
  const lastIdx = new Map(used.map((t) => {
    let last = -1;
    data.forEach((r, i) => { if (r[t.id as keyof typeof r] != null) last = i; });
    return [t.id, last] as const;
  }));
  const endLabel = (t: (typeof used)[number], i: number) => (props: { x?: number | string | undefined; y?: number | string | undefined; index?: number | undefined }) => {
    if (props.index !== lastIdx.get(t.id)) return null;
    return (
      <text x={Number(props.x) + 6} y={Number(props.y)} fontSize={10} fill={lineColor(i)} dominantBaseline="middle">
        {t.name}
      </text>
    );
  };
  return (
    <div className="h-64 w-full" data-testid="tl-gap-chart">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 110, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis yAxisId="gap" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}%`} />
          <YAxis yAxisId="str" orientation="right" domain={[0, 2]} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}x`} />
          <Tooltip
            formatter={(v: number, name: string) => (used.some((t) => t.name === name) ? [`${v.toFixed(2)}x`, name] : [`${v > 0 ? "+" : ""}${v.toFixed(1)}%`, name])}
            labelClassName="text-foreground"
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine yAxisId="gap" y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Bar yAxisId="gap" dataKey="so" name="Superoxide gap">
            {data.map((r, i) => <Cell key={i} fill={color("so", r.so)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="atp" name="ATP gap">
            {data.map((r, i) => <Cell key={i} fill={color("atp", r.atp)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="fe" name="Free iron gap">
            {data.map((r, i) => <Cell key={i} fill={color("fe", r.fe)} />)}
          </Bar>
          {used.map((t, i) => (
            <Line key={t.id} yAxisId="str" type="monotone" dataKey={t.id} name={t.name} stroke={lineColor(i)} strokeWidth={2} dot={{ r: 3 }} label={{ content: endLabel(t, i) }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
