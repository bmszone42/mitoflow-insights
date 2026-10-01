import { simulate, type Geometry, type Inputs, type Outputs } from "./model";

type BudgetKey = "superoxideSources" | "h2o2Sources" | "hydroxylSources";
type RosSource = {
  species: string;
  label: string;
  budget?: BudgetKey;
  key?: string;
  formation?: (out: Outputs) => number;
  drivers: (keyof Inputs)[];
  mechanism: string;
  literatureValue: string;
  citation: string;
  url: string;
};

export const rosFlagPercent = 25;

export const rosInputNames: Record<keyof Inputs, string> = {
  nadhRatio: "NADH ratio", succinate: "Succinate", oxygen: "Oxygen", deltaPsi: "Membrane potential",
  adp: "ADP", labileIron: "Labile iron", nitricOxide: "Nitric oxide", redDose: "Red-light dose",
  nirDose: "Near-infrared dose", irradiance: "Irradiance", tissueDepth: "Tissue depth",
  antioxidantCapacity: "Antioxidant capacity", uncoupling: "Uncoupling", gpx4: "GPx4",
  fsp1: "FSP1", cardiolipinPufa: "Cardiolipin PUFA",
};

// Published quantities below describe mechanisms or reaction constants, not
// interchangeable in-situ production rates. Rates and flags compare simulations.
export const rosSources: RosSource[] = [
  { species: "O2•-", label: "Complex I · site IF", budget: "superoxideSources", key: "CI IF", drivers: ["nadhRatio", "adp", "deltaPsi", "uncoupling", "oxygen", "redDose", "nirDose", "irradiance", "tissueDepth"], mechanism: "Reduced flavin at the NADH entry site; increases with NADH and membrane potential.", literatureValue: "Total respiratory electron leak ~0.1–2% of flux; no transferable IF-specific µM/s interval.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "O2•-", label: "Complex I · site IQ / RET", budget: "superoxideSources", key: "CI IQ (RET)", drivers: ["succinate", "deltaPsi", "uncoupling", "oxygen"], mechanism: "Reverse electron transport needs a reduced Q pool and high membrane potential.", literatureValue: "RET is strongly potential dependent; no transferable IQ-specific µM/s interval.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "O2•-", label: "Complex III · site IIIQo", budget: "superoxideSources", key: "CIII Qo", drivers: ["nadhRatio", "succinate", "deltaPsi", "uncoupling", "oxygen", "redDose", "nirDose"], mechanism: "Qo semiquinone transfers electrons to oxygen; model partitions half the rate to the intermembrane space.", literatureValue: "Model IMS partition 50%; not a universal measured site-specific rate.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "O2•-", label: "Complex II · site IIF", budget: "superoxideSources", key: "CII IIF", drivers: ["succinate", "oxygen"], mechanism: "Flavin-linked release, sensitive to succinate occupancy.", literatureValue: "Site identified; no transferable IIF-specific µM/s interval.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "O2•-", label: "2-oxoglutarate dehydrogenase", budget: "superoxideSources", key: "OGDH", drivers: ["nadhRatio", "oxygen", "redDose", "nirDose"], mechanism: "Reduced DLD flavin releases superoxide; model assigns 40% of this pathway to O2•-.", literatureValue: "40% model partition, not a universal measured fraction.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "H2O2", label: "SOD1 / SOD2 dismutation", budget: "h2o2Sources", key: "Dismutation", drivers: ["nadhRatio", "succinate", "deltaPsi", "uncoupling", "oxygen", "antioxidantCapacity", "nitricOxide"], mechanism: "Two superoxide molecules are dismutated into one H2O2.", literatureValue: "2 O2•- → 1 H2O2; SOD2 k ~2.3 × 10⁹ M⁻¹ s⁻¹. Not an H2O2 rate band.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "H2O2", label: "OGDH · direct peroxide", budget: "h2o2Sources", key: "OGDH", drivers: ["nadhRatio", "oxygen", "redDose", "nirDose"], mechanism: "Direct DLD flavin H2O2 production; model assigns 60% of OGDH ROS here.", literatureValue: "60% model partition, not an assay reference interval.", citation: "Brand, Free Radic Biol Med (2016), 100:14–31", url: "https://doi.org/10.1016/j.freeradbiomed.2016.04.001" },
  { species: "H2O2", label: "Flavin photosensitization", budget: "h2o2Sources", key: "Flavin photo", drivers: ["redDose", "nirDose", "irradiance", "tissueDepth", "oxygen"], mechanism: "Absorbed light excites flavins; absent without delivered light in this model.", literatureValue: "Light-induced H2O2 described experimentally; dose and preparation dependent, no universal µM/s band.", citation: "Hockberger et al., PNAS (1999), 96:6255–6260", url: "https://doi.org/10.1073/pnas.96.11.6255" },
  { species: "ONOO-", label: "Superoxide + nitric oxide", formation: (out) => out.rosBudget.superoxideSinks["NO (to ONOO-)"] ?? 0, drivers: ["nitricOxide", "nadhRatio", "succinate", "deltaPsi", "uncoupling", "redDose", "nirDose"], mechanism: "Matrix O2•- reacts with NO; this formation rate is also the modeled O2•- sink to ONOO-.", literatureValue: "Reaction k ~10¹⁰ M⁻¹ s⁻¹ (model assumption); not a production-rate interval.", citation: "Radi, Acc Chem Res (2013), 46:550–559", url: "https://doi.org/10.1021/ar300234c" },
  { species: "•OH", label: "Fenton · Fe2+ + H2O2", budget: "hydroxylSources", key: "Fenton", drivers: ["labileIron", "nadhRatio", "succinate", "deltaPsi", "oxygen", "antioxidantCapacity", "gpx4"], mechanism: "Labile ferrous iron converts H2O2 into a hydroxyl radical; Fe3+ recycling depends partly on superoxide.", literatureValue: "Reaction k ~10²–10³ M⁻¹ s⁻¹ (model estimate); not a mitochondrial •OH flux interval.", citation: "Koppenol, Redox Rep (2001), 6:229–234", url: "https://doi.org/10.1179/135100001101536373" },
  { species: "•OH", label: "ONOOH homolysis", budget: "hydroxylSources", key: "ONOOH homolysis", drivers: ["nitricOxide", "nadhRatio", "succinate", "deltaPsi", "uncoupling"], mechanism: "The model gives hydroxyl-like radical yield to 30% of ONOOH homolysis events.", literatureValue: "30% model yield assumption, not a universal tissue production rate.", citation: "Radi, Acc Chem Res (2013), 46:550–559", url: "https://doi.org/10.1021/ar300234c" },
];

