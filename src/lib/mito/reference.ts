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
