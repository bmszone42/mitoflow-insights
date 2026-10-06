// Scheduled strength snaps, browser-local. Each entry plans one profile's
// strength change for a date; nothing applies automatically, the date only
// marks it due and the user confirms on the Snap plan page.
import { useEffect, useState } from "react";

const KEY = "cristae-lab-snap-plan";
const EVENT = "cristae-lab-snap-plan";

export interface PlannedSnap {
  id: string;
  profileId: string;
  label: string;
  from: number;
  to: number;
  date: string; // YYYY-MM-DD
  status: "planned" | "done" | "skipped";
  appliedAt?: string;
  prev?: number | null; // override before applying, for undo
}

export type SnapStatus = "Planned" | "Due today" | "Overdue" | "Done" | "Skipped";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function snapStatus(s: PlannedSnap, today = todayStr()): SnapStatus {
  if (s.status === "done") return "Done";
  if (s.status === "skipped") return "Skipped";
  if (s.date === today) return "Due today";
  return s.date < today ? "Overdue" : "Planned";
}

function read(): PlannedSnap[] {
  try {
    const v = localStorage.getItem(KEY);
    const a = v ? (JSON.parse(v) as PlannedSnap[]) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function write(list: PlannedSnap[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch { /* storage unavailable */ }
}

export function addSnaps(items: Omit<PlannedSnap, "id" | "status">[]) {
  const now = Date.now();
  write([...read(), ...items.map((x, i) => ({ ...x, id: `${now}-${i}-${x.profileId}`, status: "planned" as const }))]);
}

export function updateSnap(id: string, patch: Partial<PlannedSnap>) {
  write(read().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function removeSnap(id: string) {
  write(read().filter((s) => s.id !== id));
}

/** Reads the plan after mount (no SSR access) and follows changes. */
export function useSnapPlan(): PlannedSnap[] {
  const [list, setList] = useState<PlannedSnap[]>([]);
  useEffect(() => {
    const r = () => setList(read());
    r();
    window.addEventListener(EVENT, r);
    return () => window.removeEventListener(EVENT, r);
  }, []);
  return list;
}
