import { useSelectedProfile } from "@/lib/mito/selectedProfile";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { demoPatients } from "@/lib/mito/patientReference";
import { profileInputs } from "@/lib/mito/treatment";
import { applyCarriers, carriers, readout, unitRates, type CarrierId, type CarrierRates } from "@/lib/mito/carriers";

const CarrierSweepChart = lazy(() => import("@/components/mito/CarrierSweepChart"));

export const Route = createFileRoute("/carriers")({
  head: () => ({
    meta: [
      { title: "Carrier efficiency | Cristae Lab" },
      { name: "description", content: "Tweak each mitochondrial carrier's transport rate and see ATP, superoxide, peroxide and iron change in the model." },
      { property: "og:title", content: "Carrier efficiency | Cristae Lab" },
      { property: "og:description", content: "Exploratory sliders for Mitoferrin, ANT, PiC, MPC, UCP1 and SLC25A34 with a cited reference table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CarriersPage,
});

const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

function CarriersPage() {
  const [pid, setPid] = useSelectedProfile(demoPatients[0].id);
  const [rates, setRates] = useState<CarrierRates>(unitRates);
  const [sel, setSel] = useState<CarrierId>("ant");
  const patient = demoPatients.find((p) => p.id === pid) ?? demoPatients[0];
  const base = useMemo(() => profileInputs(patient), [patient]);
  const before = useMemo(() => readout(base), [base]);
  const after = useMemo(() => readout(applyCarriers(base, rates)), [base, rates]);
  const curve = useMemo(
    () => Array.from({ length: 21 }, (_, k) => {
      const r = k / 10; const x = readout(applyCarriers(base, { ...rates, [sel]: r }));
      return { r, atp: x.atp, so: x.so };
    }),
    [base, rates, sel],
  );
  const rows = [
    { k: "NADH / NAD+ pool", a: before.nadh, b: after.nadh, d: 2 },
    { k: "ATP flux (µM/s)", a: before.atp, b: after.atp, d: 1 },
    { k: "Superoxide (nM)", a: before.so, b: after.so, d: 2 },
    { k: "Peroxide (nM)", a: before.h2Nm, b: after.h2Nm, d: 1 },
    { k: "Free Fe2+ (µM)", a: before.iron, b: after.iron, d: 2 },
  ];
  const selName = carriers.find((c) => c.id === sel)?.name ?? "";

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6" data-testid="carriers-page">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Carrier efficiency</h1>
        <p className="text-sm text-muted-foreground">
          Change each mitochondrial carrier's transport rate (1x = the profile's current run). Every rate mapping is{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">MADE-UP, unvalidated</span>; no published transport rate
          backs these curves. Settings stay on this page and never change the Simulator, flags, Diagnosis or scenarios. Model estimates only, not a diagnosis.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Profile{" "}
          <select data-testid="carrier-profile" className="ml-1 rounded border border-border bg-background px-2 py-1 text-sm" value={pid} onChange={(e) => setPid(e.target.value)}>
            {demoPatients.map((p) => <option key={p.id} value={p.id}>{p.label} ({p.phenotype})</option>)}
          </select>
        </label>
        <button className="rounded border border-border px-3 py-1 text-sm hover:bg-muted" onClick={() => setRates(unitRates)} data-testid="carrier-reset">Reset all to 1x</button>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4" data-testid="carrier-sliders">
          {carriers.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <button className={`text-left ${sel === c.id ? "font-semibold text-primary" : ""}`} onClick={() => setSel(c.id)}>
                  {c.name} <span className="text-xs text-muted-foreground">{c.gene}</span>
                </button>
                <span className="font-mono text-xs">{rates[c.id].toFixed(2)}x</span>
              </div>
              <Slider aria-label={`${c.name} rate`} data-testid={`carrier-${c.id}`} min={0} max={2} step={0.05} value={[rates[c.id]]}
                onValueChange={(v) => { setRates((r) => ({ ...r, [c.id]: v[0] ?? 1 })); setSel(c.id); }} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <table className="w-full rounded-lg border border-border text-sm" data-testid="carrier-readout">
            <thead><tr className="bg-muted text-left"><th className="p-2">Readout</th><th className="p-2">Current</th><th className="p-2">With carriers</th><th className="p-2">Change</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k} className="border-t border-border">
                  <td className="p-2">{r.k}</td><td className="p-2 font-mono">{r.a.toFixed(r.d)}</td><td className="p-2 font-mono">{r.b.toFixed(r.d)}</td>
                  <td className="p-2 font-mono">{pct(r.b, r.a) >= 0 ? "+" : ""}{pct(r.b, r.a).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs text-muted-foreground">{selName}: ATP (left) and superoxide (right) across 0 to 2x, other carriers held at their current setting.</p>
            <Suspense fallback={<div className="h-64 text-sm text-muted-foreground">Loading chart…</div>}>
              <CarrierSweepChart data={curve} at={{ r: rates[sel], atp: after.atp }} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Carrier reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="carrier-reference">
            <thead><tr className="bg-muted text-left"><th className="p-2">Gene</th><th className="p-2">Carrier</th><th className="p-2">Cargo</th><th className="p-2">Slider moves</th><th className="p-2">Status</th><th className="p-2">Source</th></tr></thead>
            <tbody>
              {carriers.map((c) => (
                <tr key={c.id} className="border-t border-border align-top">
                  <td className="p-2 font-mono text-xs">{c.gene}</td><td className="p-2">{c.name}</td><td className="p-2">{c.cargo}</td>
                  <td className="p-2">{c.modelLink}</td><td className="p-2">{c.status}</td>
                  <td className="p-2"><a className="text-primary underline" href={c.sourceUrl} target="_blank" rel="noreferrer">{c.sourceLabel}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Sources establish what each carrier transports, not a rate the model uses. Synopses and scores are on the References page.</p>
      </section>
    </main>
  );
}
