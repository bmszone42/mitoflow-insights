import { useMemo, useState } from "react";
import type { DemoPatient } from "@/lib/mito/patientReference";
import { therapies } from "@/lib/mito/treatment";
import type { RunRecord } from "@/lib/mito/runs";

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// A therapy+dose cell counts as run when any logged run for the profile
// included that therapy at that dose (dose 0 means a sweep across all doses).
export function NotYetRun({ pool, runs }: { pool: DemoPatient[]; runs: RunRecord[] }) {
  const [pid, setPid] = useState(pool[0]?.id ?? "");
  const [missingOnly, setMissingOnly] = useState(false);

  const done = useMemo(() => {
    const s = new Set<string>();
    for (const r of runs) {
      if (r.patientId !== pid) continue;
      for (const t of r.therapyIds) {
        if (r.dose === 0) doses.forEach((d) => s.add(`${t}|${d}`));
        else s.add(`${t}|${r.dose}`);
      }
    }
    return s;
  }, [runs, pid]);

  const total = therapies.length * doses.length;
  const missing = total - [...done].filter((k) => doses.includes(Number(k.split("|")[1])) && therapies.some((t) => k.startsWith(`${t.id}|`))).length;
  const rows = therapies.filter((t) => !missingOnly || doses.some((d) => !done.has(`${t.id}|${d}`)));

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="not-yet-run">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-medium">Not yet run</h2>
        <select aria-label="Profile" className="rounded border border-input bg-background px-2 py-1 text-sm" value={pid} onChange={(e) => setPid(e.target.value)}>
          {pool.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} /> Hide fully run therapies</label>
        <span className="text-sm text-muted-foreground" data-testid="not-yet-run-count">{missing} of {total} therapy and dose combinations missing</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-normal">Therapy</th>
            {doses.map((d) => <th key={d} className="px-1 text-center font-normal">{d}x</th>)}
          </tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="py-1 pr-2">{t.name}</td>
              {doses.map((d) => {
                const ok = done.has(`${t.id}|${d}`);
                return <td key={d} className="px-1 text-center" data-testid={ok ? "nyr-done" : "nyr-missing"}>
                  <span className={ok ? "text-primary" : "text-destructive"} title={ok ? "Run" : "Not yet run"}>{ok ? "✓" : "○"}</span>
                </td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">✓ run at that model dose (any page), ○ not yet run. Dashboard sweeps across all doses count for every dose.</p>
    </section>
  );
}
