import { useEffect, useMemo, useState } from "react";
import { listScenarios, scenarioDefencesGap, type Scenario } from "@/lib/mito/scenarios";
import { applyTherapyDose, calculatorDoses, therapies } from "@/lib/mito/treatment";

const doses = calculatorDoses.filter((d) => d > 0);
const weeks = [1, 2, 4, 8, 12];
const pc = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const tone = (v: number) => (v > 0 ? "text-destructive" : "text-primary");

/** Pick a saved scenario; rank therapy/dose pairs by how far they lower its defences-only gap, then show an assumed build-up over weeks. */
export function ScenarioTherapyPlan() {
  const [items, setItems] = useState<Scenario[]>([]);
  const [id, setId] = useState("");
  useEffect(() => {
    listScenarios().then((s) => { setItems(s); if (s[0]) setId(s[0].id); }).catch(() => setItems([]));
  }, []);
  const s = items.find((x) => x.id === id);

  const plan = useMemo(() => {
    if (!s) return null;
    const base = scenarioDefencesGap(s);
    const rows = therapies.map((t) => {
      const byDose = doses.map((d) => ({ d, gap: scenarioDefencesGap({ ...s, inputs: applyTherapyDose(s.inputs, t, d) }) }));
      const best = byDose.reduce((a, b) => (b.gap < a.gap ? b : a));
      const lowest = byDose.find((x) => x.gap <= 0);
      return { t, best, lowest, drop: best.gap - base };
    }).filter((r) => r.drop < -0.05).sort((a, b) => a.best.gap - b.best.gap);
    const halfLife = s.inputs.mitoHalfLife ?? 17.2;
    return { base, rows, halfLife };
  }, [s]);

  return <section aria-label="Scenario therapy plan" className="mt-6 rounded-md border border-border p-3" data-testid="scenario-plan">
    <h2 className="text-sm font-semibold">Scenario plan: lower the defences-only gap</h2>
    <p className="mt-1 text-xs text-muted-foreground">Pick a saved scenario to see which therapies and model doses lower its defences-only superoxide gap (healthy re-run at the scenario's membrane potential, iron and L:P held at healthy). Only therapies that move antioxidant defences or membrane potential can change this gap.</p>
    {items.length === 0 ? <p className="mt-2 text-xs text-muted-foreground" data-testid="scenario-plan-empty">No saved scenarios yet. Save one from the Simulator first.</p> : <>
      <label className="mt-2 block text-xs">Scenario <select data-testid="scenario-plan-pick" className="ml-1 rounded border border-input bg-background px-1 py-0.5" value={id} onChange={(e) => setId(e.target.value)}>{items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      {plan && <>
        <p className="mt-2 text-xs">Current gap: <span className={`tabular-nums font-medium ${tone(plan.base)}`} data-testid="scenario-plan-base">{pc(plan.base)}</span> vs healthy</p>
        {plan.rows.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No therapy lowers this scenario's gap at any model dose.</p> :
        <div className="overflow-x-auto"><table className="mt-2 w-full min-w-[720px] text-xs">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy</th><th>Real-world dose (1x anchor)</th><th>Best model dose</th><th>Gap after</th><th>Change</th><th>Lowest dose reaching healthy</th></tr></thead>
          <tbody>{plan.rows.map((r) => <tr key={r.t.id} className="border-t border-border" data-testid="scenario-plan-row">
            <td className="py-1">{r.t.name}</td>
            <td className="text-muted-foreground">{r.t.clinicalDose}{r.t.doseSource && <a className="block text-[10px] text-primary underline underline-offset-2" href={r.t.doseSource.url} target="_blank" rel="noopener noreferrer">{r.t.doseSource.text}</a>}</td>
            <td className="tabular-nums">{r.best.d}x</td>
            <td className={`tabular-nums ${tone(r.best.gap)}`}>{pc(r.best.gap)}</td>
            <td className="tabular-nums">{(r.drop).toFixed(1)} pts</td>
            <td className="tabular-nums">{r.lowest ? `${r.lowest.d}x` : <span className="text-muted-foreground">not reached by 2x</span>}</td>
          </tr>)}</tbody>
        </table></div>}
        {plan.rows.length > 0 && <div className="mt-3 overflow-x-auto">
          <h3 className="text-xs font-semibold">Timing (assumed build-up)</h3>
          <table className="mt-1 w-full min-w-[520px] text-xs" data-testid="scenario-plan-timing">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1">Therapy at best dose</th>{weeks.map((w) => <th key={w}>Week {w}</th>)}</tr></thead>
            <tbody>{plan.rows.slice(0, 5).map((r) => <tr key={r.t.id} className="border-t border-border">
              <td className="py-1">{r.t.name} ({r.best.d}x)</td>
              {weeks.map((w) => { const f = 1 - 0.5 ** ((w * 7) / plan.halfLife); const g = plan.base + (r.best.gap - plan.base) * f; return <td key={w} className={`tabular-nums ${tone(g)}`}>{pc(g)}</td>; })}
            </tr>)}</tbody>
          </table>
          <p className="mt-1 text-[10px] text-muted-foreground">ASSUMED timing: the model is steady state, so the build-up is an assumption that the effect accrues as the mitochondrial pool turns over, using this scenario's turnover half-life ({plan.halfLife.toFixed(1)} days, Kim 2012 / Stauch 2023 anchors). Not a published time course.</p>
        </div>}
      </>}
    </>}
    <p className="mt-2 text-[10px] text-muted-foreground">Model dose scales the slider move only; the real-world column is the published anchor for 1x, never a dosing guide. Model estimates for research and teaching, not a prescription.</p>
  </section>;
}
