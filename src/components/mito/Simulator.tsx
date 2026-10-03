import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultInputs, doseSweep, simulate, timeCourse, timeToCommitted, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { atpSplit, etcSteps, liveAtpPerPair, phenotype, poRatio } from "@/lib/mito/reference";
import { SliderPanel } from "./SliderPanel";
import { StandardStateNote } from "./StandardState";
import { FerroptosisPanel } from "./FerroptosisPanel";
import { PhotoreceptorPanel } from "./PhotoreceptorPanel";
import { RosBudgetPanel } from "./RosBudgetPanel";
import { WarburgSummaryCard } from "./WarburgSummaryCard";
import { Metric, chartStyle, tooltipProps } from "./SimulatorShared";



export function Simulator({
  inputs,
  setInputs,
  geo,
  out,
  onSaved,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  geo: Geometry;
  out: Outputs;
  onSaved?: () => void;
}) {
  // All species compared in pM so a single log10 axis stays readable.
  const rosData = [
    { name: "O2•-", pm: out.superoxide * 1e3, fill: "var(--color-chart-1)" },
    { name: "H2O2", pm: out.hydrogenPeroxide * 1e3, fill: "var(--color-chart-4)" },
    { name: "•OH", pm: out.hydroxylRadical, fill: "var(--color-chart-5)" },
    { name: "ONOO-", pm: out.peroxynitrite * 1e3, fill: "var(--color-chart-2)" },
    { name: "1O2", pm: out.singletOxygen, fill: "var(--color-chart-3)" },
    { name: "LOO•", pm: out.lipidPeroxyl * 1e3, fill: "var(--color-chart-5)" },
  ].map((d) => ({
    ...d,
    log: Number(Math.log10(Math.max(d.pm, 1e-4)).toFixed(2)),
    label: d.pm >= 1e3 ? `${(d.pm / 1e3).toFixed(2)} nM` : `${d.pm.toPrecision(3)} pM`,
  }));

  const [doseWl, setDoseWl] = useState<"red" | "nir">("red");
  const redSweep = doseSweep(inputs, "red");
  const nirSweep = doseSweep(inputs, "nir");
  const activeSweep = doseWl === "red" ? redSweep : nirSweep;
  // Fitted estimates at the study reference doses (3 and 30 J/cm2):
  // percent change in superoxide and H2O2 versus zero dose.
  const dose0 = activeSweep[0]!;
  const fittedAt = (target: number) => {
    const row = activeSweep.reduce((best, r) =>
      Math.abs(r.dose - target) < Math.abs(best.dose - target) ? r : best, activeSweep[0]!);
    const pct = (v: number, b: number) => (b > 0 ? ((v - b) / b) * 100 : 0);
    return {
      o2: pct(row.superoxide, dose0.superoxide),
      h2o2: pct(row.h2o2, dose0.h2o2),
      fes: row.fesIntact,
      acon: row.aconitase,
      fe: pct(row.freeIron, dose0.freeIron),
    };
  };
  const fit3 = fittedAt(3);
  const fit30 = fittedAt(30);
  const speciesSweep = activeSweep.map((r) => ({
    ...r,
    // log10 of pM so all species share one axis; floor avoids -Infinity
    logSuperoxide: Number(Math.log10(Math.max(r.superoxide * 1e3, 1e-4)).toFixed(2)),
    logH2o2: Number(Math.log10(Math.max(r.h2o2, 1e-4)).toFixed(2)),
    logHydroxyl: Number(Math.log10(Math.max(r.hydroxyl, 1e-4)).toFixed(2)),
    logPn: Number(Math.log10(Math.max(r.peroxynitrite, 1e-4)).toFixed(2)),
    logSinglet: Number(Math.log10(Math.max(r.singletOxygen, 1e-4)).toFixed(2)),
    logLoo: Number(Math.log10(Math.max(r.lipidPeroxyl, 1e-4)).toFixed(2)),
    // free iron as percent of the zero-dose value so it shares the right axis
    freeFePct: dose0.freeIron > 0 ? (r.freeIron / dose0.freeIron) * 100 : 100,
  }));
  // Labile iron dose response: free Fe2+ and Fe-S / aconitase versus the iron
  // slider, with and without the active light dose. The zero-iron end is what
  // a chelator preset (DFO/DFOm) drives the cell to.
  const ironDoseCurve = Array.from({ length: 21 }, (_, k) => {
    const iron = k;
    const dark = simulate({ ...inputs, labileIron: iron, redDose: 0, nirDose: 0 });
    const lit = simulate({ ...inputs, labileIron: iron });
    return {
      iron,
      freeFeDark: Number(dark.freeIron.toFixed(3)),
      freeFeLit: Number(lit.freeIron.toFixed(3)),
      fesDark: Number((dark.fesIntact * 100).toFixed(1)),
      fesLit: Number((lit.fesIntact * 100).toFixed(1)),
      aconDark: Number(dark.aconitaseActivity.toFixed(1)),
      aconLit: Number(lit.aconitaseActivity.toFixed(1)),
    };
  });
  const chelatorRow = ironDoseCurve[0]!;
  // Nitric oxide dose response: ONOO-, Fe-S integrity and oxidized cardiolipin
  // versus the NO slider, at the active light dose. NO scavenges superoxide
  // into ONOO-, so Fe-S erosion shifts from the superoxide term to the
  // peroxynitrite term as NO rises.
  const noDoseCurve = Array.from({ length: 21 }, (_, k) => {
    const no = k * 20;
    const o = simulate({ ...inputs, nitricOxide: no });
    return {
      no,
      onoo: Number(o.peroxynitrite.toFixed(3)),
      fes: Number((o.fesIntact * 100).toFixed(1)),
      clOx: Number(o.cardiolipinOx.toFixed(1)),
    };
  });
  const sweep = redSweep.map((r, k) => ({
    dose: r.dose,
    redATP: r.atp,
    nirATP: nirSweep[k]?.atp ?? 0,
    redROS: r.superoxide,
    // hours to reach Committed after an acute GPx4 block at this dose (null = never within 48 h)
    redTTC: timeToCommitted({ ...inputs, redDose: r.dose }),
    nirTTC: timeToCommitted({ ...inputs, nirDose: nirSweep[k]?.dose ?? 0 }),
  }));

  // Ferroptosis time course after an acute GPx4 block at the current settings.
  const course = timeCourse(inputs);
  const tPrimed = course.find((p) => p.state !== "Protected")?.t ?? null;
  const tCommitted = course.find((p) => p.state === "Committed")?.t ?? null;

  // Light dose comparison: percent change versus zero dose for each species,
  // both wavelengths, so the curves share one linear axis.
  const pctOf = (v: number, b: number) => (b > 0 ? ((v - b) / b) * 100 : 0);
  const doseCmp = redSweep.map((r, k) => {
    const n = nirSweep[k]!;
    return {
      dose: r.dose,
      o2Red: pctOf(r.superoxide, redSweep[0]!.superoxide),
      o2Nir: pctOf(n.superoxide, nirSweep[0]!.superoxide),
      h2o2Red: pctOf(r.h2o2, redSweep[0]!.h2o2),
      h2o2Nir: pctOf(n.h2o2, nirSweep[0]!.h2o2),
      ohRed: pctOf(r.hydroxyl, redSweep[0]!.hydroxyl),
      ohNir: pctOf(n.hydroxyl, nirSweep[0]!.hydroxyl),
    };
  });
  const cmpAt = (target: number) =>
    doseCmp.reduce((best, r) => (Math.abs(r.dose - target) < Math.abs(best.dose - target) ? r : best), doseCmp[0]!);
  const cmp3 = cmpAt(3);
  const cmp30 = cmpAt(30);
  const cmp60 = cmpAt(60);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <SliderPanel inputs={inputs} setInputs={setInputs} geo={geo} onSaved={onSaved} />

      <div className="space-y-4">
        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Steady state</h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              photon gain x{out.photonGain.toFixed(2)}
            </Badge>
          </div>
          <div className="mt-2">
            <StandardStateNote
              psi={inputs.deltaPsi}
              uncoupling={inputs.uncoupling}
              poNadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh")}
              poFadh={poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2")}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <Metric label="ATP flux" value={out.atpFlux.toFixed(1)} unit="µM/s" />
            <Metric
              label="P/O ratio (NADH)"
              value={poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh").toFixed(2)}
              unit="ATP/O"
            />
            <Metric
              label="P/O ratio (FADH2)"
              value={poRatio(inputs.deltaPsi, inputs.uncoupling, "fadh2").toFixed(2)}
              unit="ATP/O"
            />
            <Metric label="Complex IV flux" value={out.fluxCIV.toFixed(1)} unit="µM/s" />
            <Metric
              label="71 THz output"
              value={out.emission71THz.toFixed(1)}
              unit="rel"
              tone="accent"
            />
            <Metric
              label="Redox stress"
              value={out.redoxStress.toFixed(0)}
              unit="/100"
              tone="warning"
            />
            <Metric label="Superoxide" value={out.superoxide.toFixed(2)} unit="nM" />
            <Metric label="H2O2" value={out.hydrogenPeroxide.toFixed(1)} unit="nM" />
            <Metric
              label="Fe-S intact"
              value={(out.fesIntact * 100).toFixed(1)}
              unit="%"
              tone="accent"
            />
            <Metric
              label="Free Fe2+"
              value={out.freeIron.toFixed(2)}
              unit="µM"
              tone="warning"
            />
          </div>
        </div>

        <WarburgSummaryCard inputs={inputs} out={out} geo={geo} />

        <RosBudgetPanel out={out} />

        <PhotoreceptorPanel out={out} />

        <FerroptosisPanel out={out} inputs={inputs} />

        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Ferroptosis time course</h3>
              <p className="mono-label mt-1">Cardiolipin oxidation after an acute GPx4 block</p>
            </div>
            <Badge
              variant={tCommitted !== null ? "destructive" : tPrimed !== null ? "secondary" : "outline"}
              className="font-mono text-[11px]"
            >
              {tCommitted !== null
                ? `Primed ${tPrimed?.toFixed(1)} h · Committed ${tCommitted.toFixed(1)} h`
                : tPrimed !== null
                  ? `Primed ${tPrimed.toFixed(1)} h · not Committed within 48 h`
                  : "Stays Protected for 48 h"}
            </Badge>
          </div>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={course}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke={chartStyle.axis} fontSize={11} unit=" h" />
                <YAxis
                  stroke={chartStyle.axis}
                  fontSize={11}
                  unit="%"
                  domain={[0, (max: number) => Math.max(35, Math.ceil(max))]}
                />
                <Tooltip {...tooltipProps()} />
                <ReferenceLine y={10} stroke="var(--color-warning)" strokeDasharray="4 3" label={{ value: "Primed", fill: chartStyle.axis, fontSize: 10, position: "insideTopRight" }} />
                <ReferenceLine y={30} stroke="var(--color-destructive)" strokeDasharray="4 3" label={{ value: "Committed", fill: chartStyle.axis, fontSize: 10, position: "insideTopRight" }} />
                <Line
                  type="monotone"
                  dataKey="cardiolipinOx"
                  name="Cardiolipin oxidized %"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            GPx4 is set to zero at t = 0 (RSL3 / ML162-like block); FSP1 and basal scavenging keep removing PLOOH
            while Fe2+-driven propagation builds it. The cell crosses Primed at 10% oxidized cardiolipin and
            Committed at 30%. The dose chart above shows how red and near-infrared dose shift the time to
            Committed.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="panel p-4">
            <h3 className="text-sm font-semibold">ROS species, steady state</h3>
            <p className="mono-label mt-1">log10 concentration in pM</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rosData}>
                  <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke={chartStyle.axis} fontSize={11} />
                  <YAxis stroke={chartStyle.axis} fontSize={11} domain={[-4, "auto"]} />
                  <Tooltip
                    {...tooltipProps()}
                    formatter={(_v, _n, item) => [
                      (item?.payload as { label?: string })?.label ?? "",
                      "concentration",
                    ]}
                  />
                  <Bar dataKey="log" radius={[4, 4, 0, 0]}>
                    {rosData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Hover a bar for the actual concentration. Hydroxyl radical sits many orders lower
              because it reacts within nanometres of where it forms.
            </p>
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold">Mid-infrared output band</h3>
            <p className="mono-label mt-1">60 to 90 THz, reporter peak at 71 THz</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={out.emissionSpectrum}>
                  <defs>
                    <linearGradient id="emit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.75} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="freqTHz" stroke={chartStyle.axis} fontSize={11} unit=" THz" />
                  <YAxis stroke={chartStyle.axis} fontSize={11} />
                  <Tooltip {...tooltipProps()} />
                  <Area
                    type="monotone"
                    dataKey="intensity"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    fill="url(#emit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Photon dose response</h3>
          <p className="mono-label mt-1">ATP flux and superoxide versus delivered dose</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweep}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dose" stroke={chartStyle.axis} fontSize={11} unit=" J/cm2" />
                <YAxis yAxisId="left" stroke={chartStyle.axis} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke={chartStyle.axis} fontSize={11} />
                <Tooltip {...tooltipProps()} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="redATP"
                  name="ATP, 660 nm"
                  stroke="var(--color-chart-5)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="nirATP"
                  name="ATP, 810 nm"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="redROS"
                  name="O2•- nM"
                  stroke="var(--color-chart-2)"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  dot={false}
                />
                <YAxis yAxisId="hours" hide domain={[0, 48]} />
                <Line
                  yAxisId="hours"
                  type="monotone"
                  dataKey="redTTC"
                  name="Time to Committed, 660 nm (h)"
                  stroke="var(--color-destructive)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  yAxisId="hours"
                  type="monotone"
                  dataKey="nirTTC"
                  name="Time to Committed, 810 nm (h)"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Curves peak near 10 J/cm2 at 660 nm and 20 J/cm2 at 810 nm, then decline, matching the
            biphasic Arndt-Schulz response of cytochrome c oxidase. The solid red and dashed amber lines show
            the hours to reach Committed after an acute GPx4 block at each dose (0 to 48 h scale); a gap means
            the cells never commit within 48 h.
          </p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">ROS and Fe-S dose response</h3>
              <p className="mono-label mt-1">Each species versus delivered dose (log pM)</p>
            </div>
            <div className="flex gap-1">
              {(["red", "nir"] as const).map((w) => (
                <Button
                  key={w}
                  size="sm"
                  variant={doseWl === w ? "default" : "outline"}
                  onClick={() => setDoseWl(w)}
                >
                  {w === "red" ? "660 nm" : "810 nm"}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speciesSweep}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dose" stroke={chartStyle.axis} fontSize={11} unit=" J/cm2" />
                <YAxis
                  yAxisId="left"
                  stroke={chartStyle.axis}
                  fontSize={11}
                  domain={[-4, "auto"]}
                  tickFormatter={(v: number) => `1e${v}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={chartStyle.axis}
                  fontSize={11}
                  domain={[0, 140]}
                  unit="%"
                />
                <Tooltip
                  {...tooltipProps()}
                  formatter={(value: number, name: string) =>
                    name === "Fe-S intact" || name === "Aconitase" || name === "Free Fe2+ (rel)"
                      ? [`${value.toFixed(1)}%`, name]
                      : [`${(10 ** value).toPrecision(3)} pM`, name]
                  }
                />
                <Line yAxisId="left" type="monotone" dataKey="logSuperoxide" name="O2•-" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="logH2o2" name="H2O2" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="logHydroxyl" name="•OH" stroke="var(--color-chart-5)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="logPn" name="ONOO-" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="logSinglet" name="1O2" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="logLoo" name="LOO•" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fesIntact" name="Fe-S intact" stroke="var(--color-foreground)" strokeDasharray="5 3" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="aconitase" name="Aconitase" stroke="var(--color-accent)" strokeDasharray="2 3" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="freeFePct" name="Free Fe2+ (rel)" stroke="var(--color-destructive)" strokeDasharray="8 3" strokeWidth={2} dot={false} />
                <ReferenceLine
                  yAxisId="left"
                  x={3}
                  stroke="var(--color-primary)"
                  strokeDasharray="4 3"
                  label={{ value: "3 J/cm2", position: "insideTopLeft", fontSize: 10, fill: "var(--color-primary)" }}
                />
                <ReferenceLine
                  yAxisId="left"
                  x={30}
                  stroke="var(--color-accent)"
                  strokeDasharray="4 3"
                  label={{ value: "30 J/cm2", position: "insideTopRight", fontSize: 10, fill: "var(--color-accent)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-primary">3 J/cm2 (low-dose burst):</span>{" "}
              fitted estimate O2•- {fit3.o2 >= 0 ? "+" : ""}{fit3.o2.toFixed(0)}%, H2O2{" "}
              {fit3.h2o2 >= 0 ? "+" : ""}{fit3.h2o2.toFixed(0)}%, Fe-S {fit3.fes.toFixed(1)}%,
              aconitase {fit3.acon.toFixed(1)}%, free Fe2+ {fit3.fe >= 0 ? "+" : ""}{fit3.fe.toFixed(1)}%
            </p>
            <p>
              <span className="font-medium text-accent">30 J/cm2 (high-dose stress):</span>{" "}
              fitted estimate O2•- {fit30.o2 >= 0 ? "+" : ""}{fit30.o2.toFixed(0)}%, H2O2{" "}
              {fit30.h2o2 >= 0 ? "+" : ""}{fit30.h2o2.toFixed(0)}%, Fe-S {fit30.fes.toFixed(1)}%,
              aconitase {fit30.acon.toFixed(1)}%, free Fe2+ {fit30.fe >= 0 ? "+" : ""}{fit30.fe.toFixed(1)}%
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Species are plotted as log10 of pM so they share one axis; Fe-S intact, aconitase and
            free Fe2+ (percent of the zero-dose value) use the right axis. Superoxide and H2O2 rise with dose through the direct photon effect; peroxynitrite
            falls as NO is photodissociated from complex IV. Markers are our own fitted estimates,
            shaped after Chen 2011 (low-dose burst) and Huang 2013 (high-dose stress), not measured values.
          </p>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Light dose comparison</h3>
          <p className="mono-label mt-1">Superoxide, H2O2 and hydroxyl radical, percent change versus no light</p>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={doseCmp}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dose" stroke={chartStyle.axis} fontSize={11} unit=" J/cm2" />
                <YAxis stroke={chartStyle.axis} fontSize={11} unit="%" />
                <Tooltip
                  {...tooltipProps()}
                  formatter={(value: number, name: string) => [`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`, name]}
                />
                <ReferenceLine y={0} stroke={chartStyle.axis} strokeDasharray="2 3" />
                <ReferenceLine x={3} stroke="var(--color-primary)" strokeDasharray="4 3" label={{ value: "3", position: "top", fontSize: 10, fill: "var(--color-primary)" }} />
                <ReferenceLine x={30} stroke="var(--color-accent)" strokeDasharray="4 3" label={{ value: "30", position: "top", fontSize: 10, fill: "var(--color-accent)" }} />
                <ReferenceLine x={60} stroke="var(--color-destructive)" strokeDasharray="4 3" label={{ value: "60", position: "top", fontSize: 10, fill: "var(--color-destructive)" }} />
                <Line type="monotone" dataKey="o2Red" name="O2•- 660 nm" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="o2Nir" name="O2•- 810 nm" stroke="var(--color-chart-1)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="h2o2Red" name="H2O2 660 nm" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="h2o2Nir" name="H2O2 810 nm" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="ohRed" name="•OH 660 nm" stroke="var(--color-chart-5)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ohNir" name="•OH 810 nm" stroke="var(--color-chart-5)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            <p>
              <span className="font-medium text-primary">3 J/cm2:</span> O2•- +{cmp3.o2Red.toFixed(0)}%,
              H2O2 +{cmp3.h2o2Red.toFixed(0)}%, •OH {cmp3.ohRed >= 0 ? "+" : ""}{cmp3.ohRed.toFixed(0)}% (660 nm)
            </p>
            <p>
              <span className="font-medium text-accent">30 J/cm2:</span> O2•- +{cmp30.o2Red.toFixed(0)}%,
              H2O2 +{cmp30.h2o2Red.toFixed(0)}%, •OH {cmp30.ohRed >= 0 ? "+" : ""}{cmp30.ohRed.toFixed(0)}% (660 nm)
            </p>
            <p>
              <span className="font-medium text-destructive">60 J/cm2:</span> O2•- +{cmp60.o2Red.toFixed(0)}%,
              H2O2 +{cmp60.h2o2Red.toFixed(0)}%, •OH {cmp60.ohRed >= 0 ? "+" : ""}{cmp60.ohRed.toFixed(0)}% (660 nm)
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Solid lines are 660 nm, dashed are 810 nm. Superoxide and H2O2 rise together through the direct
            photon effect on flavins and semiquinone; hydroxyl radical follows the labile iron pool, so it
            barely moves with light unless iron is high. Values at the markers are fitted estimates, not
            measured values.
          </p>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Labile iron dose response</h3>
          <p className="mono-label mt-1">Free Fe2+ and Fe-S integrity versus the iron slider, with and without light</p>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ironDoseCurve}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="iron" stroke={chartStyle.axis} fontSize={11} unit=" µM" />
                <YAxis yAxisId="left" stroke={chartStyle.axis} fontSize={11} unit=" µM" />
                <YAxis yAxisId="right" orientation="right" stroke={chartStyle.axis} fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  {...tooltipProps()}
                  formatter={(value: number, name: string) =>
                    name.startsWith("Free Fe2+") ? [`${value.toFixed(2)} µM`, name] : [`${value.toFixed(1)}%`, name]
                  }
                />
                <Line yAxisId="left" type="monotone" dataKey="freeFeLit" name="Free Fe2+ (light)" stroke="var(--color-destructive)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="freeFeDark" name="Free Fe2+ (no light)" stroke="var(--color-destructive)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fesLit" name="Fe-S intact (light)" stroke="var(--color-foreground)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fesDark" name="Fe-S intact (no light)" stroke="var(--color-foreground)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="aconLit" name="Aconitase (light)" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="aconDark" name="Aconitase (no light)" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                {inputs.labileIron > 0 && (
                  <ReferenceLine
                    yAxisId="left"
                    x={inputs.labileIron}
                    stroke="var(--color-foreground)"
                    strokeDasharray="4 3"
                    label={{ value: "now", position: "top", fontSize: 10, fill: "var(--color-foreground)" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Solid lines run at your active light dose, dashed lines with no light. The chelator preset
            (DFO/DFOm) drives the cell to the zero-iron end: free Fe2+ {chelatorRow.freeFeLit.toFixed(2)} µM,
            Fe-S {chelatorRow.fesLit.toFixed(1)}% intact. Free iron rises with the slider and gains a little
            more under light from released cluster iron; Fe-S erosion is light-driven, so the dashed and solid
            Fe-S lines split as dose rises, while iron alone barely moves them.
          </p>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Nitric oxide dose response</h3>
          <p className="mono-label mt-1">ONOO-, Fe-S integrity and oxidized cardiolipin versus the NO slider, at your active light dose</p>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={noDoseCurve}>
                <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="no" stroke={chartStyle.axis} fontSize={11} unit=" nM" />
                <YAxis yAxisId="left" stroke={chartStyle.axis} fontSize={11} unit=" nM" />
                <YAxis yAxisId="right" orientation="right" stroke={chartStyle.axis} fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  {...tooltipProps()}
                  formatter={(value: number, name: string) =>
                    name.startsWith("ONOO-") ? [`${value.toFixed(3)} nM`, name] : [`${value.toFixed(1)}%`, name]
                  }
                />
                <Line yAxisId="left" type="monotone" dataKey="onoo" name="ONOO-" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fes" name="Fe-S intact" stroke="var(--color-foreground)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="clOx" name="Ox cardiolipin" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <ReferenceLine
                  yAxisId="right"
                  y={30}
                  stroke="var(--color-destructive)"
                  strokeDasharray="6 4"
                  label={{ value: "Committed 30% ox CL", position: "insideTopRight", fontSize: 10, fill: "var(--color-destructive)" }}
                />
                {inputs.nitricOxide > 0 && (
                  <ReferenceLine
                    yAxisId="left"
                    x={inputs.nitricOxide}
                    stroke="var(--color-foreground)"
                    strokeDasharray="4 3"
                    label={{ value: "now", position: "top", fontSize: 10, fill: "var(--color-foreground)" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Raising NO converts superoxide into peroxynitrite, so Fe-S erosion shifts from the superoxide
            term to the ONOO- term and clusters keep eroding even as superoxide falls. The dashed red line
            is the 30% oxidized cardiolipin Committed threshold: if the ox cardiolipin curve crosses it,
            cells commit at that NO level.{" "}
            {noDoseCurve.some((r) => r.clOx >= 30)
              ? `Here the curve crosses Committed at ${noDoseCurve.find((r) => r.clOx >= 30)!.no.toFixed(0)} nM NO.`
              : "Here the curve stays below Committed across the whole NO range."}
          </p>
        </div>
      </div>
    </div>
  );
}

export { simulate };
