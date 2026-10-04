import { inputRanges, simulate, defaultGeometry, type Inputs, type Outputs } from "./model";

/*
 * MADE-UP carrier efficiency levers. Each rate (0-2x, 1x = current run) scales an
 * existing Inputs key through an invented mapping. No published transport rate backs
 * any curve. Rates stay local to the Carriers page and never enter Inputs, flags,
 * scenarios or diagnosis elsewhere.
 */
export type CarrierId = "mfrn" | "slc25a34" | "ant" | "pic" | "mpc" | "ucp1";

export type Carrier = {
  id: CarrierId; gene: string; name: string; cargo: string; modelLink: string;
  status: string; sourceLabel: string; sourceUrl: string;
};

export const carriers: Carrier[] = [
  { id: "mfrn", gene: "SLC25A37 / SLC25A28", name: "Mitoferrin-1 / -2", cargo: "Fe2+ into the matrix", modelLink: "Scales labile iron (linear)", status: "Cited mechanism, made-up rate", sourceLabel: "Shaw et al., Nature 440:96-100 (2006)", sourceUrl: "https://doi.org/10.1038/nature04512" },
  { id: "slc25a34", gene: "SLC25A34", name: "Oxaloacetate carrier", cargo: "Oxaloacetate into the matrix", modelLink: "Scales NADH pool via invented curve 1.5r/(0.5+r)", status: "MADE-UP curve", sourceLabel: "Karavaeva et al., Science 394(6819), eadz4797 (2026)", sourceUrl: "https://doi.org/10.1126/science.adz4797" },
  { id: "ant", gene: "SLC25A4 / SLC25A5", name: "ADP/ATP carrier (ANT1/2)", cargo: "ADP in, ATP out", modelLink: "Scales matrix ADP available to ATP synthase (linear)", status: "Cited mechanism, made-up rate", sourceLabel: "Kunji et al., BBA 1863:2379-2393 (2016)", sourceUrl: "https://doi.org/10.1016/j.bbamcr.2016.03.015" },
  { id: "pic", gene: "SLC25A3", name: "Phosphate carrier (PiC)", cargo: "Pi into the matrix", modelLink: "Scales ADP drive at half weight (Pi co-limits synthase)", status: "Cited mechanism, made-up rate", sourceLabel: "Palmieri, Mol Aspects Med 34:465-484 (2013)", sourceUrl: "https://doi.org/10.1016/j.mam.2012.05.005" },
  { id: "mpc", gene: "MPC1 / MPC2", name: "Mitochondrial pyruvate carrier", cargo: "Pyruvate into the matrix", modelLink: "Scales NADH pool at 30% weight", status: "Cited mechanism, made-up rate", sourceLabel: "Bricker et al., Science 337:96-100 (2012)", sourceUrl: "https://doi.org/10.1126/science.1218099" },
  { id: "ucp1", gene: "SLC25A7", name: "Uncoupling protein 1", cargo: "H+ leak back into the matrix", modelLink: "Scales the uncoupling slider (linear)", status: "Cited mechanism, made-up rate", sourceLabel: "Nicholls, Biochem Soc Trans 29:751-755 (2001)", sourceUrl: "https://doi.org/10.1042/bst0290751" },
];

export type CarrierRates = Record<CarrierId, number>;
export const unitRates: CarrierRates = { mfrn: 1, slc25a34: 1, ant: 1, pic: 1, mpc: 1, ucp1: 1 };

const clamp = (k: keyof Inputs, v: number) => Math.min(inputRanges[k].max, Math.max(inputRanges[k].min, v));
const oaa = (r: number) => (1.5 * r) / (0.5 + r);

export function applyCarriers(i: Inputs, r: CarrierRates): Inputs {
  const nadh = i.nadhRatio * oaa(r.slc25a34) * (0.7 + 0.3 * r.mpc);
  const adp = i.adp * r.ant * (1 + 0.5 * (r.pic - 1));
  return {
    ...i,
    labileIron: clamp("labileIron", i.labileIron * r.mfrn),
    nadhRatio: clamp("nadhRatio", nadh),
    adp: clamp("adp", adp),
    uncoupling: clamp("uncoupling", i.uncoupling * r.ucp1),
  };
}

export type CarrierReadout = { nadh: number; atp: number; so: number; h2Nm: number; iron: number };
export const readout = (i: Inputs, o: Outputs = simulate(i, defaultGeometry)): CarrierReadout => ({
  nadh: i.nadhRatio, atp: o.atpFlux, so: o.superoxide, h2Nm: o.hydrogenPeroxide, iron: o.freeIron,
});
