
// Structure view geometry (SVG units, roughly nm-scaled). Source of ranges for the Structure
// sliders and for clamping micrograph-derived AI suggestions.
export type Geometry = {
  swelling: number; // outer-to-inner boundary membrane gap, nm
  cristaeShape: number; // 0 lamellar, 1 tubular
  tipCurvature: number; // 0 flat, 1 tightly curved (ATP synthase dimer rows)
  cristaeCount: number;
  cristaeDepth: number;
  junctionWidth: number;
  matrixWidth: number;
  length: number;
};
export const defaultGeometry: Geometry = {
  swelling: 20,
  cristaeShape: 0.2,
  tipCurvature: 0.6,
  cristaeCount: 9,
  cristaeDepth: 62,
  junctionWidth: 10,
  matrixWidth: 150,
  length: 420,
};
export const geometryRanges: Record<keyof Geometry, { min: number; max: number; step: number; label: string }> = {
  cristaeCount: { min: 2, max: 22, step: 1, label: "Cristae count" },
  cristaeDepth: { min: 20, max: 110, step: 1, label: "Crista depth" },
  junctionWidth: { min: 4, max: 34, step: 1, label: "Junction width" },
  matrixWidth: { min: 110, max: 230, step: 1, label: "Matrix width" },
  length: { min: 240, max: 620, step: 10, label: "Organelle length" },
  swelling: { min: 10, max: 60, step: 1, label: "Outer membrane swelling" },
  cristaeShape: { min: 0, max: 1, step: 0.05, label: "Cristae shape (lamellar to tubular)" },
  tipCurvature: { min: 0, max: 1, step: 0.05, label: "Cristae tip curvature" },
};

/*
 * Geometry to bioenergetics coupling. All multipliers equal 1 at defaultGeometry.
 * Strengths are our own estimates, bounded to ~0.5x-1.8x, shaped after:
 *  - Cogliati et al. 2013 (Cell): cristae shape sets supercomplex assembly and respiratory efficiency.
 *  - Frezza et al. 2006 (Cell): OPA1-dependent tight junctions retain cytochrome c.
 *  - Paumard et al. 2002 (EMBO J): ATP synthase dimers bend cristae tips.
 *  - Strauss et al. 2008 (EMBO J): tip curvature concentrates protons near ATP synthase.
 */
export type GeometryEffects = {
  capacity: number; // Complex I-IV capacity from inner membrane area
  psiShift: number; // mV added to local membrane potential
  cytcRetention: number; // CIV electron supply from cyt c trapped in cristae
  atpEfficiency: number;
  leak: number; // superoxide leak multiplier
  area: number; // relative inner membrane area
};
const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function geometryEffects(g: Geometry): GeometryEffects {
  const d = defaultGeometry;
  const shape = g.cristaeShape ?? d.cristaeShape;
  const curv = g.tipCurvature ?? d.tipCurvature;
  const swell = g.swelling ?? d.swelling;
  const area = ((g.cristaeCount * g.cristaeDepth) / (d.cristaeCount * d.cristaeDepth)) * (1 - 0.25 * (shape - d.cristaeShape));
  const capacity = clampN(Math.sqrt(Math.max(area, 0.01)), 0.5, 1.8);
  const psiShift = clampN(8 * Math.log(d.junctionWidth / g.junctionWidth) + 6 * (curv - d.tipCurvature), -15, 15);
  const cytcRetention = clampN((d.junctionWidth / g.junctionWidth) ** 0.3 * (1 - 0.006 * (swell - d.swelling)), 0.5, 1.3);
  const atpEfficiency = clampN(0.6 + (0.4 / d.tipCurvature) * curv, 0.6, 1.3);
  const leak = clampN(1 + 0.012 * (swell - d.swelling) + 0.3 * (shape - d.cristaeShape), 0.7, 1.8);
  return { capacity, psiShift, cytcRetention, atpEfficiency, leak, area };
}
