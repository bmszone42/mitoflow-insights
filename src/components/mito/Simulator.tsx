import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultInputs, doseSweep, simulate, type Inputs, type Outputs } from "@/lib/mito/model";

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

  const redSweep = doseSweep(inputs, "red");
  const nirSweep = doseSweep(inputs, "nir");
  const sweep = redSweep.map((r, k) => ({
    dose: r.dose,
    redATP: r.atp,
    nirATP: nirSweep[k]?.atp ?? 0,
    redROS: r.superoxide,
  }));

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

        <FerroptosisPanel out={out} />

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
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Curves peak near 10 J/cm2 at 660 nm and 20 J/cm2 at 810 nm, then decline, matching the
            biphasic Arndt-Schulz response of cytochrome c oxidase.
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
