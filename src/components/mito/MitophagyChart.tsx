import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MitophagyChart({ data, at, healthySo }: { data: { r: number; atp: number; so: number }[]; at: { r: number; atp: number }; healthySo: number }) {
  return (
    <div className="h-56 w-full" data-testid="mitophagy-chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="r" tickFormatter={(v) => `${v}mg`} fontSize={11} />
          <YAxis yAxisId="a" fontSize={11} />
          <YAxis yAxisId="s" orientation="right" fontSize={11} />
          <Tooltip formatter={(v: any) => v.toFixed(4)} labelFormatter={(v) => `${v} mg/day`} />
          <Line yAxisId="a" type="monotone" dataKey="atp" name="ATP flux (µM/s)" stroke="var(--primary)" dot={false} />
          <Line yAxisId="s" type="monotone" dataKey="so" name="Superoxide (nM)" stroke="var(--destructive)" dot={false} />
          <ReferenceDot yAxisId="a" x={at.r} y={at.atp} r={5} fill="var(--primary)" />
          <ReferenceLine yAxisId="s" y={healthySo} stroke="var(--muted-foreground)" strokeDasharray="4 4"
            label={{ value: `healthy ${healthySo.toFixed(3)} nM`, position: "insideTopRight", fontSize: 9, fill: "var(--muted-foreground)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
