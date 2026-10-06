import { logStrength } from "@/lib/mito/rirrDefault";
import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const RecalibrateCurve = lazy(() => import("./RecalibrateCurve").then((m) => ({ default: m.RecalibrateCurve })));
import { defaultGeometry, defaultInputs, simulate } from "@/lib/mito/model";
import { clearRirrStrength, savedRirrStrength, saveRirrStrength } from "@/lib/mito/rirrDefault";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { clearRuns, recordRun } from "@/lib/mito/runs";
import type { DemoPatient } from "@/lib/mito/patientReference";

const doses = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const WEAK_AC = 0.2; // weakest defences, the Sod2-null stand-in used for the Melov 1999 fit
export const S_MIN = 0;
export const S_MAX = 1.5;

// Fe-S intact at weak defences as % of the healthy adult, for a given strength.
export function aconitasePct(s: number, ac: number = WEAK_AC) {
  const h = simulate(defaultInputs, defaultGeometry).aconitaseActivity;
  const w = simulate({ ...defaultInputs, antioxidantCapacity: ac, rirrStrength: s }, defaultGeometry).aconitaseActivity;
  return (w / h) * 100;
}

// Bisection: aconitase % falls monotonically as strength rises.
// Williams 1998 Sod2+/- drops: MnSOD activity -50%, glutathione -30% (abstract).
// ASSUMED mapping: antioxidant capacity = healthy x (1 - mean of the two drops),
// sodWeight (0-100%) sets SOD's share; default 50 = equal weight. 50% and 30% give 0.6x.
export function williamsCapacity(sodDrop: number, gshDrop: number, sodWeight = 50) {
  const w = Math.min(100, Math.max(0, sodWeight)) / 100;
  const c = defaultInputs.antioxidantCapacity * (1 - (w * sodDrop + (1 - w) * gshDrop) / 100);
  return Math.max(0.05, Math.round(c * 100) / 100);
}

function fitStrength(target: number, ac: number) {
  const aconitasePctAc = (x: number) => aconitasePct(x, ac);
  const hi = aconitasePctAc(S_MIN);
  const lo = aconitasePctAc(S_MAX);
  if (target >= hi) return { s: S_MIN, clamped: true, reach: [lo, hi] as const };
  if (target <= lo) return { s: S_MAX, clamped: true, reach: [lo, hi] as const };
  let a = S_MIN, b = S_MAX;
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (aconitasePctAc(m) > target) a = m; else b = m;
  }
  return { s: Math.round(((a + b) / 2) * 100) / 100, clamped: false, reach: [lo, hi] as const };
}

