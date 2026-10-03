import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { applyTherapyDose, metrics, profileInputs, therapies } from "@/lib/mito/treatment";

type Profile = Parameters<typeof profileInputs>[0];

/** Percent change in model ATP, superoxide and H2O2 for one therapy at a model dose, per flagged profile. Slider move, never a drug dose. */
export function TherapyProfileChart({ profiles, dose, flaggedIds }: { profiles: Profile[]; dose: number; flaggedIds: string[] }) {
  // Therapies that move a readout by at least 1% in any flagged profile.
  const data = useMemo(() => {
    const flagged = profiles.filter((p) => flaggedIds.includes(p.id));
    const byTherapy = new Map<string, { name: string; profile: string; atp: number; superoxide: number; h2o2: number }[]>();
    for (const t of therapies) {
      const rows = flagged.map((p) => {
        const base = profileInputs(p);
        const b = metrics(base), a = metrics(applyTherapyDose(base, t, dose));
        const ch = (x: number, y: number) => (x ? Math.round((y / x - 1) * 1000) / 10 : 0);
        return { name: p.label, profile: p.phenotype, atp: ch(b.atp, a.atp), superoxide: ch(b.superoxide, a.superoxide), h2o2: ch(b.h2o2, a.h2o2) };
      });
      if (rows.some((r) => Math.abs(r.atp) >= 1 || Math.abs(r.superoxide) >= 1 || Math.abs(r.h2o2) >= 1)) byTherapy.set(t.id, rows);
    }
    return byTherapy;
  }, [profiles, flaggedIds, dose]);
  const options = therapies.filter((t) => data.has(t.id));
  const [pick, setPick] = useState<string | null>(null);
  const id = pick && data.has(pick) ? pick : options[0]?.id;
  const rows = id ? data.get(id)! : [];

  return <section className="space-y-2 border-y border-border py-4" data-testid="dash-therapy-chart">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold">Therapy effect across flagged profiles (model, {dose}x)</h2>
        <p className="text-xs text-muted-foreground">Percent change in model ATP flux, superoxide and H2O2 from each flagged profile's own baseline. Only therapies that move a readout by at least 1% somewhere are listed. Model slider move, not a drug dose or efficacy claim.</p>
      </div>
      <label className="flex items-center gap-2 text-xs">Therapy
        <select value={id ?? ""} onChange={(e) => setPick(e.target.value)} data-testid="dash-chart-therapy" className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">
          {options.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
    </div>
    {rows.length ? <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 48, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <YAxis unit="%" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Tooltip formatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`} labelFormatter={(l, p) => `${l}${p?.[0] ? ` (${p[0].payload.profile})` : ""}`} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          <Bar dataKey="atp" name="ATP" fill="var(--chart-1)" />
          <Bar dataKey="superoxide" name="Superoxide" fill="var(--chart-2)" />
          <Bar dataKey="h2o2" name="H2O2" fill="var(--chart-4)" />
        </BarChart>
      </ResponsiveContainer>
    </div> : <p className="text-xs text-muted-foreground">No therapy moves a readout at this dose.</p>}
  </section>;
}
