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
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultInputs, doseSweep, simulate, timeCourse, timeToCommitted, type Inputs, type Outputs } from "@/lib/mito/model";

type ControlDef = {
  key: keyof Inputs;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: "substrate" | "iron" | "photon" | "ferroptosis";
  hint: string;
};

const controls: ControlDef[] = [
  {
    key: "nadhRatio",
    label: "NADH / NAD+ pool",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    group: "substrate",
    hint: "Complex I reduction state",
  },
  {
    key: "succinate",
    label: "Succinate drive",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "substrate",
    hint: "Above 1.0 reverse electron transport starts",
  },
  {
    key: "oxygen",
    label: "Oxygen",
    unit: "µM",
    min: 0.5,
    max: 120,
    step: 0.5,
    group: "substrate",
    hint: "Complex IV Km near 0.5 to 1 µM",
  },
  {
    key: "deltaPsi",
    label: "Membrane potential",
    unit: "mV",
    min: 90,
    max: 210,
    step: 1,
    group: "substrate",
    hint: "Leak rises steeply above 150 mV",
  },
  {
    key: "adp",
    label: "ADP",
    unit: "µM",
    min: 0,
    max: 400,
    step: 5,
    group: "substrate",
    hint: "State 4 to state 3 respiratory control",
  },
  {
    key: "uncoupling",
    label: "Mild uncoupling",
    unit: "frac",
    min: 0,
    max: 1,
    step: 0.01,
    group: "substrate",
    hint: "UCP or protonophore activity",
  },
  {
    key: "labileIron",
    label: "Labile Fe2+ pool",
    unit: "µM",
    min: 0,
    max: 20,
    step: 0.1,
    group: "iron",
    hint: "Fenton substrate",
  },
  {
    key: "nitricOxide",
    label: "Nitric oxide",
    unit: "nM",
    min: 0,
    max: 400,
    step: 5,
    group: "iron",
    hint: "Competes with O2 at Complex IV",
  },
  {
    key: "antioxidantCapacity",
    label: "Antioxidant capacity",
    unit: "rel",
    min: 0.2,
    max: 2,
    step: 0.05,
    group: "iron",
    hint: "Prx3, GPx, GSH and thioredoxin-2",
  },
  {
    key: "redDose",
    label: "660 nm red dose",
    unit: "J/cm2",
    min: 0,
    max: 60,
    step: 0.5,
    group: "photon",
    hint: "Heme a3 and CuA absorption",
  },
  {
    key: "nirDose",
    label: "810 nm NIR dose",
    unit: "J/cm2",
    min: 0,
    max: 60,
    step: 0.5,
    group: "photon",
    hint: "CuA band, NO photodissociation",
  },
  {
    key: "irradiance",
    label: "Irradiance",
    unit: "mW/cm2",
    min: 1,
    max: 200,
    step: 1,
    group: "photon",
    hint: "Dose rate; high values saturate chromophores and heat",
  },
  {
    key: "tissueDepth",
    label: "Tissue depth",
    unit: "mm",
    min: 0,
    max: 20,
    step: 0.5,
    group: "photon",
    hint: "0 = cultured cells; 810 nm reaches deeper",
  },
  {
    key: "gpx4",
    label: "GPx4 activity",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "ferroptosis",
    hint: "0 mimics RSL3 or ML162 inhibition",
  },
  {
    key: "fsp1",
    label: "FSP1 / CoQ10H2",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "ferroptosis",
    hint: "GPx4-independent radical trapping",
  },
  {
    key: "cardiolipinPufa",
    label: "Cardiolipin PUFA fraction",
    unit: "frac",
    min: 0.2,
    max: 1,
    step: 0.01,
    group: "ferroptosis",
    hint: "ACSL4-driven substrate for peroxidation",
  },
];

const chartStyle = {
  grid: "var(--color-border)",
  axis: "var(--color-muted-foreground)",
};

