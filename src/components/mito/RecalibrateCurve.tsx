import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aconitasePct, S_MAX, S_MIN } from "./RecalibrateStrength";
import { useStrengthRange } from "@/lib/mito/rangeState";

// Strength vs aconitase curves for the Recalibrate helper: the Melov 1999 fit
// (weakest defences, Sod2-null stand-in) and the Williams 1998 fit (Sod2+/-
// defence level from the SOD and glutathione drops) side by side.
export function RecalibrateCurve({ target, fitted, ac, williamsAc }: { target: number | null; fitted: number | null; ac: number; williamsAc: number }) {
  // The same picked range as the Strength history band, so the fitted strength
  // can be read against it; updates live with the sliders on the page.
  const [range] = useStrengthRange();
  const data = [];
  for (let s = S_MIN; s <= S_MAX + 1e-9; s += 0.05) {
    const x = Math.round(s * 100) / 100;
    data.push({
      s: x,
      melov: Math.round(aconitasePct(x, 0.2) * 10) / 10,
      williams: Math.round(aconitasePct(x, williamsAc) * 10) / 10,
    });
  }
  return (
    <div className="h-56 w-full" data-testid="recal-curve">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="s" type="number" domain={[S_MIN, S_MAX]} tick={{ fontSize: 11 }} label={{ value: "ROS-induced strength (x)", position: "insideBottomRight", offset: -2, fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "Aconitase % of normal", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} labelFormatter={(s: number) => `Strength ${s}x`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="melov" name="Melov 1999 (0.2x defences)" stroke="var(--primary)" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line type="monotone" dataKey="williams" name={`Williams 1998 (${williamsAc}x defences)`} stroke="var(--chart-3, #f59e0b)" dot={false} strokeWidth={2} strokeDasharray="6 3" isAnimationActive={false} />
          {target !== null && <ReferenceLine y={target} stroke="var(--muted-foreground)" strokeDasharray="4 4" />}
          {fitted !== null && target !== null && (
            <ReferenceDot x={fitted} y={aconitasePct(fitted, ac)} r={5} fill="var(--destructive)" stroke="none" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
