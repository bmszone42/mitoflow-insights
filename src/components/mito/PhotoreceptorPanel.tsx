import { Badge } from "@/components/ui/badge";
import type { Outputs } from "@/lib/mito/model";
import { BudgetBar, Metric } from "./SimulatorShared";

export function PhotoreceptorPanel({ out }: { out: Outputs }) {
  const pr = out.photoreceptor;
  const c = out.coherence;
  const absorbed = {
    CuA: pr.absorbed.cuA,
    "Heme a/a3": pr.absorbed.hemeA,
    Flavins: pr.absorbed.flavin,
    Porphyrins: pr.absorbed.porphyrin,
  };
  const anyLight = pr.fluence.red + pr.fluence.nir > 0;
  const pct = (m: number) => `${m >= 1 ? "+" : ""}${((m - 1) * 100).toFixed(0)}%`;
  const loss = c.lossBase + c.lossLipid + c.lossCardiolipin + c.lossHeat;
  const pump = c.pumpMetabolic + c.pumpPhoton;
  const scale = Math.max(pump, loss) * 1.15 || 1;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Photoreceptor</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            at mitochondria: 660 {pr.fluence.red.toFixed(1)} · 810 {pr.fluence.nir.toFixed(1)} J/cm2 · exposure{" "}
            {pr.exposureTime.toFixed(0)} s
          </span>
        </div>
        {anyLight ? (
          <div className="mt-3 space-y-4">
            <BudgetBar title="Absorbed photons by chromophore" parts={absorbed} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Metric label="NO released" value={(pr.noReleased * 100).toFixed(0)} unit="%" />
              <Metric label="CIV rate" value={pct(1 + pr.civGain)} unit="" />
              <Metric label="Local Δψ" value={`+${pr.psiShift.toFixed(1)}`} unit="mV" />
              <Metric label="Flavin O2•- (CI, OGDH)" value={pct(pr.flavinLeak)} unit="" tone="warning" />
              <Metric label="Semiquinone O2•- (CIII)" value={pct(pr.semiquinoneLeak)} unit="" tone="warning" />
              <Metric label="Heating" value={pr.tempRise.toFixed(2)} unit="K" tone={pr.tempRise > 1 ? "warning" : "primary"} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {(pr.saturation * 100).toFixed(0)}% of photons are wasted by chromophore saturation at this irradiance.
              Photoinhibition leaves {(pr.photoinhibition * 100).toFixed(0)}% of the CIV activation. Direct flavin H2O2{" "}
              {(pr.h2o2Direct * 1e3).toFixed(2)} nM/s.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No light. Set a 660 nm or 810 nm dose to see absorption by chromophore.</p>
        )}
      </div>
      <div className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">71 THz coherence</h3>
          <Badge variant={c.pumpRatio >= 1 ? "default" : "outline"} className="font-mono text-[11px]">
            {c.pumpRatio >= 1 ? "above threshold" : "below threshold"} · {(c.coherentFraction * 100).toFixed(0)}% coherent
          </Badge>
        </div>
        <div className="mt-3 space-y-3">
          {[
            { t: "Pump", parts: [["Metabolic (CIV x Δψ)", c.pumpMetabolic, "bg-primary"], ["Photon", c.pumpPhoton, "bg-accent"]] },
            {
              t: "Losses",
              parts: [
                ["Baseline", c.lossBase, "bg-muted-foreground"],
                ["Lipid peroxyl", c.lossLipid, "bg-warning"],
                ["Oxidized cardiolipin", c.lossCardiolipin, "bg-destructive"],
                ["Heat", c.lossHeat, "bg-chart-4"],
              ],
            },
          ].map((row) => (
            <div key={row.t} className="space-y-1">
              <div className="mono-label">{row.t}</div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {row.parts.map(([k, v, cls]) => (
                  <div key={k as string} className={cls as string} style={{ width: `${((v as number) / scale) * 100}%` }} title={`${k}: ${(v as number).toFixed(3)}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                {row.parts.map(([k, v, cls]) => (
                  <span key={k as string} className="flex items-center gap-1">
                    <span className={`inline-block size-2 rounded-full ${cls as string}`} />
                    {k as string} {(v as number).toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Pump / loss" value={c.pumpRatio.toFixed(2)} unit="" />
            <Metric label="Coherent" value={(c.coherentFraction * 100).toFixed(0)} unit="%" />
            <Metric label="71 THz" value={out.emission71THz.toFixed(1)} unit="rel" tone="accent" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Hypothetical Frohlich-type pumped mode: the band becomes coherent when pump exceeds losses. Relative reporter,
            not a radiometric prediction.
          </p>
        </div>
      </div>
    </div>
  );
}
