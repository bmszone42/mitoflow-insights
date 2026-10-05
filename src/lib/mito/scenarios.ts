import { openDB, type IDBPDatabase } from "idb";
import { simulate, defaultInputs, defaultGeometry, geometryRanges, type Geometry, type Inputs } from "./model";

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

// ROS-induced ROS release strength is an assumed setting (no published value), so every
// export and comparison names the value each scenario was run at.
export const DEFAULT_RIRR_STRENGTH = 0.5;

export function scenarioStrength(s: Scenario): number | null {
  const v = (s.inputs as { rirrStrength?: unknown } | undefined)?.rirrStrength;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function scenarioStrengthLabel(s: Scenario): string {
  const v = scenarioStrength(s);
  return v == null ? `not noted (assumed ${DEFAULT_RIRR_STRENGTH}x)` : `${v}x`;
}

export type ScenarioSummaryRow = {
  id: string;
  name: string;
  rirrStrength: number | null;
  strengthNoted: boolean;
  preset?: string | undefined;
  atpFlux?: number | undefined;
  superoxide?: number | undefined;
  hydrogenPeroxide?: number | undefined;
  freeIron?: number | undefined;
  updatedAt: number;
};

export type ScenarioExportPayload = {
  format: "cristae-lab-scenarios";
  version: 2;
  exportedAt: string;
  summary: {
    count: number;
    strengthIsAssumed: true;
    strengthNote: string;
    byStrength: Record<string, number>;
    scenarios: ScenarioSummaryRow[];
  };
  scenarios: Scenario[];
};

export function scenariosExportPayload(items: Scenario[]): ScenarioExportPayload {
  const rows: ScenarioSummaryRow[] = items.map((s) => {
    const strength = scenarioStrength(s);
    return {
      id: s.id,
      name: s.name,
      rirrStrength: strength,
      strengthNoted: strength != null,
      preset: s.preset,
      atpFlux: s.snapshot.atpFlux,
      superoxide: s.snapshot.superoxide,
      hydrogenPeroxide: s.snapshot.hydrogenPeroxide,
      freeIron: s.snapshot.freeIron,
      updatedAt: s.updatedAt,
    };
  });
  const byStrength: Record<string, number> = {};
  for (const r of rows) {
    const key = r.rirrStrength == null ? "not noted" : `${r.rirrStrength}x`;
    byStrength[key] = (byStrength[key] ?? 0) + 1;
  }
  return {
    format: "cristae-lab-scenarios",
    version: 2,
    exportedAt: new Date().toISOString(),
    summary: {
      count: rows.length,
      strengthIsAssumed: true,
      strengthNote:
        "ROS-induced strength is the assumed ROS-induced ROS release setting each scenario was run at (model setting, no published value). 'not noted' means it was saved before the setting existed and used the Simulator default.",
      byStrength,
      scenarios: rows,
    },
    scenarios: items,
  };
}

// Import accepts the older flat array as well as the versioned payload above.
export function scenariosFromJson(data: unknown): Scenario[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { scenarios?: unknown })?.scenarios)
      ? (data as { scenarios: unknown[] }).scenarios
      : [data];
  return list.filter(isScenario);
}
