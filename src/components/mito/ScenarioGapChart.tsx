import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartStyle, tooltipProps } from "./SimulatorShared";

export type GapBar = { name: string; gap: number; kind: "reference" | "scenario" };

const fillFor = (r: GapBar) =>
  r.kind === "reference" ? "var(--color-muted-foreground)" : r.gap > 0 ? "var(--color-destructive)" : "var(--color-primary)";

/**
 * Defences-only gap per saved scenario as horizontal bars, always sorted
 * weakest defences (largest gap) first, whatever the table above is sorted by.
 * Red above the healthy adult's level, green at or below; the reference profile
 * sits in a neutral colour and the dashed line marks the healthy level (0%).
 */
export function ScenarioGapChart({ rows }: { rows: GapBar[] }) {
  const data = useMemo(() => [...rows].sort((a, b) => b.gap - a.gap), [rows]);
  const height = Math.max(180, data.length * 34 + 56);

  return (
    <section className="mt-3 space-y-1 border-t border-border pt-3" data-testid="spc-gap-chart">
      <h3 className="text-sm font-semibold">Defences-only gap by scenario</h3>
      <p className="text-[11px] text-muted-foreground">
        Weakest defences first, whatever the table is sorted by. Bars are red above the healthy adult's level and green at or
        below; the dashed line is the healthy level (0%). Model estimates, not a diagnosis.
      </p>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" unit="%" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} stroke={chartStyle.axis} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              stroke={chartStyle.axis}
            />
            <Tooltip
              {...tooltipProps()}
              formatter={(v: any) => [`${v >= 0 ? "+" : ""}${v.toFixed(0)}%`, "defences-only gap"]}
            />
            <ReferenceLine
              x={0}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: "healthy", position: "top", fontSize: 10, fill: "var(--color-muted-foreground)" }}
            />
            <Bar dataKey="gap" radius={[0, 3, 3, 0]}>
              {data.map((d) => (
                <Cell key={`${d.kind}:${d.name}`} fill={fillFor(d)} />
              ))}
              <LabelList
                dataKey="gap"
                position="right"
                formatter={(v: any) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
