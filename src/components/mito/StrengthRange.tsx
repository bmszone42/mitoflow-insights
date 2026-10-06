// Pick a strength range and see where each profile's effective ROS-induced
// strength (its own override, else the saved default, else 1.0x) falls.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { clearRuns, recordRun } from "@/lib/mito/runs";
import { Slider } from "@/components/ui/slider";
import { logStrength, savedRirrStrength, useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";
import type { DemoPatient } from "@/lib/mito/patientReference";

const MODEL_DEFAULT = 1.0; // model's built-in ROS-induced strength when nothing is saved

const DOSES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function StrengthRange({ pool, onRan }: { pool: DemoPatient[]; onRan?: () => void }) {
  const saved = useSavedRirr();
  const [overrides, setOverride] = useProfileRirr();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lo, setLo] = useState(0.5);
  const [hi, setHi] = useState(1.0);

  const effective = (id: string) => overrides[id] ?? saved ?? savedRirrStrength() ?? MODEL_DEFAULT;
  const source = (id: string) => (overrides[id] != null ? "profile's own" : saved != null ? "saved default" : "model default");

  const rows = pool.map((p) => {
    const s = effective(p.id);
    return { p, s, src: source(p.id), inside: s >= lo && s <= hi };
  });
  const inCount = rows.filter((r) => r.inside).length;
  const outside = rows.filter((r) => !r.inside);

  // Snap every outside profile to its nearest range edge (saved as the
  // profile's own strength), then clear the run log and re-run all profiles at
  // their effective strengths so the history and Progress grid reflect it.
  async function snapAndRerun() {
    if (!window.confirm(`Set ${outside.length} outside profile(s) to the nearest edge of ${lo.toFixed(2)}x to ${hi.toFixed(2)}x, then clear the run log and re-run all ${pool.length} profiles at their own strengths?`)) return;
    setBusy(true);
    setMsg(null);
    const eff: Record<string, number> = {};
    for (const r of rows) {
      const v = r.inside ? r.s : Math.abs(r.s - lo) <= Math.abs(r.s - hi) ? lo : hi;
      if (!r.inside) setOverride(r.p.id, v);
      eff[r.p.id] = v;
    }
    await clearRuns();
    let n = 0;
    for (const p of pool) {
      const s = eff[p.id];
      const base = { ...profileInputs(p), rirrStrength: s };
      for (const t of therapies) for (const d of DOSES) {
        simulate(applyTherapyDose(base, t, d), defaultGeometry);
        await recordRun(p.id, "progress", d, [t.id], s);
        n++;
      }
      setMsg(`Re-running: ${p.label} (${n} runs)...`);
    }
    logStrength("batch-run", null as unknown as number, `Snap to range ${lo.toFixed(2)}x-${hi.toFixed(2)}x and re-run all ${pool.length} profiles (${outside.length} snapped, ${n} runs)`);
    setMsg(`Snapped ${outside.length} profile(s) to the range edges and re-ran all ${pool.length} profiles: ${n} runs logged.`);
    setBusy(false);
    onRan?.();
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="strength-range">
      <div>
        <h2 className="text-lg font-medium">Strength range check</h2>
        <p className="text-sm text-muted-foreground">
          Pick a range and see where each profile's effective ROS-induced strength falls. Effective means the profile's own strength when set, else your saved default, else the 1.0x model default.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs">Range low: <span className="font-mono" data-testid="sr-lo">{lo.toFixed(2)}x</span></div>
          <Slider aria-label="Range low" className="mt-2" min={0} max={1.5} step={0.05} value={[lo]}
            onValueChange={(v) => setLo(Math.min(v[0] ?? lo, hi))} />
        </div>
        <div>
          <div className="text-xs">Range high: <span className="font-mono" data-testid="sr-hi">{hi.toFixed(2)}x</span></div>
          <Slider aria-label="Range high" className="mt-2" min={0} max={1.5} step={0.05} value={[hi]}
            onValueChange={(v) => setHi(Math.max(v[0] ?? hi, lo))} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground" data-testid="sr-count">{inCount} of {rows.length} profiles inside {lo.toFixed(2)}x to {hi.toFixed(2)}x.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" data-testid="sr-snap" disabled={busy || outside.length === 0} onClick={snapAndRerun}>
          Snap {outside.length} outside to nearest edge and re-run all {pool.length}
        </Button>
        {msg && <span className="text-xs text-muted-foreground" data-testid="sr-msg">{msg}</span>}
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground">
          <th className="py-1 font-normal">Profile</th>
          <th className="font-normal">Effective strength</th>
          <th className="font-normal">Source</th>
          <th className="font-normal">In range</th>
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.p.id} className="border-t border-border" data-testid="sr-row">
            <td className="py-1 pr-2">{r.p.label}</td>
            <td className="pr-2 font-mono">{r.s.toFixed(2)}x</td>
            <td className="pr-2 text-muted-foreground">{r.src}</td>
            <td className={r.inside ? "text-primary" : "text-destructive"} data-testid="sr-inside">{r.inside ? "inside" : "outside"}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}
