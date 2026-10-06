// Pick a strength range and see where each profile's effective ROS-induced
// strength (its own override, else the saved default, else 1.0x) falls.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { clearRuns, recordRun } from "@/lib/mito/runs";
import { Slider } from "@/components/ui/slider";
import { logStrength, savedRirrStrength, useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";
import { useStrengthRange } from "@/lib/mito/rangeState";
import type { DemoPatient } from "@/lib/mito/patientReference";

const MODEL_DEFAULT = 1.0; // model's built-in ROS-induced strength when nothing is saved

const DOSES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function StrengthRange({ pool, onRan }: { pool: DemoPatient[]; onRan?: () => void }) {
  const saved = useSavedRirr();
  const [overrides, setOverride] = useProfileRirr();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [{ lo, hi }, setRange] = useStrengthRange();
  // Preview of the pending snap (which profiles move, and to what), and the
  // previous overrides kept after a snap so it can be undone.
  const [preview, setPreview] = useState<{ id: string; label: string; from: number; to: number }[] | null>(null);
  const [lastSnap, setLastSnap] = useState<Record<string, number | null> | null>(null);

  const effective = (id: string) => overrides[id] ?? saved ?? savedRirrStrength() ?? MODEL_DEFAULT;
  const source = (id: string) => (overrides[id] != null ? "profile's own" : saved != null ? "saved default" : "model default");

  const rows = pool.map((p) => {
    const s = effective(p.id);
    return { p, s, src: source(p.id), inside: s >= lo && s <= hi };
  });
  const inCount = rows.filter((r) => r.inside).length;
  const outside = rows.filter((r) => !r.inside);

  const snapTarget = (s: number) => (Math.abs(s - lo) <= Math.abs(s - hi) ? lo : hi);

  // First click only previews: list each outside profile with its current
  // effective strength and the edge it would snap to. Confirm applies it.
  function previewSnap() {
    setPreview(outside.map((r) => ({ id: r.p.id, label: r.p.label, from: r.s, to: snapTarget(r.s) })));
    setMsg(null);
  }

  // Snap every outside profile to its nearest range edge (saved as the
  // profile's own strength), then clear the run log and re-run all profiles at
  // their effective strengths so the history and Progress grid reflect it.
  async function snapAndRerun() {
    if (!preview) return;
    setBusy(true);
    setMsg(null);
    // Keep each moving profile's previous override (null = followed default)
    // so Undo can restore exactly what was there before.
    const prev: Record<string, number | null> = {};
    for (const m of preview) prev[m.id] = overrides[m.id] ?? null;
    const eff: Record<string, number> = {};
    for (const r of rows) {
      const v = r.inside ? r.s : snapTarget(r.s);
      if (!r.inside) setOverride(r.p.id, v);
      eff[r.p.id] = v;
    }
    setLastSnap(prev);
    setPreview(null);
    await clearRuns();
    let n = 0;
    for (const p of pool) {
      const s = eff[p.id] ?? MODEL_DEFAULT;
      const base = { ...profileInputs(p), rirrStrength: s };
      for (const t of therapies) for (const d of DOSES) {
        simulate(applyTherapyDose(base, t, d), defaultGeometry);
        await recordRun(p.id, "progress", d, [t.id], s);
        n++;
      }
      setMsg(`Re-running: ${p.label} (${n} runs)...`);
    }
    logStrength("batch-run", null, `Snap to range ${lo.toFixed(2)}x-${hi.toFixed(2)}x and re-run all ${pool.length} profiles (${preview.length} snapped, ${n} runs)`);
    setMsg(`Snapped ${preview.length} profile(s) to the range edges and re-ran all ${pool.length} profiles: ${n} runs logged.`);
    setBusy(false);
    onRan?.();
  }

  // Restore the overrides as they were before the last snap. The Progress
  // grid is not rebuilt here; use Clear log and re-run to match it again.
  function undoSnap() {
    if (!lastSnap) return;
    for (const [id, v] of Object.entries(lastSnap)) setOverride(id, v);
    logStrength("batch-run", null, `Undo snap: restored ${Object.keys(lastSnap).length} profile strength(s) to pre-snap values`);
    setLastSnap(null);
    setMsg(`Undid the snap for ${Object.keys(lastSnap).length} profile(s). Re-run the batch to rebuild the Progress grid at the restored strengths.`);
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
onValueChange={(v) => setRange(Math.min(v[0] ?? lo, hi), hi)} />
        </div>
        <div>
          <div className="text-xs">Range high: <span className="font-mono" data-testid="sr-hi">{hi.toFixed(2)}x</span></div>
          <Slider aria-label="Range high" className="mt-2" min={0} max={1.5} step={0.05} value={[hi]}
onValueChange={(v) => setRange(lo, Math.max(v[0] ?? hi, lo))} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          data-testid="sr-reset"
          disabled={lo === 0.5 && hi === 1.0}
          onClick={() => { setRange(0.5, 1.0); setMsg("Range reset to 0.50x-1.00x. Profile strengths are unchanged; use the snap if you want to move them."); }}
        >
          Reset range to 0.5x-1.0x
        </Button>
        {(lo !== 0.5 || hi !== 1.0) && (
          <span className="text-xs text-muted-foreground">Band differs from the default 0.50x-1.00x.</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground" data-testid="sr-count">{inCount} of {rows.length} profiles inside {lo.toFixed(2)}x to {hi.toFixed(2)}x.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" data-testid="sr-snap" disabled={busy || outside.length === 0} onClick={previewSnap}>
          Preview snap of {outside.length} outside to nearest edge
        </Button>
        {lastSnap && (
          <Button size="sm" variant="ghost" data-testid="sr-undo" disabled={busy} onClick={undoSnap}>
            Undo snap ({Object.keys(lastSnap).length} profile{Object.keys(lastSnap).length === 1 ? "" : "s"})
          </Button>
        )}
        {msg && <span className="text-xs text-muted-foreground" data-testid="sr-msg">{msg}</span>}
      </div>
      {preview && (
        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3" data-testid="sr-preview">
          <p className="text-xs font-medium">
            Snap preview: {preview.length} profile{preview.length === 1 ? "" : "s"} will move to the nearest edge of {lo.toFixed(2)}x to {hi.toFixed(2)}x. Confirming clears the run log and re-runs all {pool.length} profiles at their own strengths.
          </p>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground">
              <th className="py-1 font-normal">Profile</th>
              <th className="font-normal">Current</th>
              <th className="font-normal">After snap</th>
            </tr></thead>
            <tbody>{preview.map((m) => (
              <tr key={m.id} className="border-t border-border" data-testid="sr-preview-row">
                <td className="py-1 pr-2">{m.label}</td>
                <td className="pr-2 font-mono">{m.from.toFixed(2)}x</td>
                <td className="font-mono text-destructive">{m.to.toFixed(2)}x</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" data-testid="sr-confirm" disabled={busy} onClick={snapAndRerun}>
              Confirm snap and re-run all {pool.length}
            </Button>
            <Button size="sm" variant="ghost" data-testid="sr-cancel" disabled={busy} onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
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
