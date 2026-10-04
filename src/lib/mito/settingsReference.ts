import { defaultGeometry, defaultInputs, geometryRanges, inputRanges, type Geometry, type Inputs } from "./model";

export type SettingsGroup = "Energy and substrates" | "Iron and redox" | "Light" | "Ferroptosis" | "Membrane geometry";
export const settingsGroups: SettingsGroup[] = ["Energy and substrates", "Iron and redox", "Light", "Ferroptosis", "Membrane geometry"];

type SettingMeta = {
  group: SettingsGroup;
  context: string;
  source: string;
  url: string;
  note: string;
  band?: { lo: number; hi: number; label: string; unit: string; multiplier?: number };
};

// Only comparable quantities have numeric bands. Slider limits are not reference intervals.
const inputMeta: Record<keyof Inputs, SettingMeta> = {
  nadhRatio: { group: "Energy and substrates", context: "No universal NADH pool fraction", source: "Ramsay, ChemTexts (2019)", url: "https://doi.org/10.1007/s40828-019-0085-4", note: "The model uses a reduction-state fraction, not the NADH/NAD+ concentration ratio; it varies with metabolic state." },
  succinate: { group: "Energy and substrates", context: "Relative Complex II drive", source: "Ramsay, ChemTexts (2019)", url: "https://doi.org/10.1007/s40828-019-0085-4", note: "Unitless model drive cannot be compared with tissue succinate concentration." },
  oxygen: { group: "Energy and substrates", context: "Tissue and preparation dependent", source: "Wilson, J Appl Physiol (2013)", url: "https://doi.org/10.1152/japplphysiol.01160.2012", note: "Complex IV affinity is not a reference interval for local mitochondrial oxygen." },
  deltaPsi: { group: "Energy and substrates", context: "Approximate mammalian mitochondrial band", source: "Zorova et al., Anal Biochem (2018)", url: "https://doi.org/10.1016/j.ab.2017.07.009", note: "Approximate intact-cell range; probe calibration, tissue and preparation affect absolute values.", band: { lo: 150, hi: 180, label: "150–180 mV", unit: "mV" } },
  adp: { group: "Energy and substrates", context: "No universal free matrix ADP interval", source: "Nicholls & Ferguson, Bioenergetics (2013)", url: "https://doi.org/10.1016/B978-0-12-388425-1.00003-8", note: "Free ADP depends on respiratory state, compartment and assay." },
  uncoupling: { group: "Energy and substrates", context: "Model uncoupling fraction; no comparable interval", source: "Rolfe & Brand, Biosci Rep (1997)", url: "https://doi.org/10.1023/A:1027327015957", note: "Published proton leak as a fraction of respiration is a different quantity from this model's uncoupling control. Do not interpret 5–25% respiration share as a slider reference band." },
  labileIron: { group: "Iron and redox", context: "Assay-specific labile Fe²⁺ pool", source: "Kakhlon & Cabantchik, Free Radic Biol Med (2002)", url: "https://doi.org/10.1016/S0891-5849(02)01006-7", note: "Cell type, compartment and fluorescent probe calibration prevent a universal interval." },
  nitricOxide: { group: "Iron and redox", context: "Local, transient NO exposure", source: "Brown, Biochim Biophys Acta (2001)", url: "https://doi.org/10.1016/S0005-2728(00)00238-3", note: "Local NO concentration changes rapidly and competes with oxygen at Complex IV." },
  antioxidantCapacity: { group: "Iron and redox", context: "Relative antioxidant scaling", source: "Cox et al., Biochem J (2009)", url: "https://doi.org/10.1042/BJ20091541", note: "Combines Prx3, GPx, GSH and thioredoxin effects; not a directly measured single quantity." },
  redDose: { group: "Light", context: "Experimental 660 nm exposure", source: "Huang et al., Dose Response (2009)", url: "https://doi.org/10.2203/dose-response.09-027.Hamblin", note: "Dose response depends on irradiance, target, tissue depth and protocol; no universal healthy exposure range." },
  nirDose: { group: "Light", context: "Experimental 810 nm exposure", source: "Huang et al., Dose Response (2009)", url: "https://doi.org/10.2203/dose-response.09-027.Hamblin", note: "Dose response depends on irradiance, target, tissue depth and protocol; no universal healthy exposure range." },
  irradiance: { group: "Light", context: "Experimental light intensity", source: "Huang et al., Dose Response (2009)", url: "https://doi.org/10.2203/dose-response.09-027.Hamblin", note: "Irradiance is a protocol choice, not a normal physiological quantity." },
  tissueDepth: { group: "Light", context: "Exposure geometry", source: "Jacques, Phys Med Biol (2013)", url: "https://doi.org/10.1088/0031-9155/58/11/R37", note: "Depth varies by anatomy and setup; 0 mm represents cultured cells." },
  gpx4: { group: "Ferroptosis", context: "Relative GPx4 activity", source: "Ursini et al., Biochim Biophys Acta (1985)", url: "https://doi.org/10.1016/0304-4165(85)90182-5", note: "One model scaling factor, not a comparable assay activity interval." },
  fsp1: { group: "Ferroptosis", context: "Relative FSP1 / CoQ10H₂ capacity", source: "Bersuker et al., Nature (2019)", url: "https://doi.org/10.1038/s41586-019-1705-2", note: "Mechanistic model scaling, not a measured concentration or reference interval." },
  cardiolipinPufa: { group: "Ferroptosis", context: "Composition depends on tissue and lipid species", source: "Kagan et al., Nat Chem Biol (2005)", url: "https://doi.org/10.1038/nchembio727", note: "Model fraction does not map to a standardized clinical cardiolipin PUFA interval." },
  rirrStrength: { group: "ROS", context: "Mechanism only: weak thiol defenses let Complex I/III leak more (ROS-induced ROS release)", source: "Zorov et al., Physiol Rev (2014)", url: "https://doi.org/10.1152/physrev.00026.2013", note: "No published strength; 0.5 default is a model assumption. 0 = off. Has no effect at 1x antioxidant capacity." },
  mitoHalfLife: { group: "Ferroptosis", context: "Mouse median mitochondrial protein half-life: liver 3.5-4.3 d, heart 17.2 d, brain synaptic 25.7 d", source: "Kim et al., Mol Cell Proteomics (2012)", url: "https://doi.org/10.1074/mcp.M112.021162", note: "Protein turnover proxy for mitophagy in mouse tissue; no human per-tissue interval. Damage calibration (10% at 17.2 d) is a model assumption." },
};

