// Reference library: one synopsis and a 0-100 score per study reference, keyed by DOI.
// Score = relevance to this model (0-40) + evidence strength (0-30) + quantitative usability in the model (0-30).
// Scores are the app author's appraisal for prioritising sources, not a journal or citation metric.
import { studyReferences, type StudyReference } from "./studyReferences";

export type LibraryEntry = { synopsis: string; relevance: number; evidence: number; usability: number; usedFor: string };

export const referenceLibrary: Record<string, LibraryEntry> = {
  "10.3390/jcm12103560": { synopsis: "Blood aconitase (ACO2) activity tracks long-term survival in ALS; supports aconitase as a peripheral Fe-S damage proxy.", relevance: 30, evidence: 16, usability: 18, usedFor: "Fe-S flag proxy (platelet/blood ACO2)" },
  "10.1021/bi00199a034": { synopsis: "Measures flavin midpoint potentials in Complex I, anchoring the NADH entry step of the redox ladder.", relevance: 34, evidence: 26, usability: 27, usedFor: "Complex I redox potentials" },
  "10.1042/bj1860111": { synopsis: "Classic EPR thermodynamics of Complex I Fe-S centres; midpoint potentials used for the Fe-S rungs.", relevance: 33, evidence: 24, usability: 26, usedFor: "Fe-S cluster potentials" },
  "10.1007/s40828-019-0085-4": { synopsis: "Teaching review tabulating ETC carrier potentials and energy conservation per step.", relevance: 32, evidence: 18, usability: 26, usedFor: "ETC potential table" },
  "10.1007/s10863-008-9174-6": { synopsis: "Quinone and heme couples in Complex III (Q cycle); sets the bc1 potentials.", relevance: 32, evidence: 24, usability: 25, usedFor: "Complex III potentials" },
  "10.1016/j.bbabio.2011.03.003": { synopsis: "Computational electron-transfer pathways inside cytochrome c oxidase.", relevance: 26, evidence: 18, usability: 14, usedFor: "Complex IV qualitative routing" },
  "10.1038/s41598-018-25779-w": { synopsis: "Electron distribution in activated cytochrome c oxidase; informs Complex IV redox states.", relevance: 26, evidence: 22, usability: 16, usedFor: "Complex IV states" },
  "10.1152/japplphysiol.01160.2012": { synopsis: "Oxygen and pH dependence of oxidative phosphorylation; low-O2 kinetics of respiration.", relevance: 34, evidence: 24, usability: 24, usedFor: "Oxygen slider response" },
  "10.1016/j.ab.2017.07.009": { synopsis: "Review of membrane potential physiology and measurement pitfalls (TMRM, JC-1).", relevance: 36, evidence: 22, usability: 24, usedFor: "deltaPsi range and assay caveats" },
  "10.1016/B978-0-12-388425-1.00003-8": { synopsis: "Bioenergetics textbook chapter: protonmotive force, ATP free energy, H+/ATP stoichiometry.", relevance: 38, evidence: 26, usability: 28, usedFor: "Thermodynamic core" },
  "10.1023/A:1027327015957": { synopsis: "Proton leak accounts for a large share of resting respiration across tissues.", relevance: 34, evidence: 24, usability: 24, usedFor: "Proton leak / uncoupling" },
  "10.1016/S0891-5849(02)01006-7": { synopsis: "Defines the labile iron pool, its size (low µM) and how it is measured.", relevance: 36, evidence: 22, usability: 24, usedFor: "Labile iron slider" },
  "10.1016/S0005-2728(00)00238-3": { synopsis: "NO reversibly inhibits cytochrome c oxidase in competition with O2.", relevance: 32, evidence: 22, usability: 20, usedFor: "NO inhibition term" },
  "10.1042/BJ20091541": { synopsis: "Mitochondrial peroxiredoxin 3 dominates matrix H2O2 removal and redox signaling.", relevance: 32, evidence: 22, usability: 20, usedFor: "H2O2 sink" },
  "10.2203/dose-response.09-027.Hamblin": { synopsis: "Biphasic (Arndt-Schulz) dose response of low-level light therapy.", relevance: 34, evidence: 16, usability: 20, usedFor: "Red light biphasic curve" },
  "10.1088/0031-9155/58/11/R37": { synopsis: "Review of tissue absorption and scattering coefficients across wavelengths.", relevance: 30, evidence: 26, usability: 24, usedFor: "Photon penetration" },
  "10.1016/0304-4165(85)90182-5": { synopsis: "Discovery of PHGPx (GPX4), the lipid hydroperoxide-reducing selenoenzyme.", relevance: 30, evidence: 24, usability: 14, usedFor: "GPX4 / ferroptosis defense" },
  "10.1038/s41586-019-1707-0": { synopsis: "FSP1 suppresses ferroptosis independently of glutathione via CoQ10 reduction.", relevance: 32, evidence: 28, usability: 14, usedFor: "Ferroptosis CoQ arm" },
  "10.1038/nchembio727": { synopsis: "Cytochrome c peroxidizes cardiolipin, a gate for apoptotic factor release.", relevance: 30, evidence: 26, usability: 12, usedFor: "Cardiolipin oxidation" },
  "10.1016/j.cell.2013.08.032": { synopsis: "Cristae shape governs supercomplex assembly and respiratory efficiency (OPA1).", relevance: 38, evidence: 28, usability: 18, usedFor: "Geometry effects on flux" },
  "10.1016/j.cell.2006.06.025": { synopsis: "OPA1 controls cristae junction remodeling in apoptosis, separate from fusion.", relevance: 34, evidence: 28, usability: 14, usedFor: "Cristae junction width" },
  "10.1093/emboj/21.3.221": { synopsis: "ATP synthase dimers are required to shape cristae.", relevance: 36, evidence: 26, usability: 14, usedFor: "Cristae curvature / synthase" },
  "10.1016/j.bbabio.2004.09.004": { synopsis: "Definitive P/O ratio review: about 2.5 for NADH and 1.5 for succinate.", relevance: 38, evidence: 26, usability: 29, usedFor: "P/O band 2.3-2.7" },
  "10.1371/journal.pone.0336939": { synopsis: "PBMC respiration reference values in healthy adults (Seahorse).", relevance: 32, evidence: 20, usability: 26, usedFor: "ATP-linked OCR band" },
  "10.20455/ros.2016.865": { synopsis: "Protocol for MitoSOX flow cytometry and its specificity limits.", relevance: 30, evidence: 16, usability: 18, usedFor: "MitoSOX assay caveats" },
  "10.1038/s42255-022-00591-z": { synopsis: "Consensus guidelines for measuring ROS and oxidative damage; warns probes are nonspecific.", relevance: 36, evidence: 28, usability: 20, usedFor: "ROS probe caveats" },
  "10.1016/S0891-5849(02)00848-1": { synopsis: "Validates C11-BODIPY as a lipid peroxidation probe.", relevance: 28, evidence: 22, usability: 16, usedFor: "Lipid peroxidation assay" },
  "10.1111/j.1432-1033.1969.tb00640.x": { synopsis: "Early redox potentials of ubiquinone and cytochrome b in the chain.", relevance: 30, evidence: 20, usability: 22, usedFor: "Q pool potential" },
  "10.1038/s41586-019-1705-2": { synopsis: "FSP1 acts as a CoQ oxidoreductase in parallel to GPX4 against ferroptosis.", relevance: 32, evidence: 28, usability: 14, usedFor: "Ferroptosis CoQ arm" },
  "10.1016/j.freeradbiomed.2016.04.001": { synopsis: "Mitochondrial superoxide/H2O2 production sites and their role in redox signaling.", relevance: 38, evidence: 24, usability: 24, usedFor: "ROS sources and signaling framing" },
  "10.1073/pnas.96.11.6255": { synopsis: "Visible light drives H2O2 via flavin-containing oxidases in mammalian cells.", relevance: 32, evidence: 22, usability: 16, usedFor: "Photon ROS term" },
  "10.1021/ar300234c": { synopsis: "Mechanisms of peroxynitrite-driven tyrosine nitration and its functional effects.", relevance: 26, evidence: 24, usability: 12, usedFor: "NO + superoxide product" },
  "10.1179/135100001101536373": { synopsis: "Review of Haber-Weiss/Fenton chemistry linking iron and H2O2 to hydroxyl radical.", relevance: 34, evidence: 20, usability: 18, usedFor: "Iron-driven hydroxyl term" },
  "10.1074/jbc.M114.619072": { synopsis: "Quantifies superoxide/H2O2 by site in muscle mitochondria at rest vs exercise.", relevance: 38, evidence: 26, usability: 27, usedFor: "ROS site shares" },
  "10.1126/science.adz4797": { synopsis: "SLC25A34 imports oxaloacetate into adipocyte mitochondria under clock, diet and cold control.", relevance: 20, evidence: 28, usability: 6, usedFor: "Carriers table (qualitative)" },
  "10.1038/s42255-023-00783-1": { synopsis: "Perspective arguing 'mitochondrial dysfunction' is too vague; proposes five levels: cell-dependent properties, molecular features, activities, functions, behaviors.", relevance: 34, evidence: 14, usability: 8, usedFor: "Terminology framing for flags" },
};

export const libraryScore = (e: LibraryEntry) => e.relevance + e.evidence + e.usability;

export type LibraryRow = StudyReference & { entry: LibraryEntry | null; score: number | null };

export const libraryRows = (): LibraryRow[] =>
  studyReferences
    .map((r) => { const entry = referenceLibrary[r.doi] ?? null; return { ...r, entry, score: entry ? libraryScore(entry) : null }; })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
