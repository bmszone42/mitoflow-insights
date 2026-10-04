import { openDB, type IDBPDatabase } from "idb";
import { defaultGeometry, geometryRanges, type Geometry, type Inputs } from "./model";

export type Scenario = {
  id: string;
  name: string;
  notes: string;
  inputs: Inputs;
  geometry?: Geometry; // older saved scenarios use the default membrane shape
  snapshot: { atpFlux?: number; superoxide?: number; hydrogenPeroxide?: number; fesIntact?: number; freeIron?: number; emission71THz?: number };
  interpretation?: { condition: string; text: string; at: number };
  micrograph?: { thumb: string; analysis: string; at: number };
  preset?: string; // preset name when the scenario was saved from a preset button
  createdAt: number;
  updatedAt: number;
};

// Local-only storage: every scenario lives in this browser's IndexedDB.
let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  dbp ??= openDB("cristae-lab", 1, {
    upgrade(d) {
      d.createObjectStore("scenarios", { keyPath: "id" });
    },
  });
  return dbp;
}

export async function listLocalScenarios(): Promise<Scenario[]> {
  const all = (await (await db()).getAll("scenarios")) as Scenario[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listScenarios(): Promise<Scenario[]> {
  return listLocalScenarios();
}
export async function putScenario(s: Scenario) {
  await (await db()).put("scenarios", s);
}
export async function deleteScenario(id: string) {
  await (await db()).delete("scenarios", id);
}
export function isScenario(x: unknown): x is Scenario {
  const s = x as Scenario;
  return !!s && typeof s.id === "string" && typeof s.name === "string" && typeof s.inputs === "object";
}

export function scenarioGeometry(s: Scenario): Geometry {
  const saved = s.geometry;
  const geometry = { ...defaultGeometry };
  for (const key of Object.keys(geometryRanges) as (keyof Geometry)[]) {
    const value = saved?.[key];
    const range = geometryRanges[key];
    if (typeof value === "number" && Number.isFinite(value))
      geometry[key] = Math.min(range.max, Math.max(range.min, value));
  }
  return geometry;
}
