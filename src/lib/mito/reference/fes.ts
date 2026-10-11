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

// Human research-assay envelope from platelet mitochondrial ACO2 activity in
// 22 healthy controls. The model's relative activity is anchored to the study
// mean (375.41 mU/mg), so these are assay-equivalent proxies, not clinical
// measurements or universal reference intervals. Fe-S integrity has no direct
// human clinical interval and is represented by the same ACO2-dependent proxy.
const plateletAco2Study = {
  assayLo: 209.41,
  assayHi: 541.41,
  mean: 375.41,
  unit: "mU/mg protein",
  cohort: "22 healthy controls",
  specimen: "isolated platelet mitochondria",
  source: "González-Mingot et al., J Clin Med (2023)",
  sourceUrl: "https://doi.org/10.3390/jcm12103560",
} as const;

export const ironLightReferenceBands = {
  fesIntact: {
    lo: (plateletAco2Study.assayLo / plateletAco2Study.mean) * 100,
    hi: (plateletAco2Study.assayHi / plateletAco2Study.mean) * 100,
    label: "Fe-S via platelet ACO2 proxy",
    ...plateletAco2Study,
    proxy: true,
  },
  aconitaseActivity: {
    lo: (plateletAco2Study.assayLo / plateletAco2Study.mean) * 100,
    hi: (plateletAco2Study.assayHi / plateletAco2Study.mean) * 100,
    label: "Aconitase assay-equivalent",
    ...plateletAco2Study,
    proxy: false,
  },
} as const;

// SLC25 inner-membrane carriers the model names. Qualitative only: no carrier is a slider and no rate is transferred.
export const mitoCarriers = [
  { gene: "SLC25A37 / SLC25A28", name: "Mitoferrin-1 / -2", cargo: "Fe2+ into the matrix", modelLink: "Labile iron and Fe-S assembly supply", sourceUrl: "" },
  { gene: "SLC25A34", name: "Oxaloacetate carrier", cargo: "Oxaloacetate into the matrix (anaplerosis)", modelLink: "Not modeled; TCA carbon supply is folded into the NADH ratio and fuel supply", sourceUrl: "https://doi.org/10.1126/science.adz4797", sourceLabel: "Karavaeva et al., Science 394(6819), eadz4797 (2026)" },
] as const;

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

