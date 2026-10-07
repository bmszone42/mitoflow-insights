// One-file backup of all browser-local state: visits, runs, snap plan,
// band, default and per-profile strengths, strength history, selected profile.
import { openDB } from "idb";
import { exportVisits, importVisits } from "./timeline";
import { listRuns, type RunRecord } from "./runs";

export const BACKUP_VERSION = 1;

// Migrate an older backup file forward, one version at a time.
// Add a case here when the format changes; never silently drop unknown fields.
function migrate(data: Record<string, unknown>, from: number): Record<string, unknown> {
  let d = data;
  let v = from;
  while (v < BACKUP_VERSION) {
    switch (v) {
      // case 1: d = migrate1to2(d); break;
      default:
        throw new Error(`No migration path from backup version ${v}.`);
    }
    v++;
  }
  return d;
}

const LS_KEYS = [
  "cristae-lab-snap-plan",
  "cristae-lab-rirr-range",
  "cristae-lab-rirr-default",
  "cristae-lab-rirr-profiles",
  "cristae-lab-rirr-history",
  "cristae-lab-profile",
];

export async function exportEverything() {
  const settings: Record<string, string> = {};
  for (const k of LS_KEYS) { const v = localStorage.getItem(k); if (v != null) settings[k] = v; }
  return { app: "cristae-lab", kind: "everything", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), visits: exportVisits().visits, runs: await listRuns(), settings };
}

export async function importEverything(data: unknown) {
  let d = data as { kind?: string; version?: unknown; visits?: unknown; runs?: unknown; settings?: Record<string, unknown> };
  if (!d || d.kind !== "everything") throw new Error("This is not a Move everything file.");
  const version = typeof d.version === "number" ? d.version : 1;
  if (version > BACKUP_VERSION) throw new Error(`This file is version ${version}; this app reads up to version ${BACKUP_VERSION}. Update the app, then load it again.`);
  d = migrate(d as Record<string, unknown>, version) as typeof d;
  const v = Array.isArray(d.visits) ? importVisits(d.visits) : { added: 0, skipped: 0, invalid: 0 };
  let runs = 0;
  if (Array.isArray(d.runs)) {
    const db = await openDB("cristae-lab-runs", 1, { upgrade(x) { x.createObjectStore("runs", { keyPath: "id" }); } });
    const tx = db.transaction("runs", "readwrite");
    for (const r of d.runs as RunRecord[]) {
      if (!r || typeof r.id !== "string") continue;
      const prev = (await tx.store.get(r.id)) as RunRecord | undefined;
      if (!prev || r.at > prev.at) { await tx.store.put({ ...r, count: Math.max(r.count ?? 1, prev?.count ?? 0) }); runs++; }
    }
    await tx.done;
  }
  let settings = 0;
  for (const k of LS_KEYS) {
    const val = d.settings?.[k];
    if (typeof val === "string") { localStorage.setItem(k, val); settings++; }
  }
  return { visits: v.added, runs, settings };
}
