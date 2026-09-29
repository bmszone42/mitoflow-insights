import { defaultInputs, simulate, type Inputs, type Outputs } from "./model";

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

export type FesEntry = {
  cluster: string;
  protein: string;
  role: string;
  vulnerability: string;
};

export const fesClusters: FesEntry[] = [
  {
    cluster: "[2Fe-2S] N1a, N1b",
    protein: "Complex I (NDUFV2, NDUFS1)",
    role: "Electron relay from FMN toward the quinone site",
    vulnerability: "Moderate; N1a modulates FMN-site superoxide output",
  },
  {
    cluster: "[4Fe-4S] N2, N3-N7",
    protein: "Complex I (NDUFS2/3/7/8)",
    role: "Final electron donor chain to ubiquinone",
    vulnerability: "High; loss causes deficient assembly and more leak",
  },
  {
    cluster: "[2Fe-2S] S1, [4Fe-4S] S2, [3Fe-4S] S3",
    protein: "Complex II (SDHB)",
    role: "Succinate-derived electrons to the Q pool",
    vulnerability: "High; SDHB destabilization drives succinate accumulation",
  },
  {
    cluster: "Rieske [2Fe-2S]",
    protein: "Complex III (UQCRFS1)",
    role: "Bifurcated Q-cycle oxidation at the Qo site",
    vulnerability: "Rieske loss traps a semiquinone and raises O2•- output",
  },
  {
    cluster: "[4Fe-4S]",
    protein: "Aconitase-2 (ACO2)",
    role: "Citrate to isocitrate in the TCA cycle",
    vulnerability: "Extreme; classic superoxide sensor, k ≈ 1e7 M-1 s-1",
  },
  {
    cluster: "[4Fe-4S] / [2Fe-2S]",
    protein: "Lipoyl synthase (LIAS), biotin synthase, ISCU scaffold",
    role: "Cofactor biosynthesis and cluster assembly",
    vulnerability: "LIAS sacrifices its own cluster each turnover",
  },
  {
    cluster: "[4Fe-4S]",
    protein: "Ferredoxin-2 / NFS1-ISD11-ACP-ISCU-FXN core",
    role: "Sulfur donation and de novo assembly",
    vulnerability: "Frataxin loss gives Friedreich ataxia phenotype",
  },
];

export const ironSteps = [
  {
    step: "Uptake",
    detail: "Transferrin receptor 1 endocytosis, DMT1 export from endosome to the cytosolic labile pool.",
  },
  {
    step: "Mitochondrial import",
    detail: "Mitoferrin-1/2 (SLC25A37/28) with ABCB10 stabilization delivers Fe2+ to the matrix.",
  },
  {
    step: "Cluster assembly",
    detail: "NFS1-ISD11-ACP2 makes persulfide, ISCU scaffolds, frataxin gates iron entry, ferredoxin-2 supplies electrons, HSPA9/HSC20 transfers to apo-targets.",
  },
  {
    step: "Heme branch",
    detail: "Ferrochelatase (FECH) inserts Fe2+ into protoporphyrin IX; FECH itself carries a [2Fe-2S].",
  },
  {
    step: "Storage",
    detail: "Mitochondrial ferritin (FTMT) buffers matrix iron; cytosolic ferritin H/L stores up to 4500 Fe per shell.",
  },
  {
    step: "Sensing",
    detail: "IRP1 switches between cytosolic aconitase and IRE-binding when its [4Fe-4S] is lost; IRP2 is degraded by FBXL5 when iron and oxygen are sufficient.",
  },
  {
    step: "Export / turnover",
    detail: "ABCB7 exports a sulfur species for cytosolic CIA assembly; NCOA4 ferritinophagy releases stored iron and can trigger ferroptosis.",
  },
];

export type EtcStep = {
  step: string;
  donor: string;
  acceptor: string;
  emDonor: number; // midpoint potential E'm, mV
  emAcceptor: number;
  ev: number; // energy released per electron, eV (1 V = 1 eV per electron)
  protons: number; // H+ pumped per electron pair
  note: string;
};

