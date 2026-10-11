import type { Inputs, Outputs, FerroptosisState, Coherence, RosBudget } from "./types";
import { simulate } from "./simulate";
import { inputRanges } from "./ranges";

export function doseSweep(base: Inputs, wavelength: "red" | "nir") {
  return Array.from({ length: 25 }, (_, k) => {
    const dose = k * 2.5;
    const out = simulate({
      ...base,
      redDose: wavelength === "red" ? dose : base.redDose,
      nirDose: wavelength === "nir" ? dose : base.nirDose,
    });
    return {
      dose,
      atp: Number(out.atpFlux.toFixed(1)),
      superoxide: Number(out.superoxide.toPrecision(3)),
      emission: Number(out.emission71THz.toFixed(1)),
      // per-species curves, pM-normalized for a shared log axis
      h2o2: Number((out.hydrogenPeroxide * 1e3).toFixed(3)),
      hydroxyl: Number(out.hydroxylRadical.toFixed(4)),
      peroxynitrite: Number((out.peroxynitrite * 1e3).toFixed(3)),
      singletOxygen: Number(out.singletOxygen.toFixed(4)),
      lipidPeroxyl: Number((out.lipidPeroxyl * 1e3).toFixed(3)),
      fesIntact: Number((out.fesIntact * 100).toFixed(2)),
      aconitase: Number(out.aconitaseActivity.toFixed(2)),
      freeIron: Number(out.freeIron.toFixed(3)),
    };
  });
}

/**
 * Melov 1999 (PNAS 96:846) Sod2-null mouse heart: complex I activity 59% of
 * normal, complex II 24%. Used as a severity check on the model's Fe-S intact
 * readout (aconitaseActivity, % of normal): a profile whose Fe-S intact falls
 * inside this band is as damaged as the knockout heart. The model's weakest
 * defences leave ~29% intact, fitted to the milder brain aconitase figure
 * (24-33%), so the heart band is a reference, not a calibration target.
 */
export const MELOV_HEART_BAND = { lo: 24, hi: 59 } as const;
/** Check a model Fe-S intact % against the Melov 1999 Sod2-null heart band. */
export function melovHeartCheck(aconitasePct: number) {
  return { pct: aconitasePct, inBand: aconitasePct >= MELOV_HEART_BAND.lo && aconitasePct <= MELOV_HEART_BAND.hi, below: aconitasePct < MELOV_HEART_BAND.lo };
}

/**
 * Per-enzyme Melov 1999 figures: complex I 59% and complex II 24% of normal
 * activity in the Sod2-null mouse heart. Each enzyme is tested against its own
 * figure, not the 24-59% span. Complex III (Rieske) and aconitase have no
 * published Melov figure and get none.
 */
export const MELOV_HEART_FIGURES = { complexI: 59, complexII: 24 } as const;
/** ± points around each Melov figure; my own tolerance choice, not published. */
export const MELOV_WINDOW = 5;
/** Check one enzyme's intact % against its Melov figure (null = no figure). */
export function melovHeartCheckEnzyme(pct: number, figure: number | null) {
  return {
    pct,
    figure,
    inBand: figure !== null && Math.abs(pct - figure) <= MELOV_WINDOW,
    below: figure !== null && pct < figure - MELOV_WINDOW,
  };
}
export type MelovHeartSplit = ReturnType<typeof melovHeartCheckEnzyme>;
/** Per-enzyme heart check from the model's per-pool intact %s (0-100 each). */
export function melovHeartCheckSplit(intact: { aconitase: number; complexI: number; complexII: number; complexIII: number }): Record<"aconitase" | "complexI" | "complexII" | "complexIII", MelovHeartSplit> {
  return {
    aconitase: melovHeartCheckEnzyme(intact.aconitase, null),
    complexI: melovHeartCheckEnzyme(intact.complexI, MELOV_HEART_FIGURES.complexI),
    complexII: melovHeartCheckEnzyme(intact.complexII, MELOV_HEART_FIGURES.complexII),
    complexIII: melovHeartCheckEnzyme(intact.complexIII, null),
  };
}

