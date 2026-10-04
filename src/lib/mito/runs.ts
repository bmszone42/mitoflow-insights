import { openDB, type IDBPDatabase } from "idb";

// Local-only log of which profile / therapy / dose combinations have been
// simulated, so repeats are visible on the Scenario progress page.
export type RunSource = "dashboard" | "calculator" | "compare" | "plan" | "timeline" | "progress";

export type RunRecord = {
  id: string; // dedupe key: patientId|source|dose|sorted therapy ids
  patientId: string;
  source: RunSource;
  dose: number;
  therapyIds: string[];
  at: number;
  count: number; // how many times this exact combination ran
  rirrStrength?: number; // ROS-induced ROS release strength in effect for the run (assumed setting)
  realDose?: string; // e.g. "30 mg/day MitoQ" when run from a real-dose slider
  soChangePct?: number; // superoxide change vs no therapy, percent
};

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  dbp ??= openDB("cristae-lab-runs", 1, {
    upgrade(d) {
      d.createObjectStore("runs", { keyPath: "id" });
    },
  });
  return dbp;
}

const keyOf = (patientId: string, source: RunSource, dose: number, therapyIds: string[]) =>
  `${patientId}|${source}|${dose}|${[...therapyIds].sort().join("+")}`;

// Fire-and-forget; never throws into the UI.
export async function recordRun(patientId: string, source: RunSource, dose: number, therapyIds: string[], rirrStrength?: number, extra?: { realDose: string; soChangePct: number }) {
  try {
    const id = keyOf(patientId, source, dose, therapyIds);
    const store = (await db()).transaction("runs", "readwrite").objectStore("runs");
    const prev = (await store.get(id)) as RunRecord | undefined;
    await store.put({ id, patientId, source, dose, therapyIds: [...therapyIds].sort(), at: Date.now(), count: (prev?.count ?? 0) + 1, ...(rirrStrength != null ? { rirrStrength } : {}), ...(extra ?? {}) } satisfies RunRecord);
  } catch {
    // storage unavailable; ignore
  }
}

export async function listRuns(): Promise<RunRecord[]> {
  try {
    const all = (await (await db()).getAll("runs")) as RunRecord[];
    return all.sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export async function clearRuns() {
  try {
    await (await db()).clear("runs");
  } catch {
    // ignore
  }
}
