import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { simulate, type Inputs, type Outputs } from "@/lib/mito/model";
import { Metric, chartStyle, tooltipProps } from "./SimulatorShared";

export function FerroptosisPanel({ out, inputs }: { out: Outputs; inputs: Inputs }) {
  // Ferroptosis risk versus light dose at the current settings, so the panel
  // shows whether light protects or sensitizes without leaving the tab.
  const riskCurve = Array.from({ length: 25 }, (_, k) => {
    const dose = k * 2.5;
    const red = simulate({ ...inputs, redDose: dose });
    const nir = simulate({ ...inputs, nirDose: dose });
    return {
      dose,
      red: Number(red.ferroptosisRisk.toFixed(1)),
      nir: Number(nir.ferroptosisRisk.toFixed(1)),
      clRed: Number(red.cardiolipinOx.toFixed(1)),
      clNir: Number(nir.cardiolipinOx.toFixed(1)),
    };
  });
  const baseRisk = riskCurve[0]!;
  const activeDose = inputs.redDose > 0 ? inputs.redDose : inputs.nirDose;
  const activeRisk = out.ferroptosisRisk;
  const delta = activeRisk - baseRisk.red;
  const verdict =
    activeDose <= 0
      ? "No light dose set. The curves show how risk would shift."
      : delta < -1
        ? `Light protects here: risk ${activeRisk.toFixed(0)} versus ${baseRisk.red.toFixed(0)} without light.`
        : delta > 1
          ? `Light sensitizes here: risk ${activeRisk.toFixed(0)} versus ${baseRisk.red.toFixed(0)} without light.`
          : `Light is roughly neutral here: risk ${activeRisk.toFixed(0)} versus ${baseRisk.red.toFixed(0)} without light.`;
  // Risk versus labile iron under four antioxidant states, at the active
  // light dose, so blocking GPx4 or FSP1 shows how it tilts light's effect.
  const blockerStates = [
    { key: "current", label: "Current", patch: {} },
    { key: "gpx4blocked", label: "GPx4 blocked", patch: { gpx4: 0 } },
    { key: "fsp1blocked", label: "FSP1 blocked", patch: { fsp1: 0 } },
    { key: "bothBlocked", label: "Both blocked", patch: { gpx4: 0, fsp1: 0 } },
  ] as const;
  const ironCurve = Array.from({ length: 21 }, (_, k) => {
    const iron = k;
    const row: Record<string, number> = { iron };
    for (const s of blockerStates) {
      row[s.key] = Number(simulate({ ...inputs, ...s.patch, labileIron: iron }).ferroptosisRisk.toFixed(1));
    }
    return row;
  });
  // Tilt of light's effect at the current iron for each state: risk with the
  // active dose minus risk with no light. Negative means light protects.
  const tiltLines = blockerStates.map((s) => {
    const withLight = simulate({ ...inputs, ...s.patch }).ferroptosisRisk;
    const noLight = simulate({ ...inputs, ...s.patch, redDose: 0, nirDose: 0 }).ferroptosisRisk;
    const d = withLight - noLight;
    const word = d < -1 ? "protects" : d > 1 ? "sensitizes" : "neutral";
    return `${s.label}: light ${word} (${d >= 0 ? "+" : ""}${d.toFixed(1)})`;
  });
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
      <div className="mt-4 space-y-1">
        <div className="mono-label">Ferroptosis risk versus light dose</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskCurve}>
              <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dose" stroke={chartStyle.axis} fontSize={11} unit=" J/cm2" />
              <YAxis stroke={chartStyle.axis} fontSize={11} domain={[0, 100]} />
              <Tooltip {...tooltipProps()} />
              <Line type="monotone" dataKey="red" name="Risk, 660 nm" stroke="var(--color-chart-5)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nir" name="Risk, 810 nm" stroke="var(--color-chart-1)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Line type="monotone" dataKey="clRed" name="Ox CL, 660 nm (%)" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clNir" name="Ox CL, 810 nm (%)" stroke="var(--color-chart-2)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <ReferenceLine y={30} stroke="var(--color-destructive)" strokeDasharray="6 4" label={{ value: "Committed 30% ox CL", position: "insideTopRight", fontSize: 10, fill: "var(--color-destructive)" }} />
              {activeDose > 0 && (
                <ReferenceLine x={activeDose} stroke="var(--color-foreground)" strokeDasharray="4 3" label={{ value: "now", position: "top", fontSize: 10, fill: "var(--color-foreground)" }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground">{verdict} Light lowers lipid peroxyl radicals through NO photorelease but raises superoxide and H2O2 directly, so the net sign depends on iron and dose. The ox CL curves show oxidized cardiolipin on the same 0 to 100 axis; where they climb past the dashed 30% line, cells cross Committed at that dose.</p>
      </div>
      <div className="mt-4 space-y-1">
        <div className="mono-label">Ferroptosis risk versus labile iron</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ironCurve}>
              <CartesianGrid stroke={chartStyle.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="iron" stroke={chartStyle.axis} fontSize={11} unit=" µM" />
              <YAxis stroke={chartStyle.axis} fontSize={11} domain={[0, 100]} />
              <Tooltip {...tooltipProps()} />
              <Line type="monotone" dataKey="current" name="Current" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gpx4blocked" name="GPx4 blocked" stroke="var(--color-chart-5)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fsp1blocked" name="FSP1 blocked" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bothBlocked" name="Both blocked" stroke="var(--color-destructive)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              {inputs.labileIron > 0 && (
                <ReferenceLine x={inputs.labileIron} stroke="var(--color-foreground)" strokeDasharray="4 3" label={{ value: "now", position: "top", fontSize: 10, fill: "var(--color-foreground)" }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Curves run at your active light dose ({activeDose.toFixed(0)} J/cm2). Light's tilt at your current iron:{" "}
          {tiltLines.join(" · ")}
        </p>
      </div>
    </div>
  );
}
