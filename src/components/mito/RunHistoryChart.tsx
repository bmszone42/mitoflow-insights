// Superoxide-change-over-time chart for the Scenario progress page: every
// logged run that recorded a superoxide change is plotted at its timestamp.
// Each dot is green when the run's ROS-induced strength sat inside the picked
// strength range band and red when outside (or when the strength was not
// noted). Lazy-loaded so recharts stays out of the initial Progress bundle.
import {
  CartesianGrid, Cell, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer,
  Scatter, Tooltip, XAxis, YAxis,
} from "recharts";
import type { RunRecord } from "@/lib/mito/runs";
import { therapies } from "@/lib/mito/treatment";

const therapyName = (id: string) => therapies.find((t) => t.id === id)?.name ?? id;

export function RunHistoryChart({ runs, range }: { runs: RunRecord[]; range?: { lo: number; hi: number } }) {
  const plotted = runs
    .filter((r) => r.soChangePct != null)
    .map((r) => ({
      t: r.at,
      so: r.soChangePct!,
      strength: r.rirrStrength,
      label: `${r.patientId}: ${r.therapyIds.map(therapyName).join(", ")} at ${r.dose === 0 ? "all doses" : `${r.dose}x`}`,
    }))
    .sort((a, b) => a.t - b.t);

  if (!plotted.length) {
    return <p className="text-sm text-muted-foreground" data-testid="run-chart-empty">
      No runs with a recorded superoxide change yet. Runs from real-dose sliders and therapy tools record it.
    </p>;
  }

  const inBand = (strength: number | undefined) =>
    !!range && strength != null && strength >= range.lo && strength <= range.hi;
  const inside = plotted.filter((d) => inBand(d.strength)).length;
  const outside = plotted.length - inside;

  const t0 = plotted[0]!.t;
  const t1 = plotted[plotted.length - 1]!.t;
  const pad = Math.max(60_000, (t1 - t0) * 0.04);
  const fmtTime = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const yMax = Math.max(5, ...plotted.map((d) => Math.abs(d.so))) * 1.15;
  const yStep = Math.ceil(yMax / 2);
  const yTicks = [-2 * yStep, -yStep, 0, yStep, 2 * yStep];

  return (
    <div className="h-64 w-full" data-testid="run-history-chart">
      <p className="mb-1 text-xs text-muted-foreground" data-testid="run-band-count">
        {inside} of {plotted.length} runs inside the band
        {range ? ` (${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x)` : ""}, {outside} outside or with no strength noted.
        Dots are green inside the band and red outside.
      </p>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="t" type="number" domain={[t0 - pad, t1 + pad]} tickFormatter={fmtTime} tick={{ fontSize: 11 }} />
          <YAxis domain={[-yMax, yMax]} tick={{ fontSize: 11 }} label={{ value: "Superoxide change (%)", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
          {range && (
            <ReferenceArea
              y1={-yMax} y2={yMax}
              fill="var(--primary)" fillOpacity={0.05}
              label={{ value: `band judged on strength ${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x`, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }}
            />
          )}
          <Tooltip
            labelFormatter={(t: number) => fmtTime(t)}
            formatter={(v: number, _name: string, item: { payload?: { label?: string; strength?: number } }) => [
              `${v.toFixed(1)}%${item.payload?.strength != null ? ` at ${item.payload.strength}x` : ""}`,
              item.payload?.label ?? "run",
            ]}
            contentStyle={{ fontSize: 12 }}
          />
          <Scatter data={plotted} dataKey="so" name="Superoxide change" shape="circle" isAnimationActive={false}>
            {plotted.map((d, i) => (
              <Cell key={i} fill={inBand(d.strength) ? "var(--color-primary)" : "var(--color-destructive)"} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
