import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aconitasePct, S_MAX, S_MIN, WEAK_AC } from "./RecalibrateStrength";
import { useStrengthRange } from "@/lib/mito/rangeState";

// Strength vs aconitase curves for the Recalibrate helper: the Melov 1999 fit
// (weakest defences, Sod2-null stand-in) and the Williams 1998 fit (Sod2+/-
// defence level from the SOD and glutathione drops) side by side. The picked
// range band from the Strength history sliders is drawn behind both curves, and
// each fit gets its own dot so you can see where the pasted number lands
// relative to the band on either anchor.
export function RecalibrateCurve({ target, melovFitted, williamsFitted, williamsAc, ownFitted, ownAc }: {
  target: number | null;
  melovFitted: number | null;
  williamsFitted: number | null;
  williamsAc: number;
  ownFitted: number | null;
  ownAc: number;
}) {
  const [range] = useStrengthRange();
  const inBand = (v: number) => !range || (v >= range.lo && v <= range.hi);
  const data = [];
  for (let s = S_MIN; s <= S_MAX + 1e-9; s += 0.05) {
    const x = Math.round(s * 100) / 100;
    data.push({
      s: x,
      melov: Math.round(aconitasePct(x, WEAK_AC) * 10) / 10,
      williams: Math.round(aconitasePct(x, williamsAc) * 10) / 10,
      own: Math.round(aconitasePct(x, ownAc) * 10) / 10,
    });
  }
  const bandLabel = range ? ` (${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x)` : "";
  return (
    <div className="h-56 w-full" data-testid="recal-curve">
      {(melovFitted !== null || williamsFitted !== null || ownFitted !== null) && (
        <p className="mb-1 text-xs text-muted-foreground" data-testid="recal-band-readout">
          Against the band{bandLabel}: Melov fit{" "}
          {melovFitted !== null ? (
            <span className={inBand(melovFitted) ? "text-primary" : "text-destructive"}>
              {melovFitted}x, {inBand(melovFitted) ? "inside" : "outside"}
            </span>
          ) : (
            "not reached by the model"
          )}
          {" "}· Williams fit{" "}
          {williamsFitted !== null ? (
            <span className={inBand(williamsFitted) ? "text-primary" : "text-destructive"}>
              {williamsFitted}x, {inBand(williamsFitted) ? "inside" : "outside"}
            </span>
          ) : (
            "not reached by the model"
          )}
          {" "}· My measurement fit{" "}
          {ownFitted !== null ? (
            <span className={inBand(ownFitted) ? "text-primary" : "text-destructive"}>
              {ownFitted}x, {inBand(ownFitted) ? "inside" : "outside"}
            </span>
          ) : (
            "not reached by the model"
          )}
        </p>
      )}
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="s" type="number" domain={[S_MIN, S_MAX]} tick={{ fontSize: 11 }} label={{ value: "ROS-induced strength (x)", position: "insideBottomRight", offset: -2, fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "Aconitase % of normal", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v: any, name: any) => [`${v}%`, name]} labelFormatter={(s: number) => `Strength ${s}x`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {range && <ReferenceArea x1={range.lo} x2={range.hi} fill="var(--primary)" fillOpacity={0.12} stroke="var(--primary)" strokeOpacity={0.35} strokeDasharray="4 4" label={{ value: `range ${range.lo.toFixed(2)}x-${range.hi.toFixed(2)}x`, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }} />}
          <Line type="monotone" dataKey="melov" name="Melov 1999 (0.2x defences)" stroke="var(--primary)" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line type="monotone" dataKey="williams" name={`Williams 1998 (${williamsAc}x defences)`} stroke="var(--chart-3, #f59e0b)" dot={false} strokeWidth={2} strokeDasharray="6 3" isAnimationActive={false} />
          <Line type="monotone" dataKey="own" name={`My measurement (${ownAc}x defences)`} stroke="var(--chart-4, #10b981)" dot={false} strokeWidth={2} strokeDasharray="2 2" isAnimationActive={false} />
          {target !== null && <ReferenceLine y={target} stroke="var(--muted-foreground)" strokeDasharray="4 4" />}
          {melovFitted !== null && target !== null && (
            <ReferenceDot x={melovFitted} y={aconitasePct(melovFitted, WEAK_AC)} r={5} fill={inBand(melovFitted) ? "var(--primary)" : "var(--destructive)"} stroke="none" />
          )}
          {williamsFitted !== null && target !== null && (
            <ReferenceDot x={williamsFitted} y={aconitasePct(williamsFitted, williamsAc)} r={5} fill={inBand(williamsFitted) ? "var(--chart-3, #f59e0b)" : "var(--destructive)"} stroke="none" />
          )}
          {ownFitted !== null && target !== null && (
            <ReferenceDot x={ownFitted} y={aconitasePct(ownFitted, ownAc)} r={5} fill={inBand(ownFitted) ? "var(--chart-4, #10b981)" : "var(--destructive)"} stroke="none" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
