import { AtpDriverNetwork } from "./AtpDriverNetwork";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { atpSplit, etcSteps, liveAtpPerPair, phenotype, stdAtpPerPair } from "@/lib/mito/reference";

const GREEN = "#4EDEAE";
const AMBER = "#FFBE5C";

const FUEL_PRESETS: { name: string; patch: Partial<Inputs> }[] = [
  { name: "Respiration", patch: { nadhRatio: 0.55, succinate: 0.6 } },
  { name: "Warburg shift", patch: { nadhRatio: 0.25, succinate: 0.2 } },
  { name: "Glycolysis only", patch: { nadhRatio: 0.05, succinate: 0 } },
];

const fluxOf = (o: Outputs, i: number) => (i <= 2 ? o.fluxCI : i === 3 ? o.fluxCII : o.fluxCIV);

/*
 * Live Warburg view: current run vs the healthy default respiration baseline
 * (same geometry). Shares are fractions of the total absolute per-step ATP
 * rate gap. Glycolysis split is the shared estimate from reference.ts.
 */
export function WarburgDashboard({
  inputs,
  setInputs,
  geo,
  out,
  onOpenSimulator,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  geo: Geometry;
  out: Outputs;
  onOpenSimulator: () => void;
}) {
  const base = useMemo(() => simulate(defaultInputs, geo), [geo]);
  const live = atpSplit(out);
  const ref = atpSplit(base);
  const pheno = phenotype(inputs);

  const rows = useMemo(() => {
    const r = etcSteps.map((s, i) => {
      const y = liveAtpPerPair(s, inputs.deltaPsi, inputs.uncoupling).proton;
      const yb = liveAtpPerPair(s, defaultInputs.deltaPsi, defaultInputs.uncoupling).proton;
      const rate = (y * fluxOf(out, i)) / 2;
      const rateB = (yb * fluxOf(base, i)) / 2;
      const ok = y >= stdAtpPerPair(s).proton - 1e-9;
      return { step: s.step, ev: s.ev, y, rate, rateB, diff: rate - rateB, ok };
    });
    const tot = r.reduce((a, x) => a + Math.abs(x.diff), 0);
    return r.map((x) => ({
      ...x,
      share: tot > 0 ? (Math.abs(x.diff) / tot) * 100 : 0,
      pct: x.rateB > 0 ? ((x.rate - x.rateB) / x.rateB) * 100 : 0,
    }));
  }, [inputs, out, base]);

  const netRows = useMemo(() => rows.map((r) => ({ s: { step: r.step, ev: r.ev }, ra: r.rateB, rb: r.rate, diff: r.diff })), [rows]);
  const netTotal = netRows.reduce((a, r) => a + Math.abs(r.diff), 0);
  const [netFocus, setNetFocus] = useState<number | null>(null);

  const bars = rows
    .filter((r) => r.share > 0.05)
    .sort((a, b) => b.share - a.share)
    .map((r) => ({
      name: r.step.replace("Complex", "C"),
      share: r.share,
      up: r.diff >= 0,
      label: `${r.pct >= 0 ? "+" : ""}${r.pct.toFixed(0)}%`,
    }));

  const split = [
    { name: "Now", respiration: live.respiration, glycolysis: live.glycolysis, pct: live.glycolysisPct },
    { name: "Respiration baseline", respiration: ref.respiration, glycolysis: ref.glycolysis, pct: ref.glycolysisPct },
  ];

  return (
    <div className="space-y-4" data-testid="warburg-dashboard">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Warburg dashboard</h2>
            <p className="text-xs text-muted-foreground">
              Live run vs the healthy respiration baseline. Phenotype: <span className="font-medium text-foreground">{pheno}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FUEL_PRESETS.map((p) => (
              <Button key={p.name} size="sm" variant="outline" onClick={() => setInputs({ ...inputs, ...p.patch })}>
                {p.name}
              </Button>
            ))}
            <Button size="sm" onClick={onOpenSimulator}>Open in Simulator</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label="Respiration ATP" value={`${live.respiration.toFixed(1)} µM/s`} />
          <Stat label="Glycolysis ATP" value={`${live.glycolysis.toFixed(1)} µM/s`} />
          <Stat label="Glycolysis share" value={`${live.glycolysisPct.toFixed(0)}%`} />
          <Stat label="NADH / succinate" value={`${inputs.nadhRatio.toFixed(2)} / ${inputs.succinate.toFixed(2)}`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">ATP source split</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={split} layout="vertical" stackOffset="expand" margin={{ left: 10, right: 76 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)} µM/s`} />
                <Bar dataKey="respiration" stackId="a" fill="var(--primary)" />
                <Bar dataKey="glycolysis" stackId="a" fill="var(--accent)">
                  <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(0)}% glycolysis`} style={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground">Estimate: glycolysis covers the shortfall below default ATP demand, 5% floor. Not a measured lactate rate.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Driver share vs baseline, %</h3>
          {bars.length === 0 ? (
            <p className="mt-6 text-xs text-muted-foreground">Matches the baseline. Try Warburg shift or Glycolysis only.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} layout="vertical" margin={{ left: 10, right: 44 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip formatter={(v: number, _n, p) => [`${v.toFixed(0)}% share, ${(p.payload as { label: string }).label}`, "Driver"]} />
                  <Bar dataKey="share">
                    {bars.map((b) => <Cell key={b.name} fill={b.up ? "var(--primary)" : "var(--destructive)"} />)}
                    <LabelList dataKey="label" position="right" style={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Green: the live run raises that step's ATP rate. Red: it lowers it.</p>
        </div>
      </div>

      {netTotal > 0 && (
        <div data-testid="warburg-network">
          <AtpDriverNetwork rows={netRows} totalAbs={netTotal} focus={netFocus} onFocus={setNetFocus} />
          <p className="mt-1 text-[11px] text-muted-foreground">A = healthy run (default settings), B = your current run.</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">ETC steps, live ATP per pair</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.step}
              data-testid="warburg-step"
              className="rounded-md border border-border px-3 py-2 text-xs"
              style={{ borderLeft: `3px solid ${r.ok ? GREEN : AMBER}` }}
            >
              <div className="font-medium">{r.step}</div>
              <div className="text-muted-foreground">
                {r.ev > 0 ? "+" : ""}{r.ev} eV ·{" "}
                <span style={{ color: r.ok ? GREEN : AMBER }}>{r.y.toFixed(2)} ATP/pr</span> · {r.rate.toFixed(1)} µM/s
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Green: live ATP/pr at or above the healthy default (160 mV, 5% uncoupling). Amber: below.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
