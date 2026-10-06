import { Bar, CartesianGrid, Cell, ComposedChart, DefaultTooltipContent, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { therapies } from "@/lib/mito/treatment";
import { useStrengthRange } from "@/lib/mito/rangeState";
import { snapStatus, useSnapPlan } from "@/lib/mito/snapPlan";

export type GapRow = { date: string; so: number; atp: number; fe: number; doses: Record<string, number>; corridors?: Record<string, [number, number] | null>; pairGap?: number | null; pairCor?: [number, number] | null };

// Tooltip content without the corridor plumbing rows (cor-lo / cor-span / pcor-*).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GapTooltip(props: any) {
  return <DefaultTooltipContent {...props} payload={(props.payload ?? []).filter((e: { dataKey?: unknown }) => { const k = String(e.dataKey ?? ""); return !k.startsWith("cor-") && !k.startsWith("pcor-"); })} />;
}

// Per-visit gaps vs the healthy adult (model defaults), as %. Superoxide and
// free iron are bad when above healthy; ATP is bad when below healthy.
const bad = (metric: "so" | "atp" | "fe", v: number) => (metric === "atp" ? v < 0 : v > 0);
const color = (metric: "so" | "atp" | "fe", v: number) => (bad(metric, v) ? "var(--destructive)" : "var(--primary)");
// Therapy lines cycle the theme's chart palette.
const lineColor = (i: number) => `var(--chart-${(i % 5) + 1})`;

