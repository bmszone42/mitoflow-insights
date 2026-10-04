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
import type { Geometry } from "@/lib/mito/model";

const Chart = lazy(() => import("./ProfileSensitivityChart"));

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
          <h3 className="mt-1 text-lg font-semibold">ROS-induced ROS release vs half-life vs antioxidant capacity</h3>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Each of the 18 profiles runs on its own baseline. One setting moves down and up by the step while the others stay put,
            so effects do not add. ROS-induced ROS release strength is an assumed value, not published. Model estimates only.
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
      <p className="text-[11px] text-muted-foreground">
        Ranges: ROS-induced ROS release 0 to 1.5, half-life 2 to 60 days, antioxidant capacity 0.2 to 2x. Dashed line is the healthy adult at default settings.
      </p>
    </section>
  );
}
