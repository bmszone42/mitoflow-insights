// Shared selected profile across pages, browser-local. Starts at the page's
// fallback on server and first render (hydration-safe), then adopts the saved
// pick after mount. A ?profile= search value wins and becomes the saved pick.
import { useEffect, useState } from "react";
import { demoPatients } from "./patientReference";

const KEY = "cristae-lab-profile";
const EVENT = "cristae-lab-profile";
const demoIds = new Set(demoPatients.map((p) => p.id));

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setSelectedProfile(id: string) {
  try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useSelectedProfile(
  fallback: string,
  override?: string,
  valid: (id: string) => boolean = (id) => demoIds.has(id),
): [string, (id: string) => void] {
  const [id, setId] = useState(override ?? fallback);
  useEffect(() => {
    if (override) setSelectedProfile(override);
    else { const s = read(); if (s && valid(s)) setId(s); }
    const sync = () => { const s = read(); if (s && valid(s)) setId(s); };
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override]);
  const set = (next: string) => { setId(next); if (valid(next)) setSelectedProfile(next); };
  return [id, set];
}
