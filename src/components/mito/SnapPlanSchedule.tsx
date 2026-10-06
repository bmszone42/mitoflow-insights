// Snap schedule list: status per entry, apply due snaps with a preview and
// confirm, per-row apply/skip/remove, undo of the last batch, CSV download.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { recordRun } from "@/lib/mito/runs";
import { logStrength } from "@/lib/mito/rirrDefault";
import { demoPatients } from "@/lib/mito/patientReference";
import { removeSnap, snapStatus, updateSnap, type PlannedSnap } from "@/lib/mito/snapPlan";

const DOSES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface Props {
  plan: PlannedSnap[];
  overrides: Record<string, number>;
  setOverride: (id: string, s: number | null) => void;
  lo: number;
  hi: number;
}

export function SnapPlanSchedule({ plan, overrides, setOverride, lo, hi }: Props) {
  const [preview, setPreview] = useState<PlannedSnap[] | null>(null);
  const [last, setLast] = useState<PlannedSnap[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const sorted = [...plan].sort((a, b) => a.date.localeCompare(b.date));
  const dueList = sorted.filter((s) => { const st = snapStatus(s); return st === "Due today" || st === "Overdue"; });

  async function apply(list: PlannedSnap[]) {
    setBusy(true);
    setPreview(null);
    let n = 0;
    const appliedAt = new Date().toISOString();
    for (const s of list) {
      const prev = overrides[s.profileId] ?? null;
      setOverride(s.profileId, s.to);
      updateSnap(s.id, { status: "done", appliedAt, prev });
      const p = demoPatients.find((x) => x.id === s.profileId);
      if (!p) continue;
      const base = { ...profileInputs(p), rirrStrength: s.to };
      for (const t of therapies) for (const d of DOSES) {
        simulate(applyTherapyDose(base, t, d), defaultGeometry);
        await recordRun(p.id, "progress", d, [t.id], s.to);
        n++;
      }
      setMsg(`Re-running ${s.label} (${n} runs)...`);
    }
    logStrength("batch-run", null, `Snap plan: applied ${list.length} scheduled snap(s), ${n} runs`);
    setLast(list.map((s) => ({ ...s, prev: overrides[s.profileId] ?? null })));
    setMsg(`Applied ${list.length} snap(s) and re-ran those profiles: ${n} runs logged.`);
    setBusy(false);
  }

  function undo() {
    if (!last) return;
    for (const s of last) {
      setOverride(s.profileId, s.prev ?? null);
      updateSnap(s.id, { status: "planned", appliedAt: undefined, prev: undefined });
    }
    logStrength("batch-run", null, `Snap plan: undid ${last.length} snap(s)`);
    setMsg(`Undid ${last.length} snap(s). Re-run the batch on Progress to rebuild the grid at the restored strengths.`);
    setLast(null);
  }

  function csv() {
    const head = "date,profile,from,to,status,in_band,applied_at";
    const lines = sorted.map((s) => [s.date, s.label, s.from.toFixed(2), s.to.toFixed(2), snapStatus(s), s.to >= lo && s.to <= hi ? "inside" : "outside", s.appliedAt ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "snap-plan.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const statusClass = (st: string) => st === "Overdue" ? "text-destructive" : st === "Done" ? "text-primary" : st === "Due today" ? "font-medium" : "text-muted-foreground";

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="snap-schedule">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-medium">Schedule</h2>
        <Button size="sm" disabled={busy || dueList.length === 0} onClick={() => setPreview(dueList)} data-testid="snap-apply-due">Apply {dueList.length} due snap{dueList.length === 1 ? "" : "s"}</Button>
        {last && <Button size="sm" variant="ghost" disabled={busy} onClick={undo} data-testid="snap-undo">Undo last ({last.length})</Button>}
        <Button size="sm" variant="outline" disabled={sorted.length === 0} onClick={csv}>Download spreadsheet</Button>
      </div>
      {msg && <p className="text-xs text-muted-foreground" data-testid="snap-msg">{msg}</p>}
      {preview && (
        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3" data-testid="snap-preview">
          <p className="text-xs font-medium">These {preview.length} profile(s) will move. Confirming saves each as its own strength and re-runs it.</p>
          <ul className="text-sm">{preview.map((s) => <li key={s.id} className="font-mono">{s.label}: {s.from.toFixed(2)}x to {s.to.toFixed(2)}x</li>)}</ul>
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => apply(preview)} data-testid="snap-confirm">Confirm</Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No snaps scheduled yet. Pick profiles below.</p>
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-normal">Date</th><th className="font-normal">Profile</th><th className="font-normal">From</th>
            <th className="font-normal">To</th><th className="font-normal">Status</th><th />
          </tr></thead>
          <tbody>{sorted.map((s) => {
            const st = snapStatus(s);
            const open = s.status === "planned";
            return (
              <tr key={s.id} className="border-t border-border" data-testid="snap-row">
                <td className="py-1 pr-2">{open ? <input type="date" value={s.date} onChange={(e) => e.target.value && updateSnap(s.id, { date: e.target.value })} className="rounded-md border border-input bg-background px-1 py-0.5 text-xs" aria-label={`Date for ${s.label}`} /> : s.date}</td>
                <td className="pr-2">{s.label}</td>
                <td className="pr-2 font-mono">{s.from.toFixed(2)}x</td>
                <td className={`pr-2 font-mono ${s.to >= lo && s.to <= hi ? "text-primary" : "text-destructive"}`}>{s.to.toFixed(2)}x</td>
                <td className={statusClass(st)} data-testid="snap-status">{st}</td>
                <td className="space-x-1 text-right">
                  {open && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setPreview([s])}>Apply now</Button>}
                  {open && <Button size="sm" variant="ghost" onClick={() => updateSnap(s.id, { status: "skipped" })}>Skip</Button>}
                  {s.status === "skipped" && <Button size="sm" variant="ghost" onClick={() => updateSnap(s.id, { status: "planned" })}>Unskip</Button>}
                  <Button size="sm" variant="ghost" onClick={() => removeSnap(s.id)}>Remove</Button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </section>
  );
}
