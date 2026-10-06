// Progress tracker for the snap schedule: status counts, band count now vs
// after all planned snaps, and a date strip of every snap colored by band.
import { snapStatus, type PlannedSnap } from "@/lib/mito/snapPlan";
import type { ProfileRow } from "./SnapPlanPicker";

export function SnapPlanProgress({ plan, rows, lo, hi }: { plan: PlannedSnap[]; rows: ProfileRow[]; lo: number; hi: number }) {
  const st = plan.map((s) => snapStatus(s));
  const done = st.filter((x) => x === "Done").length;
  const overdue = st.filter((x) => x === "Overdue").length;
  const due = st.filter((x) => x === "Due today").length;
  const planned = st.filter((x) => x === "Planned").length;
  const active = plan.filter((s) => s.status !== "skipped").length;
  const pctDone = active ? Math.round((done / active) * 100) : 0;

  const inBand = (v: number) => v >= lo - 1e-9 && v <= hi + 1e-9;
  const nowIn = rows.filter((r) => r.inside).length;
  const after: Record<string, number> = Object.fromEntries(rows.map((r) => [r.id, r.s]));
  for (const s of [...plan].filter((x) => x.status === "planned").sort((a, b) => a.date.localeCompare(b.date))) after[s.profileId] = s.to;
  const afterIn = Object.values(after).filter(inBand).length;

  const dated = [...plan].filter((s) => s.status !== "skipped").sort((a, b) => a.date.localeCompare(b.date));
  const t = (d: string) => new Date(d + "T00:00:00").getTime();
  const t0 = dated.length ? t(dated[0]!.date) : 0;
  const t1 = dated.length ? t(dated[dated.length - 1]!.date) : 1;
  const W = 600;
  const x = (d: string) => 20 + (t1 === t0 ? (W - 40) / 2 : ((t(d) - t0) / (t1 - t0)) * (W - 40));

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="snap-progress">
      <h2 className="text-lg font-medium">Progress</h2>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pctDone}%` }} />
      </div>
      <p className="text-sm" data-testid="snap-progress-count">
        {done} of {active} snaps done ({pctDone}%): {planned} planned, {due} due today, <span className={overdue ? "text-destructive" : ""}>{overdue} overdue</span>.
      </p>
      <p className="text-sm" data-testid="snap-band-count">
        Profiles inside {lo.toFixed(2)}x-{hi.toFixed(2)}x: {nowIn} of {rows.length} now, {afterIn} of {rows.length} after all planned snaps.
      </p>
      {dated.length > 0 && (
        <svg viewBox={`0 0 ${W} 60`} className="w-full" role="img" aria-label="Snap dates">
          <line x1={20} x2={W - 20} y1={30} y2={30} className="stroke-border" />
          {dated.map((s, i) => (
            <g key={s.id}>
              <circle cx={x(s.date)} cy={30} r={s.status === "done" ? 6 : 5}
                className={inBand(s.to) ? "fill-primary" : "fill-destructive"}
                fillOpacity={s.status === "done" ? 1 : 0.4}>
                <title>{`${s.date} ${s.label}: ${s.from.toFixed(2)}x to ${s.to.toFixed(2)}x (${snapStatus(s)})`}</title>
              </circle>
              {(i === 0 || dated[i - 1]!.date !== s.date) && (
                <text x={x(s.date)} y={54} textAnchor="middle" className="fill-muted-foreground text-[10px]">{s.date.slice(5)}</text>
              )}
            </g>
          ))}
        </svg>
      )}
      <p className="text-xs text-muted-foreground">Dots: filled = done, faded = not yet; green = target inside band, red = outside.</p>
    </section>
  );
}
