export type Inputs = {
  nadhRatio: number; // NADH/(NADH+NAD+), 0-1
  succinate: number; // relative Complex II drive, 0-2
  oxygen: number; // µM O2
  deltaPsi: number; // mV, proton-motive force proxy
  adp: number; // µM ADP (state 3 vs state 4 control)
  labileIron: number; // µM cytosolic/matrix labile Fe2+ pool
  nitricOxide: number; // nM NO
  redDose: number; // J/cm2 at 660 nm
  nirDose: number; // J/cm2 at 810 nm
  irradiance: number; // mW/cm2 at the surface (sets dose rate and exposure time)
  tissueDepth: number; // mm of tissue above the mitochondria (0 = cultured cells)
  antioxidantCapacity: number; // 0-2 scaling of Prx3/GPx/GSH system
  uncoupling: number; // 0-1 UCP/mild uncoupler
  gpx4: number; // 0-2 relative GPx4 activity (0 = RSL3/ML162 inhibited)
  fsp1: number; // 0-2 relative FSP1/CoQ10H2 capacity
  cardiolipinPufa: number; // 0.2-1 fraction of PUFA acyl chains (ACSL4-driven)
  rirrStrength: number; // 0-1.5 ROS-induced ROS release exponent (Zorov 2014 mechanism; strength fitted to Melov 1999, partly published)
  mitoHalfLife: number; // days, mitochondrial turnover half-life (Kim 2012: heart 17.2, liver 4.3)
};

export const defaultInputs: Inputs = {
  nadhRatio: 0.55,
  succinate: 0.6,
  oxygen: 30,
  deltaPsi: 160,
  adp: 120,
  labileIron: 2,
  nitricOxide: 40,
  redDose: 0,
  nirDose: 0,
  irradiance: 50,
  tissueDepth: 0,
  antioxidantCapacity: 1,
  uncoupling: 0.05,
  gpx4: 1,
  fsp1: 1,
  cardiolipinPufa: 0.6,
  mitoHalfLife: 17.2,
  rirrStrength: 1, // fitted to Melov 1999 brain aconitase loss (partly published)
};

export type Coherence = {
  pumpMetabolic: number;
  pumpPhoton: number;
  lossBase: number;
  lossLipid: number;
  lossCardiolipin: number;
  lossHeat: number;
  pumpRatio: number;
  coherentFraction: number;
};
export const THZ_CAL = 200; // relative units, sets default emission near its previous value

export type FerroptosisState = "Protected" | "Primed" | "Committed";

export type Outputs = {
  fluxCI: number;
  fluxCII: number;
  fluxCIV: number;
  atpFlux: number;
  photonGain: number;
  superoxide: number; // nM steady state
  hydrogenPeroxide: number; // nM
  hydroxylRadical: number; // pM
  peroxynitrite: number; // nM
  singletOxygen: number; // pM (relative)
  lipidPeroxyl: number; // nM
  fesIntact: number; // fraction of [4Fe-4S] clusters intact
  aconitaseActivity: number; // %
  freeIron: number; // µM after cluster loss feedback
  emission71THz: number; // relative units
  coherentFraction: number; // 0-1 share of the 71 THz mode above threshold
  coherence: Coherence;
  tempRise: number; // K from light absorption
  noReleased: number; // % of CIV-bound NO photoreleased
  photoreceptor: Photoreceptor;
  emissionSpectrum: { freqTHz: number; intensity: number }[];
  redoxStress: number; // 0-100 composite index
  plooh: number; // nM lumped phospholipid hydroperoxide
  cardiolipinOx: number; // % cardiolipin oxidized
  ferroptosisRisk: number; // 0-100, propagation / removal ratio
  ferroptosisState: FerroptosisState;
  ploohRemoval: { gpx4: number; fsp1: number; basal: number }; // s-1 each
  propagationRatio: number; // Fe-driven propagation / total removal
  rosBudget: RosBudget;
};

// Per-pathway rates (µM/s) for the site-resolved ROS network.
export type RosBudget = {
  superoxideSources: Record<string, number>;
  superoxideSinks: Record<string, number>;
  superoxideIMS: number; // nM, intermembrane space pool
  h2o2Sources: Record<string, number>;
  h2o2Sinks: Record<string, number>;
  prxHyperoxidized: number; // fraction of Prx3 hyperoxidized
  peroxynitriteSinks: Record<string, number>;
  hydroxylSources: Record<string, number>;
  fe2Fraction: number; // Fe2+ share of the labile pool
};

// Keeps lipid peroxyl (and so ferroptosis) on its prior calibration after the ROS rebuild.
