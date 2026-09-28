import { useId } from "react";
import { defaultGeometry, type Geometry } from "@/lib/mito/model";

/*
 * Stylized 2D cross-section of the organelle drawn from a saved Geometry.
 * Pure SVG, no three.js, so it is safe to render many of these in Compare.
 * Outer ellipse = outer membrane; inner ellipse = boundary membrane; folds
 * hanging from the top boundary are cristae. Lamellar folds are wide sheets,
 * tubular folds are narrow necks with a bulb tip sized by tipCurvature.
 */

const VW = 660;
const VH = 280;
const PAD = 14;

function cristaPath(x: number, topY: number, depth: number, neckW: number, shape: number, tipCurv: number): string {
  // shape 0 = lamellar sheet (wide, flat tip), 1 = tubular (thin neck, round bulb)
  const half = neckW / 2;
  const bulbR = half + tipCurv * (4 + 18 * shape);
  const shaftHalf = half * (1 - 0.55 * shape);
  const tipY = topY + depth;
  const joinY = tipY - bulbR;
  if (joinY <= topY + 2) {
    // very shallow fold: just a bump
    return `M ${x - half} ${topY} Q ${x} ${topY + depth} ${x + half} ${topY}`;
  }
  return [
    `M ${x - shaftHalf} ${topY}`,
    `L ${x - shaftHalf} ${joinY}`,
    `A ${bulbR} ${bulbR} 0 0 0 ${x + shaftHalf} ${joinY}`,
    `L ${x + shaftHalf} ${topY}`,
  ].join(" ");
}

type ShapeParts = {
  count: number;
  dims: string;
  outerRx: number;
  outerRy: number;
  innerRx: number;
  innerRy: number;
  folds: string[];
};

// Geometry to drawing parts, in nanometres (unscaled). Callers scale.
function shapeParts(geo: Geometry): ShapeParts {
  const g = { ...defaultGeometry, ...geo };
  const outerRx = g.length / 2;
  const outerRy = g.matrixWidth / 2 + g.swelling;
  const innerRx = Math.max(outerRx - g.swelling, 10);
  const innerRy = g.matrixWidth / 2;
  const count = Math.max(2, Math.round(g.cristaeCount));
  const span = innerRx * 2 * 0.86; // keep folds off the poles
  const startX = -span / 2;
  const folds: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = startX + ((i + 0.5) / count) * span;
    folds.push(cristaPath(x, -innerRy, g.cristaeDepth, g.junctionWidth, g.cristaeShape, g.tipCurvature));
  }
  return {
    count,
    dims: `${g.length} x ${Math.round(g.matrixWidth + 2 * g.swelling)} nm`,
    outerRx,
    outerRy,
    innerRx,
    innerRy,
    folds,
  };
}

function ShapeSvg({
  parts,
  color,
  uid,
  scale,
}: {
  parts: ShapeParts;
  color: string;
  uid: string;
  scale: number;
}) {
  return (
    <g transform={`translate(${VW / 2} ${VH / 2}) scale(${scale})`}>
      <defs>
        <clipPath id={`inner-${uid}`}>
          <ellipse cx={0} cy={0} rx={parts.innerRx} ry={parts.innerRy} />
        </clipPath>
      </defs>
      {/* intermembrane space between outer and boundary membranes */}
      <ellipse cx={0} cy={0} rx={parts.outerRx} ry={parts.outerRy} fill="none" stroke={color} strokeWidth={2 / scale} opacity={0.9} />
      <ellipse cx={0} cy={0} rx={parts.innerRx} ry={parts.innerRy} fill="none" stroke={color} strokeWidth={1.4 / scale} opacity={0.65} />
      {/* cristae folds, clipped to the matrix */}
      <g clipPath={`url(#inner-${uid})`}>
        {parts.folds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.6 / scale} opacity={0.85} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
}

function fitScale(parts: ShapeParts[]): number {
  const maxRx = Math.max(...parts.map((p) => p.outerRx));
  const maxRy = Math.max(...parts.map((p) => p.outerRy));
  return Math.min((VW - PAD * 2) / (maxRx * 2), (VH - PAD * 2) / (maxRy * 2));
}

export function ShapeSketch({ geo, color, label }: { geo: Geometry; color: string; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const parts = shapeParts(geo);
  const scale = fitScale([parts]);

  return (
    <div>
      {label && <div className="mono-label mb-1 truncate" style={{ color }}>{label}</div>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full rounded-md border border-border bg-background/40" role="img" aria-label={label ?? "Mitochondrion shape"}>
        <ShapeSvg parts={parts} color={color} uid={uid} scale={scale} />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{parts.count} cristae</span>
        <span>{parts.dims}</span>
      </div>
    </div>
  );
}

/*
 * Both saved shapes drawn in one outline on a shared scale, so differences
 * in size, cristae count and fold shape line up directly.
 */
export function ShapeOverlay({
  geoA,
  geoB,
  colorA,
  colorB,
  labelA,
  labelB,
}: {
  geoA: Geometry;
  geoB: Geometry;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pa = shapeParts(geoA);
  const pb = shapeParts(geoB);
  const scale = fitScale([pa, pb]);

  return (
    <div>
      <div className="mono-label mb-1 flex gap-3 truncate">
        <span style={{ color: colorA }}>A: {labelA}</span>
        <span style={{ color: colorB }}>B: {labelB}</span>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full rounded-md border border-border bg-background/40" role="img" aria-label="Both mitochondrion shapes overlaid">
        <ShapeSvg parts={pa} color={colorA} uid={`${uid}a`} scale={scale} />
        <ShapeSvg parts={pb} color={colorB} uid={`${uid}b`} scale={scale} />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span style={{ color: colorA }}>{pa.count} cristae, {pa.dims}</span>
        <span style={{ color: colorB }}>{pb.count} cristae, {pb.dims}</span>
      </div>
    </div>
  );
}
