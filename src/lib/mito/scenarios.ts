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
  strengthSource?: string; // where rirrStrength came from when saved (profile's own strength, saved default, tuned on the card, model default)
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

// Where a scenario's strength came from: the structured field saved by the
// Profile sensitivity card, else parsed from older notes text, else unknown.
export function scenarioStrengthSource(s: Scenario): string {
  if (typeof s.strengthSource === "string" && s.strengthSource) return s.strengthSource;
  const m = /ROS-induced strength [\d.]+x \(([^)]+)\)/.exec(s.notes ?? "");
  if (m?.[1]) return m[1];
  return "not noted";
}

// Defences-only gap, the same matched-healthy comparison the Dashboard,
// Timeline and scenario compare table use: healthy defaults re-run at the
// subject's own membrane potential (iron and L:P held at healthy), healthy
// antioxidant capacity vs the subject's, so only defences and ROS-induced
// release show. Shared by saved scenarios AND the reference profile row, so
// the table, CSV and JSON export can never disagree.
export function defencesGapFromInputs(inputs: Inputs, geometry: Geometry = defaultGeometry): number {
  const matched = (ac: number) =>
    simulate({ ...defaultInputs, deltaPsi: inputs.deltaPsi, antioxidantCapacity: ac }, geometry).superoxide;
  const base = matched(defaultInputs.antioxidantCapacity);
  const val = matched(inputs.antioxidantCapacity);
  return base === 0 ? 0 : ((val - base) / base) * 100;
}

export function scenarioDefencesGap(s: Scenario): number {
  return defencesGapFromInputs(s.inputs, scenarioGeometry(s));
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
  defencesOnlyGap?: number;
  updatedAt: number;
};

// Reference-profile row in the JSON summary, mirroring the CSV's
// "reference profile" row so both files share the same fields.
export type ReferenceSummaryRow = {
  label: string;
  superoxide: number;
  atpFlux: number;
  hydrogenPeroxide: number;
  freeIron: number;
  defencesOnlyGap: number;
};

export type ScenarioExportPayload = {
  format: "cristae-lab-scenarios";
  version: 3;
  exportedAt: string;
  summary: {
    count: number;
    strengthIsAssumed: true;
    strengthNote: string;
    referenceNote: string;
    versionNote: string;
    byStrength: Record<string, number>;
    healthyReference: { superoxide: number; atpFlux: number; hydrogenPeroxide: number; freeIron: number };
    referenceProfile: ReferenceSummaryRow | null;
    scenarios: ScenarioSummaryRow[];
  };
  scenarios: Scenario[];
};

export function scenariosExportPayload(items: Scenario[], reference?: { label: string; inputs: Inputs }): ScenarioExportPayload {
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
      defencesOnlyGap: scenarioDefencesGap(s),
      updatedAt: s.updatedAt,
    };
  });
  // Sort weakest defences first, matching the compare table's default sort.
  rows.sort((a, b) => (b.defencesOnlyGap ?? 0) - (a.defencesOnlyGap ?? 0));
  const byStrength: Record<string, number> = {};
  for (const r of rows) {
    const key = r.rirrStrength == null ? "not noted" : `${r.rirrStrength}x`;
    byStrength[key] = (byStrength[key] ?? 0) + 1;
  }
  const healthyOut = simulate(defaultInputs, defaultGeometry);
  const referenceProfile: ReferenceSummaryRow | null = reference
    ? {
        label: reference.label,
        ...(() => {
          const o = simulate(reference.inputs, defaultGeometry);
          return { superoxide: o.superoxide, atpFlux: o.atpFlux, hydrogenPeroxide: o.hydrogenPeroxide, freeIron: o.freeIron };
        })(),
        defencesOnlyGap: defencesGapFromInputs(reference.inputs),
      }
    : null;
  return {
    format: "cristae-lab-scenarios",
    version: 3,
    exportedAt: new Date().toISOString(),
    summary: {
      count: rows.length,
      strengthIsAssumed: true,
      strengthNote:
        "ROS-induced strength is the assumed ROS-induced ROS release setting each scenario was run at (model setting, no published value). 'not noted' means it was saved before the setting existed and used the Simulator default.",
      referenceNote: referenceProfile
        ? "healthyReference is the healthy adult at model defaults; referenceProfile is the reference profile the scenario compare table uses, recomputed live from its saved inputs with the same matched-healthy defences-only gap as the table and CSV. Scenario rows are sorted by defences-only gap, weakest first, matching the compare table's default sort."
        : "No reference profile was passed at export time; the CSV export on the Dashboard and Diagnosis carries its own reference row.",
      versionNote:
        "Version 3. New since version 2: per-scenario defencesOnlyGap, the healthyReference block, the referenceProfile block with its own defencesOnlyGap, and scenario rows sorted by defences-only gap, weakest defences first, matching the compare table's default sort. Import still accepts version 2 files and the older flat array.",
      byStrength,
      healthyReference: {
        superoxide: healthyOut.superoxide,
        atpFlux: healthyOut.atpFlux,
        hydrogenPeroxide: healthyOut.hydrogenPeroxide,
        freeIron: healthyOut.freeIron,
      },
      referenceProfile,
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
