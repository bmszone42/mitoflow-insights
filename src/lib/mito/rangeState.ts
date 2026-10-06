// Shared strength-range pick (low/high) for the Progress page: the Strength
// range check sliders and the Strength history chart band read the same
// values so the band moves live with the sliders. Module state only, not
// persisted; defaults to 0.5x-1.0x.
import { useEffect, useState } from "react";

export const RANGE_EVENT = "cristae-lab-rirr-range";

let lo = 0.5;
let hi = 1.0;

export function strengthRange(): { lo: number; hi: number } {
  return { lo, hi };
}

export function setStrengthRange(nextLo: number, nextHi: number) {
  lo = Math.min(nextLo, nextHi);
  hi = Math.max(nextLo, nextHi);
  window.dispatchEvent(new Event(RANGE_EVENT));
}

export function useStrengthRange(): [{ lo: number; hi: number }, (lo: number, hi: number) => void] {
  const [r, setR] = useState(strengthRange());
  useEffect(() => {
    const load = () => setR(strengthRange());
    window.addEventListener(RANGE_EVENT, load);
    return () => window.removeEventListener(RANGE_EVENT, load);
  }, []);
  return [r, setStrengthRange];
}
