/** Iron-sulfur cluster states, per-enzyme pools and labile iron. Split from simulate.ts; called only by simulate(). */
import type { Inputs } from "./types";
import type { photoreceptor } from "./photoreceptor";
import type { geometryEffects } from "./geometry";
import type { qualityControl } from "./simulate";
type Photoreceptor = ReturnType<typeof photoreceptor>;
type GeometryEffects = ReturnType<typeof geometryEffects>;
type QualityControl = ReturnType<typeof qualityControl>;

export function ironSulfur(i: Inputs, qc: QualityControl, adpDrive: number, superoxideM: number, h2o2: number, onooM: number) {
  // Fe-S cluster attack and labile iron feedback.
  // Superoxide term: effective rate for attack on aconitase (Flint 1993,
  // ~1e7 M-1 s-1), strengthened 3.5x so light-driven superoxide visibly
  // erodes clusters at photobiomodulation doses.
  // H2O2 term: measured attack on dehydratase [4Fe-4S] clusters is
  // ~5e3 M-1 s-1 (Jang & Imlay 2007); scaled up here as an effective rate
  // for the wider cluster pool so antioxidant capacity (Prx3, GPx1, GPx4)
  // modulates cluster loss.
  // Peroxynitrite term: ONOO- oxidizes and inactivates aconitase [4Fe-4S]
  // with k ~1e5 M-1 s-1 (Castro 1994, Hausladen & Fridovich 1994); used
  // here as an effective rate on the cluster pool so NO availability
  // modulates cluster loss through the ONOO- branch. All terms unfitted;
  // shapes follow Imlay 2003 and Radi 2013.
  const kAcon = 3.5e7 * 1e-6; // µM-1 s-1 effective
  const kH2o2Fes = 1e4 * 1e-6; // µM-1 s-1 effective, H2O2-specific
  const kOnooFes = 1e7 * 1e-6; // µM-1 s-1 effective, ONOO- specific (scaled up: model ONOO- steady state is nM-scale)
  const clusterAttack = kAcon * superoxideM + kH2o2Fes * h2o2 + kOnooFes * onooM; // s-1
  // Three cluster states. Cluster conversion chemistry cited from:
  //   Holm & Lo 2016, Chem Rev, doi:10.1021/acs.chemrev.6b00276
  //     ([4Fe-4S] <-> [3Fe-4S] conversion, single Fe loss and re-insertion)
  //   Beinert, Holm & Munck 1997, Science, doi:10.1126/science.277.5326.653
  //     (cluster types, aconitase [3Fe-4S] inactive form)
  // Rates from Flint 1993, Gardner & Fridovich 1992, Gardner 1995:
  // superoxide and ONOO- oxidize [4Fe-4S] to [3Fe-4S]+, releasing ONE Fe;
  // the 3Fe cluster is reactivated fast (~1 min t1/2, rounded assumption)
  // or degraded further by H2O2 to apo (all 4 Fe lost), rebuilt slowly by ISC.
  const kRepair = 5e-3 * (1 + 0.5 * adpDrive); // apo -> [4Fe-4S], ISCU/NFS1/frataxin
  // Reactivation needs Fe2+ and a reductant (Holm & Lo 2016; Beinert 1997):
  // scale with labile iron and antioxidant (GSH/ascorbate) supply, both
  // normalized so the healthy defaults keep the ~1 min rate. Assumed shape.
  const reactSupply = Math.max(0.1, Math.sqrt(((i.labileIron * (1 - (i.chelatorBound ?? 0))) / 2) * i.antioxidantCapacity));
  const kReact = 1.2e-2 * reactSupply; // [3Fe-4S] -> [4Fe-4S], fast reactivation
  const a3 = kAcon * superoxideM + kOnooFes * onooM; // [4Fe-4S] -> [3Fe-4S] + 1 Fe
  const aApo = kH2o2Fes * h2o2; // [4Fe-4S] -> apo + 4 Fe
  const d3 = kH2o2Fes * h2o2; // [3Fe-4S] -> apo + 3 Fe
  const t3PerI = a3 / (kReact + d3);
  // Half-life of the [3Fe-4S]+ pool: reactivation (kReact) competes with
  // H2O2 degradation to apo (d3), so the effective removal rate is the sum.
  const fesReactHalfLifeS = Math.LN2 / (kReact + d3);
  const apoPerI = (aApo + d3 * t3PerI) / kRepair;
  const fesIntact = 1 / (1 + t3PerI + apoPerI);
  const fes3Fe = fesIntact * t3PerI;
  const fesApo = fesIntact * apoPerI;
  void clusterAttack;
  // Separate pools (Beinert, Holm & Munck 1997): aconitase's cluster is
  // solvent-exposed with a free Fe site; respiratory-chain clusters are
  // buried in protein. Relative exposure factors are ASSUMED, not fitted;
  // aconitase uses factor 1 so the shared readouts above stay unchanged.
  const pool = (exposure: number) => {
    const t = (a3 * exposure) / (kReact + d3 * exposure);
    const apo = (aApo * exposure + d3 * exposure * t) / kRepair;
    const intact = 1 / (1 + t + apo);
    return { intact, threeFe: intact * t, apo: intact * apo };
  };
  const fesPools = {
    aconitase: { intact: fesIntact, threeFe: fes3Fe, apo: fesApo },
    complexI: pool(i.fesExposureCI ?? 0.15),
    complexII: pool(i.fesExposureCII ?? 0.3),
    complexIII: pool(i.fesExposureCIII ?? 0.05),
  };
  // ~6 µM cluster protein: 1 Fe freed per 3Fe cluster, 4 Fe per apo protein
  const ironFromClusters = 6 * (fes3Fe + 4 * fesApo);
  const freeIron = i.labileIron * qc.iron + ironFromClusters;
  return { kAcon, kH2o2Fes, kOnooFes, clusterAttack, kRepair, reactSupply, kReact, a3, aApo, d3, t3PerI, fesReactHalfLifeS, apoPerI, fesIntact, fes3Fe, fesApo, pool, fesPools, ironFromClusters, freeIron };
}
