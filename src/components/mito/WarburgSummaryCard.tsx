import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { atpSplit, etcSteps, liveAtpPerPair, phenotype } from "@/lib/mito/reference";

/*
 * Compact Warburg summary for the Simulator: glycolysis vs respiration ATP,
 * top driver shares vs the healthy baseline, and the glycolysis share.
 * Same estimates and baseline as the Warburg dashboard tab.
 */
export function WarburgSummaryCard({ inputs, out, geo }: { inputs: Inputs; out: Outputs; geo: Geometry }) {
  const base = useMemo(() => simulate(defaultInputs, geo), [geo]);
  const live = atpSplit(out);
  const pheno = phenotype(inputs);

  const drivers = useMemo(() => {
    const fluxOf = (o: Outputs, i: number) => (i <= 2 ? o.fluxCI : i === 3 ? o.fluxCII : o.fluxCIV);
    const rows = etcSteps.map((s, i) => {
      const y = liveAtpPerPair(s, inputs.deltaPsi, inputs.uncoupling).proton;
      const yb = liveAtpPerPair(s, defaultInputs.deltaPsi, defaultInputs.uncoupling).proton;
      const rate = (y * fluxOf(out, i)) / 2;
      const rateB = (yb * fluxOf(base, i)) / 2;
      return { step: s.step.replace("Complex", "C"), diff: rate - rateB, rateB, rate };
    });
    const tot = rows.reduce((a, x) => a + Math.abs(x.diff), 0);
    return rows
      .map((x) => ({
        ...x,
        share: tot > 0 ? (Math.abs(x.diff) / tot) * 100 : 0,
        pct: x.rateB > 0 ? ((x.rate - x.rateB) / x.rateB) * 100 : 0,
      }))
      .filter((x) => x.share > 0.05)
      .sort((a, b) => b.share - a.share)
      .slice(0, 3);
  }, [inputs, out, base]);

  const total = live.respiration + live.glycolysis;
  const respW = total > 0 ? (live.respiration / total) * 100 : 0;

  return (
    <div className="panel p-4" data-testid="warburg-summary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Glycolysis vs respiration</h3>
        <Badge variant="outline" className="font-mono text-[11px]">
          {pheno} · {live.glycolysisPct.toFixed(0)}% glycolysis
        </Badge>
      </div>
      <div className="mt-3 flex h-4 w-full overflow-hidden rounded-md border border-border">
        <div style={{ width: `${respW}%`, background: "var(--primary)" }} title={`Respiration ${live.respiration.toFixed(1)} µM/s`} />
        <div style={{ width: `${100 - respW}%`, background: "var(--accent)" }} title={`Glycolysis ${live.glycolysis.toFixed(1)} µM/s`} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>Respiration {live.respiration.toFixed(1)} µM/s</span>
        <span>Glycolysis {live.glycolysis.toFixed(1)} µM/s</span>
      </div>
      {drivers.length > 0 && (
        <div className="mt-3 space-y-1">
          {drivers.map((d) => (
            <div key={d.step} className="flex items-center gap-2 text-[11px]">
              <span className="w-32 truncate text-muted-foreground">{d.step}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full"
                  style={{ width: `${d.share}%`, background: d.diff >= 0 ? "var(--primary)" : "var(--destructive)" }}
                />
              </div>
              <span className="w-20 text-right font-mono">
                {d.share.toFixed(0)}% · {d.pct >= 0 ? "+" : ""}{d.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Driver shares vs the healthy baseline. Green: this run raises that step's ATP rate, red: lowers it. Glycolysis is an estimate, not a measured lactate rate.
      </p>
    </div>
  );
}
