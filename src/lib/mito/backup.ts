// One-file backup of all browser-local state: visits, runs, snap plan,
// band, default and per-profile strengths, strength history, selected profile.
import { openDB } from "idb";
import { exportVisits, importVisits } from "./timeline";
import { listRuns, type RunRecord } from "./runs";
import { REFERENCE_VERSION } from "./reference";
import { strengthRange } from "./rangeState";
import { savedRirrStrength } from "./rirrDefault";

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

// What a "Download everything" file would carry right now, so the page can
// state it before the user clicks. Reads the same sources as exportEverything.
export async function describeBackup() {
  const visits = exportVisits().visits;
  const runs = await listRuns();
  const snapRaw = localStorage.getItem("cristae-lab-snap-plan");
  let snaps = 0;
  try {
    const a = snapRaw ? JSON.parse(snapRaw) : [];
    snaps = Array.isArray(a) ? a.length : 0;
  } catch { /* unreadable snap plan counts as none */ }
  const profileRaw = localStorage.getItem("cristae-lab-rirr-profiles");
  let profileStrengths = 0;
  try {
    const o = profileRaw ? JSON.parse(profileRaw) : {};
    profileStrengths = o && typeof o === "object" ? Object.keys(o).length : 0;
  } catch { /* unreadable profile strengths count as none */ }
  const historyRaw = localStorage.getItem("cristae-lab-rirr-history");
  let history = 0;
  try {
    const a = historyRaw ? JSON.parse(historyRaw) : [];
    history = Array.isArray(a) ? a.length : 0;
  } catch { /* unreadable history counts as none */ }
  const band = strengthRange();
  const defaultStrength = savedRirrStrength();
  const selected = localStorage.getItem("cristae-lab-profile");
  return {
    visits: visits.length,
    runs: runs.length,
    snaps,
    profileStrengths,
    history,
    band,
    defaultStrength,
    selected: selected ?? null,
    version: BACKUP_VERSION,
    referenceVersion: REFERENCE_VERSION,
  };
}

export async function exportEverything() {
  const settings: Record<string, string> = {};
  for (const k of LS_KEYS) { const v = localStorage.getItem(k); if (v != null) settings[k] = v; }
  return { app: "cristae-lab", kind: "everything", version: BACKUP_VERSION, referenceVersion: REFERENCE_VERSION, exportedAt: new Date().toISOString(), visits: exportVisits().visits, runs: await listRuns(), settings };
}

export async function importEverything(data: unknown) {
  let d = data as { kind?: string; version?: unknown; referenceVersion?: unknown; visits?: unknown; runs?: unknown; settings?: Record<string, unknown> };
  if (!d || d.kind !== "everything") throw new Error("This is not a Move everything file.");
  const version = typeof d.version === "number" ? d.version : 1;
  if (version > BACKUP_VERSION) throw new Error(`This file is version ${version}; this app reads up to version ${BACKUP_VERSION}. Update the app, then load it again.`);
  const refVersion = typeof d.referenceVersion === "number" ? d.referenceVersion : 1;
  if (refVersion > REFERENCE_VERSION) throw new Error(`This file was saved with newer reference data (version ${refVersion}); this app has version ${REFERENCE_VERSION}. Update the app, then load it again.`);
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
