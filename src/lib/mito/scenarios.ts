import { openDB, type IDBPDatabase } from "idb";
import { defaultGeometry, geometryRanges, type Geometry, type Inputs } from "./model";
import { supabase } from "@/integrations/supabase/client";

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

// Storage facade: signed in -> account (Lovable Cloud), signed out -> this browser (IndexedDB).
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

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Saved Compare AI driver reply for an A|B pair, in the signed-in account. Null when signed out. */
export async function loadDriverReply(pairKey: string): Promise<string | null> {
  const uid = await userId();
  if (!uid) return null;
  const { data, error } = await supabase.from("driver_ai_replies").select("reply").eq("pair_key", pairKey).maybeSingle();
  if (error) throw error;
  return data?.reply ?? null;
}

export async function saveDriverReply(pairKey: string, reply: string): Promise<void> {
  const uid = await userId();
  if (!uid) return;
  const { error } = await supabase.from("driver_ai_replies").upsert(
    { user_id: uid, pair_key: pairKey, reply, updated_at: new Date().toISOString() },
    { onConflict: "user_id,pair_key" },
  );
  if (error) throw error;
}

export async function listLocalScenarios(): Promise<Scenario[]> {
  const all = (await (await db()).getAll("scenarios")) as Scenario[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function putCloud(uid: string, s: Scenario) {
  const { error } = await supabase.from("scenarios").upsert(
    {
      id: s.id,
      user_id: uid,
      name: s.name,
      data: s as never,
      created_at: new Date(s.createdAt).toISOString(),
      updated_at: new Date(s.updatedAt).toISOString(),
    },
    { onConflict: "user_id,id" },
  );
  if (error) throw error;
}

export async function listScenarios(): Promise<Scenario[]> {
  const uid = await userId();
  if (!uid) return listLocalScenarios();
  const { data, error } = await supabase.from("scenarios").select("data").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.data as unknown as Scenario).filter(isScenario);
}
export async function putScenario(s: Scenario) {
  const uid = await userId();
  if (uid) return putCloud(uid, s);
  await (await db()).put("scenarios", s);
}
export async function deleteScenario(id: string) {
  const uid = await userId();
  if (uid) {
    const { error } = await supabase.from("scenarios").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await (await db()).delete("scenarios", id);
}
/** Copies browser scenarios into the signed-in account. Local copies are kept. */
export async function copyLocalToAccount(): Promise<number> {
  const uid = await userId();
  if (!uid) throw new Error("Not signed in");
  const local = await listLocalScenarios();
  for (const s of local) await putCloud(uid, s);
  return local.length;
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
