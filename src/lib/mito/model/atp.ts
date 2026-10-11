/** Electron transport and ATP synthesis. Split from simulate.ts; called only by simulate(). */
import type { Inputs } from "./types";
import type { photoreceptor } from "./photoreceptor";
import type { geometryEffects } from "./geometry";
import type { qualityControl } from "./simulate";
type Photoreceptor = ReturnType<typeof photoreceptor>;
type GeometryEffects = ReturnType<typeof geometryEffects>;
type QualityControl = ReturnType<typeof qualityControl>;

export function chainFlux(i: Inputs, ge: GeometryEffects, pr: Photoreceptor, qc: QualityControl, psi: number) {
  const photonGain = 1 + pr.civGain;
  const noEff = i.nitricOxide * (1 - pr.noReleased);

  // --- Electron transport (lumped Michaelis-Menten with backpressure) ---
  const psiBrake = 1 / (1 + Math.exp((psi - 175) / 12)); // Q-cycle reverse pressure
  const adpDrive = i.adp / (i.adp + 40); // ANT/ATP synthase control
  const o2Sat = i.oxygen / (i.oxygen + 0.8); // CIV Km ~ 0.5-1 µM O2
  const noInhib = 1 / (1 + noEff / 120); // competitive NO inhibition of CIV

  const vmaxCI = 55;
  const fluxCI = vmaxCI * ge.capacity * i.nadhRatio * (0.35 + 0.65 * adpDrive);
  const fluxCII = 30 * ge.capacity * (i.succinate / (i.succinate + 0.5));
  // Copper sites of complex IV (CuA accepts from cytochrome c; CuB pairs with
  // heme a3 to bind O2). Copper deficiency lowers COX activity; the saturating
  // shape (1 at default, ~0.55 at 0.1x) is ASSUMED, not fitted.
  const cu = i.copperCiv ?? 1;
  const cuFactor = (cu / (cu + 0.08)) * 1.08;
  const fluxCIV = cuFactor *
    Math.min(fluxCI + fluxCII, 80 * ge.capacity) * ge.cytcRetention * o2Sat * noInhib * photonGain * (0.4 + 0.6 * adpDrive);
  // Hinkle 2005: 10 H+ per NADH and 6 H+ per succinate-derived electron pair;
  // 4 H+ per ATP including transport -> 2.5 and 1.5 P/O respectively.
  // Route the CIV electron-pair flux proportionally to CI/CII supply after
  // oxygen/NO inhibition, rather than assigning NADH yield to every pair.
  const chainSupply = fluxCI + fluxCII;
  const mixedPo = chainSupply > 0 ? (fluxCI * 2.5 + fluxCII * 1.5) / chainSupply : 0;
  // ADP / geometry multipliers remain unfitted: this is not a measured rate.
  const atpFlux = fluxCIV * mixedPo * (1 - i.uncoupling) * (0.5 + 0.5 * adpDrive) * ge.atpEfficiency * qc.atp;
  return { photonGain, noEff, psiBrake, adpDrive, o2Sat, noInhib, vmaxCI, fluxCI, fluxCII, cu, cuFactor, fluxCIV, chainSupply, mixedPo, atpFlux };
}
export type ChainFlux = ReturnType<typeof chainFlux>;
