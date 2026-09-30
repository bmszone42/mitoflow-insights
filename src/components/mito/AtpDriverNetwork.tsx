/*
 * ATP driver network: the ETC steps laid out as a pathway graph, like the
 * iron x light map, with each node sized by its share of the Compare A/B
 * ATP gap and colored by direction (green: B raises, red: B lowers).
 * Edges follow electron flow and inherit the share of their target step.
 */
import { ATP_COST_TEXTBOOK, atpCostFlagCause, atpNetworkRangeFlags, type AtpFlagContext } from "@/lib/mito/reference";

type Row = { s: { step: string; ev: number; tbLo: number; tbHi: number; protons: number }; ra: number; rb: number; diff: number; costA: number; costB: number; contextA: AtpFlagContext; contextB: AtpFlagContext };

// Index into etcSteps -> position (viewBox 0..720 x 0..300)
const POS: Record<number, { x: number; y: number; short: string }> = {
  0: { x: 60, y: 70, short: "CI entry" },
  1: { x: 180, y: 70, short: "CI Fe-S" },
  2: { x: 300, y: 70, short: "CI to Q" },
  3: { x: 300, y: 230, short: "CII" },
  4: { x: 420, y: 150, short: "CIII Qo" },
  5: { x: 530, y: 150, short: "Cyt c" },
  6: { x: 630, y: 90, short: "CIV CuA" },
  7: { x: 630, y: 220, short: "CIV to O2" },
  8: { x: 150, y: 250, short: "Overall" },
};
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 4],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
];

