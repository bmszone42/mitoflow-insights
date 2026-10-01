import type { Inputs, Outputs } from "./model";

// Values labelled "assumed" are model parameters, never healthy intervals.
// Source links support the named mechanism or kinetic constant only, not a
// cross-tissue calibration of simulated flux (µM/s).
export const biochemicalLedger = [
  { name: "Oxygen input", value: "Live slider", kind: "Concentration", basis: "µM dissolved O₂. Model CIV saturation uses an assumed apparent K₀.₅ of 0.8 µM; oxygen affinity varies with respiratory state and preparation.", source: "Wilson et al. J Appl Physiol 2012;113:1838–1845", url: "https://doi.org/10.1152/japplphysiol.01160.2012" },
  { name: "ADP input", value: "Live slider", kind: "Concentration", basis: "µM nominal ADP, not measured free matrix ADP. Apparent ADP drive K = 40 µM is assumed; Mg²⁺ binding and phosphorylation state alter availability.", source: "Gout et al. PNAS 2014;111:E4560–E4567", url: "https://doi.org/10.1073/pnas.1406251111" },
  { name: "NADH and succinate", value: "Dimensionless inputs", kind: "Redox/substrate proxy", basis: "NADH ratio and succinate control are not absolute matrix concentrations. No mM can be derived from these sliders; CI 55 and CII 30 µM electron-pairs/s are unfitted capacities.", source: "Chen et al. Cell 2016;166:1324–1337", url: "https://doi.org/10.1016/j.cell.2016.07.040" },
  { name: "NO input", value: "Live slider", kind: "Concentration", basis: "nM nominal NO, not a verified matrix measurement. CIV inhibition constant 120 nM is a model assumption; NO competes with oxygen.", source: "Radi. Acc Chem Res 2013;46:550–559", url: "https://doi.org/10.1021/ar300234c" },
  { name: "Labile Fe²⁺ input", value: "Live slider", kind: "Concentration", basis: "µM model pool; Fe release from clusters and Fenton flux are estimated, not an assay-calibrated clinical value.", source: "Koppenol. Redox Rep 2001;6:229–234", url: "https://doi.org/10.1179/135100001101536373" },
  { name: "Prx3 + H₂O₂", value: "2 × 10⁷ M⁻¹ s⁻¹", kind: "Measured enzyme kinetic constant", basis: "Purified human Prx3 second-order rate. The model multiplies by an assumed 0.075 µM accessible reduced pool and limits clearance by an assumed NADPH recycling cap; neither pool nor cap is measured here.", source: "Cox et al. Biochemistry 2009;48:6495–6501", url: "https://doi.org/10.1021/bi900558g" },
  { name: "SOD2 and ROS sites", value: "10,000 s⁻¹ effective sink", kind: "Assumed effective rate", basis: "Matrix superoxide clearance is a fitted first-order sink, not a measured SOD2 enzyme rate. Site-specific CI/II/III/OGDH ROS source coefficients are relative; isolated-mitochondria rates cannot calibrate in-vivo µM/s.", source: "Murphy. Biochem J 2009;417:1–13", url: "https://doi.org/10.1042/BJ20081386" },
  { name: "ATP yield", value: "2.5 NADH / 1.5 succinate", kind: "Stoichiometric literature estimate", basis: "10 or 6 pumped H⁺ divided by 4 H⁺/ATP including transport. Model routes CIV supply by CI/CII share and applies assumed ADP, leak and geometry penalties. It is not an ATP flux assay.", source: "Hinkle. BBA Bioenergetics 2005;1706:1–11", url: "https://doi.org/10.1016/j.bbabio.2004.09.004" },
  { name: "Fe-S damage and lipid propagation", value: "3.5× / 1.15×", kind: "Model calibration", basis: "Aconitase superoxide attack is amplified 3.5× for light sensitivity; lipid-peroxyl propagation uses a legacy 1.15 multiplier. Neither multiplier is a measured biochemical constant.", source: "Murphy. Biochem J 2009;417:1–13 (limitations context)", url: "https://doi.org/10.1042/BJ20081386" },
] as const;

export function biochemicalLiveReadouts(inputs: Inputs, outputs: Outputs) {
  return [
    { name: "O₂ input", value: `${inputs.oxygen.toFixed(1)} µM`, note: "Nominal dissolved concentration" },
    { name: "ADP input", value: `${inputs.adp.toFixed(0)} µM`, note: "Nominal, not free matrix ADP" },
    { name: "NO input", value: `${inputs.nitricOxide.toFixed(0)} nM`, note: "Nominal, not measured matrix NO" },
    { name: "Labile Fe²⁺", value: `${inputs.labileIron.toFixed(2)} µM`, note: "Assumed input pool" },
    { name: "ATP production", value: `${outputs.atpFlux.toFixed(2)} µM/s`, note: "Uncalibrated model estimate" },
    { name: "Matrix O₂•⁻", value: `${outputs.superoxide.toPrecision(3)} nM`, note: "Uncalibrated steady state" },
    { name: "H₂O₂", value: `${outputs.hydrogenPeroxide.toPrecision(3)} nM`, note: "Uncalibrated steady state" },
    { name: "Prx3 H₂O₂ removal", value: `${(outputs.rosBudget.h2o2Sinks["Prx3"] ?? 0).toPrecision(3)} µM/s`, note: "Measured k, assumed active pool" },
  ];
}