export function RecalibrateStrength({ pool, onRan }: { pool: DemoPatient[]; onRan?: () => void }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(() => savedRirrStrength());
  const target = Number(raw);
  const valid = raw.trim() !== "" && Number.isFinite(target) && target > 0 && target < 100;
  const [anchor, setAnchor] = useState<"melov" | "williams" | "own">("melov");
  const [ownAcRaw, setOwnAcRaw] = useState("0.6");
  const ownAc = Math.min(2, Math.max(0.05, Number(ownAcRaw) || 0.6));
  const [sodRaw, setSodRaw] = useState("50");
  const [gshRaw, setGshRaw] = useState("30");
  const sod = Math.min(100, Math.max(0, Number(sodRaw) || 0));
  const gsh = Math.min(100, Math.max(0, Number(gshRaw) || 0));
  const [wRaw, setWRaw] = useState(50);
  const ac = anchor === "williams" ? williamsCapacity(sod, gsh, wRaw) : anchor === "own" ? ownAc : WEAK_AC;
  const williamsAc = williamsCapacity(sod, gsh, wRaw);
  const fit = useMemo(() => (valid ? fitStrength(target, ac) : null), [valid, target, ac]);
  // All anchors fitted side by side so the curve can show each against the band.
  const fitMelov = useMemo(() => (valid ? fitStrength(target, WEAK_AC) : null), [valid, target]);
  const fitWilliams = useMemo(() => (valid ? fitStrength(target, williamsAc) : null), [valid, target, williamsAc]);
  const fitOwn = useMemo(() => (valid ? fitStrength(target, ownAc) : null), [valid, target, ownAc]);
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
    setMsg(`Cleared the log and re-ran all ${pool.length} profiles at ${s}x (fitted to ${target}% aconitase at ${ac}x defences): ${n} combinations logged.`);
    logStrength("batch-run", s, `Recalibrate re-run all ${pool.length} profiles (${n} runs)`);
    setBusy(false);
    onRan?.();
  }

  return (
    <section className="space-y-2 rounded-lg border border-border p-4" data-testid="recalibrate">
      <h2 className="text-lg font-medium">Recalibrate ROS-induced strength</h2>
      <p className="text-sm text-muted-foreground">
        Paste the Williams 1998 aconitase activity as % of normal. The helper finds the strength where the model's Fe-S intact % at the weakest defences ({WEAK_AC}x) matches it, the same method as the current Melov 1999 brain fit (1.0x gives {current.toFixed(0)}%). Model estimate, not a clinical value.
      </p>
      <div className="flex flex-wrap items-center gap-3 rounded border border-border p-2 text-sm" data-testid="recal-anchor">
        <span className="font-medium">Defence level the aconitase is read at:</span>
        <label className="flex items-center gap-1">
          <input type="radio" name="recal-anchor" data-testid="recal-anchor-melov" checked={anchor === "melov"} onChange={() => setAnchor("melov")} />
          Weakest ({WEAK_AC}x, Sod2-null stand-in, Melov method)
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" name="recal-anchor" data-testid="recal-anchor-williams" checked={anchor === "williams"} onChange={() => setAnchor("williams")} />
          From Williams 1998 SOD and glutathione drops
        </label>
        {anchor === "williams" && (
          <span className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1">SOD drop %<input data-testid="recal-sod" inputMode="decimal" className="w-14 rounded border border-input bg-background px-1 py-0.5" value={sodRaw} onChange={(e) => setSodRaw(e.target.value)} /></label>
            <label className="flex items-center gap-1">Glutathione drop %<input data-testid="recal-gsh" inputMode="decimal" className="w-14 rounded border border-input bg-background px-1 py-0.5" value={gshRaw} onChange={(e) => setGshRaw(e.target.value)} /></label>
            <label className="flex items-center gap-1">SOD weight<input data-testid="recal-weight" type="range" min={0} max={100} step={5} value={wRaw} onChange={(e) => setWRaw(Number(e.target.value))} /><span>{wRaw}% SOD / {100 - wRaw}% GSH</span></label>
            <span data-testid="recal-ac">Defences: <strong>{ac}x</strong> (ASSUMED: healthy x (1 minus the weighted drop))</span>
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">The SOD and glutathione drops set how weak the defences are; they cannot set the strength alone. The strength is still fitted from aconitase, read at that defence level. Williams 1998 used Sod2+/- mice (half the enzyme), so its aconitase should be read at the Williams level, not the 0.2x Sod2-null level.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Aconitase (% of normal)
          <input data-testid="recal-input" inputMode="decimal" className="w-24 rounded border border-input bg-background px-2 py-1 text-sm" value={raw} onChange={(e) => { setRaw(e.target.value); setMsg(null); }} placeholder="e.g. 45" />
        </label>
        {fit && (
          <span className="text-sm" data-testid="recal-result">
            Fitted strength: <strong>{fit.s}x</strong> (model gives {aconitasePct(fit.s, ac).toFixed(1)}% at {ac}x defences)
            {fit.clamped && <span className="text-destructive"> Outside what the model can reach ({fit.reach[0].toFixed(0)} to {fit.reach[1].toFixed(0)}%), clamped.</span>}
          </span>
        )}
        {raw.trim() !== "" && !valid && <span className="text-sm text-destructive">Enter a number between 0 and 100.</span>}
        <Button size="sm" variant="outline" data-testid="recal-rerun" disabled={!fit || busy} onClick={rerun}>
          Clear log and re-run all {pool.length} at {fit ? `${fit.s}x` : "fitted strength"}
        </Button>
        <Button
          size="sm"
          data-testid="recal-save"
          disabled={!fit || fit.clamped}
          onClick={() => { if (!fit) return; saveRirrStrength(fit.s); setSaved(fit.s); setMsg(`Saved ${fit.s}x as your default strength in this browser. The Simulator uses it from now on.`); }}
        >
          Save as my default
        </Button>
      </div>
      <p className="text-sm" data-testid="recal-saved">
        Your saved default: {saved === null ? "none (Simulator uses 1.0x, the Melov 1999 fit)" : `${saved}x, the Simulator uses it automatically`}
        {saved !== null && (
          <Button size="sm" variant="ghost" className="ml-2" data-testid="recal-clear" onClick={() => { clearRirrStrength(); setSaved(null); setMsg("Cleared your saved default. The Simulator is back to 1.0x."); }}>
            Clear
          </Button>
        )}
      </p>
      <Suspense fallback={<div className="h-56 w-full animate-pulse rounded bg-muted" />}>
        <RecalibrateCurve
          target={valid ? target : null}
          melovFitted={fitMelov && !fitMelov.clamped ? fitMelov.s : null}
          williamsFitted={fitWilliams && !fitWilliams.clamped ? fitWilliams.s : null}
          williamsAc={williamsAc}
        />
      </Suspense>
      <p className="text-xs text-muted-foreground">Both fits side by side: the solid line is the Melov 1999 fit at the weakest defences (0.2x), the dashed line is the Williams 1998 fit at the defence level from its SOD and glutathione drops. The dashed horizontal line is your pasted number and each dot is that fit's strength, green inside your picked band and red outside it.</p>
      {msg && <p className="text-sm" data-testid="recal-msg">{msg}</p>}
      <p className="text-xs text-muted-foreground">The saved default lives in this browser only and changes what the Simulator starts at; it does not re-run or change anything already in the Progress log. The code default stays 1.0x until you send me the number, so I can update the label and the reference score too.</p>
    </section>
  );
}