export default function TimelineGapChart({ rows }: { rows: GapRow[] }) {
  const [range] = useStrengthRange();
  // Scheduled snaps from the Snap plan page, plotted as a date strip under the
  // gap chart: green when the snap's target strength sits inside the saved
  // band, red when outside. Only planned snaps show; done and skipped are history.
  const snaps = useSnapPlan().filter((s) => s.status === "planned");
  const sorted = [...rows].sort((a, b) => b.so - a.so);
  // One line per therapy that appears in any visit; null where not given so the line breaks.
  const used = therapies.filter((t) => sorted.some((r) => r.doses[t.id] != null));
  const data = sorted.map((r) => {
    const entries: Record<string, number | null> = Object.fromEntries(used.map((t) => [t.id, r.doses[t.id] ?? null]));
    for (const t of used) {
      const c = r.corridors?.[`cor-${t.id}`];
      entries[`cor-lo-${t.id}`] = c ? c[0] : null;
      entries[`cor-span-${t.id}`] = c ? c[1] - c[0] : null;
    }
    // Combined pair strip: the gap all the visit's therapies give together at
    // the band's low and high strengths. Null on single-therapy visits.
    entries["pcor-lo"] = r.pairCor ? r.pairCor[0] : null;
    entries["pcor-span"] = r.pairCor ? r.pairCor[1] - r.pairCor[0] : null;
    return { ...r, ...entries };
  });
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
            content={<GapTooltip />}
            formatter={(v: unknown, name: string) => {
              const n = Number(v ?? 0);
              return used.some((t) => t.name === name) ? [`${n.toFixed(2)}x`, name] : [`${n > 0 ? "+" : ""}${n.toFixed(1)}%`, name];
            }}
            labelClassName="text-foreground"
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine yAxisId="gap" y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          {range && (
            <ReferenceArea
              yAxisId="str"
              y1={range.lo}
              y2={range.hi}
              fill="var(--primary)"
              fillOpacity={0.14}
              stroke="var(--primary)"
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              label={{ value: `range ${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x`, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }}
            />
          )}
          <Bar yAxisId="gap" dataKey="so" name="Superoxide gap">
            {data.map((r, i) => <Cell key={i} fill={color("so", r.so)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="atp" name="ATP gap">
            {data.map((r, i) => <Cell key={i} fill={color("atp", r.atp)} />)}
          </Bar>
          <Bar yAxisId="gap" dataKey="fe" name="Free iron gap">
            {data.map((r, i) => <Cell key={i} fill={color("fe", r.fe)} />)}
          </Bar>
          {/* Gap corridor strips: per therapy, a strip from the defences-only gap
              at the range's low strength to the gap at the high strength, so each
              gap can be read against the saved band. Two stacked bars: the first
              is transparent padding up to the low value, the second is the colored
              span. Null where that therapy was not given. Flat array, not a
              Fragment: recharts only registers chart items as direct children. */}
          {used.flatMap((t, i) => [
            <Bar key={`cor-lo-${t.id}`} yAxisId="gap" stackId={`cor-${t.id}`} dataKey={`cor-lo-${t.id}`} fill="transparent" stroke="none" isAnimationActive={false} legendType="none" />,
            <Bar
              key={`cor-span-${t.id}`}
              yAxisId="gap"
              stackId={`cor-${t.id}`}
              dataKey={`cor-span-${t.id}`}
              name={`${t.name} gap in range`}
              fill={lineColor(i)}
              fillOpacity={0.22}
              stroke={lineColor(i)}
              strokeOpacity={0.5}
              strokeDasharray="3 3"
              isAnimationActive={false}
              legendType="none"
            />,
          ])}
          {/* Combined pair strip: the defences-only gap all of a visit's
              therapies give together at the band's low and high strengths.
              Only present on visits with two or more therapies. */}
          <Bar yAxisId="gap" stackId="pcor" dataKey="pcor-lo" fill="transparent" stroke="none" isAnimationActive={false} legendType="none" />
          <Bar
            yAxisId="gap"
            stackId="pcor"
            dataKey="pcor-span"
            name="Combined gap in range"
            fill="var(--foreground)"
            fillOpacity={0.18}
            stroke="var(--foreground)"
            strokeOpacity={0.45}
            strokeDasharray="3 3"
            isAnimationActive={false}
            legendType="none"
          />
          {used.map((t, i) => (
            <Line key={t.id} yAxisId="str" type="monotone" dataKey={t.id} name={t.name} stroke={lineColor(i)} strokeWidth={2} dot={{ r: 3 }} label={{ content: endLabel(t, i) }} />
          ))}
          {/* Combined pair gap line: all of a visit's therapies together at
              their model doses, dashed, only where a visit has 2+ therapies. */}
          <Line yAxisId="gap" type="monotone" dataKey="pairGap" name="Combined therapies gap" stroke="var(--foreground)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
      {snaps.length > 0 && (
        <div className="mt-1" data-testid="tl-snap-strip">
          <p className="text-[11px] text-muted-foreground">
            Scheduled snaps: green when the planned target strength sits inside your range, red when outside. Dates come from the Snap plan page.
          </p>
          <div className="h-20 w-full">
            <ResponsiveContainer>
              <ComposedChart
                data={snaps.map((s) => ({ x: new Date(`${s.date}T12:00:00`).getTime(), y: s.to, label: `${s.label}: ${s.from.toFixed(2)}x to ${s.to.toFixed(2)}x (${snapStatus(s)})`, in: !!range && s.to >= range.lo && s.to <= range.hi }))}
                margin={{ top: 4, right: 110, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={["dataMin - 86400000", "dataMax + 86400000"]}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v: number) => new Date(v).toISOString().slice(0, 10)}
                />
                <YAxis domain={[0, 2]} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `${v}x`} width={40} />
                <Tooltip
                  formatter={(v: unknown, name: string) => (name === "y" ? [`${Number(v).toFixed(2)}x`, "Target strength"] : [String(v), name])}
                  labelFormatter={(v: unknown) => new Date(Number(v)).toISOString().slice(0, 10)}
                  labelClassName="text-foreground"
                />
                {range && (
                  <ReferenceArea
                    y1={range.lo}
                    y2={range.hi}
                    fill="var(--primary)"
                    fillOpacity={0.14}
                    stroke="var(--primary)"
                    strokeOpacity={0.35}
                    strokeDasharray="4 4"
                  />
                )}
                <Scatter dataKey="y" name="Planned snap" isAnimationActive={false}>
                  {snaps.map((s) => {
                    const inBand = !!range && s.to >= range.lo && s.to <= range.hi;
                    return <Cell key={s.id} fill={inBand ? "var(--primary)" : "var(--destructive)"} />;
                  })}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
