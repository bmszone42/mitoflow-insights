// The user's saved ROS-induced ROS release strength (fitted in the Recalibrate
// box on the Progress page). Stored in this browser only; the Simulator applies
// it after mount so SSR never touches localStorage.
const KEY = "cristae-lab-rirr-default";

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
