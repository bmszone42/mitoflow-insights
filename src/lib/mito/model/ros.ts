/** Superoxide, H2O2, peroxynitrite and hydroxyl chemistry. Split from simulate.ts; called only by simulate(). */
import type { Inputs } from "./types";
import type { photoreceptor } from "./photoreceptor";
import type { geometryEffects } from "./geometry";
import type { qualityControl } from "./simulate";
type Photoreceptor = ReturnType<typeof photoreceptor>;
type GeometryEffects = ReturnType<typeof geometryEffects>;
type QualityControl = ReturnType<typeof qualityControl>;
import type { RosBudget } from "./types";
import type { ChainFlux } from "./atp";

// Smallest positive root of a steady-state balance f(x) = production - removal.
function solveSteady(f: (x: number) => number) {
  let lo = 0;
  let hi = 1e-7;
  while (f(hi) > 0 && hi < 1e6) {
    lo = hi;
    hi *= 1.5;
  }
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function rosChemistry(i: Inputs, ge: GeometryEffects, pr: Photoreceptor, qc: QualityControl, psi: number, c: ChainFlux) {

  // --- Superoxide: site-resolved production (Brand 2016; Quinlan et al. 2013) ---
  // Leak rises steeply with deltaPsi (reduced CoQ pool), damped by uncoupling.
  // Electrons back up when copper limits CIV (assumed 1:1 extra leak).
  const cuBackup = 1 + Math.max(0, 1 - c.cuFactor);
  const leakPsi = cuBackup * Math.exp((psi - 150) / 22) * (1 - 0.6 * i.uncoupling) * pr.heatLeak * qc.leak;
  const o2Term = i.oxygen / (i.oxygen + 10);
  // Complex I site IF: reduced FMN, set by NADH/NAD+ ratio (squared, two-electron flavin).
  const vIF = 0.0055 * c.fluxCI * i.nadhRatio ** 2 * leakPsi * o2Term * pr.flavinLeak * ge.leak;
  // Complex I site IQ, reverse electron transport: needs succinate-reduced CoQ and high deltaPsi.
  const retDrive = 1 / (1 + Math.exp(-(i.succinate - 0.9) / 0.15));
  const vIQ = 0.012 * c.fluxCII * retDrive * Math.exp((psi - 160) / 10) * (1 - 0.8 * i.uncoupling) * o2Term;
  // Complex III site IIIQo: unstable semiquinone, backpressure from high deltaPsi; half to IMS.
  const vIIIQo = 0.003 * (c.fluxCI + c.fluxCII) * c.psiBrake * leakPsi * o2Term * pr.semiquinoneLeak * ge.leak;
  // Complex II site IIF: flavin, highest at low succinate occupancy.
  const vIIF = 0.0015 * c.fluxCII * (1 - i.succinate / (i.succinate + 0.3)) * o2Term;
  // 2-oxoglutarate dehydrogenase (DLD flavin), NADH driven; ~40% leaves as O2•-, 60% as H2O2.
  const vOGDHtotal = 0.0012 * c.fluxCI * i.nadhRatio ** 2 * o2Term * pr.flavinLeak;
  const vOGDH = 0.4 * vOGDHtotal;
  // ROS-induced ROS release (Zorov 2014): weak thiol defenses let oxidized
  // Complex I/III leak more. Model tuning exponent; 1x capacity = no change.
  // Strength is user-tunable (rirrStrength, default 1.0 fitted to Melov 1999 Sod2-null brain aconitase 24-33% of control); legacy states lack it and keep 0.5.
  const redoxFb = i.antioxidantCapacity ** -(i.rirrStrength ?? 0.5);
  const vMatrixO2 = redoxFb * (vIF + vIQ + 0.5 * vIIIQo + vIIF + vOGDH);
  const vImsO2 = redoxFb * 0.5 * vIIIQo;

  // Matrix sinks: SOD2 (2.3e9 M-1 s-1 x 10 µM), NO (1e10 M-1 s-1), aconitase [4Fe-4S] (1e7 M-1 s-1 x ~6 µM).
  // SOD_AC_EXP: how strongly antioxidant capacity scales SOD clearance. Model tuning
  // choice (no tissue-general published value); 1x capacity is unaffected by it.
  const SOD_AC_EXP = 1.0;
  const kSod = 1e4 * i.antioxidantCapacity ** SOD_AC_EXP; // s-1
  const kNoO2 = 1e4 * (c.noEff / 1000); // s-1
  const kAconSink = 10 * 6; // s-1
  const superoxideM = vMatrixO2 / (kSod + kNoO2 + kAconSink); // µM
  // IMS sinks: SOD1 and cytochrome c reoxidation.
  const kSod1 = 5e3 * i.antioxidantCapacity ** SOD_AC_EXP;
  const superoxideIMS = vImsO2 / (kSod1 + 2e3 + kNoO2);

  // --- H2O2: sources and reduced-Prx3-dependent clearance ---
  const vDismutation = 0.5 * kSod * superoxideM + 0.25 * kSod1 * superoxideIMS; // 2 O2•- -> H2O2
  const vOGDHh2o2 = 0.6 * vOGDHtotal;
  const vH2O2Photo = pr.h2o2Direct * o2Term; // flavin photosensitization
  const vH2O2 = vDismutation + vOGDHh2o2 + vH2O2Photo;
  const ac = i.antioxidantCapacity;
  // Cox et al. Biochemistry 2009, doi:10.1021/bi900558g measured
  // k(Prx3 + H2O2) = 2e7 M-1 s-1 in purified human protein.
  // Active reduced Prx3 (0.075 µM here) is an unfitted accessible-pool
  // assumption, NOT a measured whole-matrix Prx3 concentration.
  // 2e7 M-1 s-1 * 1e-6 M/µM * 0.075 µM = 1.5 s-1.
  const prx3SecondOrder = 2e7 * 1e-6; // µM-1 s-1
  const prx3Accessible = 0.075 * ac; // µM, effective reduced pool (assumed)
  const prxVmax = 3 * ac; // µM/s, assumed recycling cap from TrxR2 / NADPH
  const prxKm = 2; // µM, effective cap transition (assumed)
  const hyper = (h: number) => 1 / (1 + (h / 5) ** 2); // Prx3 hyperoxidation above ~5 µM
  const kGpx1 = 0.3 * ac;
  const kCat = 0.02;
  const kEfflux = 0.3; // diffusion to cytosol
  // GPx4 also reduces H2O2 weakly (it is primarily a lipid peroxidase),
  // so the GPx4 slider modulates matrix H2O2 and thereby Fe-S attack.
  const kGpx4h2o2 = 0.2 * i.gpx4;
  const prx3Removal = (h: number) => Math.min(prx3SecondOrder * prx3Accessible * h, prxVmax * h / (prxKm + h)) * hyper(h);
  const h2o2Removal = (h: number) => prx3Removal(h) + (kGpx1 + kGpx4h2o2 + kCat + kEfflux) * h;
  const h2o2 = solveSteady((h) => vH2O2 - h2o2Removal(h));
  const prxReduced = hyper(h2o2) * (1 - h2o2 / (prxKm + h2o2) * 0.5);


  // --- Peroxynitrite: formation and competing sinks (Radi 2013) ---
  const vPN = kNoO2 * superoxideM; // µM s-1
  const kPnCO2 = 0.046 * 1300; // 4.6e4 M-1 s-1 x 1.3 mM CO2
  const kPnPrx = 300 * ac * prxReduced;
  const kPnGpx = 10 * ac;
  const kPnThiol = 30;
  const kPnHomolysis = 0.9; // ONOOH isomerization / homolysis
  const kPnTotal = kPnCO2 + kPnPrx + kPnGpx + kPnThiol + kPnHomolysis;
  const onooM = vPN / kPnTotal; // µM
  const peroxynitrite = onooM * 1e3; // nM
  return { cuBackup, leakPsi, o2Term, vIF, retDrive, vIQ, vIIIQo, vIIF, vOGDHtotal, vOGDH, redoxFb, vMatrixO2, vImsO2, SOD_AC_EXP, kSod, kNoO2, kAconSink, superoxideM, kSod1, superoxideIMS, vDismutation, vOGDHh2o2, vH2O2Photo, vH2O2, ac, prx3SecondOrder, prx3Accessible, prxVmax, prxKm, hyper, kGpx1, kCat, kEfflux, kGpx4h2o2, prx3Removal, h2o2Removal, h2o2, prxReduced, vPN, kPnCO2, kPnPrx, kPnGpx, kPnThiol, kPnHomolysis, kPnTotal, onooM, peroxynitrite };
}
export type RosChemistry = ReturnType<typeof rosChemistry>;

export function hydroxylAndBudget(i: Inputs, r: RosChemistry, freeIron: number) {

  // --- Hydroxyl radical: Fenton, Haber-Weiss recycling, ONOOH homolysis ---
  const kFeRed = 0.5 * r.ac + 1 * r.superoxideM * 1e3; // ascorbate/GSH + O2•- reduction of Fe3+
  const kFeOx = 0.05 * (i.oxygen / 30);
  // Ligand-dependent Fenton reactivity: chelator-bound iron (e.g. DFO-Fe) is
  // largely redox-inert (Halliwell & Gutteridge). 95% suppression is ASSUMED.
  const kFenton = 1e-3 * (1 - 0.95 * (i.chelatorBound ?? 0)); // µM-1 s-1 (1e3 M-1 s-1)
  const fe2Fraction = kFeRed / (kFeRed + kFeOx + kFenton * r.h2o2);
  const vFenton = kFenton * freeIron * fe2Fraction * r.h2o2;
  const vOHfromPN = 0.3 * r.kPnHomolysis * r.onooM;
  const vOH = vFenton + vOHfromPN;
  const hydroxyl = vOH / 1e9; // µM, quenched within ~1 ns diffusion radius

  const rosBudget: RosBudget = {
    superoxideSources: { "CI IF": r.vIF, "CI IQ (RET)": r.vIQ, "CIII Qo": r.vIIIQo, "CII IIF": r.vIIF, OGDH: r.vOGDH },
    superoxideSinks: {
      SOD2: r.kSod * r.superoxideM,
      "NO (to ONOO-)": r.kNoO2 * r.superoxideM,
      "Aconitase Fe-S": r.kAconSink * r.superoxideM,
    },
    superoxideIMS: r.superoxideIMS * 1e3,
    h2o2Sources: { Dismutation: r.vDismutation, OGDH: r.vOGDHh2o2, "Flavin photo": r.vH2O2Photo },
    h2o2Sinks: {
      Prx3: r.prx3Removal(r.h2o2),
      GPx1: r.kGpx1 * r.h2o2,
      Catalase: r.kCat * r.h2o2,
      Efflux: r.kEfflux * r.h2o2,
    },
    prxHyperoxidized: 1 - r.hyper(r.h2o2),
    peroxynitriteSinks: {
      CO2: r.kPnCO2 * r.onooM,
      Prx3: r.kPnPrx * r.onooM,
      GPx: r.kPnGpx * r.onooM,
      Thiols: r.kPnThiol * r.onooM,
      Homolysis: r.kPnHomolysis * r.onooM,
    },
    hydroxylSources: { Fenton: vFenton, "ONOOH homolysis": vOHfromPN },
    fe2Fraction,
  };
  return { kFeRed, kFeOx, kFenton, fe2Fraction, vFenton, vOHfromPN, vOH, hydroxyl, rosBudget };
}