// Species-level assay flags: a profile's own assay signal versus the healthy
// control profile. One assay covers every site of its species; never site-specific.
export type RosAssayMetric = "mitosox" | "h2o2" | "lipidPeroxidation";
export const rosAssayBySpecies: Record<string, { metric: RosAssayMetric; label: string; scale: number } | undefined> = {
  "O2•-": { metric: "mitosox", label: "MitoSOX", scale: 1 },
  H2O2: { metric: "h2o2", label: "H₂O₂ probe", scale: 1 },
  "•OH": { metric: "lipidPeroxidation", label: "Lipid oxidation", scale: 100 },
};

export function rosAssayFlag(species: string, profile: Record<RosAssayMetric, number> | undefined, control: Record<RosAssayMetric, number>) {
  const assay = rosAssayBySpecies[species];
  if (!assay || !profile) return null;
  const ratio = profile[assay.metric] / control[assay.metric];
  const percent = (ratio - 1) * 100;
  return { ...assay, value: profile[assay.metric] / assay.scale, control: control[assay.metric] / assay.scale, percent, flagged: Math.abs(percent) >= rosFlagPercent };
}

export function rosSourceRows(current: Outputs, baseline: Outputs, inputs: Inputs, defaultInputs: Inputs) {
  return rosSources.map((source) => {
    const live = rosSourceRate(source, current);
    const base = rosSourceRate(source, baseline);
    const percent = base > 0 ? ((live - base) / base) * 100 : null;
    const flagged = base > 0 ? Math.abs(percent ?? 0) >= rosFlagPercent : live > 0;
    const changedDrivers = source.drivers.filter((key) => inputs[key] !== defaultInputs[key]);
    return { ...source, live, base, percent, flagged, changedDrivers };
  });
}

export function rosSourceRate(source: RosSource, out: Outputs) {
  return source.formation?.(out) ?? (source.budget && source.key ? out.rosBudget[source.budget][source.key] ?? 0 : 0);
}

// Leave-one-control-out counterfactuals, evaluated at the CURRENT settings.
// Effects interact and cannot be added together or treated as clinical causality.
export function rosDriverAttributions(
  rows: ReturnType<typeof rosSourceRows>, inputs: Inputs, defaults: Inputs, geo: Geometry,
) {
  const changed = (Object.keys(defaults) as (keyof Inputs)[]).filter((key) => inputs[key] !== defaults[key]);
  const reverted = new Map(changed.map((key) => [key, simulate({ ...inputs, [key]: defaults[key] }, geo)]));
  return rows.map((row) => changed.map((key) => {
    const without = reverted.get(key);
    const rateWithout = without ? rosSourceRate(row, without) : row.live;
    return { key, from: defaults[key], to: inputs[key], delta: row.live - rateWithout, rateWithout, direct: row.drivers.includes(key) };
  }).filter((effect) => Math.abs(effect.delta) > 1e-12).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)));
}