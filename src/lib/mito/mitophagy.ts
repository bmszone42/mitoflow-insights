import { defaultInputs, inputRanges, simulate, type Geometry, type Inputs } from "./model";

/*
 * MADE-UP mitophagy lever (behaviors level, Monzel 2023 framing). Rate 0-2x, 1x = no change.
 * Clearing damaged mitochondria pulls membrane potential toward the default, lowers labile
 * iron, and trims ATP capacity (fewer mitochondria). No published rate backs these numbers.
 * Never enters Inputs, flags, scenarios or diagnosis.
 */
const clamp = (k: keyof Inputs, v: number) => Math.min(inputRanges[k].max, Math.max(inputRanges[k].min, v));

export function applyMitophagy(i: Inputs, rate: number): { inputs: Inputs; atpTrim: number } {
  const d = rate - 1;
  return {
    inputs: {
      ...i,
      deltaPsi: clamp("deltaPsi", i.deltaPsi + (defaultInputs.deltaPsi - i.deltaPsi) * 0.3 * d),
      labileIron: clamp("labileIron", i.labileIron * (1 - 0.2 * d)),
    },
    atpTrim: Math.max(0, 1 - 0.1 * d),
  };
}

export function mitophagyReadout(i: Inputs, geo: Geometry, rate: number) {
  const { inputs, atpTrim } = applyMitophagy(i, rate);
  const o = simulate(inputs, geo);
  return { psi: inputs.deltaPsi, iron: inputs.labileIron, atp: o.atpFlux * atpTrim, so: o.superoxide, h2: o.hydrogenPeroxide, fes: o.fesIntact };
}
