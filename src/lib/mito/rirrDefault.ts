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
  logStrength("default-saved", s, "Saved as default strength");
}

export function clearRirrStrength() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  logStrength("default-cleared", null, "Cleared saved default (back to 1.0x)");
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
    if (s === null) logStrength("profile-cleared", null, `Profile ${id}: follow default`);
    else logStrength("profile-set", o[id]!, `Profile ${id}`);
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

// History of every strength value used (saved default, cleared default,
// per-profile override, batch reruns). Browser-only, newest first, capped.
const HISTORY_KEY = "cristae-lab-rirr-history";
const HISTORY_MAX = 500;
export const RIRR_HISTORY_EVENT = "cristae-lab-rirr-history";

export interface StrengthHistoryEntry {
  at: string; // ISO timestamp
  kind: "default-saved" | "default-cleared" | "profile-set" | "profile-cleared" | "batch-run";
  strength: number | null;
  detail: string;
}

export function strengthHistory(): StrengthHistoryEntry[] {
  try {
    const v = localStorage.getItem(HISTORY_KEY);
    const a = v ? (JSON.parse(v) as StrengthHistoryEntry[]) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function logStrength(kind: StrengthHistoryEntry["kind"], strength: number | null, detail: string) {
  try {
    const next = [{ at: new Date().toISOString(), kind, strength, detail }, ...strengthHistory()].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RIRR_HISTORY_EVENT));
  } catch { /* storage unavailable */ }
}

export function clearStrengthHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event(RIRR_HISTORY_EVENT));
  } catch { /* storage unavailable */ }
}
