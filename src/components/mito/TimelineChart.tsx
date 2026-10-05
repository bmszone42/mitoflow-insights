import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TimelineChartPoint = { date: string; value: number | null; top: number; real: number | null; plan: number | null; gapBefore: number; gapAfter: number | null };

// Dot color follows the defences-only gap: red above the healthy level, green at or below.
// Same tokens as the table's Defences only column (text-destructive / text-primary).
const gapColor = (gap: number) => (gap > 0 ? "var(--destructive)" : "var(--primary)");

const gapDot =
  (gapOf: (p: TimelineChartPoint) => number, opts?: { stroke?: string; dashed?: boolean }) =>
  (props: { cx?: number; cy?: number; key?: string | number; payload?: TimelineChartPoint }) => {
    if (props.cx == null || props.cy == null || !props.payload) return <g key={props.key} data-gapdot="missing" data-has-cx={String(props.cx != null)} data-has-payload={String(!!props.payload)} />;
    return (
      <circle
        key={props.key}
        cx={props.cx}
        cy={props.cy}
        r={4}
        fill={gapColor(gapOf(props.payload))}
        stroke={opts?.stroke ?? "var(--background)"}
        strokeWidth={2}
        strokeDasharray={opts?.dashed ? "2 2" : undefined}
      />
    );
  };

export default function TimelineChart({ chart, mLabel, isH2o2, isMitosox }: { chart: TimelineChartPoint[]; mLabel: string; isH2o2: boolean; isMitosox: boolean }) {
  return <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
    <YAxis yAxisId="v" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
    <YAxis yAxisId="s" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={30} />
    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} />
    <Legend wrapperStyle={{ fontSize: 10 }} />
    {isH2o2 && <ReferenceLine yAxisId="v" y={100} stroke="var(--destructive)" strokeDasharray="4 3" label={{ value: "100 nM", fontSize: 9, fill: "var(--destructive)" }} />}
    {isMitosox && <ReferenceLine yAxisId="v" y={1.5} stroke="var(--destructive)" strokeDasharray="4 3" label={{ value: "1.5x", fontSize: 9, fill: "var(--destructive)" }} />}
    {isMitosox && <ReferenceLine yAxisId="v" y={0.59} stroke="var(--destructive)" strokeDasharray="4 3" label={{ value: "0.59x", fontSize: 9, fill: "var(--destructive)" }} />}
    <Line yAxisId="v" dataKey="value" name={mLabel} stroke="var(--primary)" strokeWidth={2} dot={gapDot((p) => p.gapBefore)} connectNulls={false} />
    <Line yAxisId="v" dataKey="real" name="Real-world visit" stroke="none" dot={gapDot((p) => p.gapBefore, { stroke: "var(--background)" })} isAnimationActive={false} legendType="circle" />
    <Line yAxisId="v" dataKey="plan" name="Plan row" stroke="none" dot={gapDot((p) => p.gapAfter ?? p.gapBefore, { stroke: "var(--muted-foreground)", dashed: true })} isAnimationActive={false} legendType="circle" />
    <Line yAxisId="s" dataKey="top" name="Top mechanism score" stroke="var(--muted-foreground)" strokeDasharray="4 3" dot={false} />
  </LineChart></ResponsiveContainer></div>;
}
