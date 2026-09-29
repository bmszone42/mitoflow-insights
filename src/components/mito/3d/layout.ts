import type { Geometry } from "@/lib/mito/model";

export type Crista = { x: number; top: boolean; depth: number; thick: number; zExtent: number; center: number; k: number };

// Shared placement so the scene and the camera presets agree on where things are.
export function layout(geo: Geometry) {
  const L = geo.length / 100;
  const r = geo.matrixWidth / 200;
  const gap = geo.swelling / 100;
  const spacing = L / (geo.cristaeCount + 1);
  const depth = Math.min((geo.cristaeDepth / 100) * 1.3, 2 * r * 0.85);
  const thick = Math.max(0.06, geo.junctionWidth / 100) * 1.6;
  const zExtent = 2 * r * 0.8 * (1 - 0.6 * geo.cristaeShape);
  const cristae: Crista[] = Array.from({ length: geo.cristaeCount }, (_, k) => {
    const x = -L / 2 + spacing * (k + 1);
    return { x, top: k % 2 === 0, depth, thick, zExtent, center: Math.abs(x) / (L / 2), k };
  });
  // y of a point a fraction f from the crista base (inner boundary) to its tip
  const yAt = (c: Crista, f: number) => (c.top ? r - f * c.depth : -r + f * c.depth);
  const zRows = (c: Crista) => [-0.32, 0, 0.32].map((t) => t * c.zExtent);
  const focus = cristae[Math.floor(cristae.length / 2)] ?? cristae[0];
  const ciPos = focus
    ? ([focus.x + focus.thick / 2 + 0.05, yAt(focus, 0.25), zRows(focus)[2]!] as [number, number, number])
    : ([0, 0, 0] as [number, number, number]);
  const fesPos: [number, number, number] = [ciPos[0] + 0.07, ciPos[1] + (focus?.top ? -0.02 : 0.02), ciPos[2] + 0.06];
  return { L, r, gap, cristae, yAt, zRows, focus, ciPos, fesPos };
}

export type Layout = ReturnType<typeof layout>;
export type ViewPreset = "whole" | "crista" | "complex" | "fes";

export function presetCamera(lay: Layout, v: ViewPreset): { pos: [number, number, number]; target: [number, number, number] } {
  const f = lay.focus;
  if (v === "whole" || !f) {
    // Fit the organelle length into view with a 3/4 tilt so the cut face and folds both read.
    const d = 1.4 * lay.L + 1.1;
    return { pos: [lay.L * 0.16, d * 0.4, d * 0.9], target: [0, -0.08, 0] };
  }
  if (v === "crista") {
    const y = lay.yAt(f, 0.5);
    return { pos: [f.x + 1.1, y + 0.35, 1.9], target: [f.x, y, 0.1] };
  }
  if (v === "complex") {
    const [x, y, z] = lay.ciPos;
    return { pos: [x + 0.55, y + 0.08, z + 0.95], target: [x + 0.2, y + (lay.focus?.top ? -0.12 : 0.12), z] };
  }
  const [x, y, z] = lay.fesPos;
  return { pos: [x + 0.12, y + 0.05, z + 0.1], target: [x, y, z] };
}

// Up to six callout anchors for the whole-organelle view, placed on surfaces the camera sees.
export function wholeAnchors(lay: Layout): { text: string; p: [number, number, number] }[] {
  const { L, r, gap, cristae, yAt } = lay;
  const f = lay.focus;
  const j = cristae[1] ?? f;
  const last = cristae[cristae.length - 2] ?? f;
  const out: { text: string; p: [number, number, number] }[] = [
    { text: "Outer membrane", p: [L * 0.18, r + gap + 0.08, -0.35] },
  ];
  if (j) out.push({ text: "Crista junction", p: [j.x, j.top ? r : -r, 0] });
  if (f) out.push({ text: "Crista, ETC complexes", p: [f.x, yAt(f, 0.45), 0] });
  if (last) out.push({ text: "ATP synthase dimers", p: [last.x, yAt(last, 1), 0] });
  out.push({ text: "mtDNA nucleoid", p: [-L * 0.28, 0, -r * 0.25] });
  out.push({ text: "TCA / aconitase Fe-S", p: [-L * 0.05, 0, r * 0.1] });
  return out.slice(0, 6);
}
