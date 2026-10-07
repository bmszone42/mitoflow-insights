import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CarrierSweepChart({ data, at }: { data: { r: number; atp: number; so: number }[]; at: { r: number; atp: number } }) {
  return (
    <div className="h-64 w-full" data-testid="carrier-chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="r" tickFormatter={(v) => `${v}x`} fontSize={11} />
          <YAxis yAxisId="a" fontSize={11} />
          <YAxis yAxisId="s" orientation="right" fontSize={11} />
          <Tooltip formatter={(v: any) => v.toFixed(2)} labelFormatter={(v) => `${v}x`} />
          <Line yAxisId="a" type="monotone" dataKey="atp" name="ATP flux (µM/s)" stroke="var(--primary)" dot={false} />
          <Line yAxisId="s" type="monotone" dataKey="so" name="Superoxide (nM)" stroke="var(--destructive)" dot={false} />
          <ReferenceDot yAxisId="a" x={at.r} y={at.atp} r={5} fill="var(--primary)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