// Midpoint potentials E'm (mV, pH 7) from standard bioenergetics tables
// (Nicholls & Ferguson, Bioenergetics 4th ed.). eV = deltaE in volts per electron.
export const etcSteps: EtcStep[] = [
  {
    step: "Complex I entry",
    donor: "NADH/NAD+",
    acceptor: "FMN",
    emDonor: -320,
    emAcceptor: -300,
    ev: 0.02,
    protons: 0,
    note: "NADH binds and reduces FMN; the small gap keeps flavin superoxide low at rest.",
  },
  {
    step: "Complex I Fe-S relay",
    donor: "FMN",
    acceptor: "[4Fe-4S] N2",
    emDonor: -300,
    emAcceptor: -40,
    ev: 0.26,
    protons: 4,
    note: "Electrons cross N3-N7 to N2; the ~0.26 eV drop drives the four pumped protons.",
  },
  {
    step: "Complex I to Q",
    donor: "[4Fe-4S] N2",
    acceptor: "Q/QH2",
    emDonor: -40,
    emAcceptor: 90,
    ev: 0.13,
    protons: 0,
    note: "Two electrons plus two matrix protons reduce ubiquinone to ubiquinol.",
  },
  {
    step: "Complex II (FADH2)",
    donor: "Succinate/fumarate",
    acceptor: "Q/QH2",
    emDonor: 30,
    emAcceptor: 90,
    ev: -0.06,
    protons: 0,
    note: "Slightly uphill; driven by succinate mass action, so no protons are pumped.",
  },
  {
    step: "Complex III Qo",
    donor: "QH2",
    acceptor: "Rieske [2Fe-2S] / cyt c1",
    emDonor: 90,
    emAcceptor: 280,
    ev: 0.19,
    protons: 4,
    note: "Q-cycle bifurcation: one electron to Rieske, one back to Qi; semiquinone here leaks O2•-.",
  },
  {
    step: "Cytochrome c shuttle",
    donor: "cyt c1",
    acceptor: "cytochrome c",
    emDonor: 280,
    emAcceptor: 235,
    ev: -0.045,
    protons: 0,
    note: "Near-equilibrium shuttle; cardiolipin-bound cyt c is the ferroptosis peroxidase switch.",
  },
  {
    step: "Complex IV CuA / heme a",
    donor: "cytochrome c",
    acceptor: "CuA / heme a",
    emDonor: 235,
    emAcceptor: 290,
    ev: 0.055,
    protons: 0,
    note: "CuA is the main 810 nm chromophore; heme a/a3 absorbs 660 nm.",
  },
  {
    step: "Complex IV to O2",
    donor: "heme a3-CuB",
    acceptor: "O2/H2O",
    emDonor: 290,
    emAcceptor: 820,
    ev: 0.53,
    protons: 2,
    note: "The largest drop; 2 H+ pumped plus 2 chemical H+ per pair. NO binds here and light releases it.",
  },
{
    step: "Overall NADH to O2",
    donor: "NADH/NAD+",
    acceptor: "O2/H2O",
    emDonor: -320,
    emAcceptor: 820,
    ev: 1.14,
    protons: 10,
    note: "1.14 eV per electron, about 52 kcal/mol per pair; roughly 40% is captured as ATP.",
  },
];

/*
 * ATP yield estimates per step, two independent derivations (Nicholls & Ferguson,
 * Bioenergetics 4th ed.):
 *  - Proton-based: H_PER_ATP = 4 (3 H+ per ATP synthase rotation + ~1 H+ for Pi/ADP
 *    transport). ATP per pair = pumped protons / 4. Gives the modern 2.5 ATP per NADH.
 *  - Energy-based: usable energy = eV drop x 2 electrons; ATP_COST_EV = 0.52 eV
 *    (~50 kJ/mol at cellular ATP/ADP/Pi). ATP = energy / 0.52, clamped at 0 for
 *    uphill steps. Both are standard-state estimates, not per-step in-situ yields.
 */
