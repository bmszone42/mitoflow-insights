import { defaultInputs, simulate, type Inputs, type Outputs } from "../model";

export type RosEntry = {
  name: string;
  formula: string;
  halfLife: string;
  diffusion: string;
  sources: string;
  removal: string;
  targets: string;
  note: string;
};

export const rosSpecies: RosEntry[] = [
  {
    name: "Superoxide anion",
    formula: "O2•-",
    halfLife: "~1e-6 s (matrix)",
    diffusion: "~0.3 µm, membrane impermeant",
    sources: "Complex I site IF/IQ, Complex III Qo, GPDH, p66Shc, MAO",
    removal: "SOD2 (k ≈ 2.3e9 M-1 s-1), SOD1 in IMS",
    targets: "[4Fe-4S] clusters (aconitase-2, SDH), NO",
    note: "Primary ROS; nearly all other species derive from it. Yield rises steeply above ΔΨ ≈ 150 mV.",
  },
  {
    name: "Hydrogen peroxide",
    formula: "H2O2",
    halfLife: "~1e-3 to 1 s",
    diffusion: "µm-mm, crosses membranes via aquaporin-8",
    sources: "SOD2 dismutation, MAO, sulfhydryl oxidases, p66Shc",
    removal: "Peroxiredoxin-3/5, GPx1/4, catalase, thioredoxin-2",
    targets: "Cysteine thiols (PTP1B, PTEN), Keap1/Nrf2, HIF stability",
    note: "The main redox-signalling species; 10-100 nM is signalling, >1 µM is damaging.",
  },
  {
    name: "Hydroxyl radical",
    formula: "•OH",
    halfLife: "~1e-9 s",
    diffusion: "~1-3 nm, reacts where formed",
    sources: "Fenton reaction Fe2+ + H2O2, Haber-Weiss cycle",
    removal: "No enzyme; only iron sequestration prevents it",
    targets: "mtDNA (8-oxo-dG), cardiolipin, protein backbone",
    note: "Controlled only upstream, by keeping the labile iron pool small.",
  },
  {
    name: "Peroxynitrite",
    formula: "ONOO-",
    halfLife: "~10 ms",
    diffusion: "~5-20 µm",
    sources: "O2•- + NO at k ≈ 1e10 M-1 s-1",
    removal: "Peroxiredoxin-5, CO2-catalysed decay, glutathione",
    targets: "Tyrosine nitration of SOD2, Complex I, aconitase, MnSOD Tyr34",
    note: "Diffusion-limited; forms whenever NO and superoxide coexist.",
  },
  {
    name: "Singlet oxygen",
    formula: "1O2",
    halfLife: "~1-4 µs",
    diffusion: "~100-200 nm",
    sources: "Photosensitization of porphyrins/flavins, O2•- recombination",
    removal: "Carotenoids, tocopherol, physical quenching by water",
    targets: "Unsaturated lipids, guanine, His/Trp/Met residues",
    note: "The species most directly increased by high photon doses.",
  },
  {
    name: "Lipid peroxyl / alkoxyl radicals",
    formula: "LOO• / LO•",
    halfLife: "~s",
    diffusion: "Propagates within the bilayer",
    sources: "Chain initiation by •OH or ONOO- on cardiolipin",
    removal: "GPx4, tocopherol, CoQ10-H2, FSP1",
    targets: "Cardiolipin, cytochrome c anchoring, mPTP threshold",
    note: "Cardiolipin peroxidation releases cytochrome c and is the ferroptosis link.",
  },
  {
    name: "Hydroperoxyl radical",
    formula: "HO2•",
    halfLife: "~1e-6 s",
    diffusion: "Membrane permeant, unlike O2•-",
    sources: "Protonation of O2•- (pKa 4.8) at membrane surfaces",
    removal: "Spontaneous dismutation, tocopherol",
    targets: "PUFA bis-allylic hydrogens",
    note: "Minor by concentration, disproportionately potent at initiating peroxidation.",
  },
];