export function AtpDriverNetwork({
  rows,
  totalAbs,
  focus,
  onFocus,
}: {
  rows: Row[];
  totalAbs: number;
  focus: number | null;
  onFocus: (i: number | null) => void;
}) {
  const share = (i: number) => (totalAbs > 0 && rows[i] ? Math.abs(rows[i]!.diff) / totalAbs : 0);
  const color = (i: number) =>
    !rows[i] || rows[i]!.diff === 0 ? "var(--muted-foreground)" : rows[i]!.diff > 0 ? "var(--primary)" : "var(--destructive)";
  const pct = (r: Row) => (r.ra > 0 ? ((r.rb - r.ra) / r.ra) * 100 : 0);
  // The redox span is fixed; effective ATP cost responds to potential and leak.
  // Only proton-pumping steps synthesize ATP in this step-level accounting.
  const outsideEv = (r: Row) => atpNetworkRangeFlags(r.s, r.costA, r.costB).evOutside;
  const outsideCost = (r: Row) => atpNetworkRangeFlags(r.s, r.costA, r.costB).costBOutside;
  const outsideTb = (r: Row) => outsideEv(r) || outsideCost(r);
  const causeA = (r: Row) => atpNetworkRangeFlags(r.s, r.costA, r.costB).costAOutside ? atpCostFlagCause(r.s, r.contextA) : null;
  const causeB = (r: Row) => outsideCost(r) ? atpCostFlagCause(r.s, r.contextB) : null;
  const flaggedRows = rows
    .map((row, index) => ({ row, index, evOutside: outsideEv(row), sliderCause: causeB(row) }))
    .filter(({ evOutside, sliderCause }) => evOutside || sliderCause);
  const sel = focus != null ? rows[focus] : null;

  return (
    <div data-testid="atp-driver-network" className="rounded-md border border-border bg-muted/20 p-3">
      <div className="mono-label mb-1">ATP driver network</div>
      <svg viewBox="0 0 720 300" className="h-auto w-full" role="img" aria-label="ATP driver network">
        <defs>
          <marker id="adn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted-foreground)" />
          </marker>
        </defs>
        {EDGES.map(([a, b]) => {
          const pa = POS[a]!;
          const pb = POS[b]!;
          return (
            <line
              key={`${a}-${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={color(b)}
              strokeOpacity={0.5}
              strokeWidth={1.5 + share(b) * 14}
              markerEnd="url(#adn-arrow)"
            />
          );
        })}
        <text x={20} y={30} fontSize="11" fill="var(--muted-foreground)">NADH</text>
        <text x={250} y={290} fontSize="11" fill="var(--muted-foreground)">Succinate</text>
        <text x={660} y={280} fontSize="11" fill="var(--muted-foreground)">O2 to H2O</text>
        {rows.map((r, i) => {
          const p = POS[i];
          if (!p) return null;
          const rad = 14 + share(i) * 40;
          const on = focus === i;
          return (
            <g key={r.s.step} className="cursor-pointer" onClick={() => onFocus(on ? null : i)}>
              <title>{`${r.s.step}: ${(share(i) * 100).toFixed(0)}% share, ${pct(r) > 0 ? "+" : ""}${pct(r).toFixed(0)}% B vs A; redox drop ${r.s.ev} eV (reference ${r.s.tbLo} to ${r.s.tbHi})${r.s.protons > 0 ? `; effective ATP cost A ${r.costA.toFixed(2)}, B ${r.costB.toFixed(2)} eV/ATP (reference ${ATP_COST_TEXTBOOK.lo.toFixed(2)} to ${ATP_COST_TEXTBOOK.hi.toFixed(2)})` : "; no step ATP synthesis"}${outsideEv(r) ? "; fixed redox drop outside, not slider-caused" : ""}${causeA(r) ? `; A cause: ${causeA(r)}` : ""}${causeB(r) ? `; B cause: ${causeB(r)}` : ""}`}</title>
              {outsideTb(r) && (
                <circle
                  data-testid={`tb-halo-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={rad + 4}
                  fill="none"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  strokeDasharray="2 3"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={rad}
                fill={color(i)}
                fillOpacity={0.25}
                stroke={color(i)}
                strokeWidth={on ? 3 : 1.5}
                strokeDasharray={i === 8 ? "4 3" : undefined}
              />
              <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="11" fill="var(--foreground)">{p.short}</text>
              <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="var(--muted-foreground)">
                {(share(i) * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 text-[11px] text-muted-foreground">
        Node size and edge width: share of the A/B ATP gap. Green: B raises that step's ATP rate. Red: B lowers it.
        The dashed Overall node is the whole-chain summary. Click a node to highlight its table row.{" "}
        <span className="text-destructive">
          A red dashed halo means its eV drop is outside the textbook range, or a pumping step's
          live effective ATP cost is outside {ATP_COST_TEXTBOOK.lo.toFixed(2)} to {ATP_COST_TEXTBOOK.hi.toFixed(2)} eV/ATP
        </span>
        . Effective cost factors in membrane potential and uncoupling; it is a model proxy, not a measured step-specific range.
      </div>
      {flaggedRows.length > 0 && (
        <div className="mt-3 border-t border-border pt-2" data-testid="atp-network-flag-causes">
          <div className="text-[10px] font-medium uppercase text-destructive">Flag causes</div>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {flaggedRows.map(({ row, index, evOutside, sliderCause }) => (
              <button
                key={row.s.step}
                type="button"
                className="rounded-sm border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-left text-[10px] leading-relaxed text-destructive hover:bg-destructive/10"
                onClick={() => onFocus(focus === index ? null : index)}
              >
                <span className="font-medium">{row.s.step}:</span>{" "}
                {sliderCause ? `Slider cause: ${sliderCause}` : "Model parameter: fixed redox drop outside the cited range."}
                {sliderCause && evOutside ? " Fixed redox drop is also outside the cited range." : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {sel && (
        <div className="mt-1 font-mono text-[11px]" data-testid="atp-network-detail">
          {sel.s.step}: A {sel.ra.toFixed(2)} vs B {sel.rb.toFixed(2)} ATP rate, {pct(sel) > 0 ? "+" : ""}
          {pct(sel).toFixed(0)}%, {(share(focus ?? -1) * 100).toFixed(0)}% of gap, {sel.s.ev > 0 ? "+" : ""}
          {sel.s.ev} eV{" "}
          <span className={outsideEv(sel) ? "text-destructive" : "text-muted-foreground"}>
            (textbook {sel.s.tbLo} to {sel.s.tbHi} eV{outsideEv(sel) ? ", outside" : ""})
          </span>
          {sel.s.protons > 0 && <span className={outsideCost(sel) ? "text-destructive" : "text-muted-foreground"}>
            {" "}· effective ATP cost A {sel.costA.toFixed(2)}, B {sel.costB.toFixed(2)} eV/ATP
            (reference {ATP_COST_TEXTBOOK.lo.toFixed(2)} to {ATP_COST_TEXTBOOK.hi.toFixed(2)}{outsideCost(sel) ? ", B outside" : ""})
          </span>}
          {(causeA(sel) || causeB(sel)) && (
            <span className="mt-1 block text-destructive" data-testid="atp-network-flag-cause">
              {causeA(sel) ? `A slider cause: ${causeA(sel)}. ` : ""}{causeB(sel) ? `B slider cause: ${causeB(sel)}.` : ""}
            </span>
          )}
          {outsideEv(sel) && <span className="mt-1 block text-destructive">Redox cause: fixed model drop, not a slider change.</span>}
        </div>
      )}
    </div>
  );
}
