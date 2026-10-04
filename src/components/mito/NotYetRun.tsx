import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemoPatient } from "@/lib/mito/patientReference";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { recordRun, type RunRecord } from "@/lib/mito/runs";

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

type LastRun = { therapy: string; dose: number; atp: number; so: number; h2: number; baseAtp: number; baseSo: number; baseH2: number };

// A therapy+dose cell counts as run when any logged run for the profile
// included that therapy at that dose (dose 0 means a sweep across all doses).
export function NotYetRun({ pool, runs, onRan }: { pool: DemoPatient[]; runs: RunRecord[]; onRan?: () => void }) {
  const [pid, setPid] = useState(pool[0]?.id ?? "");
  const [missingOnly, setMissingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LastRun | null>(null);

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

  const nextMissing = useMemo(() => {
    for (const t of therapies) for (const d of doses) if (!done.has(`${t.id}|${d}`)) return { t, d };
    return null;
  }, [done]);

  async function runMissing() {
    const p = pool.find((x) => x.id === pid);
    if (!p || !nextMissing) return;
    setBusy(true);
    const base = profileInputs(p);
    const b = simulate(base, defaultGeometry);
    const o = simulate(applyTherapyDose(base, nextMissing.t, nextMissing.d), defaultGeometry);
    await recordRun(p.id, "progress", nextMissing.d, [nextMissing.t.id]);
    setLast({ therapy: nextMissing.t.name, dose: nextMissing.d, atp: o.atpFlux, so: o.superoxide, h2: o.hydrogenPeroxide, baseAtp: b.atpFlux, baseSo: b.superoxide, baseH2: b.hydrogenPeroxide });
    setBusy(false);
    onRan?.();
  }

  const pct = (a: number, b: number) => (b === 0 ? "n/a" : `${(((a - b) / b) * 100).toFixed(1)}%`);

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="not-yet-run">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-medium">Not yet run</h2>
        <select aria-label="Profile" className="rounded border border-input bg-background px-2 py-1 text-sm" value={pid} onChange={(e) => { setPid(e.target.value); setLast(null); }}>
          {pool.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} /> Hide fully run therapies</label>
        <span className="text-sm text-muted-foreground" data-testid="not-yet-run-count">{missing} of {total} therapy and dose combinations missing</span>
        <Button size="sm" data-testid="run-missing" disabled={!nextMissing || busy} onClick={runMissing}>
          <Play className="size-4" aria-hidden /> {nextMissing ? `Run missing: ${nextMissing.t.name} at ${nextMissing.d}x` : "All run"}
        </Button>
      </div>
      {last && (
        <p className="text-sm" data-testid="run-missing-result">
          Ran {last.therapy} at {last.dose}x: ATP {last.atp.toFixed(1)} µM/s ({pct(last.atp, last.baseAtp)}), superoxide {last.so.toFixed(4)} nM ({pct(last.so, last.baseSo)}), peroxide {last.h2.toFixed(1)} nM ({pct(last.h2, last.baseH2)}) vs no therapy. Logged.
        </p>
      )}
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
      <p className="text-xs text-muted-foreground">✓ run at that model dose (any page), ○ not yet run. Dashboard sweeps across all doses count for every dose. Run missing simulates the first ○ cell with the real model and logs it.</p>
    </section>
  );
}
