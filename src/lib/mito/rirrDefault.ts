// The user's saved ROS-induced ROS release strength (fitted in the Recalibrate
// box on the Progress page). Stored in this browser only; the Simulator applies
// it after mount so SSR never touches localStorage.
import { useEffect, useState } from "react";

const KEY = "cristae-lab-rirr-default";

// Module-level active strength, set by useSavedRirr after mount. profileInputs
// overlays it so Dashboard, Diagnosis and Timeline all read the same fitted
// strength. Null during SSR and first client render, so no hydration mismatch.
let active: number | null = null;

export function activeRirr(): number | null {
  return active;
}

/** Reads the saved strength after mount and makes it the active default. */
export function useSavedRirr(): number | null {
  const [s, setS] = useState<number | null>(null);
  useEffect(() => {
    const v = savedRirrStrength();
    active = v;
    setS(v);
    return () => { active = null; };
  }, []);
  return s;
}

export function savedRirrStrength(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 1.5 ? n : null;
  } catch {
    return null;
  }
}

export function saveRirrStrength(s: number) {
  try { localStorage.setItem(KEY, String(s)); } catch { /* storage unavailable */ }
}

export function clearRirrStrength() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
