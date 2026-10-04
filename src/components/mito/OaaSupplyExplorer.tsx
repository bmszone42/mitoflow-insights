import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";

/*
 * MADE-UP exploratory lever. Oxaloacetate (OAA) supply, e.g. SLC25A34 import or
 * anaplerosis, scales how much NADH the TCA cycle can deliver via a saturating
 * curve f = 1.5 * oaa / (0.5 + oaa) (f = 1 at oaa = 1). No published flux backs it.
 * It never changes the app's inputs, flags, scenarios or diagnosis.
 */
export const oaaFactor = (oaa: number) => (1.5 * oaa) / (0.5 + oaa);

const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

export function OaaSupplyExplorer({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const [oaa, setOaa] = useState(1);
  const nadh = Math.min(1, Math.max(0, inputs.nadhRatio * oaaFactor(oaa)));
  const x = useMemo(() => simulate({ ...inputs, nadhRatio: nadh }, geo), [inputs, geo, nadh]);
  const rows = [
    { k: "NADH / NAD+ pool", a: inputs.nadhRatio, b: nadh, d: 2 },
    { k: "ATP flux (µM/s)", a: out.atpFlux, b: x.atpFlux, d: 1 },
    { k: "Superoxide (nM)", a: out.superoxide, b: x.superoxide, d: 2 },
  ];
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4" data-testid="oaa-explorer">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Oxaloacetate supply (exploratory)</h3>
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">MADE-UP, unvalidated</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Invented lever inspired by the SLC25A34 oxaloacetate carrier (Karavaeva 2026, adipocytes). It scales the NADH pool by a
        made-up saturating curve; 1 = current state. It does not change your sliders, flags, scenarios or diagnosis.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="w-32 text-xs">OAA supply: <span className="font-mono">{oaa.toFixed(2)}x</span></span>
        <Slider aria-label="Oxaloacetate supply (made-up)" min={0} max={2} step={0.05} value={[oaa]} onValueChange={(v) => setOaa(v[0] ?? 1)} className="max-w-xs" />
      </div>
      <table className="mt-3 w-full text-xs">
        <thead><tr className="text-left text-muted-foreground"><th className="py-1">Readout</th><th>Current</th><th>With OAA lever</th><th>Change</th></tr></thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => <tr key={r.k}><td className="py-1">{r.k}</td><td className="font-mono">{r.a.toFixed(r.d)}</td><td className="font-mono">{r.b.toFixed(r.d)}</td><td className="font-mono">{pct(r.b, r.a) >= 0 ? "+" : ""}{pct(r.b, r.a).toFixed(1)}%</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
