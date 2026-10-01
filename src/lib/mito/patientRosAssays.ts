export type RosAssayKey = "dcfh" | "fluorDhpe" | "mitosox" | "c11";

export type RosAssay = {
  key: RosAssayKey;
  name: string;
  specimen: string;
  readout: string;
  direction: "high" | "low";
  source: string;
  url: string;
  published?: string;
  note: string;
};

export const patientRosAssays: RosAssay[] = [
  {
    key: "dcfh", name: "DCFH-DA · general oxidant signal", specimen: "Unstimulated PBMCs", readout: "Flow-cytometry MFI", direction: "high",
    source: "du Plessis et al., J Occup Environ Hyg (2010), 7:367–374", url: "https://doi.org/10.1080/15459621003724108",
    published: "15 unexposed workers: 3.78 ± 1.20 MFI (mean ± SEM, unstimulated)",
    note: "DCFH-DA detects general probe oxidation, not mitochondrial superoxide or a specific H₂O₂ concentration. Study MFI is instrument-dependent and is not a reference interval.",
  },
  {
    key: "fluorDhpe", name: "fluor-DHPE · lipid oxidation", specimen: "Unstimulated PBMCs", readout: "Flow-cytometry MFI", direction: "low",
    source: "du Plessis et al., J Occup Environ Hyg (2010), 7:367–374", url: "https://doi.org/10.1080/15459621003724108",
    published: "15 unexposed workers: 957.02 ± 51.55 MFI (mean ± SEM, unstimulated)",
    note: "Lower fluorescence indicates more oxidation in this protocol. It is not C11-BODIPY and cannot be compared with its oxidized/reduced ratio. Study MFI is not a portable reference interval.",
  },
  {
    key: "mitosox", name: "MitoSOX · mitochondrial oxidant signal", specimen: "PBMCs", readout: "Flow-cytometry MFI", direction: "high",
    source: "Kauffman et al., Reactive Oxygen Species (2016), 2:361–370", url: "https://doi.org/10.20455/ros.2016.865",
    note: "Method reference only. No validated PBMC normal interval; account for probe loading, cell type, instrument and gating. Not a direct superoxide concentration.",
  },
  {
    key: "c11", name: "C11-BODIPY · lipid oxidation", specimen: "PBMCs", readout: "Oxidized/reduced fluorescence ratio", direction: "high",
    source: "Drummen et al., Free Radic Biol Med (2002), 33:473–490", url: "https://doi.org/10.1016/S0891-5849(02)00848-1",
    note: "Method reference only. No portable PBMC normal interval. Do not compare this ratio with fluor-DHPE intensity or model cardiolipin oxidation.",
  },
];

export type AssayObservation = { value: string; controlLo: string; controlHi: string };

export function assayStatus(assay: RosAssay, observation: AssayObservation): "No assay result" | "Needs matched controls" | "Invalid controls" | "Within local controls" | "Above local controls" | "Below local controls" {
  if (!observation.value.trim()) return "No assay result";
  const value = Number(observation.value);
  if (!Number.isFinite(value) || value < 0) return "Invalid controls";
  if (!observation.controlLo.trim() || !observation.controlHi.trim()) return "Needs matched controls";
  const lo = Number(observation.controlLo);
  const hi = Number(observation.controlHi);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi <= lo) return "Invalid controls";
  if (value < lo) return "Below local controls";
  if (value > hi) return "Above local controls";
  return "Within local controls";
}