export const H_PER_ATP = 4;
export const ATP_COST_EV = 0.52;
export function atpPerPair(s: EtcStep): { proton: number; energy: number } {
  return {
    proton: s.protons / H_PER_ATP,
    energy: Math.max(0, (s.ev * 2) / ATP_COST_EV),
  };
}

/*
 * Live in-situ yield: scales the standard-state estimate with membrane
 * potential and uncoupling. A higher deltaPsi raises the free-energy cost of
 * making ATP (cost scales with psi / 160 mV reference), so the energy-based
 * yield falls; uncoupling bleeds protons past the synthase, so both yields
 * scale with (1 - uncoupling). Proton stoichiometry itself is fixed.
 */
export function liveAtpPerPair(s: EtcStep, psi: number, uncoupling: number): { proton: number; energy: number; costEv: number } {
  const costEv = ATP_COST_EV * (psi / 160);
  const coup = Math.max(0, 1 - uncoupling);
  return {
    proton: (s.protons / H_PER_ATP) * coup,
    energy: Math.max(0, (s.ev * 2) / costEv) * coup,
    costEv,
  };
}

/*
 * P/O ratio: ATP made per oxygen atom reduced (one electron pair reduces one
 * O atom, half an O2). Summed from the live proton-based step yields.
 * NADH path pumps at Complexes I, III and IV; the succinate (FADH2) path
 * enters at Complex II and skips the Complex I steps. Standard state gives
 * the classic 2.5 and 1.5.
 */
export function poRatio(psi: number, uncoupling: number, path: "nadh" | "fadh2"): number {
  const skip = path === "fadh2" ? "Complex I" : "\0";
  return etcSteps
    .filter((s) => !s.step.startsWith("Overall") && !s.step.startsWith(skip))
    .reduce((acc, s) => acc + liveAtpPerPair(s, psi, uncoupling).proton, 0);
}

/*
 * Glycolysis vs respiration ATP split. Estimate: glycolysis covers any
 * shortfall below the default-condition ATP demand, with a 5% basal floor.
 * Not a measured lactate rate.
 */
export const ATP_DEMAND = simulate(defaultInputs).atpFlux;
export function atpSplit(o: Outputs): { respiration: number; glycolysis: number; glycolysisPct: number } {
  const glyco = Math.max(0.05 * ATP_DEMAND, ATP_DEMAND - o.atpFlux);
  const tot = glyco + o.atpFlux;
  return { respiration: o.atpFlux, glycolysis: glyco, glycolysisPct: tot > 0 ? (glyco / tot) * 100 : 0 };
}
export function phenotype(i: Inputs): "glycolysis only" | "Warburg shift" | "respiration" {
  return i.nadhRatio <= 0.1 && i.succinate <= 0.05 ? "glycolysis only" : i.nadhRatio < 0.4 && i.succinate < 0.4 ? "Warburg shift" : "respiration";
}

export const photonNotes = [
  {
    title: "660 nm red",
    body: "Absorbed by the oxidized heme a3-CuB binuclear centre and CuA of cytochrome c oxidase. Heme a/a3 absorbs most strongly here, so 660 nm releases more NO per J/cm2, and its flavin tail makes H2O2 directly. It is attenuated fastest in tissue (about 0.35 per mm).",
  },
  {
    title: "810 nm near-infrared",
    body: "Absorbed mainly by CuA and reaches deeper (about 0.2 per mm). CuA excitation speeds Complex IV, raising the local proton gradient, which is why superoxide rises with the gain. High dose photoinhibits Complex IV.",
  },
  {
    title: "Dose rate and 71 THz",
    body: "At high irradiance chromophores saturate, so the same J/cm2 does less and heats more (reciprocity breakdown). The 71 THz band is modelled as a pumped coherent mode that switches on when metabolic plus photon pump exceeds losses from lipid peroxidation, oxidized cardiolipin and heat.",
  },
  {
    title: "Photon side effects",
    body: "The same photons that raise CIV turnover also photosensitize porphyrins and flavins, generating singlet oxygen. The model shows this as a rising 1O2 term while the ATP curve flattens.",
  },
  {
    title: "71 THz output band",
    body: "Treated as a relative mid-infrared reporter at ≈4.22 µm (2370 cm-1) that scales with cytochrome c oxidase turnover, membrane potential and ordered interfacial water. Cardiolipin peroxidation damps it, so the band is read as a coherence and coupling index rather than an absolute radiometric prediction.",
  },
];

