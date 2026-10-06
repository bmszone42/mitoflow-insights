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

// Per-profile strength overrides, stored in this browser only. A profile with
// its own override uses it everywhere profileInputs runs; profiles without one
// fall back to the saved default (then the 1.0x code default).
const PROFILE_KEY = "cristae-lab-rirr-profiles";

export function profileRirrOverrides(): Record<string, number> {
  try {
    const v = localStorage.getItem(PROFILE_KEY);
    if (!v) return {};
    const o = JSON.parse(v) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, n] of Object.entries(o)) {
      if (typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1.5) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export function profileRirr(id: string): number | null {
  const o = profileRirrOverrides();
  return id in o ? o[id]! : null;
}

export function saveProfileRirr(id: string, s: number | null) {
  try {
    const o = profileRirrOverrides();
    if (s === null) delete o[id]; else o[id] = Math.min(1.5, Math.max(0, s));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(o));
  } catch { /* storage unavailable */ }
}

/** Reads per-profile overrides after mount; setOverride persists one. */
export function useProfileRirr(): [Record<string, number>, (id: string, s: number | null) => void] {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  useEffect(() => { setOverrides(profileRirrOverrides()); }, []);
  const setOverride = (id: string, s: number | null) => {
    saveProfileRirr(id, s);
    setOverrides(profileRirrOverrides());
  };
  return [overrides, setOverride];
}
