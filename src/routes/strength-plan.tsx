import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { demoPatients } from "@/lib/mito/patientReference";
import { applyTherapyDose, metrics, profileInputs, therapies } from "@/lib/mito/treatment";
import { defencesGapFromInputs } from "@/lib/mito/scenarios";
import { useStrengthRange } from "@/lib/mito/rangeState";
import { useProfileRirr, useSavedRirr, strengthHistory, RIRR_HISTORY_EVENT, type StrengthHistoryEntry } from "@/lib/mito/rirrDefault";
import { listRuns, recordRun, type RunRecord } from "@/lib/mito/runs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/strength-plan")({
  head: () => ({
    meta: [
      { title: "Strength plan | Cristae Lab" },
      { name: "description", content: "Therapy suggestions ranked at your current ROS-induced strength and saved band, with run progress over time." },
      { property: "og:title", content: "Strength plan | Cristae Lab" },
      { property: "og:description", content: "Therapies ranked at your current strength and band edges, with logged progress over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StrengthPlan,
});

const DOSES = [0.5, 1, 1.5, 2];
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;

function StrengthPlan() {
  const [pid, setPid] = useState(demoPatients[0].id);
  const [{ lo, hi }] = useStrengthRange();
  const saved = useSavedRirr();
  const [own] = useProfileRirr();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [hist, setHist] = useState<StrengthHistoryEntry[]>([]);
  const p = demoPatients.find((x) => x.id === pid) ?? demoPatients[0];

  const reload = () => { listRuns().then(setRuns).catch(() => setRuns([])); setHist(strengthHistory()); };
  useEffect(() => {
    reload();
    window.addEventListener(RIRR_HISTORY_EVENT, reload);
    return () => window.removeEventListener(RIRR_HISTORY_EVENT, reload);
  }, []);

  const base = useMemo(() => profileInputs(p), [p, saved, own]);
  const strength = base.rirrStrength ?? 1;
  const source = own[p.id] !== undefined ? "profile's own" : saved !== null ? "saved default" : "model default";
  const inside = strength >= lo - 1e-9 && strength <= hi + 1e-9;

  const rows = useMemo(() => {
    const at = (s: number) => {
      const b = { ...base, rirrStrength: s };
      const so0 = metrics(b).superoxide;
      const gap0 = defencesGapFromInputs(b);
      return therapies.map((t) => {
        let best = { dose: 0, so: 0, gap: gap0 };
        for (const d of DOSES) {
          const inp = applyTherapyDose(b, t, d);
          const so = so0 ? (metrics(inp).superoxide / so0 - 1) * 100 : 0;
          if (so < best.so) best = { dose: d, so, gap: defencesGapFromInputs(inp) };
        }
        return { t, ...best, gap0 };
      });
    };
    const cur = at(strength), low = at(lo), high = at(hi);
    return cur.map((r, i) => ({ ...r, lo: low[i]!.so, hi: high[i]!.so, robust: low[i]!.so < 0 && high[i]!.so < 0 }))
      .sort((a, b) => Number(b.robust) - Number(a.robust) || a.so - b.so);
  }, [base, strength, lo, hi]);

  const progress = runs.filter((r) => r.patientId === p.id && r.soChangePct !== undefined).sort((a, b) => a.at - b.at);
  const profHist = hist.filter((h) => h.detail.includes(p.id) || h.detail.includes(p.label) || h.kind.startsWith("default")).slice(0, 12);

  const logTop = async () => {
    const top = rows.find((r) => r.dose > 0);
    if (!top) return;
    await recordRun(p.id, "plan", top.dose, [top.t.id], strength, { realDose: top.t.clinicalDose, soChangePct: top.so });
    reload();
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Strength plan</h1>
        <p className="text-sm text-muted-foreground">Therapies ranked at this profile's current ROS-induced strength, checked at both edges of your saved band. Model levers only, never dosing advice. Change the band on the <Link to="/runs" className="underline">Progress</Link> page.</p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <label className="text-sm">Profile
          <select className="ml-2 rounded border bg-background px-2 py-1" value={pid} onChange={(e) => setPid(e.target.value)}>
            {demoPatients.map((x) => <option key={x.id} value={x.id}>{x.id.replace("demo-", "Demo ")} {x.label}</option>)}
          </select>
        </label>
        <div className="text-sm">Strength <b>{strength.toFixed(2)}x</b> ({source})</div>
        <div className="text-sm">Band {lo.toFixed(2)}x-{hi.toFixed(2)}x: <span className={inside ? "text-primary" : "text-destructive"}>{inside ? "inside" : "outside"}</span></div>
        <div className="text-sm">Defences-only gap {pct(rows[0]?.gap0 ?? 0)}</div>
        <Button size="sm" onClick={logTop}>Log top suggestion</Button>
      </section>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-2">Therapy</th><th className="p-2">Best model dose</th><th className="p-2">Superoxide now</th><th className="p-2">At {lo.toFixed(2)}x</th><th className="p-2">At {hi.toFixed(2)}x</th><th className="p-2">Gap after</th><th className="p-2">Holds across band</th><th className="p-2">Real-world anchor</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t.id} className="border-t">
                <td className="p-2">{r.t.name}</td>
                <td className="p-2">{r.dose ? `${r.dose}x` : "no benefit"}</td>
                <td className={`p-2 ${r.so < 0 ? "text-primary" : "text-destructive"}`}>{pct(r.so)}</td>
                <td className="p-2">{pct(r.lo)}</td>
                <td className="p-2">{pct(r.hi)}</td>
                <td className="p-2">{pct(r.gap)}</td>
                <td className={`p-2 ${r.robust ? "text-primary" : "text-muted-foreground"}`}>{r.robust ? "yes" : "no"}</td>
                <td className="p-2">{r.t.doseSource ? <a className="underline" href={r.t.doseSource.url} target="_blank" rel="noreferrer">{r.t.clinicalDose}</a> : r.t.clinicalDose}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="p-2 text-xs text-muted-foreground">Ranked: therapies that lower superoxide at both band edges first, then by superoxide drop at the current strength. Edge columns use the same best dose search.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Logged progress for this profile</h2>
          {progress.length === 0 ? <p className="text-sm text-muted-foreground">No logged runs with a superoxide change yet. Use Log top suggestion or the Progress page.</p> : (
            <table className="w-full text-sm"><thead className="text-left"><tr><th>When</th><th>Therapy</th><th>Dose</th><th>Strength</th><th>Superoxide</th></tr></thead>
              <tbody>{progress.map((r) => (
                <tr key={r.id} className="border-t"><td>{new Date(r.at).toLocaleString()}</td><td>{r.therapyIds.join(", ")}</td><td>{r.dose}x</td><td>{r.rirrStrength?.toFixed(2) ?? "?"}x</td><td className={(r.soChangePct ?? 0) < 0 ? "text-primary" : "text-destructive"}>{pct(r.soChangePct ?? 0)}</td></tr>
              ))}</tbody></table>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Strength changes over time</h2>
          {profHist.length === 0 ? <p className="text-sm text-muted-foreground">No strength history yet.</p> : (
            <ul className="space-y-1 text-sm">{profHist.map((h, i) => {
              const ok = h.strength !== null && h.strength >= lo && h.strength <= hi;
              return <li key={i}><span className="text-muted-foreground">{new Date(h.at).toLocaleDateString()}</span> {h.strength !== null ? <b className={ok ? "text-primary" : "text-destructive"}>{h.strength.toFixed(2)}x</b> : "cleared"} {h.detail}</li>;
            })}</ul>
          )}
        </div>
      </section>
    </main>
  );
}
