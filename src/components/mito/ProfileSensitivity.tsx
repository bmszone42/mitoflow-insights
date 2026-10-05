import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoPatients } from "@/lib/mito/patientReference";
import {
  profileSensCsv,
  profileSensitivity,
  profileSensKeys,
  profileSensOutputs,
  profileSweep,
  shortLabel,
  type ProfileSensOut,
} from "@/lib/mito/profileSensitivity";
import { inputRanges, simulate, type Geometry } from "@/lib/mito/model";
import { profileInputs } from "@/lib/mito/treatment";
import { putScenario } from "@/lib/mito/scenarios";
import type { DemoPatient } from "@/lib/mito/patientReference";

const Chart = lazy(() => import("./ProfileSensitivityChart"));

const tuneKeys = ["rirrStrength", "mitoHalfLife", "antioxidantCapacity", "labileIron", "deltaPsi"] as const;

function TuneAndSave({ patient, geo, healthy }: { patient: DemoPatient; geo: Geometry; healthy: number }) {
  const base = useMemo(() => profileInputs(patient), [patient]);
  const [vals, setVals] = useState(() => Object.fromEntries(tuneKeys.map((k) => [k, base[k]])) as Record<(typeof tuneKeys)[number], number>);
  const [name, setName] = useState(`${patient.label} tuned`);
  const [saved, setSaved] = useState("");
  const inputs = { ...base, ...vals };
  const o = useMemo(() => simulate(inputs, geo), [JSON.stringify(vals), geo, base]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(() => simulate(base, geo), [base, geo]);
  const pct = (a: number, c: number) => (c ? `${(((a - c) / c) * 100).toFixed(1)}%` : "n/a");

  async function save() {
    const now = Date.now();
    const n = name.trim() || `${patient.label} tuned`;
    await putScenario({
      id: crypto.randomUUID(), name: n,
      notes: `Tuned from ${patient.label} on the Profile sensitivity card. ROS-induced ROS release strength is partly published (fitted to Melov 1999).`,
      inputs, geometry: geo,
      snapshot: { atpFlux: o.atpFlux, superoxide: o.superoxide, hydrogenPeroxide: o.hydrogenPeroxide, fesIntact: o.fesIntact, freeIron: o.freeIron },
      createdAt: now, updatedAt: now,
    });
    setSaved(n);
  }

  return (
    <div className="mt-6 space-y-3 rounded border border-border p-3" data-testid="profile-tune">
      <div className="mono-label">Tune {patient.label} and save as a scenario</div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tuneKeys.map((k) => (
          <div key={k}>
            <div className="text-xs">{inputRanges[k].label}: {vals[k].toFixed(2)} {inputRanges[k].unit}{k === "rirrStrength" ? " (partly published)" : ""}</div>
            <Slider aria-label={inputRanges[k].label} className="mt-2" min={inputRanges[k].min} max={inputRanges[k].max} step={(inputRanges[k].max - inputRanges[k].min) / 100} value={[vals[k]]} onValueChange={(v) => setVals((s) => ({ ...s, [k]: v[0] ?? s[k] }))} />
          </div>
        ))}
      </div>
      <p className="text-xs" data-testid="profile-tune-readout">
        Superoxide {o.superoxide.toFixed(4)} nM ({pct(o.superoxide, b.superoxide)} vs profile, <span className={o.superoxide > healthy ? "text-destructive" : ""}>{o.superoxide > healthy ? "above" : "at or below"} healthy</span>), ATP {o.atpFlux.toFixed(1)} µM/s ({pct(o.atpFlux, b.atpFlux)}), free iron {o.freeIron.toFixed(2)} µM ({pct(o.freeIron, b.freeIron)}).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Scenario name" className="w-64 rounded border border-input bg-background px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" data-testid="profile-tune-save" onClick={save}>Save as scenario</Button>
        {saved && <span className="text-xs text-muted-foreground" data-testid="profile-tune-saved">Saved "{saved}". Open it from the Simulator's scenario list.</span>}
      </div>
    </div>
  );
}

const cell = (v: number) => {
  const a = Math.min(1, Math.abs(v) / 30) * 0.45;
  const bg = v > 0.05 ? `color-mix(in oklab, var(--destructive) ${a * 100}%, transparent)` : v < -0.05 ? `color-mix(in oklab, var(--chart-2) ${a * 100}%, transparent)` : "transparent";
  return { background: bg };
};
const f = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

export function ProfileSensitivity({ geo }: { geo: Geometry }) {
  const [delta, setDelta] = useState(0.2);
  const [out, setOut] = useState<ProfileSensOut | "all">("all");
  const [sortRirr, setSortRirr] = useState(false);
  const [pid, setPid] = useState(demoPatients[0]!.id);
  const rows = useMemo(() => profileSensitivity(geo, delta), [geo, delta]);
  const sorted = useMemo(() => {
    if (!sortRirr) return rows;
    const s = (r: (typeof rows)[number]) => Math.abs(r.effects.rirrStrength.up.superoxide - r.effects.rirrStrength.down.superoxide);
    return [...rows].sort((a, b) => s(b) - s(a));
  }, [rows, sortRirr]);
  const outs = profileSensOutputs.filter((o) => out === "all" || o.key === out);
  const patient = demoPatients.find((p) => p.id === pid) ?? demoPatients[0]!;
  const sweep = useMemo(() => profileSweep(patient, geo), [patient, geo]);
  const healthy = rows.find((r) => r.patient.id === "demo-01")?.base.superoxide ?? 0;

  const download = () => {
    const blob = new Blob([profileSensCsv(rows, delta)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cristae-lab-profile-sensitivity.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="panel p-4" data-testid="profile-sensitivity">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono-label">Profile sensitivity</div>
          <h3 className="mt-1 text-lg font-semibold">ROS-induced ROS release vs half-life vs antioxidant capacity vs iron vs potential</h3>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Each of the 18 profiles runs on its own baseline. One setting moves down and up by the step while the others stay put,
            so effects do not add. ROS-induced ROS release strength is partly published: fitted to brain aconitase loss in Sod2 null mice (Melov 1999). Model estimates only.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={download}>Download CSV</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div className="min-w-[200px]">
          <div className="text-xs">Step plus or minus {(delta * 100).toFixed(0)}% of range</div>
          <Slider className="mt-2" min={0.05} max={0.5} step={0.05} value={[delta]} onValueChange={(v) => setDelta(v[0] ?? 0.2)} />
        </div>
        <Select value={out} onValueChange={(v) => setOut(v as ProfileSensOut | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outputs</SelectItem>
            {profileSensOutputs.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={sortRirr} onChange={(e) => setSortRirr(e.target.checked)} />
          Sort by biggest ROS-induced ROS release effect
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs" data-testid="profile-sens-table">
          <thead>
            <tr className="border-b border-border">
              <th rowSpan={2} className="p-1 text-left">Profile</th>
              {profileSensKeys.map((k) => <th key={k} colSpan={outs.length} className="p-1 text-center">{shortLabel[k]}</th>)}
              <th rowSpan={2} className="p-1 text-left">Biggest superoxide swing</th>
            </tr>
            <tr className="border-b border-border text-muted-foreground">
              {profileSensKeys.map((k) => outs.map((o) => <th key={k + o.key} className="p-1 font-normal">{o.label} down / up</th>))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.patient.id} className="border-b border-border/50">
                <td className="p-1"><div className="font-medium">{r.patient.label}</div><div className="text-muted-foreground">{r.patient.phenotype}</div></td>
                {profileSensKeys.map((k) => outs.map((o) => (
                  <td key={k + o.key} className="p-1 text-center font-mono">
                    <span className="rounded px-1" style={cell(r.effects[k].down[o.key])}>{f(r.effects[k].down[o.key])}</span>{" "}
                    <span className="rounded px-1" style={cell(r.effects[k].up[o.key])}>{f(r.effects[k].up[o.key])}</span>
                  </td>
                )))}
                <td className="p-1">{shortLabel[r.dominant]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="mono-label">Superoxide across each setting's range</div>
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>{demoPatients.map((p) => <SelectItem key={p.id} value={p.id}>{p.label} ({p.phenotype})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Suspense fallback={<div className="h-72" />}><Chart data={sweep} healthy={healthy} /></Suspense>
      <TuneAndSave key={patient.id} patient={patient} geo={geo} healthy={healthy} />
      <p className="text-[11px] text-muted-foreground">
        Ranges: ROS-induced ROS release 0 to 1.5, half-life 2 to 60 days, antioxidant capacity 0.2 to 2x, labile iron 0 to 20 µM, membrane potential 90 to 210 mV. Dashed line is the healthy adult at default settings.
      </p>
    </section>
  );
}
