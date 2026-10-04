import { inputRanges, qualityControl, simulate, type Geometry, type Inputs } from "./model";

/*
 * Urolithin A exploration card. The turnover math itself lives in simulate()
 * (mitoHalfLife input, published half-lives). Here a turnover speed-up factor
 * (from the dose slider, effect size assumed) shortens the half-life:
 * t1/2 / speedup. Local card state only; never written back to Inputs.
 */
export function applyMitophagy(i: Inputs, speedup: number): Inputs {
  const r = inputRanges.mitoHalfLife;
  return { ...i, mitoHalfLife: Math.min(r.max, Math.max(r.min, i.mitoHalfLife / Math.max(0.1, speedup))) };
}

export function mitophagyReadout(i: Inputs, geo: Geometry, speedup: number) {
  const inputs = applyMitophagy(i, speedup);
  const qc = qualityControl(inputs.mitoHalfLife);
  const o = simulate(inputs, geo);
  return {
    halfLife: inputs.mitoHalfLife,
    damaged: qc.damaged,
    psi: inputs.deltaPsi - 15 * qc.dD,
    iron: inputs.labileIron * qc.iron,
    atp: o.atpFlux,
    so: o.superoxide,
    h2: o.hydrogenPeroxide,
    fes: o.fesIntact,
  };
}
