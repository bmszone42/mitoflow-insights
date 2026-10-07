import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { demoPatients, type DemoPatient } from "@/lib/mito/patientReference";
import { therapies } from "@/lib/mito/treatment";
import { addVisit } from "@/lib/mito/timeline";
import { recordRun } from "@/lib/mito/runs";
import { setStrengthRange } from "@/lib/mito/rangeState";
import { logStrength } from "@/lib/mito/rirrDefault";
import { fitStrength } from "./RecalibrateStrength";
import { addSnaps } from "@/lib/mito/snapPlan";
import { useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";

// Aconitase-to-strength fit for pasted lines reads at 0.6x defences (the
// Williams-style moderate level): the 0.2x Sod2-null stand-in cannot reach
// high aconitase percentages and would clamp every mild reading to 0x.
const PASTE_FIT_AC = 0.6;

// Paste-your-measurements panel on the Progress page. One line per entry:
//   date, therapy name, dose x, aconitase %, superoxide (MitoSOX), [strength x]
// e.g. 2026-09-14, iron chelation, 1, 72, 1.4
// On apply: each line becomes a real Timeline visit (measured MitoSOX filled
// in, other labs from the profile) and a logged run; the band sliders move to
// the min and max of the strengths found in the data (pasted strength per line
// wins, otherwise the strength fitted from that line's aconitase).

type Parsed = {
  date: string;
  therapyId: string;
  therapyName: string;
  dose: number;
  aconitase: number | null;
  mitosox: number | null;
  strength: number;
  strengthFrom: "pasted" | "fitted";
  error?: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseLine(line: string): Parsed | { error: string } {
  const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { error: "Need at least a date and a therapy." };
  const [date, therapyRaw, doseRaw, acRaw, soRaw, sRaw] = parts;
  if (!DATE.test(date ?? "")) return { error: `Date "${date}" must be YYYY-MM-DD.` };
  const q = (therapyRaw ?? "").toLowerCase();
  const t = therapies.find((x) => x.id.toLowerCase() === q || x.name.toLowerCase() === q || x.name.toLowerCase().includes(q));
  if (!t) return { error: `No therapy matches "${therapyRaw}".` };
  const dose = doseRaw === undefined || doseRaw === "" ? 1 : Number(doseRaw.replace(/x$/i, ""));
  if (!Number.isFinite(dose) || dose <= 0) return { error: `Dose "${doseRaw}" is not a number.` };
  const aconitase = acRaw && Number.isFinite(Number(acRaw)) ? Number(acRaw) : null;
  const mitosox = soRaw && Number.isFinite(Number(soRaw)) ? Number(soRaw) : null;
  let strength: number;
  let strengthFrom: "pasted" | "fitted";
  if (sRaw && Number.isFinite(Number(sRaw.replace(/x$/i, "")))) {
    strength = Number(sRaw.replace(/x$/i, ""));
    strengthFrom = "pasted";
  } else if (aconitase !== null && aconitase > 0 && aconitase < 100) {
    const fit = fitStrength(aconitase, PASTE_FIT_AC);
    strength = fit.s;
    strengthFrom = "fitted";
  } else {
    return { error: "Give a strength (last column) or an aconitase % I can fit one from." };
  }
  return { date: date!, therapyId: t.id, therapyName: t.name, dose, aconitase, mitosox, strength, strengthFrom };
}

export function PasteMeasurements({ pool, onRan }: { pool: DemoPatient[]; onRan?: () => void }) {
  const [patientId, setPatientId] = useState(pool[0]?.id ?? demoPatients[0].id);
  const [raw, setRaw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState(true);
  const saved = useSavedRirr();
  const [overrides] = useProfileRirr();

  const parsed = useMemo(() => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => ({ line: l, result: parseLine(l) }));
  }, [raw]);

  const okRows = parsed.map((p) => p.result).filter((r): r is Parsed => "date" in r);
  const badCount = parsed.length - okRows.length;
  const band = okRows.length
    ? { lo: Math.min(...okRows.map((r) => r.strength)), hi: Math.max(...okRows.map((r) => r.strength)) }
    : null;

  async function apply() {
    const prof = pool.find((p) => p.id === patientId);
    if (!prof || !okRows.length || !band) return;
    setBusy(true);
    for (const r of okRows) {
      const values = { ...prof.values };
      if (r.mitosox !== null) values.mitosox = r.mitosox;
      addVisit(
        {
          patientId: prof.id,
          date: r.date,
          values,
          therapies: [r.therapyId],
          doses: { [r.therapyId]: r.dose },
          actualDoses: { [r.therapyId]: `${r.dose}x model dose (pasted measurement)` },
        },
        "real",
      );
      await recordRun(prof.id, "timeline", r.dose, [r.therapyId], r.strength);
      logStrength("batch-run", r.strength, `Pasted measurement ${r.date}: ${r.therapyName} ${r.dose}x (${r.strengthFrom})`);
    }
    setStrengthRange(band.lo, band.hi);
    // One planned snap per measurement date, from the previous strength to
    // the strength in that line; applies only on confirm on the Therapy plan
    // Schedule tab.
    let snapped = 0;
    if (schedule) {
      let prev = overrides[prof.id] ?? saved ?? 1.0;
      const byDate = [...okRows].sort((a, b) => a.date.localeCompare(b.date));
      addSnaps(byDate.map((r) => {
        const item = { profileId: prof.id, label: `${prof.label} (measured ${r.therapyName} ${r.dose}x)`, from: prev, to: r.strength, date: r.date };
        prev = r.strength;
        return item;
      }));
      snapped = byDate.length;
    }
    setMsg(
      `Added ${okRows.length} real visits to the Timeline for ${prof.label} and logged them on this page. Band set to ${band.lo.toFixed(2)}x-${band.hi.toFixed(2)}x from your data${snapped ? `; scheduled ${snapped} snap(s) on Snap plan, shown on the Timeline snap strip` : ""}${badCount ? `; ${badCount} line(s) skipped` : ""}.`,
    );
    setBusy(false);
    onRan?.();
  }

  return (
    <section className="space-y-2 rounded-lg border border-border p-4" data-testid="paste-measurements">
      <h2 className="text-lg font-medium">Paste your measurements</h2>
      <p className="text-sm text-muted-foreground">
        One line per entry, date first: <code>date, therapy, dose x, aconitase %, superoxide (MitoSOX), strength x</code>. Example: <code>2026-09-14, iron chelation, 1, 72, 1.4</code>. Strength is optional: leave it out and I fit it from the aconitase %. Applying adds each line as a real visit on the Timeline gap chart, logs it here, and moves the band sliders to the lowest and highest strengths in your data.
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Profile
          <select data-testid="paste-profile" className="rounded border border-input bg-background px-2 py-1" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {pool.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted-foreground">Other labs on each visit are filled from this profile; only your measured values are real.</span>
      </div>
      <textarea
        data-testid="paste-input"
        className="h-32 w-full rounded border border-input bg-background px-2 py-1 font-mono text-xs"
        placeholder={"2026-09-14, iron chelation, 1, 72, 1.4\n2026-10-01, mitochondrial antioxidant support, 1.5, 80, 1.1, 0.9"}
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setMsg(null); }}
      />
      {parsed.length > 0 && (
        <table className="w-full text-sm" data-testid="paste-preview">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-normal">Date</th>
              <th className="font-normal">Therapy</th>
              <th className="font-normal">Dose</th>
              <th className="font-normal">Aconitase</th>
              <th className="font-normal">MitoSOX</th>
              <th className="font-normal">Strength</th>
              <th className="font-normal">Note</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((p, i) => {
              const r = p.result;
              if (!("date" in r)) {
                return (
                  <tr key={i} className="border-t border-border text-destructive">
                    <td className="py-1" colSpan={7}>{r.error} <span className="text-muted-foreground">({p.line})</span></td>
                  </tr>
                );
              }
              return (
                <tr key={i} className="border-t border-border">
                  <td className="py-1">{r.date}</td>
                  <td>{r.therapyName}</td>
                  <td>{r.dose}x</td>
                  <td>{r.aconitase !== null ? `${r.aconitase}%` : "-"}</td>
                  <td>{r.mitosox !== null ? r.mitosox : "-"}</td>
                  <td>{r.strength}x</td>
                  <td className="text-muted-foreground">{r.strengthFrom === "fitted" ? "fitted from aconitase" : "pasted"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" data-testid="paste-apply" disabled={!okRows.length || busy} onClick={apply}>
          {busy ? "Applying…" : `Add ${okRows.length || ""} to Timeline and set band${band ? ` ${band.lo.toFixed(2)}x-${band.hi.toFixed(2)}x` : ""}`}
        </Button>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" data-testid="paste-schedule" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />Also schedule a snap per date</label>
        {badCount > 0 && <span className="text-sm text-destructive">{badCount} line(s) have problems and will be skipped.</span>}
      </div>
      {msg && <p className="text-sm" data-testid="paste-msg">{msg}</p>}
      <p className="text-xs text-muted-foreground">Everything stays in this browser: visits are tab-only, runs and the band are saved locally. Nothing is sent anywhere.</p>
    </section>
  );
}
