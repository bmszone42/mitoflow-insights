// Shared strength-range pick (low/high) for the Progress page: the Strength
// range check sliders and the Strength history chart band read the same
// values so the band moves live with the sliders. Persisted in this browser
// so the band and sliders survive a reload; defaults to 0.5x-1.0x.
import { useEffect, useState } from "react";

export const RANGE_EVENT = "cristae-lab-rirr-range";
const KEY = "cristae-lab-rirr-range";

function load(): { lo: number; hi: number } {
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return { lo: 0.5, hi: 1.0 };
    const o = JSON.parse(v) as { lo?: unknown; hi?: unknown };
    if (typeof o.lo === "number" && typeof o.hi === "number" && Number.isFinite(o.lo) && Number.isFinite(o.hi)) {
      return { lo: Math.min(o.lo, o.hi), hi: Math.max(o.lo, o.hi) };
    }
  } catch { /* storage unavailable */ }
  return { lo: 0.5, hi: 1.0 };
}

const saved = typeof window === "undefined" ? { lo: 0.5, hi: 1.0 } : load();
let lo = saved.lo;
let hi = saved.hi;

export function strengthRange(): { lo: number; hi: number } {
  return { lo, hi };
}

/**
 * Re-reads the saved range from this browser into the module state. The
 * module-level read runs during SSR and on the first client render, so callers
 * that must show the band the user actually saved call this once after mount.
 */
export function reloadStrengthRange() {
  if (typeof window === "undefined") return;
  const r = load();
  lo = r.lo;
  hi = r.hi;
}

export function setStrengthRange(nextLo: number, nextHi: number) {
  lo = Math.min(nextLo, nextHi);
  hi = Math.max(nextLo, nextHi);
  try { localStorage.setItem(KEY, JSON.stringify({ lo, hi })); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(RANGE_EVENT));
}

export function useStrengthRange(): [{ lo: number; hi: number }, (lo: number, hi: number) => void] {
  const [r, setR] = useState(strengthRange());
  useEffect(() => {
    // Re-read after mount: the module-level read happens during SSR and on the
    // very first client render, so a range saved in this browser must be
    // picked up here before the band is trusted. Same pattern as useSavedRirr.
    reloadStrengthRange();
    setR(strengthRange());
    const sync = () => setR(strengthRange());
    window.addEventListener(RANGE_EVENT, sync);
    return () => window.removeEventListener(RANGE_EVENT, sync);
  }, []);
  return [r, setStrengthRange];
}
