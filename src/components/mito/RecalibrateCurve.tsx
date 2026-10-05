import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aconitasePct, S_MAX, S_MIN } from "./RecalibrateStrength";

// Strength vs aconitase curve for the Recalibrate helper: how the model's Fe-S
// intact % at the weakest defences falls as the ROS-induced strength rises.
export function RecalibrateCurve({ target, fitted }: { target: number | null; fitted: number | null }) {
  const data = [];
  for (let s = S_MIN; s <= S_MAX + 1e-9; s += 0.05) {
    const x = Math.round(s * 100) / 100;
    data.push({ s: x, aco: Math.round(aconitasePct(x) * 10) / 10 });
  }
  return (
    <div className="h-56 w-full" data-testid="recal-curve">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="s" type="number" domain={[S_MIN, S_MAX]} tick={{ fontSize: 11 }} label={{ value: "ROS-induced strength (x)", position: "insideBottomRight", offset: -2, fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "Aconitase % of normal", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`${v}%`, "Aconitase"]} labelFormatter={(s: number) => `Strength ${s}x`} />
          <Line type="monotone" dataKey="aco" stroke="var(--primary)" dot={false} strokeWidth={2} isAnimationActive={false} />
          {target !== null && <ReferenceLine y={target} stroke="var(--muted-foreground)" strokeDasharray="4 4" />}
          {fitted !== null && target !== null && (
            <ReferenceDot x={fitted} y={aconitasePct(fitted)} r={5} fill="var(--destructive)" stroke="none" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
