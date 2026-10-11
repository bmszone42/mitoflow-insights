import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { demoPatients } from "@/lib/mito/patientReference";
import { simulate } from "@/lib/mito/model";
import { applyTherapyDose, profileInputs, therapies } from "@/lib/mito/treatment";
import { addPlan, removeVisit, useVisits } from "@/lib/mito/timeline";
import { recordRun } from "@/lib/mito/runs";
import { useSelectedProfile } from "@/lib/mito/selectedProfile";

const doseSteps = [0.5, 1, 1.5, 2];
const today = () => new Date().toISOString().slice(0, 10);

/** Cluster readouts for a set of inputs: intact % per pool, free iron, 3-iron repair half-life. */
function clusterRead(inputs: Parameters<typeof simulate>[0]) {
  const o = simulate(inputs);
  const pools = o.fesPools;
  return {
    acon: pools.aconitase.intact * 100,
    worstComplex: Math.min(pools.complexI.intact, pools.complexII.intact, pools.complexIII.intact) * 100,
    iron: o.freeIron,
    halfLife: o.fesReactHalfLifeS,
  };
}

/** Ranks model therapies by how much they protect Fe-S clusters, then schedules doses as Timeline plan visits. */
export function ClusterPlanPanel() {
  const [pid, setPid] = useSelectedProfile(demoPatients[0]!.id);
  const p = demoPatients.find((d) => d.id === pid) ?? demoPatients[0]!;
  const [dose, setDose] = useState<Record<string, number>>({});
  const [date, setDate] = useState(today());
  const visits = useVisits();

  const base = useMemo(() => clusterRead(profileInputs(p)), [p]);
  const rows = useMemo(() => therapies.map((t) => {
    const d = dose[t.id] ?? 1;
    const r = clusterRead(applyTherapyDose(profileInputs(p), t, d));
    return { t, d, r, gain: r.acon - base.acon };
  }).sort((a, b) => b.gain - a.gain), [p, dose, base]);

  const planned = visits.filter((v) => v.origin === "plan" && v.patientId === p.id).sort((a, b) => a.date.localeCompare(b.date));
  const sign = (x: number, d = 1) => `${x >= 0 ? "+" : ""}${x.toFixed(d)}`;
  const tone = (good: boolean, x: number) => Math.abs(x) < 0.05 ? "text-muted-foreground" : good ? "text-primary" : "text-destructive";

  const schedule = (id: string, d: number) => {
    addPlan({ patientId: p.id, date, therapies: [id], doses: { [id]: d } });
    void recordRun(p.id, "plan", d, [id], profileInputs(p).rirrStrength);
  };

  return <section className="space-y-4" data-testid="cluster-plan">
    <div>
      <h2 className="text-lg font-semibold">Cluster protection</h2>
      <p className="text-xs text-muted-foreground">Ranks therapies by how much they keep aconitase's iron-sulfur clusters intact, with free iron and the 3-iron repair half-life alongside. Doses are model doses (slider moves), never drug doses. Complex I, II and III use the assumed exposure sliders.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">Profile
        <select className="rounded border bg-background px-2 py-1" value={p.id} onChange={(e) => setPid(e.target.value)}>
          {demoPatients.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">Schedule date
        <input type="date" className="rounded border bg-background px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <p className="text-xs text-muted-foreground">Now: aconitase {base.acon.toFixed(1)}% intact, weakest complex {base.worstComplex.toFixed(1)}%, free iron {base.iron.toFixed(2)} µM, repair half-life {base.halfLife.toFixed(1)} s</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-xs">
        <thead><tr className="text-left text-muted-foreground"><th className="font-normal">Therapy</th><th className="font-normal">Model dose</th><th className="font-normal">Aconitase intact</th><th className="font-normal">Weakest complex</th><th className="font-normal">Free iron</th><th className="font-normal">Repair half-life</th><th /></tr></thead>
        <tbody>{rows.map(({ t, d, r, gain }) => <tr key={t.id} className="border-t" data-testid="cluster-row">
          <td className="py-1 pr-2">{t.name}</td>
          <td><select className="rounded border bg-background px-1" value={d} onChange={(e) => setDose((s) => ({ ...s, [t.id]: Number(e.target.value) }))}>{doseSteps.map((x) => <option key={x} value={x}>{x}x</option>)}</select></td>
          <td className={`tabular-nums ${tone(gain > 0, gain)}`}>{r.acon.toFixed(1)}% ({sign(gain)})</td>
          <td className={`tabular-nums ${tone(r.worstComplex > base.worstComplex, r.worstComplex - base.worstComplex)}`}>{r.worstComplex.toFixed(1)}% ({sign(r.worstComplex - base.worstComplex)})</td>
          <td className={`tabular-nums ${tone(r.iron < base.iron, r.iron - base.iron)}`}>{r.iron.toFixed(2)} µM ({sign(r.iron - base.iron, 2)})</td>
          <td className={`tabular-nums ${tone(r.halfLife < base.halfLife, r.halfLife - base.halfLife)}`}>{r.halfLife.toFixed(1)} s ({sign(r.halfLife - base.halfLife)})</td>
          <td><Button size="sm" variant="outline" onClick={() => schedule(t.id, d)}>Schedule</Button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="text-[11px] text-muted-foreground">Lower free iron can slow 3-iron repair (repair needs iron), so a therapy may protect clusters overall while lengthening the half-life. Model estimates, not a prescription.</p>
    <div>
      <h3 className="text-sm font-semibold">Scheduled for {p.label}</h3>
      {planned.length === 0 ? <p className="text-xs text-muted-foreground">Nothing scheduled yet. Scheduled doses also appear on the Timeline as plan visits.</p> :
        <ul className="mt-1 space-y-1 text-xs">{planned.map((v) => {
          const inputs = v.therapies.reduce((acc, id) => { const t = therapies.find((x) => x.id === id); return t ? applyTherapyDose(acc, t, v.doses?.[id] ?? 1) : acc; }, profileInputs(p));
          const r = clusterRead(inputs);
          const due = v.date <= today();
          return <li key={v.id} className="flex flex-wrap items-center gap-2" data-testid="cluster-planned">
            <span className={due ? "text-destructive" : "text-primary"}>{due ? "Due" : "Upcoming"}</span>
            <span className="tabular-nums">{v.date}</span>
            <span>{v.therapies.map((id) => `${therapies.find((x) => x.id === id)?.name ?? id} ${v.doses?.[id] ?? 1}x`).join(" + ")}</span>
            <span className="text-muted-foreground">projected aconitase {r.acon.toFixed(1)}%, free iron {r.iron.toFixed(2)} µM, repair {r.halfLife.toFixed(1)} s</span>
            <Button size="sm" variant="ghost" onClick={() => removeVisit(v.id)}>Remove</Button>
          </li>;
        })}</ul>}
    </div>
  </section>;
}
