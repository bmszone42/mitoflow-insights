import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultGeometry, defaultInputs, simulate } from "@/lib/mito/model";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { clearRuns, recordRun } from "@/lib/mito/runs";
import type { DemoPatient } from "@/lib/mito/patientReference";

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const WEAK_AC = 0.2; // weakest defences, the Sod2-null stand-in used for the Melov 1999 fit
const S_MIN = 0;
const S_MAX = 1.5;

// Fe-S intact at weak defences as % of the healthy adult, for a given strength.
function aconitasePct(s: number) {
  const h = simulate(defaultInputs, defaultGeometry).aconitaseActivity;
  const w = simulate({ ...defaultInputs, antioxidantCapacity: WEAK_AC, rirrStrength: s }, defaultGeometry).aconitaseActivity;
  return (w / h) * 100;
}

// Bisection: aconitase % falls monotonically as strength rises.
function fitStrength(target: number) {
  const hi = aconitasePct(S_MIN);
  const lo = aconitasePct(S_MAX);
  if (target >= hi) return { s: S_MIN, clamped: true, reach: [lo, hi] as const };
  if (target <= lo) return { s: S_MAX, clamped: true, reach: [lo, hi] as const };
  let a = S_MIN, b = S_MAX;
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (aconitasePct(m) > target) a = m; else b = m;
  }
  return { s: Math.round(((a + b) / 2) * 100) / 100, clamped: false, reach: [lo, hi] as const };
}

export function RecalibrateStrength({ pool, onRan }: { pool: DemoPatient[]; onRan?: () => void }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const target = Number(raw);
  const valid = raw.trim() !== "" && Number.isFinite(target) && target > 0 && target < 100;
  const fit = useMemo(() => (valid ? fitStrength(target) : null), [valid, target]);
  const current = useMemo(() => aconitasePct(defaultInputs.rirrStrength), []);

  async function rerun() {
    if (!fit) return;
    const s = fit.s;
    const n0 = pool.length * therapies.length * doses.length;
    if (!window.confirm(`Clear the whole run log and re-run all ${pool.length} profiles at the fitted ${s}x strength? This logs ${n0} runs.`)) return;
    setBusy(true);
    await clearRuns();
    let n = 0;
    for (const prof of pool) {
      const base = { ...profileInputs(prof), rirrStrength: s };
      for (const t of therapies) for (const d of doses) {
        simulate(applyTherapyDose(base, t, d), defaultGeometry);
        await recordRun(prof.id, "progress", d, [t.id], s);
        n++;
      }
      setMsg(`Re-running: ${prof.label} (${n} of ${n0})...`);
    }
    setMsg(`Cleared the log and re-ran all ${pool.length} profiles at ${s}x (fitted to ${target}% aconitase): ${n} combinations logged.`);
    setBusy(false);
    onRan?.();
  }

  return (
    <section className="space-y-2 rounded-lg border border-border p-4" data-testid="recalibrate">
      <h2 className="text-lg font-medium">Recalibrate ROS-induced strength</h2>
      <p className="text-sm text-muted-foreground">
        Paste the Williams 1998 aconitase activity as % of normal. The helper finds the strength where the model's Fe-S intact % at the weakest defences ({WEAK_AC}x) matches it, the same method as the current Melov 1999 brain fit (1.0x gives {current.toFixed(0)}%). Model estimate, not a clinical value.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Aconitase (% of normal)
          <input data-testid="recal-input" inputMode="decimal" className="w-24 rounded border border-input bg-background px-2 py-1 text-sm" value={raw} onChange={(e) => { setRaw(e.target.value); setMsg(null); }} placeholder="e.g. 45" />
        </label>
        {fit && (
          <span className="text-sm" data-testid="recal-result">
            Fitted strength: <strong>{fit.s}x</strong> (model gives {aconitasePct(fit.s).toFixed(1)}%)
            {fit.clamped && <span className="text-destructive"> Outside what the model can reach ({fit.reach[0].toFixed(0)} to {fit.reach[1].toFixed(0)}%), clamped.</span>}
          </span>
        )}
        {raw.trim() !== "" && !valid && <span className="text-sm text-destructive">Enter a number between 0 and 100.</span>}
        <Button size="sm" variant="outline" data-testid="recal-rerun" disabled={!fit || busy} onClick={rerun}>
          Clear log and re-run all {pool.length} at {fit ? `${fit.s}x` : "fitted strength"}
        </Button>
      </div>
      {msg && <p className="text-sm" data-testid="recal-msg">{msg}</p>}
      <p className="text-xs text-muted-foreground">The Simulator default stays 1.0x until you send me the number, so I can update the label and the reference score too.</p>
    </section>
  );
}