export const warburgNotes = [
  {
    title: "The Warburg effect",
    body: "Otto Warburg observed in the 1920s that tumour cells ferment glucose to lactate even when oxygen is plentiful (aerobic glycolysis), instead of oxidizing it fully through mitochondria. Glycolysis yields only 2 ATP per glucose against roughly 30 to 32 from full oxidation, so the cell trades efficiency for speed and biosynthetic carbon.",
  },
  {
    title: "Why ferment when oxygen is available",
    body: "Glycolysis runs about 10 to 100 times faster than respiration per unit of enzyme, and its intermediates feed the pentose phosphate pathway, serine and lipid synthesis needed for proliferation. Rapid ATP production per second can therefore favour fermentation despite the low yield per glucose.",
  },
  {
    title: "Mitochondria are not broken",
    body: "Warburg originally blamed irreversible respiratory injury, but most tumour mitochondria still respire; flux is rerouted, not lost. In this model that maps to lowering NADH and succinate supply while the chain itself stays intact: ATP flux falls, membrane potential and ROS shift, and the cell leans on glycolysis for the difference.",
  },
  {
    title: "Redox and iron consequences",
    body: "Aerobic glycolysis lowers electron flux through Complexes I and III, cutting superoxide and H2O2 at the source, while lactate export acidifies the microenvironment and changes iron handling. Less respiratory leak means less Fe-S cluster attack and a smaller Fenton substrate pool, one reason highly glycolytic cells can be harder to push into ferroptosis.",
  },
  {
    title: "Exploring it here",
    body: "Drop the NADH/NAD+ and succinate sliders to mimic a Warburg-shifted cell: watch ATP flux and the P/O readout fall, ROS and Fe-S erosion ease, and the 71 THz coherence signal dim with the lower pump. Raising them back models a differentiated, oxidative phenotype.",
  },
];

export const ferroptosisNotes = [
  {
    title: "GPx4",
    body: "Selenoprotein that reduces phospholipid hydroperoxides to alcohols using GSH (k near 1e7 M-1 s-1). Inhibited by RSL3 and ML162; GSH depletion by erastin (system xc- block) disables it indirectly.",
  },
  {
    title: "FSP1 (AIFM2)",
    body: "NAD(P)H-dependent reductase that regenerates ubiquinol (CoQ10H2), a radical-trapping antioxidant. Protects independently of GPx4; inhibited by iFSP1.",
  },
  {
    title: "ACSL4",
    body: "Loads arachidonic and adrenic acid into membrane phospholipids, raising the PUFA substrate for peroxidation. Modeled as the cardiolipin PUFA fraction.",
  },
  {
    title: "Cardiolipin peroxidation",
    body: "Oxidized cardiolipin loosens cytochrome c binding; above roughly 10% oxidation cytochrome c release begins. Fe2+ decomposes lipid hydroperoxides into alkoxyl radicals, making propagation autocatalytic once it outpaces GPx4 and FSP1.",
  },
];

/*
 * Reference point for green/amber yield coloring: the model's healthy default
 * state (160 mV, 5% uncoupling), not the ideal textbook stoichiometry.
 */
export const STD_PSI = 160;
export const STD_UNCOUPLING = 0.05;
export function stdAtpPerPair(s: EtcStep): { proton: number; energy: number } {
  const y = liveAtpPerPair(s, STD_PSI, STD_UNCOUPLING);
  return { proton: y.proton, energy: y.energy };
}
