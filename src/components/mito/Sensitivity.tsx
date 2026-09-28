import { useEffect, useMemo, useRef, useState } from "react";
import { putScenario, type Scenario } from "@/lib/mito/scenarios";
import { snapshotOf } from "./Scenarios";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  grid2d,
  simulate,
  sensitivity,
  sensitivityDrivers,
  sensOutputs,
  sweep,
  type Geometry,
  type Inputs,
  type SensOutputKey,
} from "@/lib/mito/model";
import { sensitivityCsv } from "@/lib/mito/csv";
import { etcSteps } from "@/lib/mito/reference";

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
};
const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export function Sensitivity({ inputs, geo, onSaved }: { inputs: Inputs; geo: Geometry; onSaved?: () => void }) {
  const [delta, setDelta] = useState(0.2);
  const [output, setOutput] = useState<SensOutputKey>("superoxide");
  const [driver, setDriver] = useState<keyof Inputs>("labileIron");
  const [lightKey, setLightKey] = useState<"redDose" | "nirDose">("redDose");
  const [mapOutput, setMapOutput] = useState<SensOutputKey>("hydroxylRadical");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [source, setSource] = useState<"table" | "map">("table");
  const [savedName, setSavedName] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [cooldownUntil]);
  const cooling = Math.max(0, Math.ceil((cooldownUntil - Math.max(now, Date.now())) / 1000));

  const sens = useMemo(() => sensitivity(inputs, delta), [inputs, delta]);
  const sweepData = useMemo(
    () =>
      sweep(inputs, driver).map((r) => ({
        ...r,
        fesPct: (r["fesIntact"] ?? 0) * 100,
      })),
    [inputs, driver],
  );

  const tornado = sens
    .map((s) => ({
      name: s.driver.label,
      down: s.down[output],
      up: s.up[output],
      span: Math.abs(s.up[output]) + Math.abs(s.down[output]),
    }))
    .sort((a, b) => b.span - a.span);

  const maxAbs = Math.max(
    1,
    ...sens.flatMap((s) => sensOutputs.map((o) => Math.max(Math.abs(s.up[o.key]), Math.abs(s.down[o.key])))),
  );
  const dDef = sensitivityDrivers.find((d) => d.key === driver)!;
  const outLabel = sensOutputs.find((o) => o.key === output)!.label;

  const grid = useMemo(() => grid2d(inputs, "labileIron", lightKey), [inputs, lightKey]);
  // Lowest light dose where oxidized cardiolipin crosses the 30% Committed
  // threshold, at the map's highest iron, for three NO levels. Shows how NO
  // shifts the crossing without re-rendering the map.
  const noCrossing = useMemo(() => {
    const maxIron = Math.max(...grid.xs);
    const crossAt = (no: number) => {
      for (const y of grid.ys) {
        const o = simulate({ ...inputs, nitricOxide: no, labileIron: maxIron, [lightKey]: y });
        if (o.cardiolipinOx >= 30) return y;
      }
      return null;
    };
    return { low: crossAt(0), now: crossAt(inputs.nitricOxide), high: crossAt(400) };
  }, [grid, inputs, lightKey]);
  const mapVals = grid.cells.flat().map((c) => c[mapOutput] ?? 0);
  const isRos = ["superoxide", "hydrogenPeroxide", "hydroxylRadical", "peroxynitrite", "lipidPeroxyl"].includes(mapOutput);
  const vMin = Math.min(...mapVals);
  const vMax = Math.max(...mapVals);
  const logMin = Math.log10(Math.max(vMin, 1e-9));
  const logMax = Math.log10(Math.max(vMax, 1e-9));
  const cellColor = (v: number) => {
    const t = isRos
      ? logMax === logMin
        ? 0.5
        : (Math.log10(Math.max(v, 1e-9)) - logMin) / (logMax - logMin)
      : vMax === vMin
        ? 0.5
        : (v - vMin) / (vMax - vMin);
    return `color-mix(in oklch, var(--accent) ${Math.round(10 + t * 85)}%, transparent)`;
  };
  const fmtVal = (v: number) => (Math.abs(v) < 0.01 ? v.toExponential(1) : v.toPrecision(3));

  // Study points at 3 and 30 J/cm2 (Chen 2011, Huang 2013): nearest grid row
  // plus Fe-S erosion at that dose with the current non-light inputs.
  const nearestDose = (target: number) =>
    grid.ys.reduce((b, y) => (Math.abs(y - target) < Math.abs(b - target) ? y : b), grid.ys[0]!);
  const studyRows = [3, 30].map((d) => {
    const dose = nearestDose(d);
    const o = simulate({ ...inputs, [lightKey]: dose });
    return { dose, fes: o.fesIntact * 100, acon: o.aconitaseActivity };
  });

  const mapPayload = () => {
    const dx = grid.dx;
    const dy = grid.dy;
    const at = (x: number, y: number) => simulate({ ...inputs, labileIron: x, [lightKey]: y });
    const f00 = at(dx.min, dy.min);
    const f10 = at(dx.max, dy.min);
    const f01 = at(dx.min, dy.max);
    const f11 = at(dx.max, dy.max);
    const base = simulate(inputs);
    const pc = (v: number, b: number) => ((v - b) / Math.abs(b)) * 100;
    const outputs = sensOutputs
      .filter((o) => Math.abs(f00[o.key]) > 1e-12)
      .map((o) => {
        const vals = grid.cells.flat().map((c) => c[o.key] ?? 0);
        const xOnly = pc(f10[o.key], f00[o.key]);
        const yOnly = pc(f01[o.key], f00[o.key]);
        const both = pc(f11[o.key], f00[o.key]);
        return {
          label: o.label,
          base: base[o.key],
          xOnlyPct: xOnly,
          yOnlyPct: yOnly,
          bothPct: both,
          synergyPct: both - xOnly - yOnly,
          min: Math.min(...vals),
          max: Math.max(...vals),
        };
      });
    const idx = [0, 3, 6, 9, 12, 15, 18, 20].filter((i) => i < grid.xs.length);
    // Nitric oxide context: the ONOO- driven Fe-S attack term means NO shifts
    // both cluster loss and the 30% oxidized cardiolipin crossing dose.
    const maxIron = Math.max(...grid.xs);
    const noRow = (no: number) => {
      const o = simulate({ ...inputs, nitricOxide: no, labileIron: maxIron }, geo);
      return {
        no,
        peroxynitrite: o.peroxynitrite,
        fesIntactPct: o.fesIntact * 100,
        aconitasePct: o.aconitaseActivity,
        cardiolipinOxPct: o.cardiolipinOx,
      };
    };
    // Light pump context: treat the absorbed photon as a separate energy source
    // and compare its eV against the ETC step drops (hc/lambda, 1240 nm.eV).
    const photonEv660 = 1240 / 660;
    const photonEv810 = 1240 / 810;
    const pumpSteps = etcSteps.filter((s) => s.protons > 0);
    return {
      lightPump: {
        photonEv660,
        photonEv810,
        activeWavelengthNm: lightKey === "dose810" ? 810 : 660,
        photonGainBase: base.photonGain,
        photonGainMaxDose: f01.photonGain,
        vsPumpSteps: pumpSteps.map((s) => ({
          step: s.step,
          stepEv: s.ev,
          ratio660: photonEv660 / s.ev,
          ratio810: photonEv810 / s.ev,
        })),
      },
      nitricOxide: {
        currentNm: inputs.nitricOxide,
        atMaxIron: maxIron,
        crossingDoses: {
          no0: noCrossing.low,
          current: noCrossing.now,
          no400: noCrossing.high,
        },
        levels: [0, inputs.nitricOxide, 400].map(noRow),
      },
      xLabel: `${dx.label} (µM)`,
      yLabel: `${dy.label} (J/cm2)`,
      xRange: [dx.min, dx.max] as [number, number],
      yRange: [dy.min, dy.max] as [number, number],
      baseline: { x: inputs.labileIron, y: inputs[lightKey] },
      shownOutput: sensOutputs.find((o) => o.key === mapOutput)!.label,
      shownGrid: idx.map((r) => idx.map((c) => grid.cells[r]![c]![mapOutput] ?? 0)),
      outputs,
    };
  };

  const autoSave = async (mode: "table" | "map", body: string) => {
    const lightLabel = lightKey === "redDose" ? "660 nm" : "810 nm";
    const outLbl = sensOutputs.find((o) => o.key === mapOutput)!.label;
    const condition =
      mode === "map"
        ? `Interaction map: labile iron x ${lightLabel} dose, shown output ${outLbl}`
        : `Sensitivity table, step ${(delta * 100).toFixed(0)}% of range`;
    const now = Date.now();
    const name = `${mode === "map" ? `Map: Fe x ${lightLabel} (${outLbl})` : "Sensitivity"} ${new Date(now).toLocaleString()}`;
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      notes: `Saved automatically with the AI interpretation. ${condition}.`,
      inputs,
      geometry: { ...geo },
      snapshot: snapshotOf(simulate(inputs, geo)),
      interpretation: { condition, text: body, at: now },
      createdAt: now,
      updatedAt: now,
    };
    try {
      await putScenario(scenario);
      setSavedName(name);
      onSaved?.();
    } catch (e) {
      setError(`Interpretation done, but saving the scenario failed: ${(e as Error).message}`);
    }
  };

  const explain = async (mode: "table" | "map" = "table") => {
    setBusy(true);
    setError(null);
    setText("");
    setSource(mode);
    setSavedName(null);
    if (mode === "map") panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    let full = "";
    let ok = false;
    setCooldownUntil(Date.now() + 10_000);
    setNow(Date.now());
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/explain-sensitivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta,
          inputs,
          rows:
            mode === "map"
              ? []
              : sens.map((s) => ({
                  driver: s.driver.label,
                  group: s.driver.group,
                  down: s.down,
                  up: s.up,
                })),
          ...(mode === "map" ? { map: mapPayload() } : {}),
        }),
        signal: ac.signal,
      });
      const r = res.headers.get("X-RateLimit-Remaining");
      if (r !== null) setRemaining(Number(r));
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        setText((t) => t + chunk);
      }
      ok = full.trim().length > 0 && !full.includes("[Stream interrupted]");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
    if (ok) await autoSave(mode, full);
  };

  return (
    <div className="space-y-4">
      <section className="panel flex flex-wrap items-end gap-6 p-4">
        <div className="min-w-[220px] flex-1">
          <div className="mono-label">Perturbation step</div>
          <div className="mt-1 text-sm">
            plus or minus {(delta * 100).toFixed(0)}% of each driver's full range
          </div>
          <Slider
            className="mt-3"
            min={0.05}
            max={0.5}
            step={0.05}
            value={[delta]}
            onValueChange={(v) => setDelta(v[0] ?? 0.2)}
          />
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Baseline is the current Simulator settings. Steps are a share of range, not of baseline, so
          drivers starting at zero (like light dose) still show their effect. Values are clamped to
          the slider limits.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const csv = sensitivityCsv(inputs, delta, driver, lightKey);
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "cristae-lab-sensitivity.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download CSV report
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="mono-label">Tornado: what moves {outLabel}</div>
            <Select value={output} onValueChange={(v) => setOutput(v as SensOutputKey)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensOutputs.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <BarChart data={tornado} layout="vertical" stackOffset="sign" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip {...tip} formatter={(v: number, n) => [fmt(v), n === "down" ? "Driver down" : "Driver up"]} />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                {(["down", "up"] as const).map((k) => (
                  <Bar key={k} dataKey={k} stackId="a">
                    {tornado.map((t, i) => (
                      <Cell key={i} fill={t[k] >= 0 ? "var(--accent)" : "var(--primary)"} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pink bars raise the output, green bars lower it. Longest bars matter most.
          </p>
        </section>

        <section className="panel overflow-x-auto p-4">
          <div className="mono-label">Heatmap: driver up by one step</div>
          <table className="mt-3 w-full border-separate border-spacing-1 text-[11px]">
            <thead>
              <tr>
                <th />
                {sensOutputs.map((o) => (
                  <th key={o.key} className="font-mono font-normal text-muted-foreground">
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.map((s) => (
                <tr key={s.driver.key}>
                  <td className="whitespace-nowrap pr-2 text-muted-foreground">{s.driver.label}</td>
                  {sensOutputs.map((o) => {
                    const v = s.up[o.key];
                    const a = Math.min(1, Math.abs(v) / maxAbs);
                    const color = v >= 0 ? "var(--accent)" : "var(--primary)";
                    return (
                      <td
                        key={o.key}
                        title={`${s.driver.label} up: ${o.label} ${fmt(v)} (down: ${fmt(s.down[o.key])})`}
                        className="rounded px-1 py-2 text-center font-mono"
                        style={{
                          background: `color-mix(in oklch, ${color} ${Math.round(a * 85)}%, transparent)`,
                        }}
                      >
                        {Math.abs(v) < 0.5 ? "0" : v.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Percent change in each output. Hover a cell for up and down values.
          </p>
        </section>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono-label">Sweep across full range</div>
          <Select value={driver} onValueChange={(v) => setDriver(v as keyof Inputs)}>
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sensitivityDrivers.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.group}: {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 h-80">
          <ResponsiveContainer>
            <LineChart data={sweepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[dDef.min, dDef.max]}
                tickFormatter={(v) => Number(v).toFixed(1)}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                yAxisId="ros"
                scale="log"
                domain={["auto", "auto"]}
                allowDataOverflow
                tickFormatter={(v) => Number(v).toPrecision(2)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                label={{ value: "ROS nM (log)", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis yAxisId="fe" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tip} formatter={(v: number) => Number(v).toPrecision(3)} labelFormatter={(v) => `${dDef.label} ${Number(v).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="ros" x={inputs[driver]} stroke="var(--foreground)" strokeDasharray="4 4" />
              <Line yAxisId="ros" dataKey="superoxide" name="O2•- nM" stroke="var(--chart-1)" dot={false} />
              <Line yAxisId="ros" dataKey="hydrogenPeroxide" name="H2O2 nM" stroke="var(--chart-2)" dot={false} />
              <Line yAxisId="ros" dataKey="peroxynitrite" name="ONOO- nM" stroke="var(--chart-3)" dot={false} />
              <Line yAxisId="ros" dataKey="lipidPeroxyl" name="LOO• nM" stroke="var(--chart-4)" dot={false} />
              <Line yAxisId="fe" dataKey="fesPct" name="Fe-S intact %" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line yAxisId="fe" dataKey="freeIron" name="Free Fe2+ µM" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Left axis: ROS on a log scale. Right axis: Fe-S intact (%) and free Fe2+ (µM). Dashed line
          marks the current baseline.
        </p>
      </section>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono-label">Interaction map: labile iron x light dose</div>
          <div className="flex gap-2">
            <Select value={lightKey} onValueChange={(v) => setLightKey(v as "redDose" | "nirDose")}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redDose">660 nm dose</SelectItem>
                <SelectItem value="nirDose">810 nm dose</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mapOutput} onValueChange={(v) => setMapOutput(v as SensOutputKey)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensOutputs.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <div className="inline-block">
            <div className="flex">
              <div className="w-10" />
              <div
                className="grid flex-1 gap-px"
                style={{ gridTemplateColumns: `repeat(${grid.xs.length}, minmax(0, 1fr))`, width: 560 }}
              >
                {[...grid.cells].reverse().map((row, ri) =>
                  row.map((c, ci) => {
                    const v = c[mapOutput] ?? 0;
                    const rowDose = grid.ys[grid.ys.length - 1 - ri]!;
                    const isBase =
                      ci === grid.xs.reduce((b, x, i) => (Math.abs(x - inputs.labileIron) < Math.abs(grid.xs[b]! - inputs.labileIron) ? i : b), 0) &&
                      grid.ys.length - 1 - ri === grid.ys.reduce((b, y, i) => (Math.abs(y - inputs[lightKey]) < Math.abs(grid.ys[b]! - inputs[lightKey]) ? i : b), 0);
                    const studyBorder =
                      rowDose === studyRows[0]!.dose
                        ? "2px dashed var(--foreground)"
                        : rowDose === studyRows[1]!.dose
                          ? "2px solid var(--foreground)"
                          : undefined;
                    // Ferroptosis thresholds from the same cell: risk 100 =
                    // Committed (ratio 0.8 or 30% CL ox), risk 50 = Primed.
                    const risk = c["ferroptosisRisk"] ?? 0;
                    const clOx = c["cardiolipinOx"] ?? 0;
                    const committed = risk >= 100;
                    const primed = !committed && risk >= 50;
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        title={`Fe ${(c["x"] ?? 0).toFixed(1)} µM, ${grid.dy.label} ${(c["y"] ?? 0).toFixed(1)} J/cm2: ${sensOutputs.find((o) => o.key === mapOutput)!.label} ${fmtVal(v)} · risk ${risk.toFixed(0)} · CL ox ${clOx.toFixed(1)}%${committed ? " · Committed" : primed ? " · Primed" : ""}`}
                        className="relative aspect-square rounded-[2px]"
                        style={{
                          background: cellColor(v),
                          outline: isBase ? "2px solid var(--foreground)" : undefined,
                          outlineOffset: -1,
                          borderTop: studyBorder,
                        }}
                      >
                        {committed && (
                          <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-foreground" />
                        )}
                        {primed && (
                          <span className="absolute inset-0 m-auto h-2 w-2 rounded-full border border-foreground" />
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="mt-1 flex" style={{ paddingLeft: 40, width: 600 }}>
              <div className="flex w-full justify-between font-mono text-[10px] text-muted-foreground">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <span key={t}>{(grid.dx.min + (grid.dx.max - grid.dx.min) * t).toFixed(0)}</span>
                ))}
              </div>
            </div>
            <div className="mt-1 text-center font-mono text-[10px] text-muted-foreground" style={{ paddingLeft: 40, width: 600 }}>
              Labile iron (µM)
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Rows: {grid.dy.label} from {grid.dy.min} to {grid.dy.max} J/cm2 (bottom to top). Brighter cells
          mean higher {sensOutputs.find((o) => o.key === mapOutput)!.label}
          {isRos ? " (log scale)" : ""}. The outlined cell is your current baseline. Hover any cell for
          exact values.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Ferroptosis thresholds: filled dot = Committed (risk 100, propagation ratio 0.8 or 30%
          cardiolipin oxidized), ring = Primed (risk 50).{" "}
          {(() => {
            const committedCells = grid.cells.flat().filter((c) => (c["ferroptosisRisk"] ?? 0) >= 100);
            const clCrossCells = grid.cells.flat().filter((c) => (c["cardiolipinOx"] ?? 0) >= 30);
            const clLine =
              clCrossCells.length === 0
                ? " Oxidized cardiolipin stays below the 30% Committed threshold everywhere on this map."
                : ` Oxidized cardiolipin first crosses the 30% Committed threshold at ${Math.min(
                    ...clCrossCells.map((c) => c["y"] ?? 0),
                  ).toFixed(0)} J/cm2 (at ${Math.min(
                    ...clCrossCells
                      .filter(
                        (c) =>
                          (c["y"] ?? 0) ===
                          Math.min(...clCrossCells.map((d) => d["y"] ?? 0)),
                      )
                      .map((c) => c["x"] ?? 0),
                  ).toFixed(0)} µM iron).`;
            if (committedCells.length === 0)
              return (
                "No cell on this map crosses Committed: light and iron together stay below the threshold at your current settings." +
                clLine
              );
            const minDose = Math.min(...committedCells.map((c) => c["y"] ?? 0));
            const maxIronNoLight = Math.max(
              ...grid.cells[0]!.filter((c) => (c["ferroptosisRisk"] ?? 0) < 100).map((c) => c["x"] ?? 0),
              0,
            );
            return `${committedCells.length} of ${grid.cells.flat().length} cells are Committed. The lowest dose that commits any cell is ${minDose.toFixed(0)} J/cm2; without light, iron alone commits above ${maxIronNoLight.toFixed(0)} µM.${clLine}`;
          })()}{" "}
          {(() => {
            const fmt = (v: number | null) => (v === null ? "never within 60 J/cm2" : `${v.toFixed(0)} J/cm2`);
            return `At the map's highest iron, the 30% ox CL threshold is crossed at ${fmt(noCrossing.now)} with your current NO (${inputs.nitricOxide.toFixed(0)} nM), at ${fmt(noCrossing.low)} with NO at 0, and at ${fmt(noCrossing.high)} with NO at 400 nM.`;
          })()}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Study points (Chen 2011, Huang 2013): dashed line {studyRows[0]!.dose.toFixed(0)} J/cm2, solid
          line {studyRows[1]!.dose.toFixed(0)} J/cm2. Fe-S erosion at your current inputs:{" "}
          {studyRows[0]!.fes.toFixed(1)}% intact at {studyRows[0]!.dose.toFixed(0)} J/cm2,{" "}
          {studyRows[1]!.fes.toFixed(1)}% intact at {studyRows[1]!.dose.toFixed(0)} J/cm2 (aconitase
          tracks Fe-S).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => explain("map")} disabled={busy || cooling > 0 || remaining === 0}>
            {busy && source === "map" ? "Interpreting..." : "Interpret this map (AI)"}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Sends iron-only, light-only and combined effects plus synergy for every output. The result is saved as a
            new scenario automatically.
          </span>
        </div>
      </section>

      <section ref={panelRef} className="panel scroll-mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="mono-label">
            {source === "map" ? "Interaction map interpretation (AI)" : "Explain these results (AI)"}
          </div>
          {remaining !== null && (
            <span className="font-mono text-[10px] text-muted-foreground">{remaining} of 10 left (10 min)</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Sends the sensitivity table above to the AI and streams back an explanation of the dominant
          drivers, key parameter interactions and what they imply for ROS and Fe-S outputs.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => explain("table")} disabled={busy || cooling > 0 || remaining === 0}>
            {busy ? "Explaining..." : "Explain these results"}
          </Button>
          {busy && (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              Stop
            </Button>
          )}
          {!busy && cooling > 0 && (
            <span className="text-[11px] text-muted-foreground">Ready in {cooling}s</span>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {savedName && (
          <p className="mt-3 text-xs text-primary">Saved as scenario "{savedName}". Open it in Scenarios or Compare.</p>
        )}
        {busy && !text && (
          <p className="mt-3 animate-pulse text-xs text-muted-foreground">Thinking...</p>
        )}
        {text && (
          <div className="prose prose-sm prose-invert mt-4 max-w-none text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h2]:text-primary">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}
