// Band-aware pair ranking shared by the Strength plan and Timeline pages.
// Pairs are scored at the current strength and both band edges; pairs that
// still lower superoxide at both edges rank first, by their worst edge.
import type { Inputs } from "./model";
import { applyTherapyDose, metrics, therapies } from "./treatment";

export const PAIR_DOSES = [0.5, 1, 1.5, 2];
type T = (typeof therapies)[number];
export type PairBest = { doseA: number; doseB: number; so: number };
export type RankedPair = { tA: T; tB: T; cur: PairBest; low: PairBest; high: PairBest; robust: boolean };

export function pairBestAt(base: Inputs, tA: T, tB: T, s: number): PairBest {
  const b = { ...base, rirrStrength: s };
  const s0 = metrics(b).superoxide;
  let best = { doseA: 0, doseB: 0, so: 0 };
  for (const dA of PAIR_DOSES) for (const dB of PAIR_DOSES) {
    const so = s0 ? (metrics(applyTherapyDose(applyTherapyDose(b, tA, dA), tB, dB)).superoxide / s0 - 1) * 100 : 0;
    if (so < best.so) best = { doseA: dA, doseB: dB, so };
  }
  return best;
}

export function rankPairs(base: Inputs, strength: number, lo: number, hi: number, n = 3): RankedPair[] {
  const out: RankedPair[] = [];
  for (let i = 0; i < therapies.length; i++) for (let j = i + 1; j < therapies.length; j++) {
    const tA = therapies[i]!, tB = therapies[j]!;
    const cur = pairBestAt(base, tA, tB, strength);
    if (cur.doseA === 0 && cur.doseB === 0) continue;
    const low = pairBestAt(base, tA, tB, lo), high = pairBestAt(base, tA, tB, hi);
    out.push({ tA, tB, cur, low, high, robust: low.so < 0 && high.so < 0 });
  }
  const worst = (r: RankedPair) => Math.max(r.low.so, r.high.so);
  out.sort((a, b) => Number(b.robust) - Number(a.robust) || worst(a) - worst(b) || a.cur.so - b.cur.so);
  return out.slice(0, n);
}

/** Superoxide change of a pair (best joint dose) at evenly spaced strengths across the band. */
export function pairBandCurve(base: Inputs, pairs: RankedPair[], lo: number, hi: number, steps = 6) {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const s = lo + ((hi - lo) * k) / steps;
    const row: Record<string, number> = { s: Math.round(s * 100) / 100 };
    pairs.forEach((r, i) => { row[`p${i}`] = pairBestAt(base, r.tA, r.tB, s).so; });
    return row;
  });
}