// ---------- Ferroptosis time course after acute GPx4 block ----------
// Integrates dP/dt = vInit + (kProp - kRemove) * P from the pre-block steady
// state, with GPx4 forced to 0 at t = 0 (RSL3 / ML162-like acute block).
// Rates reuse the same lumped terms as the steady-state ferroptosis module,
// and the Primed / Committed thresholds match simulate(): propagation ratio
// 0.4 / 0.8 or oxidized cardiolipin 10% / 30% (Dixon 2012, Stockwell 2017).

export interface TimePoint {
  t: number; // hours since GPx4 block
  plooh: number; // nM
  cardiolipinOx: number; // %
  state: FerroptosisState;
}

export function timeCourse(inputs: Inputs, hours = 48, steps = 96): TimePoint[] {
  const pre = simulate(inputs);
  const blocked = simulate({ ...inputs, gpx4: 0 });
  const pufa = inputs.cardiolipinPufa;
  const kRemove = blocked.ploohRemoval.fsp1 + blocked.ploohRemoval.basal;
  const kProp = blocked.propagationRatio * (kRemove + blocked.ploohRemoval.gpx4);
  const vInit = blocked.plooh * Math.max(kRemove - kProp, 0.02 * kRemove);
  const net = kProp - kRemove; // s-1
  const dt = (hours * 3600) / steps;
  // Exact per-step solution of dP/dt = vInit + net * P; an explicit Euler step
  // is unstable here because net * dt >> 1 at hour-scale steps.
  const grow = Math.exp(net * dt);
  // Physical ceiling: PLOOH saturates when essentially all PUFA cardiolipin is
  // oxidized (ox -> 99%). Without this clamp the exact step overflows to
  // Infinity when net * dt is large (acute block plus high iron).
  const pSat = (99 * 400) / pufa;
  let p = Math.min(pre.plooh, pSat);
  const pts: TimePoint[] = [];
  for (let k = 0; k <= steps; k++) {
    const ox = (100 * p * pufa) / (p * pufa + 400);
    const state: FerroptosisState =
      blocked.propagationRatio >= 0.8 || ox >= 30
        ? "Committed"
        : blocked.propagationRatio >= 0.4 || ox >= 10
          ? "Primed"
          : "Protected";
    pts.push({ t: Number(((k * hours) / steps).toFixed(2)), plooh: p, cardiolipinOx: ox, state });
    p = Math.min(pSat, Math.max(0, Math.abs(net) > 1e-9 ? (p + vInit / net) * grow - vInit / net : p + vInit * dt));
  }
  return pts;
}

// First hour at which the trajectory reaches Committed, or null if it never
// does within the window. Used for the dose chart overlay.
export function timeToCommitted(inputs: Inputs, hours = 48): number | null {
  const hit = timeCourse(inputs, hours, 48).find((p) => p.state === "Committed");
  return hit ? hit.t : null;
}

// ---------- Sensitivity analysis ----------
// Drivers are perturbed by a fraction of their full slider range (not of the
// baseline), so zero-baseline inputs such as photon dose still register.
export type DriverDef = { key: keyof Inputs; label: string; min: number; max: number; group: string };
export const sensitivityDrivers: DriverDef[] = [
  { key: "nadhRatio", label: "NADH / NAD+", min: 0, max: 1, group: "Electron flux" },
  { key: "succinate", label: "Succinate drive", min: 0, max: 2, group: "Electron flux" },
  { key: "oxygen", label: "Oxygen", min: 0.5, max: 120, group: "Electron flux" },
  { key: "labileIron", label: "Labile iron", min: 0, max: 20, group: "Iron" },
  { key: "nitricOxide", label: "Nitric oxide", min: 0, max: 400, group: "ROS / RNS" },
  { key: "redDose", label: "660 nm dose", min: 0, max: 60, group: "Photon" },
  { key: "nirDose", label: "810 nm dose", min: 0, max: 60, group: "Photon" },
  { key: "irradiance", label: "Irradiance", min: 1, max: 200, group: "Photon" },
  { key: "tissueDepth", label: "Tissue depth", min: 0, max: 20, group: "Photon" },
  { key: "gpx4", label: "GPx4 activity", min: 0, max: 2, group: "Ferroptosis" },
  { key: "fsp1", label: "FSP1 / CoQ10H2", min: 0, max: 2, group: "Ferroptosis" },
  { key: "cardiolipinPufa", label: "Cardiolipin PUFA", min: 0.2, max: 1, group: "Ferroptosis" },
  { key: "mitoHalfLife", label: "Turnover half-life", min: 2, max: 60, group: "Iron" },
  { key: "rirrStrength", label: "ROS-induced ROS release", min: 0, max: 1.5, group: "ROS / RNS" },
];
export type SensOutputKey =
  | "superoxide" | "hydrogenPeroxide" | "hydroxylRadical" | "peroxynitrite"
  | "lipidPeroxyl" | "fesIntact" | "aconitaseActivity" | "freeIron"
  | "plooh" | "cardiolipinOx" | "ferroptosisRisk"
  | "emission71THz" | "coherentFraction" | "noReleased" | "tempRise";
