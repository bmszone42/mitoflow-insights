import { useMemo } from "react";
import { defaultInputs, simulate, type Outputs } from "@/lib/mito/model";
import { etcSteps } from "@/lib/mito/reference";

type Node = { id: string; x: number; y: number; label: string; value: (o: Outputs) => number; unit: string; digits?: number; tone: "ros" | "iron" | "lipid" | "light" | "fes" };
type Edge = { from: string; to: string; flux: (o: Outputs) => number; brake?: string };

const NODES: Node[] = [
  { id: "light", x: 90, y: 50, label: "Red / NIR light", value: (o) => o.photoreceptor.fluence.red + o.photoreceptor.fluence.nir, unit: "J/cm2", tone: "light" },
  { id: "etc", x: 90, y: 150, label: "ETC leak (CI, CIII)", value: (o) => o.superoxide, unit: "nM O2•-", digits: 3, tone: "ros" },
  { id: "h2o2", x: 300, y: 150, label: "H2O2", value: (o) => o.hydrogenPeroxide, unit: "nM", tone: "ros" },
  { id: "onoo", x: 90, y: 260, label: "ONOO- (NO + O2•-)", value: (o) => o.peroxynitrite, unit: "nM", digits: 3, tone: "ros" },
  { id: "fes", x: 300, y: 260, label: "Fe-S clusters", value: (o) => o.fesIntact * 100, unit: "% intact", tone: "fes" },
  { id: "fe", x: 510, y: 260, label: "Labile Fe2+", value: (o) => o.freeIron, unit: "µM", digits: 2, tone: "iron" },
  { id: "oh", x: 510, y: 150, label: "Fenton •OH", value: (o) => o.hydroxylRadical, unit: "pM", digits: 3, tone: "ros" },
  { id: "lipid", x: 510, y: 50, label: "Lipid peroxidation", value: (o) => o.cardiolipinOx, unit: "% CL ox", tone: "lipid" },
  { id: "ferro", x: 300, y: 50, label: "Ferroptosis risk", value: (o) => o.ferroptosisRisk, unit: "/ 100", tone: "lipid" },
];

const EDGES: Edge[] = [
  { from: "light", to: "etc", flux: (o) => o.photoreceptor.flavinLeak * o.photoreceptor.semiquinoneLeak },
  { from: "etc", to: "h2o2", flux: (o) => o.superoxide, brake: "SOD2" },
  { from: "etc", to: "onoo", flux: (o) => o.peroxynitrite },
  { from: "h2o2", to: "fes", flux: (o) => o.hydrogenPeroxide, brake: "Prx3 / GPx" },
  { from: "onoo", to: "fes", flux: (o) => o.peroxynitrite },
  { from: "fes", to: "fe", flux: (o) => 1 - o.fesIntact, brake: "ISC repair" },
  { from: "fe", to: "oh", flux: (o) => o.freeIron * o.hydrogenPeroxide, brake: "ferritin / chelator" },
  { from: "h2o2", to: "oh", flux: (o) => o.hydroxylRadical },
  { from: "oh", to: "lipid", flux: (o) => o.lipidPeroxyl, brake: "GPx4 / FSP1" },
  { from: "lipid", to: "ferro", flux: (o) => o.plooh },
];

const TONE: Record<Node["tone"], string> = {
  ros: "stroke-accent",
  iron: "stroke-destructive",
  lipid: "stroke-destructive",
  light: "stroke-primary",
  fes: "stroke-primary",
};

const W = 170;
const Hh = 52;
const fmt = (v: number, d = 1) => (v !== 0 && Math.abs(v) < 0.01 ? v.toExponential(1) : v.toFixed(d));

