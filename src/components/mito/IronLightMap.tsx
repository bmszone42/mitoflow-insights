import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grid2d, sensOutputs, simulate, type Geometry, type Inputs, type SensOutputKey } from "@/lib/mito/model";
import { etcSteps, ironLightReferenceBands } from "@/lib/mito/reference";

export type IronLightPayload = ReturnType<typeof buildPayload>;

function buildPayload(inputs: Inputs, geo: Geometry, lightKey: "redDose" | "nirDose", mapOutput: SensOutputKey) {
  const grid = grid2d(inputs, "labileIron", lightKey);
  const dx = grid.dx;
  const dy = grid.dy;
  const at = (x: number, y: number) => simulate({ ...inputs, labileIron: x, [lightKey]: y });
  const f00 = at(dx.min, dy.min);
  const f10 = at(dx.max, dy.min);
  const f01 = at(dx.min, dy.max);
  const f11 = at(dx.max, dy.max);
  const base = simulate(inputs);
  const pc = (v: number, b: number) => ((v - b) / Math.abs(b)) * 100;
  const outputs = sensOutputs.filter((o) => Math.abs(f00[o.key]) > 1e-12).map((o) => {
    const vals = grid.cells.flat().map((c) => c[o.key] ?? 0);
    const xOnly = pc(f10[o.key], f00[o.key]);
    const yOnly = pc(f01[o.key], f00[o.key]);
    const both = pc(f11[o.key], f00[o.key]);
    return { label: o.label, base: base[o.key], xOnlyPct: xOnly, yOnlyPct: yOnly, bothPct: both, synergyPct: both - xOnly - yOnly, min: Math.min(...vals), max: Math.max(...vals) };
  });
  const activeBand = mapOutput === "fesIntact" || mapOutput === "aconitaseActivity" ? ironLightReferenceBands[mapOutput] : null;
  const flaggedCells = activeBand ? grid.cells.flat().filter((c) => {
    const pct = mapOutput === "fesIntact" ? (c["fesIntact"] ?? 0) * 100 : (c["aconitaseActivity"] ?? 0);
    return pct < activeBand.lo || pct > activeBand.hi;
  }).length : 0;
  const idx = [0, 3, 6, 9, 12, 15, 18, 20].filter((i) => i < grid.xs.length);
  const maxIron = Math.max(...grid.xs);
  const crossing = (no: number) => grid.ys.find((y) => simulate({ ...inputs, nitricOxide: no, labileIron: maxIron, [lightKey]: y }).cardiolipinOx >= 30) ?? null;
  const noRow = (no: number) => {
    const out = simulate({ ...inputs, nitricOxide: no, labileIron: maxIron }, geo);
    return { no, peroxynitrite: out.peroxynitrite, fesIntactPct: out.fesIntact * 100, aconitasePct: out.aconitaseActivity, cardiolipinOxPct: out.cardiolipinOx };
  };
  const photonEv660 = 1240 / 660;
  const photonEv810 = 1240 / 810;
  return {
    lightPump: { photonEv660, photonEv810, activeWavelengthNm: lightKey === "nirDose" ? 810 : 660, photonGainBase: base.photonGain, photonGainMaxDose: f01.photonGain, vsPumpSteps: etcSteps.filter((s) => s.protons > 0).map((s) => ({ step: s.step, stepEv: s.ev, ratio660: photonEv660 / s.ev, ratio810: photonEv810 / s.ev })) },
    nitricOxide: { currentNm: inputs.nitricOxide, atMaxIron: maxIron, crossingDoses: { no0: crossing(0), current: crossing(inputs.nitricOxide), no400: crossing(400) }, levels: [0, inputs.nitricOxide, 400].map(noRow) },
    xLabel: `${dx.label} (µM)`, yLabel: `${dy.label} (J/cm2)`, xRange: [dx.min, dx.max] as [number, number], yRange: [dy.min, dy.max] as [number, number], baseline: { x: inputs.labileIron, y: inputs[lightKey] }, shownOutput: sensOutputs.find((o) => o.key === mapOutput)?.label ?? mapOutput, shownGrid: idx.map((r) => idx.map((c) => grid.cells[r]?.[c]?.[mapOutput] ?? 0)),
    referenceBand: activeBand ? { label: activeBand.label, loPct: activeBand.lo, hiPct: activeBand.hi, assayLo: activeBand.assayLo, assayHi: activeBand.assayHi, assayUnit: activeBand.unit, cohort: activeBand.cohort, specimen: activeBand.specimen, source: activeBand.source, proxy: activeBand.proxy, flaggedCells, totalCells: grid.cells.flat().length } : undefined,
    outputs,
  };
}