function Metric({
  label,
  value,
  unit,
  tone = "primary",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "primary" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <div className="mono-label">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${toneClass}`}>
        {value}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function tooltipProps() {
  return {
    contentStyle: {
      background: "var(--color-popover)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      color: "var(--color-popover-foreground)",
      fontSize: "12px",
    },
    labelStyle: { color: "var(--color-muted-foreground)" },
  };
}

export function Simulator({
  inputs,
  setInputs,
  out,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  out: Outputs;
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
  }));
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

  const set = (key: keyof Inputs, value: number) => setInputs({ ...inputs, [key]: value });

  const groups: { id: ControlDef["group"]; title: string; note: string }[] = [
    { id: "substrate", title: "Bioenergetics", note: "Substrate supply and coupling" },
    { id: "iron", title: "Iron and defence", note: "Fenton substrate and scavenging" },
    { id: "photon", title: "Photon input", note: "Biphasic dose response" },
    { id: "ferroptosis", title: "Ferroptosis defence", note: "Lipid hydroperoxide removal" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="panel space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Model inputs</h2>
          <Button variant="ghost" size="sm" onClick={() => setInputs(defaultInputs)}>
            Reset
          </Button>
        </div>
        {groups.map((g) => (
          <div key={g.id} className="space-y-4">
            <div>
              <div className="mono-label">{g.title}</div>
              <p className="text-xs text-muted-foreground">{g.note}</p>
            </div>
            {controls
              .filter((c) => c.group === g.id)
              .map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-foreground">{c.label}</span>
                    <span className="font-mono text-xs text-primary">
                      {inputs[c.key]}
                      {c.unit ? ` ${c.unit}` : ""}
                    </span>
                  </div>
                  <Slider
                    value={[inputs[c.key]]}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    onValueChange={(v) => set(c.key, v[0] ?? inputs[c.key])}
                  />
                  <p className="text-[11px] text-muted-foreground">{c.hint}</p>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Steady state</h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              photon gain x{out.photonGain.toFixed(2)}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <Metric label="ATP flux" value={out.atpFlux.toFixed(1)} unit="µM/s" />
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

        <RosBudgetPanel out={out} />

        <PhotoreceptorPanel out={out} />

        <FerroptosisPanel out={out} />

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
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  {...tooltipProps()}
                  formatter={(value: number, name: string) =>
                    name === "Fe-S intact"
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
              {fit3.h2o2 >= 0 ? "+" : ""}{fit3.h2o2.toFixed(0)}%
            </p>
            <p>
              <span className="font-medium text-accent">30 J/cm2 (high-dose stress):</span>{" "}
              fitted estimate O2•- {fit30.o2 >= 0 ? "+" : ""}{fit30.o2.toFixed(0)}%, H2O2{" "}
              {fit30.h2o2 >= 0 ? "+" : ""}{fit30.h2o2.toFixed(0)}%
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Species are plotted as log10 of pM so they share one axis; Fe-S intact uses the right
            axis. Superoxide and H2O2 rise with dose through the direct photon effect; peroxynitrite
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
      </div>
    </div>
  );
}

export { simulate };

function FerroptosisPanel({ out }: { out: Outputs }) {
  const r = out.ploohRemoval;
  const total = r.gpx4 + r.fsp1 + r.basal;
  const share = [
    { name: "GPx4", v: r.gpx4, cls: "bg-primary" },
    { name: "FSP1", v: r.fsp1, cls: "bg-accent" },
    { name: "Basal", v: r.basal, cls: "bg-muted-foreground" },
  ];
  const ratioPct = Math.min(100, (out.propagationRatio / 1) * 100);
  const variant =
    out.ferroptosisState === "Committed" ? "destructive" : out.ferroptosisState === "Primed" ? "secondary" : "outline";
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Ferroptosis</h3>
        <Badge variant={variant} className="font-mono text-[11px]">
          {out.ferroptosisState} · risk {out.ferroptosisRisk.toFixed(0)}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="PLOOH" value={out.plooh.toPrecision(3)} unit="nM" tone="warning" />
        <Metric label="Cardiolipin oxidized" value={out.cardiolipinOx.toFixed(1)} unit="%" tone="warning" />
        <Metric label="Propagation / removal" value={out.propagationRatio.toFixed(2)} unit="ratio" />
      </div>
      <div className="mt-4 space-y-1">
        <div className="mono-label">Iron-driven propagation vs removal</div>
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-warning" style={{ width: `${ratioPct}%` }} />
          <div className="absolute inset-y-0 w-px bg-foreground" style={{ left: "40%" }} title="Primed" />
          <div className="absolute inset-y-0 w-px bg-destructive" style={{ left: "80%" }} title="Committed" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Primed at 0.4 or 10% oxidized cardiolipin (cytochrome c release begins). Committed at 0.8 or 30%, when Fe2+
          propagation outpaces GPx4 and FSP1.
        </p>
      </div>
      <div className="mt-4 space-y-1">
        <div className="mono-label">Share of PLOOH removal</div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {share.map((s) => (
            <div key={s.name} className={s.cls} style={{ width: `${(s.v / total) * 100}%` }} title={s.name} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {share.map((s) => (
            <span key={s.name} className="flex items-center gap-1">
              <span className={`inline-block size-2 rounded-full ${s.cls}`} />
              {s.name} {((s.v / total) * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ title, parts }: { title: string; parts: Record<string, number> }) {
  const entries = Object.entries(parts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const cls = ["bg-primary", "bg-accent", "bg-warning", "bg-destructive", "bg-muted-foreground"];
  return (
    <div className="space-y-1">
      <div className="mono-label">{title}</div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {entries.map(([k, v], n) => (
          <div key={k} className={cls[n % cls.length]} style={{ width: `${(v / total) * 100}%` }} title={`${k}: ${v.toExponential(2)} µM/s`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {entries.map(([k, v], n) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block size-2 rounded-full ${cls[n % cls.length]}`} />
            {k} {((v / total) * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

function RosBudgetPanel({ out }: { out: Outputs }) {
  const b = out.rosBudget;
  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">ROS sources and sinks</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          IMS O2•- {(b.superoxideIMS * 1e3).toPrecision(3)} pM · Prx3 hyperoxidized {(b.prxHyperoxidized * 100).toFixed(1)}% · Fe2+{" "}
          {(b.fe2Fraction * 100).toFixed(0)}%
        </span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <BudgetBar title="Superoxide sources" parts={b.superoxideSources} />
        <BudgetBar title="Superoxide sinks (matrix)" parts={b.superoxideSinks} />
        <BudgetBar title="H2O2 sources" parts={b.h2o2Sources} />
        <BudgetBar title="H2O2 sinks" parts={b.h2o2Sinks} />
        <BudgetBar title="Peroxynitrite sinks" parts={b.peroxynitriteSinks} />
        <BudgetBar title="Hydroxyl radical sources" parts={b.hydroxylSources} />
      </div>
    </div>
  );
}

function PhotoreceptorPanel({ out }: { out: Outputs }) {
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
