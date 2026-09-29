import type { Geometry, Outputs } from "@/lib/mito/model";

// Illustrated 2D cross section: double membrane with a visible intermembrane space,
// tapered cristae folds, complex glyphs on the fold walls, and live ROS / Fe-S glows.

const COLORS: Record<string, string> = {
  CI: "var(--color-chart-1)",
  CIII: "var(--color-chart-4)",
  CIV: "var(--color-chart-2)",
  CV: "var(--color-chart-3)",
};

export function CrossSection({
  geo,
  out,
  showRos,
  showComplexes,
  selected,
  setSelected,
}: {
  geo: Geometry;
  out: Outputs;
  showRos: boolean;
  showComplexes: boolean;
  selected: string;
  setSelected: (s: string) => void;
}) {
  const W = geo.length + 120;
  const Hh = geo.matrixWidth + 120;
  const top = 40;
  const bottom = geo.matrixWidth + 80;
  const glow = Math.min(1, out.emission71THz / 110);
  const rosR = 6 + 22 * Math.min(1, out.redoxStress / 60);
  const fesDamage = Math.min(1, (1 - out.fesIntact) * 3);
  const depth = Math.min(geo.cristaeDepth, geo.matrixWidth * 0.8);
  const neck = Math.max(2, geo.junctionWidth * 0.28);
  const body = Math.max(neck + 2.5, geo.junctionWidth * 0.5 + 5 * (1 - geo.cristaeShape));
  const curv = geo.tipCurvature;
  const spacing = geo.length / (geo.cristaeCount + 1);

  const cristae = Array.from({ length: geo.cristaeCount }, (_, k) => {
    const x = 60 + spacing * (k + 1) + Math.sin(k * 1.7) * 3;
    const dir = k % 2 === 0 ? 1 : -1;
    const y0 = dir > 0 ? top : bottom;
    const Y = (v: number) => y0 + dir * v;
    const tip = depth;
    const bulge = body * (0.35 + 0.8 * curv);
    const d = [
      `M ${x - neck} ${Y(-3)}`,
      `L ${x - neck} ${Y(6)}`,
      `C ${x - neck} ${Y(12)} ${x - body} ${Y(12)} ${x - body} ${Y(20)}`,
      `L ${x - body} ${Y(tip - body)}`,
      `C ${x - body} ${Y(tip - body + bulge)} ${x + body} ${Y(tip - body + bulge)} ${x + body} ${Y(tip - body)}`,
      `L ${x + body} ${Y(20)}`,
      `C ${x + body} ${Y(12)} ${x + neck} ${Y(12)} ${x + neck} ${Y(6)}`,
      `L ${x + neck} ${Y(-3)}`,
    ].join(" ");
    return { k, x, dir, Y, d, tipY: Y(tip - body + bulge * 0.75) };
  });

  const pick = (id: string) => ({
    className: "cursor-pointer",
    onClick: () => setSelected(id),
    stroke: selected === id ? "var(--color-foreground)" : "none",
    strokeWidth: selected === id ? 1.2 : 0,
  });

  const cx = W / 2;
  const cy = Hh / 2;

  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className="mt-3 w-full" role="img" aria-label="Cross section of a mitochondrion with cristae and respiratory complexes">
      <defs>
        <radialGradient id="cs-matrix" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.9} />
          <stop offset="100%" stopColor="var(--color-card)" stopOpacity={1} />
        </radialGradient>
        <linearGradient id="cs-outer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-muted-foreground)" stopOpacity={0.9} />
          <stop offset="100%" stopColor="var(--color-muted-foreground)" stopOpacity={0.45} />
        </linearGradient>
        <radialGradient id="cs-ros">
          <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.75} />
          <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cs-fes">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35 + 0.5 * fesDamage} />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
        </radialGradient>
        <filter id="cs-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="cs-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="cs-clip">
          <rect x="40" y="40" width={geo.length + 40} height={geo.matrixWidth + 40} rx={Math.min(70, (geo.matrixWidth + 40) / 2)} />
        </clipPath>
      </defs>

      {/* Outer membrane with intermembrane space */}
      <rect x="20" y="20" width={geo.length + 80} height={geo.matrixWidth + 80} rx={Math.min(90, (geo.matrixWidth + 80) / 2)} fill="var(--color-secondary)" fillOpacity={0.35} stroke="url(#cs-outer)" strokeWidth="5" />
      <rect x="20" y="20" width={geo.length + 80} height={geo.matrixWidth + 80} rx={Math.min(90, (geo.matrixWidth + 80) / 2)} fill="none" stroke="var(--color-background)" strokeOpacity={0.7} strokeWidth="1.3" />

      {/* Matrix */}
      <rect x="40" y="40" width={geo.length + 40} height={geo.matrixWidth + 40} rx={Math.min(70, (geo.matrixWidth + 40) / 2)} fill="url(#cs-matrix)" />

      <g clipPath="url(#cs-clip)">
        {/* Fe-S hotspot in the matrix */}
        <circle cx={cx} cy={cy} r={24 + 60 * fesDamage} fill="url(#cs-fes)" filter="url(#cs-blur)" />
        {/* Matrix granules and mtDNA */}
        {Array.from({ length: 40 }, (_, k) => (
          <circle key={k} cx={50 + ((k * 97) % (geo.length + 20))} cy={50 + ((k * 53) % (geo.matrixWidth + 20))} r={1.2} fill="var(--color-muted-foreground)" opacity={0.35} />
        ))}
        <ellipse cx={60 + geo.length * 0.22} cy={cy} rx={9} ry={6} fill="none" stroke="var(--color-chart-5)" strokeOpacity={0.7} strokeDasharray="2 2" />

        {/* ROS glows at Complex I / III sites */}
        {showRos &&
          cristae.map((c) => (
            <circle key={`r${c.k}`} cx={c.x} cy={c.Y(depth * 0.35)} r={rosR} fill="url(#cs-ros)" filter="url(#cs-blur)" />
          ))}

        {/* Cristae folds */}
        {cristae.map((c) => (
          <g key={c.k}>
            <path d={c.d} fill="var(--color-secondary)" fillOpacity={0.55} stroke="var(--color-primary)" strokeOpacity={0.55 + glow * 0.4} strokeWidth="4" strokeLinejoin="round" />
            <path d={c.d} fill="none" stroke="var(--color-card)" strokeOpacity={0.8} strokeWidth="1.1" />
          </g>
        ))}

        {/* Complex glyphs on both fold walls */}
        {showComplexes &&
          cristae.map((c) => (
            <g key={`c${c.k}`}>
              {[-1, 1].map((s) => {
                const wx = c.x + s * body;
                const yCI = c.Y(depth * 0.3);
                const yCIII = c.Y(depth * 0.5);
                const yCIV = c.Y(depth * 0.7);
                return (
                  <g key={s}>
                    <path d={`M ${wx - 1.5} ${yCI - 5} h 3 v 10 h -3 z M ${wx} ${yCI - 2} h ${s * 9} v 4 h ${-s * 9} z`} fill={COLORS["CI"]} {...pick("CI")} />
                    <circle cx={wx + s * 2.5} cy={yCIII - 3.2} r={3.1} fill={COLORS["CIII"]} {...pick("CIII")} />
                    <circle cx={wx + s * 2.5} cy={yCIII + 3.2} r={3.1} fill={COLORS["CIII"]} {...pick("CIII")} />
                    <rect x={wx + (s > 0 ? -1 : -6)} y={yCIV - 4.5} width={7} height={9} rx={2.5} fill={COLORS["CIV"]} opacity={0.6 + 0.4 * Math.min(1, out.photoreceptor.civActivation)} {...pick("CIV")} />
                  </g>
                );
              })}
              {[-1, 1].map((s) => {
                const ang = s * (0.4 + 0.5 * curv);
                const bx = c.x + s * body * 0.55;
                const by = c.tipY;
                const hx = bx + Math.sin(ang) * 8;
                const hy = by + c.dir * Math.cos(ang) * 8;
                return (
                  <g key={`v${s}`} className="cursor-pointer" onClick={() => setSelected("CV")}>
                    <line x1={bx} y1={by} x2={hx} y2={hy} stroke={COLORS["CV"]} strokeWidth={1.6} />
                    <circle cx={hx} cy={hy} r={selected === "CV" ? 5 : 4.2} fill={COLORS["CV"]} stroke={selected === "CV" ? "var(--color-foreground)" : "none"} strokeWidth={1.2} />
                  </g>
                );
              })}
            </g>
          ))}

        {/* Fe-S cluster glyph */}
        {showComplexes && (
          <g className="cursor-pointer" onClick={() => setSelected("ISC")} transform={`translate(${cx}, ${cy})`}>
            {[
              [-4, -4],
              [4, -4],
              [-4, 4],
              [4, 4],
            ].map(([x, y], k) => (
              <circle key={k} cx={x! * (1 + fesDamage * 0.6)} cy={y! * (1 + fesDamage * 0.6)} r={2.8} fill={k % 3 === 0 ? "var(--color-accent)" : "var(--color-chart-3)"} />
            ))}
            <rect x={-7} y={-7} width={14} height={14} fill="none" stroke={selected === "ISC" ? "var(--color-foreground)" : "var(--color-accent)"} strokeOpacity={0.7} strokeWidth={0.8} />
            <text y={20} textAnchor="middle" fontSize="9" fill="var(--color-muted-foreground)" fontFamily="monospace">
              Fe-S
            </text>
          </g>
        )}
      </g>

      {/* Inner boundary membrane, glowing with 71 THz coherence */}
      <rect x="40" y="40" width={geo.length + 40} height={geo.matrixWidth + 40} rx={Math.min(70, (geo.matrixWidth + 40) / 2)} fill="none" stroke="var(--color-primary)" strokeOpacity={0.5 + glow * 0.45} strokeWidth="4.5" filter={glow > 0.2 ? "url(#cs-glow)" : undefined} />
      <rect x="40" y="40" width={geo.length + 40} height={geo.matrixWidth + 40} rx={Math.min(70, (geo.matrixWidth + 40) / 2)} fill="none" stroke="var(--color-card)" strokeOpacity={0.85} strokeWidth="1.2" />
    </svg>
  );
}