export function IronLightMap({ inputs, geo, onInterpret, interpreting = false, compact = false, lightKey: controlledLightKey, onLightKeyChange, mapOutput: controlledMapOutput, onMapOutputChange }: { inputs: Inputs; geo: Geometry; onInterpret?: (payload: IronLightPayload, context: { lightKey: "redDose" | "nirDose"; mapOutput: SensOutputKey }) => void; interpreting?: boolean; compact?: boolean; lightKey?: "redDose" | "nirDose"; onLightKeyChange?: (value: "redDose" | "nirDose") => void; mapOutput?: SensOutputKey; onMapOutputChange?: (value: SensOutputKey) => void }) {
  const [localLightKey, setLocalLightKey] = useState<"redDose" | "nirDose">("redDose");
  const [localMapOutput, setLocalMapOutput] = useState<SensOutputKey>(compact ? "fesIntact" : "hydroxylRadical");
  const lightKey = controlledLightKey ?? localLightKey;
  const mapOutput = controlledMapOutput ?? localMapOutput;
  const setLightKey = (value: "redDose" | "nirDose") => onLightKeyChange ? onLightKeyChange(value) : setLocalLightKey(value);
  const setMapOutput = (value: SensOutputKey) => onMapOutputChange ? onMapOutputChange(value) : setLocalMapOutput(value);
  const grid = useMemo(() => grid2d(inputs, "labileIron", lightKey), [inputs, lightKey]);
  const payload = useMemo(() => buildPayload(inputs, geo, lightKey, mapOutput), [inputs, geo, lightKey, mapOutput]);
  const values = grid.cells.flat().map((c) => c[mapOutput] ?? 0);
  const isRos = ["superoxide", "hydrogenPeroxide", "hydroxylRadical", "peroxynitrite", "lipidPeroxyl"].includes(mapOutput);
  const min = Math.min(...values), max = Math.max(...values);
  const logMin = Math.log10(Math.max(min, 1e-9)), logMax = Math.log10(Math.max(max, 1e-9));
  const color = (value: number) => {
    const t = isRos ? (logMax === logMin ? 0.5 : (Math.log10(Math.max(value, 1e-9)) - logMin) / (logMax - logMin)) : (max === min ? 0.5 : (value - min) / (max - min));
    return `color-mix(in oklch, var(--accent) ${Math.round(10 + t * 85)}%, transparent)`;
  };
  const activeBand = mapOutput === "fesIntact" || mapOutput === "aconitaseActivity" ? ironLightReferenceBands[mapOutput] : null;
  const current = useMemo(() => activeBand ? simulate(inputs) : null, [inputs, activeBand]);
  const currentPct = current ? mapOutput === "fesIntact" ? current.fesIntact * 100 : current.aconitaseActivity : null;
  const currentOutside = activeBand && currentPct !== null && (currentPct < activeBand.lo || currentPct > activeBand.hi);
  const nearest = (target: number) => grid.ys.reduce((best, y) => Math.abs(y - target) < Math.abs(best - target) ? y : best, grid.ys[0] ?? 0);
  const studyRows = [3, 30].map((target) => { const dose = nearest(target); const out = simulate({ ...inputs, [lightKey]: dose }); return { dose, fes: out.fesIntact * 100 }; });
  const committed = grid.cells.flat().filter((c) => (c["ferroptosisRisk"] ?? 0) >= 100);
  const fmtCross = (value: number | null) => value === null ? "never within 60 J/cm2" : `${value.toFixed(0)} J/cm2`;
  return (
    <section className="panel min-w-0 p-4" data-testid="iron-light-map">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="mono-label">Interaction map: labile iron x light dose</div>
        <div className="flex flex-wrap gap-2">
          <Select value={lightKey} onValueChange={(value) => setLightKey(value as "redDose" | "nirDose")}><SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="redDose">660 nm dose</SelectItem><SelectItem value="nirDose">810 nm dose</SelectItem></SelectContent></Select>
          <Select value={mapOutput} onValueChange={(value) => setMapOutput(value as SensOutputKey)}><SelectTrigger className="h-8 w-[145px]"><SelectValue /></SelectTrigger><SelectContent>{sensOutputs.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto"><div className="min-w-[420px] max-w-[600px]">
        <div className="grid gap-px pl-8" style={{ gridTemplateColumns: `repeat(${grid.xs.length}, minmax(0, 1fr))` }}>
          {[...grid.cells].reverse().flatMap((row, ri) => row.map((cell, ci) => {
            const value = cell[mapOutput] ?? 0;
            const pct = mapOutput === "fesIntact" ? value * 100 : value;
            const outside = activeBand ? pct < activeBand.lo || pct > activeBand.hi : false;
            const rowDose = grid.ys[grid.ys.length - 1 - ri] ?? 0;
            const baseline = ci === grid.xs.reduce((best, x, i) => Math.abs(x - inputs.labileIron) < Math.abs((grid.xs[best] ?? 0) - inputs.labileIron) ? i : best, 0) && grid.ys.length - 1 - ri === grid.ys.reduce((best, y, i) => Math.abs(y - inputs[lightKey]) < Math.abs((grid.ys[best] ?? 0) - inputs[lightKey]) ? i : best, 0);
            const risk = cell["ferroptosisRisk"] ?? 0;
            return <div key={`${ri}-${ci}`} className="relative aspect-square rounded-[2px]" style={{ background: color(value), outline: baseline ? "2px solid var(--foreground)" : undefined, outlineOffset: -1, borderTop: rowDose === studyRows[0]?.dose ? "2px dashed var(--foreground)" : rowDose === studyRows[1]?.dose ? "2px solid var(--foreground)" : undefined }} title={`Fe ${(cell["x"] ?? 0).toFixed(1)} µM, ${grid.dy.label} ${(cell["y"] ?? 0).toFixed(1)} J/cm2: ${payload.shownOutput} ${activeBand ? `${pct.toFixed(1)}%, ${((pct / 100) * activeBand.mean).toFixed(1)} ${activeBand.unit} assay-equivalent` : value.toPrecision(3)}${outside ? "; outside study controls" : ""}`}>
              {outside && <span data-testid="iron-light-range-halo" className="pointer-events-none absolute inset-[2px] rounded-[2px] border-2 border-dashed border-destructive" />}
              {risk >= 100 ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-foreground" /> : risk >= 50 ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-full border border-foreground" /> : null}
            </div>;
          }))}
        </div>
        <div className="mt-1 flex justify-between pl-8 font-mono text-[10px] text-muted-foreground">{[0, .25, .5, .75, 1].map((t) => <span key={t}>{(grid.dx.min + (grid.dx.max - grid.dx.min) * t).toFixed(0)}</span>)}</div>
        <div className="pl-8 text-center font-mono text-[10px] text-muted-foreground">Labile iron (µM)</div>
      </div></div>
      <p className="mt-2 text-[11px] text-muted-foreground">Rows: {grid.dy.label}, {grid.dy.min} to {grid.dy.max} J/cm2, bottom to top. Brighter means higher {payload.shownOutput}{isRos ? " on a log scale" : ""}. The outlined cell is the current baseline.</p>
      <p className="mt-1 text-[11px] text-muted-foreground" data-testid="iron-light-range-legend"><span className="mr-1 inline-block h-2.5 w-2.5 align-middle border-2 border-dashed border-destructive" />Red dashed halo: {activeBand ? `${payload.referenceBand?.flaggedCells ?? 0} of ${grid.cells.flat().length} cells outside ${activeBand.assayLo.toFixed(1)}–${activeBand.assayHi.toFixed(1)} ${activeBand.unit} platelet ACO2 controls. ${activeBand.proxy ? "Fe-S uses ACO2 as a proxy." : "Assay-equivalent model estimate."}` : "choose Fe-S or aconitase to view study-control flags."} {activeBand && <a href={activeBand.sourceUrl} target="_blank" rel="noreferrer" className="text-foreground underline decoration-border underline-offset-2">{activeBand.source}</a>}</p>
       {activeBand && currentPct !== null && <p className={`mt-1 text-xs font-medium ${currentOutside ? "text-destructive" : "text-primary"}`} role="status" data-testid="iron-light-current-study-status" data-outside={Boolean(currentOutside)}>Current model: {currentPct.toFixed(1)}% ({(currentPct / 100 * activeBand.mean).toFixed(1)} {activeBand.unit} assay-equivalent), {currentOutside ? "outside" : "within"} platelet study controls. {activeBand.proxy ? "Fe-S is inferred from aconitase, not directly measured." : "Aconitase is scaled, not assayed."}</p>}
       {activeBand && <p className="mt-1 text-[11px] text-muted-foreground">Study controls are not clinical normal ranges or diagnostic thresholds. The same modeled Fe-S activity drives both outputs; their flags are not independent findings.</p>}
      <p className="mt-1 text-[11px] text-muted-foreground">Filled dot = Committed; ring = Primed. {committed.length} of {grid.cells.flat().length} cells are Committed. At maximum iron, the 30% oxidized-cardiolipin crossing is {fmtCross(payload.nitricOxide.crossingDoses.current)} at current NO, {fmtCross(payload.nitricOxide.crossingDoses.no0)} at 0 nM NO, and {fmtCross(payload.nitricOxide.crossingDoses.no400)} at 400 nM NO.</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Study lines: {studyRows[0]?.dose.toFixed(0)} and {studyRows[1]?.dose.toFixed(0)} J/cm2. Fe-S intact: {studyRows[0]?.fes.toFixed(1)}% and {studyRows[1]?.fes.toFixed(1)}%.</p>
      {onInterpret && <div className="mt-3 flex flex-wrap items-center gap-2"><Button size="sm" onClick={() => onInterpret(payload, { lightKey, mapOutput })} disabled={interpreting}>{interpreting ? "Interpreting..." : "Interpret this map (AI)"}</Button><span className="text-[11px] text-muted-foreground">Sends iron-only, light-only and combined effects plus synergy for every output.</span></div>}
    </section>
  );
}