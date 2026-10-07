import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { profileSensKeys, shortLabel } from "@/lib/mito/profileSensitivity";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function ProfileSensitivityChart({ data, healthy }: { data: Record<string, number>[]; healthy: number }) {
  return (
    <div className="h-72" data-testid="profile-sens-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="x" type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: "Position in setting's range", position: "insideBottom", offset: -8, fontSize: 11 }} fontSize={11} />
          <YAxis fontSize={11} tickFormatter={(v) => Number(v).toFixed(3)} label={{ value: "Superoxide nM", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(4)} nM`} labelFormatter={(v) => `${Number(v).toFixed(0)}% of range`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={healthy} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: "healthy", fontSize: 10, position: "right" }} />
          {profileSensKeys.map((k, i) => (
            <Line key={k} dataKey={k} name={shortLabel[k]} stroke={colors[i] ?? "var(--primary)"} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
