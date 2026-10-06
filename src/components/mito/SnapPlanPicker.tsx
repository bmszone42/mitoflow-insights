// Pick profiles, a date and a target, then add them to the snap schedule.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addSnaps, todayStr } from "@/lib/mito/snapPlan";

export interface ProfileRow { id: string; label: string; s: number; src: string; inside: boolean }

export function SnapPlanPicker({ rows, lo, hi }: { rows: ProfileRow[]; lo: number; hi: number }) {
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [allDate, setAllDate] = useState("");
  const [mode, setMode] = useState<"edge" | "custom">("edge");
  const [custom, setCustom] = useState(0.75);
  const [msg, setMsg] = useState<string | null>(null);

  // Preselect outside profiles once rows have their real (post-mount) values.
  const key = rows.map((r) => `${r.id}:${r.inside}`).join(",");
  useEffect(() => {
    setSel(Object.fromEntries(rows.map((r) => [r.id, !r.inside])));
    setAllDate(todayStr());
  }, [key]);

  const target = (s: number) => (mode === "custom" ? custom : Math.abs(s - lo) <= Math.abs(s - hi) ? lo : hi);
  const picked = rows.filter((r) => sel[r.id]);

  function add() {
    const items = picked.map((r) => ({ profileId: r.id, label: r.label, from: r.s, to: target(r.s), date: dates[r.id] || allDate || todayStr() }));
    addSnaps(items);
    setMsg(`Scheduled ${items.length} snap(s).`);
    setSel({});
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="snap-picker">
      <h2 className="text-lg font-medium">Pick profiles and dates</h2>
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="space-y-1">
          <div className="text-xs text-muted-foreground">Date for all selected</div>
          <input type="date" value={allDate} onChange={(e) => setAllDate(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1" data-testid="snap-all-date" />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-muted-foreground">Target</div>
          <select value={mode} onChange={(e) => setMode(e.target.value as "edge" | "custom")} className="rounded-md border border-input bg-background px-2 py-1" data-testid="snap-mode">
            <option value="edge">Nearest band edge ({lo.toFixed(2)}x or {hi.toFixed(2)}x)</option>
            <option value="custom">Custom value</option>
          </select>
        </label>
        {mode === "custom" && (
          <label className="space-y-1">
            <div className="text-xs text-muted-foreground">Custom (0-1.5x)</div>
            <input type="number" min={0} max={1.5} step={0.05} value={custom} onChange={(e) => setCustom(Math.min(1.5, Math.max(0, Number(e.target.value) || 0)))} className="w-24 rounded-md border border-input bg-background px-2 py-1" />
          </label>
        )}
        <Button size="sm" disabled={picked.length === 0} onClick={add} data-testid="snap-add">Schedule {picked.length} snap{picked.length === 1 ? "" : "s"}</Button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground">
          <th className="py-1 font-normal">Pick</th><th className="font-normal">Profile</th><th className="font-normal">Strength</th>
          <th className="font-normal">Source</th><th className="font-normal">Band</th><th className="font-normal">Snap to</th><th className="font-normal">Own date</th>
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t border-border" data-testid="snap-pick-row">
            <td className="py-1"><Checkbox aria-label={`Pick ${r.label}`} checked={!!sel[r.id]} onCheckedChange={(v) => setSel({ ...sel, [r.id]: v === true })} /></td>
            <td className="pr-2">{r.label}</td>
            <td className="pr-2 font-mono">{r.s.toFixed(2)}x</td>
            <td className="pr-2 text-muted-foreground">{r.src}</td>
            <td className={r.inside ? "text-primary" : "text-destructive"}>{r.inside ? "inside" : "outside"}</td>
            <td className="pr-2 font-mono">{target(r.s).toFixed(2)}x</td>
            <td><input type="date" value={dates[r.id] ?? ""} onChange={(e) => setDates({ ...dates, [r.id]: e.target.value })} className="rounded-md border border-input bg-background px-1 py-0.5 text-xs" aria-label={`Date for ${r.label}`} /></td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}
