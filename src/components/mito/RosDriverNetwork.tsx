import { useId } from "react";
import { rosFlagPercent, rosInputNames, type rosDriverAttributions, type rosSourceRows } from "@/lib/mito/rosPhysiology";
import type { Inputs } from "@/lib/mito/model";

type Row = ReturnType<typeof rosSourceRows>[number];
type Attribution = ReturnType<typeof rosDriverAttributions>[number];

const shortNames = ["CI · IF", "CI · IQ / RET", "CIII · IIIQo", "CII · IIF", "OGDH · O2•-", "SOD1 / SOD2", "OGDH · H2O2", "Flavin photo", "O2•- + NO", "Fenton", "ONOOH"];
const formatRate = (n: number) => n === 0 ? "0" : n.toPrecision(3);
const formatDelta = (n: number) => `${n > 0 ? "+" : ""}${formatRate(n)}`;

export function RosDriverNetwork({ rows, attributions, inputs, focus, onFocus }: {
  rows: Row[];
  attributions: Attribution[];
  inputs: Inputs;
  focus: number | null;
  onFocus: (index: number | null) => void;
}) {
  const marker = useId().replace(/:/g, "");
  const selectedIndex = focus ?? rows.findIndex((row) => row.flagged);
  const activeIndex = selectedIndex < 0 ? 0 : selectedIndex;
  const selected = rows[activeIndex];
  const links = attributions[activeIndex] ?? [];
  const controls = [...new Set(rows.flatMap((row) => row.drivers))];
  const flagged = rows.map((row, index) => ({ row, index, effects: attributions[index] ?? [] })).filter(({ row }) => row.flagged);
  const select = (index: number) => onFocus(focus === index ? null : index);

  return <section className="border-y border-border py-5" data-testid="ros-driver-network" aria-label="ROS driver network">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div><div className="mono-label">Upstream inputs → ROS sources</div><h3 className="mt-1 text-base font-semibold">ROS driver network</h3></div>
      <span className="font-mono text-xs text-muted-foreground">{flagged.length} / {rows.length} model-change flags</span>
    </div>
    <div className="overflow-x-auto border border-border bg-muted/20">
      <svg viewBox="0 0 900 730" className="block h-auto min-w-[660px] w-full" role="img" aria-label="Changed sliders linked to eleven modeled ROS sources; select a source for individual control effects">
        <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="var(--muted-foreground)" /></marker></defs>
        <text x="24" y="28" fontSize="12" fill="var(--muted-foreground)">SLIDERS</text>
        <text x="488" y="28" fontSize="12" fill="var(--muted-foreground)">MODELED PRODUCTION SITES</text>
        {links.map(({ key, delta }) => {
          const i = controls.indexOf(key);
          const y1 = 58 + i * 41;
          const y2 = 61 + activeIndex * 57;
          return <path key={key} d={`M 252 ${y1} C 365 ${y1}, 365 ${y2}, 485 ${y2}`} fill="none" stroke={delta > 0 ? "var(--destructive)" : delta < 0 ? "var(--primary)" : "var(--muted-foreground)"} strokeWidth={Math.min(5, 1.5 + Math.log1p(Math.abs(delta) * 100))} strokeOpacity={0.75} markerEnd={`url(#${marker})`} />;
        })}
        {controls.map((key, i) => {
          const changed = links.some((link) => link.key === key);
          const related = selected?.drivers.includes(key);
          return <g key={key}>
            <rect x="22" y={42 + i * 41} width="230" height="32" rx="3" fill={changed ? "var(--primary)" : "var(--muted)"} fillOpacity={changed ? 0.18 : 0.5} stroke={related ? "var(--primary)" : "var(--border)"} strokeWidth={related ? 1.5 : 1} />
            <text x="34" y={63 + i * 41} fontSize="12" fill={changed ? "var(--foreground)" : "var(--muted-foreground)"}>{rosInputNames[key]}{changed ? "  ●" : ""}</text>
          </g>;
        })}
        {rows.map((row, index) => {
          const y = 43 + index * 57;
          const active = activeIndex === index;
          return <g key={`${row.species}-${row.label}`} role="button" tabIndex={0} aria-label={`${row.label}, ${row.flagged ? "model-change flag" : "within model-change band"}. Select source`} aria-pressed={active} className="cursor-pointer outline-none" onClick={() => select(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(index); } }} data-testid="ros-network-source" data-outside={row.flagged}>
            {row.flagged && <rect x="481" y={y - 4} width="393" height="47" rx="4" fill="none" stroke="var(--destructive)" strokeWidth="2" strokeDasharray="5 3" />}
            <rect x="486" y={y} width="383" height="39" rx="3" fill={active ? "var(--primary)" : "var(--muted)"} fillOpacity={active ? 0.16 : 0.45} stroke={active ? "var(--primary)" : "var(--border)"} strokeWidth={active ? 2 : 1} />
            <text x="498" y={y + 16} fontSize="12" fill="var(--foreground)" fontWeight={active ? 600 : 400}>{row.flagged ? "!  " : ""}{shortNames[index] ?? row.label}</text>
            <text x="498" y={y + 31} fontSize="10" fill="var(--muted-foreground)">{row.species} · {row.base === 0 ? row.live > 0 ? "newly active" : "inactive" : `${row.percent && row.percent > 0 ? "+" : ""}${row.percent?.toFixed(0)}% vs default`}</text>
            <title>{row.label}: {formatRate(row.base)} → {formatRate(row.live)} µM/s. {row.flagged ? "Outside the model-change band." : "Inside the model-change band."}</title>
          </g>;
        })}
      </svg>
    </div>
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
      <span>● Changed input · red line raises rate · green line lowers rate</span>
      <span>Dashed outline: change ≥ ±{rosFlagPercent}% from same-geometry simulated default, or newly active</span>
    </div>
    {selected && <div className="mt-4 border-l-2 border-primary pl-3 text-xs" data-testid="ros-network-detail">
      <div className="font-semibold">{selected.species} · {selected.label}</div>
      <div className="mt-1 font-mono text-muted-foreground">{formatRate(selected.base)} → {formatRate(selected.live)} µM/s · {selected.base === 0 ? selected.live > 0 ? "newly active" : "inactive" : `${selected.percent && selected.percent > 0 ? "+" : ""}${selected.percent?.toFixed(0)}%`}</div>
      {links.length ? <div className="mt-2 flex flex-wrap gap-2" data-testid="ros-network-causes">{links.map(({ key, from, to, delta, direct }) => <span key={key} className="border border-border px-2 py-1.5 text-foreground">{rosInputNames[key]} {from} → {to}: <strong className={delta > 0 ? "text-destructive" : delta < 0 ? "text-primary" : "text-muted-foreground"}>{formatDelta(delta)} µM/s</strong>{direct ? "" : " · indirect"}</span>)}</div> : <p className="mt-2 text-muted-foreground">No changed slider has a detectable one-at-a-time effect on this source.</p>}
      {selected.flagged && links.length === 0 && <p className="mt-2 text-destructive">Flag has no detectable changed-slider effect. Do not assign a cause.</p>}
    </div>}
    {flagged.length > 0 && <div className="mt-4 border-t border-border pt-3" data-testid="ros-network-flag-causes">
      <div className="text-xs font-semibold text-destructive">Flagged sources and input effects</div>
      <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">{flagged.map(({ row, index, effects }) => <div key={index} className="border-l-2 border-destructive pl-2 text-[11px] leading-relaxed"><span className="font-medium">{row.label}</span>: {effects.length ? effects.slice(0, 3).map(({ key, delta, direct }) => `${rosInputNames[key]} ${formatDelta(delta)}${direct ? "" : " (indirect)"}`).join(" · ") : "No detectable changed-slider effect"}{effects.length > 3 ? ` · +${effects.length - 3} more in selected source` : ""}</div>)}</div>
    </div>}
    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Input effects are one-at-a-time model counterfactuals: each changed slider is reset to its default while every other setting stays current. They interact and do not sum to the total change. Links show modeled associations, not experimentally isolated or clinical causes. Downstream products share upstream production and must not be added to primary superoxide totals.</p>
  </section>;
}