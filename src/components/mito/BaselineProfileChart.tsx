import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { profileInputs } from "@/lib/mito/treatment";

type Profile = Parameters<typeof profileInputs>[0];

/** Baseline model ATP, superoxide and H2O2 per profile, as percent of the healthy adult (demo-01 = 100%). */
export function BaselineProfileChart({ profiles }: { profiles: Profile[] }) {
  const rows = useMemo(() => {
    const healthy = simulate(profileInputs(profiles.find((p) => p.id === "demo-01") ?? profiles[0]!), defaultGeometry);
    const pct = (v: number, b: number) => (b ? Math.round((v / b) * 1000) / 10 : 0);
    return profiles.map((p) => {
      const out = simulate(profileInputs(p), defaultGeometry);
      return {
        name: p.label,
        profile: p.phenotype,
        atp: pct(out.atpFlux, healthy.atpFlux),
        superoxide: pct(out.superoxide, healthy.superoxide),
        h2o2: pct(out.hydrogenPeroxide, healthy.hydrogenPeroxide),
      };
    });
  }, [profiles]);

  return <section className="space-y-2 border-y border-border py-4" data-testid="dash-baseline-chart">
    <div>
      <h2 className="text-sm font-semibold">Baseline readouts across profiles (model)</h2>
      <p className="text-xs text-muted-foreground">Model ATP flux, superoxide and H2O2 for every profile before any therapy, as a percent of the healthy adult (demo-01 = 100%). Same numbers as the table. Research model, not a diagnosis.</p>
    </div>
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 48, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <YAxis unit="%" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Tooltip formatter={(v: number) => `${v}% of healthy`} labelFormatter={(l, p) => `${l}${p?.[0] ? ` (${p[0].payload.profile})` : ""}`} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={100} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: "healthy", position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Bar dataKey="atp" name="ATP" fill="var(--chart-1)" />
          <Bar dataKey="superoxide" name="Superoxide" fill="var(--chart-2)" />
          <Bar dataKey="h2o2" name="H2O2" fill="var(--chart-4)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>;
}
