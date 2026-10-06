// Strength-over-time chart for the Strength history section: each logged event
// with a numeric strength is plotted at its timestamp. The saved default is a
// connected line (gaps where it was cleared); per-profile strengths and batch
// runs are separate scatter marks. Lazy-loaded so recharts stays out of the
// initial Progress bundle.
import {
  CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer,
  Scatter, Tooltip, XAxis, YAxis,
} from "recharts";
import type { StrengthHistoryEntry } from "@/lib/mito/rirrDefault";

const KIND_LABEL: Record<StrengthHistoryEntry["kind"], string> = {
  "default-saved": "Default saved",
  "default-cleared": "Default cleared",
  "profile-set": "Profile strength set",
  "profile-cleared": "Profile strength cleared",
  "batch-run": "Batch run",
};

export function StrengthHistoryChart({ rows }: { rows: StrengthHistoryEntry[] }) {
  const withStrength = rows.filter((r) => r.strength !== null);
  if (!withStrength.length) {
    return <p className="text-sm text-muted-foreground" data-testid="strength-chart-empty">
      No strength values with a number to plot yet.
    </p>;
  }

  // Oldest first so the saved default steps left to right: the value holds
  // from one save to the next, then drops to nothing where it was cleared.
  const sorted = [...rows].reverse();
  const t0 = new Date(sorted[0]!.at).getTime();
  const t1 = new Date(sorted[sorted.length - 1]!.at).getTime();
  const pad = Math.max(60_000, (t1 - t0) * 0.04);

  let current: number | undefined;
  const data = sorted.map((r) => {
    if (r.kind === "default-saved") current = r.strength!;
    if (r.kind === "default-cleared") current = undefined;
    return {
      t: new Date(r.at).getTime(),
      kind: r.kind,
      detail: r.detail,
      default: current,
      profile: r.kind === "profile-set" ? r.strength : undefined,
      batch: r.kind === "batch-run" ? r.strength : undefined,
    };
  });

  // Cleared-default events have no strength, so they fall out of the data and
  // the default line simply breaks there (connectNulls={false}).


  const fmtTime = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-64 w-full" data-testid="strength-history-chart">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="t" type="number" domain={[t0 - pad, t1 + pad]} tickFormatter={fmtTime} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 1.5]} ticks={[0, 0.5, 1, 1.5]} tick={{ fontSize: 11 }} label={{ value: "ROS-induced strength (x)", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ReferenceLine y={1} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Tooltip
            labelFormatter={(t: number) => fmtTime(t)}
            formatter={(v: number, name: string) => [`${v}x`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="stepAfter" dataKey="default" name="Saved default" stroke="var(--primary)" dot={{ r: 3 }} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
          <Scatter dataKey="profile" name="Per-profile strength" fill="var(--chart-2, #10b981)" shape="circle" isAnimationActive={false} />
          <Scatter dataKey="batch" name="Batch run" fill="var(--chart-3, #f59e0b)" shape="triangle" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