export const sensOutputs: { key: SensOutputKey; label: string }[] = [
  { key: "superoxide", label: "O2•-" },
  { key: "hydrogenPeroxide", label: "H2O2" },
  { key: "hydroxylRadical", label: "•OH" },
  { key: "peroxynitrite", label: "ONOO-" },
  { key: "lipidPeroxyl", label: "LOO•" },
  { key: "fesIntact", label: "Fe-S intact" },
  { key: "aconitaseActivity", label: "Aconitase" },
  { key: "freeIron", label: "Free Fe2+" },
  { key: "plooh", label: "PLOOH" },
  { key: "cardiolipinOx", label: "CL ox %" },
  { key: "ferroptosisRisk", label: "Ferroptosis risk" },
  { key: "emission71THz", label: "71 THz" },
  { key: "coherentFraction", label: "Coherent frac" },
  { key: "noReleased", label: "NO released %" },
  { key: "tempRise", label: "Temp rise" },
];

const pctChange = (v: number, b: number) => (b === 0 ? 0 : ((v - b) / Math.abs(b)) * 100);

/** Percent change of every output when each driver moves down / up by delta * range. */
export function sensitivity(base: Inputs, delta = 0.2) {
  const b = simulate(base);
  return sensitivityDrivers.map((d) => {
    const step = delta * (d.max - d.min);
    const lo = simulate({ ...base, [d.key]: Math.max(d.min, base[d.key] - step) });
    const hi = simulate({ ...base, [d.key]: Math.min(d.max, base[d.key] + step) });
    const down = {} as Record<SensOutputKey, number>;
    const up = {} as Record<SensOutputKey, number>;
    for (const o of sensOutputs) {
      down[o.key] = pctChange(lo[o.key], b[o.key]);
      up[o.key] = pctChange(hi[o.key], b[o.key]);
    }
    return { driver: d, down, up };
  });
}

/** Sweep one driver across its range, returning all sensitivity outputs. */
export function sweep(base: Inputs, key: keyof Inputs, n = 40) {
  const d = sensitivityDrivers.find((x) => x.key === key)!;
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = d.min + ((d.max - d.min) * i) / n;
    const o = simulate({ ...base, [key]: x });
    const row: Record<string, number> = { x };
    for (const s of sensOutputs) row[s.key] = o[s.key];
    return row;
  });
}

/** Two-driver grid: each axis spans the driver's range, each cell runs the full model. */
export function grid2d(base: Inputs, keyX: keyof Inputs, keyY: keyof Inputs, n = 21) {
  const dx = sensitivityDrivers.find((d) => d.key === keyX)!;
  const dy = sensitivityDrivers.find((d) => d.key === keyY)!;
  const xs = Array.from({ length: n }, (_, i) => dx.min + ((dx.max - dx.min) * i) / (n - 1));
  const ys = Array.from({ length: n }, (_, i) => dy.min + ((dy.max - dy.min) * i) / (n - 1));
  const cells = ys.map((y) =>
    xs.map((x) => {
      const o = simulate({ ...base, [keyX]: x, [keyY]: y });
      const row = { x, y } as Record<string, number>;
      for (const s of sensOutputs) row[s.key] = o[s.key];
      return row;
    }),
  );
  return { xs, ys, cells, dx, dy };
}
