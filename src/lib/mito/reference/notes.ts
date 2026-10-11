import { defaultInputs, simulate, type Inputs, type Outputs } from "../model";
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
    body: "Drop the NADH/NAD+ and succinate sliders to mimic a Warburg-shifted cell: watch ATP flux fall and the glycolysis share rise while the P/O readout remains tied to membrane potential and uncoupling. ROS and Fe-S erosion may ease and the 71 THz coherence signal may dim with the lower pump. Raising fuel supply back models a differentiated, oxidative phenotype.",
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
