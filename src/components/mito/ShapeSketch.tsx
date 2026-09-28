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

export function ShapeSketch({ geo, color, label }: { geo: Geometry; color: string; label?: string }) {
  const g = { ...defaultGeometry, ...geo };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const outerRx = g.length / 2;
  const outerRy = g.matrixWidth / 2 + g.swelling;
  const innerRx = Math.max(outerRx - g.swelling, 10);
  const innerRy = g.matrixWidth / 2;

  const scale = Math.min((VW - PAD * 2) / (outerRx * 2), (VH - PAD * 2) / (outerRy * 2));
  const cx = VW / 2;
  const cy = VH / 2;

  const topInnerY = cy - innerRy * scale;
  const count = Math.max(2, Math.round(g.cristaeCount));
  const span = innerRx * 2 * 0.86; // keep folds off the poles
  const startX = cx - (span * scale) / 2;

  const folds: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = startX + ((i + 0.5) / count) * span * scale;
    folds.push(cristaPath(x, topInnerY, g.cristaeDepth * scale, g.junctionWidth * scale, g.cristaeShape, g.tipCurvature));
  }

  return (
    <div>
      {label && <div className="mono-label mb-1 truncate" style={{ color }}>{label}</div>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full rounded-md border border-border bg-background/40" role="img" aria-label={label ?? "Mitochondrion shape"}>
        <defs>
          <clipPath id={`inner-${uid}`}>
            <ellipse cx={cx} cy={cy} rx={innerRx * scale} ry={innerRy * scale} />
          </clipPath>
        </defs>
        {/* intermembrane space between outer and boundary membranes */}
        <ellipse cx={cx} cy={cy} rx={outerRx * scale} ry={outerRy * scale} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
        <ellipse cx={cx} cy={cy} rx={innerRx * scale} ry={innerRy * scale} fill="none" stroke={color} strokeWidth={1.4} opacity={0.65} />
        {/* cristae folds, clipped to the matrix */}
        <g clipPath={`url(#inner-${uid})`}>
          {folds.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.6} opacity={0.85} strokeLinecap="round" />
          ))}
        </g>
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{count} cristae</span>
        <span>{g.length} x {Math.round(g.matrixWidth + 2 * g.swelling)} nm</span>
      </div>
    </div>
  );
}