// Live ROS/RNS, Fe-S, iron and Fenton loop. Arrow width follows each flux relative to default settings.
export function PathwayMap({ out }: { out: Outputs }) {
  const base = useMemo(() => simulate(defaultInputs), []);
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mono-label">Pathway map</div>
      <h3 className="text-sm font-semibold">ROS/RNS, Fe-S and iron: the self-amplifying damage loop</h3>
      <svg viewBox="0 0 600 310" overflow="visible" className="mt-3 w-full" role="img" aria-label="Live pathway map">
        <defs>
          <marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
        </defs>
        {EDGES.map((e) => {
          const a = pos[e.from]!;
          const b = pos[e.to]!;
          const cur = e.flux(out);
          const ref = e.flux(base);
          const ratio = ref > 0 ? cur / ref : cur > 0 ? 3 : 1;
          const w = Math.max(1, Math.min(9, 2.5 * Math.sqrt(Math.max(0, ratio))));
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ox = (dx / len) * (Math.abs(dx) > Math.abs(dy) ? W / 2 : Hh / 2);
          const oy = (dy / len) * (Math.abs(dx) > Math.abs(dy) ? W / 2 : Hh / 2);
          const x1 = a.x + ox;
          const y1 = a.y + oy;
          const x2 = b.x - ox;
          const y2 = b.y - oy;
          const up = ratio > 1.05;
          return (
            <g key={e.from + e.to}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} markerEnd="url(#pm-arrow)" className={up ? "stroke-accent" : "stroke-muted-foreground"} strokeOpacity={0.75} />
              {e.brake && (
                <text x={(x1 + x2) / 2 + (Math.abs(dy) > Math.abs(dx) ? 6 : 0)} y={(y1 + y2) / 2 + (Math.abs(dy) > Math.abs(dx) ? 3 : -8)} textAnchor={Math.abs(dy) > Math.abs(dx) ? "start" : "middle"} className="fill-primary font-mono text-[9px]">
                  ⊣ {e.brake}
                </text>
              )}
            </g>
          );
        })}
        {NODES.map((n) => {
          const v = n.value(out);
          const b = n.value(base);
          const pct = b !== 0 ? ((v - b) / Math.abs(b)) * 100 : null;
          return (
            <g key={n.id} transform={`translate(${n.x - W / 2},${n.y - Hh / 2})`}>
              <rect width={W} height={Hh} rx={8} className={`fill-background ${TONE[n.tone]}`} strokeWidth={1.5} />
              <text x={10} y={18} className="fill-foreground text-[11px] font-semibold">
                {n.label}
              </text>
              <text x={10} y={38} className="fill-foreground font-mono text-[11px]">
                {fmt(v, n.digits ?? 1)} <tspan className="fill-muted-foreground">{n.unit}</tspan>
                {pct !== null && Math.abs(pct) >= 1 && (
                  <tspan className={pct > 0 ? "fill-accent" : "fill-primary"}>
                    {" "}
                    {pct > 0 ? "+" : ""}
                    {pct.toFixed(0)}%
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Arrow width follows each flux relative to default settings; highlighted arrows are above default. ⊣ marks the brake that limits each step. Percentages compare with default inputs.
      </p>
    </section>
  );
}

// Figure 4 style: which model terms currently drive the 71 THz reporter under each origin hypothesis.
export function ThzHypotheses({ out }: { out: Outputs }) {
  const c = out.coherence;
  const loss = c.lossBase + c.lossLipid + c.lossCardiolipin + c.lossHeat;
  const pump = c.pumpMetabolic + c.pumpPhoton;
  const rows = [
    { h: "H1", name: "Metabolic pump (CIV flux x Δψ)", share: pump > 0 ? c.pumpMetabolic / pump : 0, kind: "pump", test: "Titrate cyanide or FCCP; signal should fall with CIV flux." },
    { h: "H2", name: "Photon pump (absorbed red / NIR energy)", share: pump > 0 ? c.pumpPhoton / pump : 0, kind: "pump", test: "Dose light with CIV inhibited; residual rise isolates the photon term." },
    { h: "H3", name: "Membrane damage losses (lipid peroxyl, oxidized cardiolipin)", share: loss > 0 ? (c.lossLipid + c.lossCardiolipin) / loss : 0, kind: "loss", test: "Add ferrostatin-1; signal should recover if H3 dominates." },
    { h: "H4", name: "Thermal losses (light heating)", share: loss > 0 ? c.lossHeat / loss : 0, kind: "loss", test: "Match temperature rise without light; compare signal drop." },
  ];
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mono-label">71 THz origin hypotheses</div>
      <h3 className="text-sm font-semibold">
        Pump / loss {c.pumpRatio.toFixed(2)}, coherent {(c.coherentFraction * 100).toFixed(0)}%, emission {out.emission71THz.toFixed(1)} rel
      </h3>
      <div className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.h}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span>
                <span className="font-mono text-primary">{r.h}</span> {r.name}
              </span>
              <span className="font-mono">
                {(r.share * 100).toFixed(0)}% of {r.kind}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded bg-secondary">
              <div className={`h-1.5 rounded ${r.kind === "pump" ? "bg-primary" : "bg-accent"}`} style={{ width: `${Math.min(100, r.share * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Discriminating test: {r.test}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">The 71 THz output is a relative reporter from a threshold model; it is a hypothesis, not a radiometric prediction.</p>
    </section>
  );
}

// Energy released at each electron transfer step, in eV per electron, with live flux context.
export function EtcEnergyCard({ out }: { out: Outputs }) {
  const maxEv = Math.max(...etcSteps.map((s) => Math.abs(s.ev)));
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mono-label">Electron transport chain energetics</div>
      <h3 className="text-sm font-semibold">
        Energy per step, eV per electron · chain flux {(out.fluxCI + out.fluxCII).toFixed(1)} µM/s pairs
      </h3>
      <div className="mt-3 space-y-2">
        {etcSteps.map((s) => (
          <div key={s.step}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span>
                <span className="font-semibold">{s.step}</span>{" "}
                <span className="text-muted-foreground">
                  {s.donor} → {s.acceptor}
                </span>
              </span>
              <span className="font-mono">
                {s.ev > 0 ? "+" : ""}
                {s.ev.toFixed(2)} eV{s.protons > 0 ? ` · ${s.protons} H+` : ""}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded bg-secondary">
              <div
                className={`h-1.5 rounded ${s.ev >= 0 ? "bg-primary" : "bg-accent"}`}
                style={{ width: `${Math.max(3, (Math.abs(s.ev) / maxEv) * 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              E'm {s.emDonor} → {s.emAcceptor} mV. {s.note}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        eV = midpoint potential gap in volts per electron (Nicholls & Ferguson, Bioenergetics 4th ed.). Bars scale to the largest step; amber bars are slightly uphill steps driven by mass action.
      </p>
    </section>
  );
}