const geometryMeta: Record<keyof Geometry, Omit<SettingMeta, "group">> = {
  length: { context: "Cell type and imaging dependent", source: "Cogliati et al., Cell (2013)", url: "https://doi.org/10.1016/j.cell.2013.08.032", note: "Model geometry is approximately nm-scaled; no universal organelle length interval applies." },
  matrixWidth: { context: "Morphology dependent", source: "Cogliati et al., Cell (2013)", url: "https://doi.org/10.1016/j.cell.2013.08.032", note: "Width in this simplified cross-section is not an assay-standardized measurement." },
  swelling: { context: "Stress and preparation dependent", source: "Frezza et al., Cell (2006)", url: "https://doi.org/10.1016/j.cell.2006.06.025", note: "Outer membrane gap is a model geometry control, not a diagnostic swelling threshold." },
  cristaeCount: { context: "Size and section dependent", source: "Cogliati et al., Cell (2013)", url: "https://doi.org/10.1016/j.cell.2013.08.032", note: "A two-dimensional count changes with cut plane and organelle length." },
  cristaeDepth: { context: "Section and morphology dependent", source: "Cogliati et al., Cell (2013)", url: "https://doi.org/10.1016/j.cell.2013.08.032", note: "The modeled depth is approximately nm-scaled, not calibrated against one tissue." },
  junctionWidth: { context: "Imaging and preparation dependent", source: "Frezza et al., Cell (2006)", url: "https://doi.org/10.1016/j.cell.2006.06.025", note: "Junction width varies with method and state; the slider's bounds are design limits." },
  cristaeShape: { context: "Model lamellar-to-tubular index", source: "Cogliati et al., Cell (2013)", url: "https://doi.org/10.1016/j.cell.2013.08.032", note: "Unitless morphologic mix, not a directly reported clinical measurement." },
  tipCurvature: { context: "Model curvature index", source: "Paumard et al., EMBO J (2002)", url: "https://doi.org/10.1093/emboj/21.3.221", note: "Unitless index for ATP synthase-associated curvature, not a measured physical radius." },
};

export type SettingRow = {
  id: string;
  group: SettingsGroup;
  label: string;
  live: string;
  baseline: string;
  reference: string;
  status: "Within range" | "Outside range" | "Context dependent";
  drift: string | null;
  source: string;
  url: string;
  note: string;
};

const show = (value: number, unit: string, key: string) =>
  key === "uncoupling" ? `${(value * 100).toFixed(0)}%` : `${Number(value.toFixed(2))}${unit && unit !== "fraction" && unit !== "rel" ? ` ${unit}` : unit === "rel" ? " rel" : ""}`;

function makeRow(id: string, label: string, value: number, baseline: number, unit: string, meta: SettingMeta): SettingRow {
  const band = meta.band;
  const scaled = value * (band?.multiplier ?? 1);
  const status = !band ? "Context dependent" : scaled < band.lo - 1e-9 || scaled > band.hi + 1e-9 ? "Outside range" : "Within range";
  const distance = band && status === "Outside range"
    ? `${Number(Math.abs(scaled - (scaled < band.lo ? band.lo : band.hi)).toFixed(2))} ${band.unit} ${scaled < band.lo ? "below" : "above"} ${scaled < band.lo ? band.lo : band.hi} ${band.unit}`
    : null;
  return { id, group: meta.group, label, live: show(value, unit, id), baseline: show(baseline, unit, id), reference: band?.label ?? meta.context, status, drift: distance, source: meta.source, url: meta.url, note: meta.note };
}

export function modelSettingRows(inputs: Inputs, geo: Geometry): SettingRow[] {
  const inputRows = (Object.keys(inputRanges) as (keyof Inputs)[]).map((key) => {
    const definition = inputRanges[key];
    return makeRow(key, definition.label, inputs[key], defaultInputs[key], definition.unit, inputMeta[key]);
  });
  const geometryRows = (Object.keys(geometryRanges) as (keyof Geometry)[]).map((key) => {
    const definition = geometryRanges[key];
    return makeRow(key, definition.label, geo[key], defaultGeometry[key], key === "cristaeShape" || key === "tipCurvature" || key === "cristaeCount" ? "" : "nm", { ...geometryMeta[key], group: "Membrane geometry" });
  });
  return [...inputRows, ...geometryRows];
}