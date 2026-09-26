import { openDB, type IDBPDatabase } from "idb";
import type { Inputs } from "./model";

export type Scenario = {
  id: string;
  name: string;
  notes: string;
  inputs: Inputs;
  snapshot: { atpFlux?: number; superoxide?: number; hydrogenPeroxide?: number; fesIntact?: number; freeIron?: number; emission71THz?: number };
  interpretation?: { condition: string; text: string; at: number };
  micrograph?: { thumb: string; analysis: string; at: number };
  createdAt: number;
  updatedAt: number;
};

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

export async function listScenarios(): Promise<Scenario[]> {
  const all = (await (await db()).getAll("scenarios")) as Scenario[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
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
