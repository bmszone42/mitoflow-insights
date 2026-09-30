import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Inputs, Outputs } from "@/lib/mito/model";
import {
  ATP_COST_TEXTBOOK,
  atpCostFlagCause,
  atpFlagContext,
  atpNetworkRangeFlags,
  effectiveAtpCost,
  etcSteps,
  ironLightReferenceBands,
  liveAtpPerPair,
  poRatio,
  STD_PSI,
  STD_UNCOUPLING,
} from "@/lib/mito/reference";
import { StandardStateNote } from "./StandardState";

export function Physiology({ inputs, out, focusStep = null }: { inputs: Inputs; out: Outputs; focusStep?: number | null }) {
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const standardCost = effectiveAtpCost(STD_PSI, STD_UNCOUPLING);
  const flagContext = atpFlagContext(inputs.deltaPsi, inputs.uncoupling);
  const steps = etcSteps.map((step) => {
    const flags = atpNetworkRangeFlags(step, standardCost, cost);
    const cause = flags.costBOutside ? atpCostFlagCause(step, flagContext) : null;
    return { step, flags, cause, flagged: flags.evOutside || flags.costBOutside };
  });
  const ironRows = [
    { band: ironLightReferenceBands.fesIntact, value: out.fesIntact * 100 },
    { band: ironLightReferenceBands.aconitaseActivity, value: out.aconitaseActivity },
  ];
  const flaggedSteps = steps.filter((row) => row.flagged).length;
  const flaggedIron = ironRows.filter(({ band, value }) => value < band.lo || value > band.hi).length;

  return (
    <div className="space-y-6" data-testid="physiology-view">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="mono-label">Reference comparison</div>
          <h2 className="mt-1 text-xl font-semibold">Physiology</h2>
          <p className="mt-1 text-xs text-muted-foreground">Current Simulator settings against literature-informed reference bands.</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-sm ${flaggedSteps + flaggedIron ? "text-destructive" : "text-primary"}`} role="status">
          {flaggedSteps + flaggedIron ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
          {flaggedSteps + flaggedIron} outside range
        </div>
      </div>

      <section aria-labelledby="physiology-general">
        <h3 id="physiology-general" className="mb-3 text-sm font-semibold">Whole-mitochondrion reference</h3>
        <StandardStateNote
          psi={inputs.deltaPsi}
          uncoupling={inputs.uncoupling}
          poNadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh")}
          poFadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2")}
        />
      </section>

      <section aria-labelledby="physiology-etc">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="physiology-etc" className="text-sm font-semibold">Electron transport steps</h3>
          <span className="font-mono text-xs text-muted-foreground">{flaggedSteps} / {steps.length} flagged</span>
        </div>
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[840px] text-left text-xs" data-testid="physiology-steps">
            <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium">Step / electron path</th>
                <th scope="col" className="px-3 py-3 font-medium">Model drop</th>
                <th scope="col" className="px-3 py-3 font-medium">Literature-derived ΔE</th>
                <th scope="col" className="px-3 py-3 font-medium">Live ATP / pair</th>
                <th scope="col" className="px-3 py-3 font-medium">Effective ATP cost</th>
                <th scope="col" className="px-3 py-3 font-medium">Status</th>
                <th scope="col" className="px-3 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {steps.map(({ step, flags, cause, flagged }, index) => (
                <tr key={step.step} data-testid="physiology-step" data-physiology-step-index={index} data-selected={focusStep === index} data-outside={flagged} className={`border-t border-border/60 ${flagged ? "bg-destructive/10" : ""} ${focusStep === index ? "ring-1 ring-inset ring-primary bg-primary/10" : ""}`}>
                  <th scope="row" className="px-3 py-3 font-medium text-foreground">
                    {step.step}
                    <div className="mt-0.5 font-normal text-muted-foreground">{step.donor} → {step.acceptor}</div>
                  </th>
                  <td className={`px-3 py-3 font-mono ${flags.evOutside ? "text-destructive" : "text-primary"}`}>{step.ev.toFixed(3)} eV</td>
                  <td className="px-3 py-3 font-mono">{step.tbLo.toFixed(2)}–{step.tbHi.toFixed(2)} eV</td>
                  <td className="px-3 py-3 font-mono">{liveAtpPerPair(step, inputs.deltaPsi, inputs.uncoupling).proton.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-mono ${flags.costBOutside ? "text-destructive" : ""}`}>
                    {step.protons > 0 ? <>{cost.toFixed(2)} eV/ATP <span className="block text-[10px] text-muted-foreground">ref {ATP_COST_TEXTBOOK.lo.toFixed(2)}–{ATP_COST_TEXTBOOK.hi.toFixed(2)}</span></> : "Not pumping"}
                  </td>
                  <td className={`px-3 py-3 font-medium ${flagged ? "text-destructive" : "text-primary"}`}>
                    {flags.evOutside && flags.costBOutside ? "Drop + cost outside" : flags.evOutside ? "Drop outside" : flags.costBOutside ? "Cost outside" : "Within range"}
                    {cause && <span className="mt-1 block max-w-[250px] text-[10px] font-normal leading-relaxed" data-testid="physiology-flag-cause">Slider cause: {cause}</span>}
                    {flags.evOutside && <span className="mt-1 block max-w-[250px] text-[10px] font-normal leading-relaxed">Fixed model redox drop, not caused by a slider.</span>}
                  </td>
                  <td className="max-w-[330px] px-3 py-3 text-muted-foreground">
                    <a href={step.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary">
                      {step.sourceCitation}
                    </a>
                    <span className="mt-1 block text-[10px] leading-relaxed">{step.rangeBasis}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Redox drops are fixed model parameters, not live measurements. Each comparison interval is calculated from reported pH 7 midpoint potentials in the cited source, not copied from a universal textbook range. Protein environment, pH, preparation and redox state shift those potentials. Live membrane potential and uncoupling change ATP yield and the effective cost proxy on pumping steps. P/O is the resulting efficiency readout, not a separate slider. The 0.50–0.62 eV/ATP band is a derived overall synthesis-energy estimate, not a measured per-step interval. Overall NADH to O₂ is a chain summary, not an additional reaction.
        </p>
      </section>

      <section aria-labelledby="physiology-iron">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="physiology-iron" className="text-sm font-semibold">Iron-sulfur integrity</h3>
          <span className="font-mono text-xs text-muted-foreground">{flaggedIron} / {ironRows.length} flagged</span>
        </div>
        <div className="grid gap-0 border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-border">
          {ironRows.map(({ band, value }) => {
            const flagged = value < band.lo || value > band.hi;
            return (
              <div key={band.label} data-testid="physiology-iron-row" data-outside={flagged} className={`p-4 ${flagged ? "bg-destructive/10" : ""}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-medium">{band.label}</h4>
                  <span className={`font-mono text-sm ${flagged ? "text-destructive" : "text-primary"}`}>{value.toFixed(1)}%</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">Study-normalized band: {band.lo.toFixed(1)}–{band.hi.toFixed(1)}% · {flagged ? "Outside controls" : "Within controls"}</p>
                <p className="mt-1 text-xs text-muted-foreground"><a href={band.sourceUrl} target="_blank" rel="noreferrer" className="text-foreground underline decoration-border underline-offset-2 hover:text-primary">{band.source}</a> · {band.cohort} · {band.specimen}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">The model is scaled to a published platelet mitochondrial ACO2 control envelope of 209.41–541.41 mU/mg protein. Fe-S integrity uses ACO2 as an Fe-S-dependent proxy. These are assay-equivalent model estimates, not patient measurements or universal clinical reference intervals.</p>
      </section>
    </div>
  );
}