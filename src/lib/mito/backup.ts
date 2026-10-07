// One-file backup of all browser-local state: visits, runs, snap plan,
// band, default and per-profile strengths, strength history, selected profile.
import { openDB } from "idb";
import { exportVisits, importVisits } from "./timeline";
import { listRuns, type RunRecord } from "./runs";

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
  return { app: "cristae-lab", kind: "everything", version: 1, exportedAt: new Date().toISOString(), visits: exportVisits().visits, runs: await listRuns(), settings };
}

export async function importEverything(data: unknown) {
  const d = data as { kind?: string; visits?: unknown; runs?: unknown; settings?: Record<string, unknown> };
  if (!d || d.kind !== "everything") throw new Error("This is not a Move everything file.");
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
