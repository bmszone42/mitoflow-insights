import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoPatients, type DemoPatient } from "@/lib/mito/patientReference";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { recordRun, type RunRecord } from "@/lib/mito/runs";
import { realDoseFor, realDoseToModel } from "@/lib/mito/realDoses";

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

type LastRun = { therapy: string; dose: number; atp: number; so: number; h2: number; baseAtp: number; baseSo: number; baseH2: number };

// A therapy+dose cell counts as run when any logged run for the profile
// included that therapy at that dose (dose 0 means a sweep across all doses).
export function NotYetRun({ pool, runs, onRan }: { pool: DemoPatient[]; runs: RunRecord[]; onRan?: () => void }) {
  const [pid, setPid] = useState(pool[0]?.id ?? "");
  const [missingOnly, setMissingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LastRun | null>(null);
  const [real, setReal] = useState<Record<string, number>>({});

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

  // ROS-induced ROS release strengths logged for this profile's runs (assumed setting).
  const strengths = useMemo(() => {
    const s = new Set<number>();
    for (const r of runs) if (r.patientId === pid && r.rirrStrength != null) s.add(r.rirrStrength);
    return [...s].sort((a, b) => a - b);
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
    await recordRun(p.id, "progress", nextMissing.d, [nextMissing.t.id], base.rirrStrength);
    setLast({ therapy: nextMissing.t.name, dose: nextMissing.d, atp: o.atpFlux, so: o.superoxide, h2: o.hydrogenPeroxide, baseAtp: b.atpFlux, baseSo: b.superoxide, baseH2: b.hydrogenPeroxide });
    setBusy(false);
    onRan?.();
  }

  const profile = pool.find((x) => x.id === pid);
  const base = profile ? profileInputs(profile) : null;
  const baseOut = useMemo(() => (base ? simulate(base, defaultGeometry) : null), [pid]); // eslint-disable-line react-hooks/exhaustive-deps
  const healthySo = useMemo(() => {
    const h = demoPatients.find((x) => x.id === "demo-01");
    return h ? simulate(profileInputs(h), defaultGeometry).superoxide : 0;
  }, []);

  async function runReal(id: string, drug: string, val: number, unit: string, md: number, soPct: number) {
    if (!profile || !base) return;
    setBusy(true);
    await recordRun(profile.id, "progress", Math.round(md * 100) / 100, [id], base.rirrStrength, { realDose: `${val} ${unit} ${drug}`, soChangePct: soPct });
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
        {strengths.length > 0 && (
          <span className="text-sm text-muted-foreground" data-testid="not-yet-run-rirr">
            ROS-induced strength logged: {strengths.map((s) => `${s}x`).join(", ")} (assumed)
          </span>
        )}
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
            <th className="px-2 font-normal">Real dose (from trials, effect size assumed)</th>
          </tr></thead>
          <tbody>{rows.map((t) => {
            const rd = realDoseFor(t.id);
            const val = rd ? (real[t.id] ?? rd.max) : 0;
            const md = rd ? realDoseToModel(rd, val) : 0;
            const so = rd && baseOut && base ? simulate(applyTherapyDose(base, t, md), defaultGeometry).superoxide : 0;
            const soPct = baseOut && baseOut.superoxide ? ((so - baseOut.superoxide) / baseOut.superoxide) * 100 : 0;
            return (
            <tr key={t.id} className="border-t border-border">
              <td className="py-1 pr-2">{t.name}</td>
              {doses.map((d) => {
                const ok = done.has(`${t.id}|${d}`);
                return <td key={d} className="px-1 text-center" data-testid={ok ? "nyr-done" : "nyr-missing"}>
                  <span className={ok ? "text-primary" : "text-destructive"} title={ok ? "Run" : "Not yet run"}>{ok ? "✓" : "○"}</span>
                </td>;
              })}
              <td className="px-2 py-1">
                {rd ? (
                  <div className="flex min-w-72 flex-wrap items-center gap-2" data-testid="nyr-real-dose">
                    <input type="range" aria-label={`${t.name} real dose`} min={0} max={rd.max * 2} step={rd.step} value={val} onChange={(e) => setReal((r) => ({ ...r, [t.id]: Number(e.target.value) }))} className="w-28" />
                    <span>{val} {rd.unit} {rd.drug}</span>
                    <span className="text-muted-foreground">= {md.toFixed(2)}x</span>
                    <span className={soPct < 0 ? "text-primary" : soPct > 0 ? "text-destructive" : "text-muted-foreground"} data-testid="nyr-so-pct">SO {soPct.toFixed(1)}%</span>
                    <span className={so > healthySo ? "text-destructive" : "text-muted-foreground"}>{so.toFixed(4)} nM</span>
                    {t.doseSource && <a href={t.doseSource.url} target="_blank" rel="noreferrer" className="text-xs underline">source</a>}
                    <Button size="sm" variant="outline" disabled={busy} data-testid="nyr-run-real" onClick={() => runReal(t.id, rd.drug, val, rd.unit, md, soPct)}>Run</Button>
                  </div>
                ) : <span className="text-xs text-muted-foreground">No numeric clinical dose</span>}
              </td>
            </tr>
          ); })}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">✓ run at that model dose (any page), ○ not yet run. Dashboard sweeps across all doses count for every dose. Run missing simulates the first ○ cell with the real model and logs it. Real-dose sliders: doses come from published trials or labels; the mapping is assumed (top of the published range = 1x model dose, linear, capped at 2x). SO is superoxide vs no therapy; red nM sits above the healthy adult ({healthySo.toFixed(4)} nM). Model estimates, not dosing advice.</p>
    </section>
  );
}
