
// Strength-over-time chart for the Strength history section: each logged event
// with a numeric strength is plotted at its timestamp. The saved default is a
// connected line (gaps where it was cleared); per-profile strengths and batch
// runs are separate scatter marks. Every dot is coloured green when its value
// falls inside the picked strength range band and red when it falls outside.
// Lazy-loaded so recharts stays out of the initial Progress bundle.
import {
  CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer,
  Scatter, Tooltip, XAxis, YAxis,
} from "recharts";
import type { StrengthHistoryEntry } from "@/lib/mito/rirrDefault";

const inBand = (v: number, range?: { lo: number; hi: number }) =>
  !range || (v >= range.lo && v <= range.hi);
const bandFill = (v: number, range?: { lo: number; hi: number }) =>
  inBand(v, range) ? "var(--color-primary)" : "var(--color-destructive)";

export function StrengthHistoryChart({ rows, range }: { rows: StrengthHistoryEntry[]; range?: { lo: number; hi: number } }) {
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

  // Scatters carry their own data so each Cell can colour its own point by
  // whether that value sits inside the band.
  const profileData = data.filter((d) => d.profile != null);
  const batchData = data.filter((d) => d.batch != null);

  // One count per history entry, not per drawn mark: a profile-set entry also
  // carries the still-held default on the line, so it would otherwise count
  // twice. Each entry is judged by the value it recorded.
  const marks = data.flatMap((d) => {
    if (d.profile != null || d.batch != null) {
      return d.profile != null ? [d.profile] : [d.batch!];
    }
    return d.default != null ? [d.default] : [];
  });
  const inside = marks.filter((v) => inBand(v, range)).length;
  const outside = marks.length - inside;

  const fmtTime = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-64 w-full" data-testid="strength-history-chart">
      <p className="mb-1 text-xs text-muted-foreground" data-testid="strength-band-count">
        {inside} of {marks.length} history points inside the band
        {range ? ` (${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x)` : ""}, {outside} outside.
        Dots are green inside the band and red outside.
      </p>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="t" type="number" domain={[t0 - pad, t1 + pad]} tickFormatter={fmtTime} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 1.5]} ticks={[0, 0.5, 1, 1.5]} tick={{ fontSize: 11 }} label={{ value: "ROS-induced strength (x)", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ReferenceLine y={1} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
          {range && <ReferenceArea y1={range.lo} y2={range.hi} fill="var(--primary)" fillOpacity={0.12} stroke="var(--primary)" strokeOpacity={0.35} strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: `range ${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x`, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }} />}
          <Tooltip
            labelFormatter={(t: any) => fmtTime(t)}
            formatter={(v: any, name: any) => [`${v}x`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="stepAfter" dataKey="default" name="Saved default" stroke="var(--primary)" strokeWidth={2} connectNulls={false} isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: { default?: number } }) =>
              props.payload?.default == null ? <g /> :
              <circle
                cx={props.cx} cy={props.cy} r={3}
                fill={bandFill(props.payload.default, range)}
                stroke="var(--color-background)" strokeWidth={1}
              />}
          />
          <Scatter data={profileData} dataKey="profile" name="Per-profile strength" shape="circle" isAnimationActive={false}>
            {profileData.map((d, i) => (
              <Cell key={i} fill={bandFill(d.profile!, range)} />
            ))}
          </Scatter>
          <Scatter data={batchData} dataKey="batch" name="Batch run" shape="triangle" isAnimationActive={false}>
            {batchData.map((d, i) => (
              <Cell key={i} fill={bandFill(d.batch!, range)} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
