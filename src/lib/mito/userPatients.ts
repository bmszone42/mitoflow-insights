import { useSyncExternalStore } from "react";
import { demoPatients, patientMetrics, type DemoPatient, type PatientMetricKey, type ValueOrigin } from "./patientReference";

// User-entered results live only in this browser tab (module memory). Never
// persisted or sent to the server, except a file sent once for AI reading.
let users: DemoPatient[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const useUserPatients = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => users, () => users);
export const removeUserPatient = (id: string) => { users = users.filter((u) => u.id !== id); emit(); };

// Update one entered value on a user profile in place (tab-only, never stored).
export const updateUserPatientValue = (id: string, key: PatientMetricKey, value: number) => {
  users = users.map((u) => u.id === id ? { ...u, values: { ...u.values, [key]: value }, origins: { ...u.origins, [key]: { origin: "user" as const, citation: "Entered by you" } } } : u);
  emit();
};

export type UserEntry = { key: PatientMetricKey; value: number; unit?: string | undefined; sourceText?: string | undefined };
export type UserDraft = { name: string; age: number; sex: "F" | "M"; fasting: boolean; entries: UserEntry[]; via: "manual" | "csv" | "file" };

const metricKeys = patientMetrics.map((m) => m.key);
export const isMetricKey = (k: string): k is PatientMetricKey => (metricKeys as string[]).includes(k);

// Convert common alternate units to the app units. Returns null when the unit is not understood.
export function toAppUnit(key: PatientMetricKey, value: number, unit = ""): { value: number; note?: string } | null {
  const u = unit.toLowerCase().replace(/\s/g, "").replace("μ", "µ");
  if (!u) return { value };
  if (key === "glucose") { if (u.includes("mg/dl")) return { value: +(value / 18.016).toFixed(2), note: "mg/dL to mmol/L" }; if (u.includes("mmol")) return { value }; return null; }
  if (key === "lactate") { if (u.includes("mg/dl")) return { value: +(value / 9.008).toFixed(2), note: "mg/dL to mmol/L" }; if (u.includes("mmol") || u.includes("meq")) return { value }; return null; }
  if (key === "pyruvate") { if (u.includes("mmol")) return { value: Math.round(value * 1000), note: "mmol/L to µmol/L" }; if (u.includes("mg/dl")) return { value: Math.round(value / 0.008806), note: "mg/dL to µmol/L" }; if (u.includes("µmol") || u.includes("umol")) return { value }; return null; }
  if (key === "ferritin") { if (u.includes("ng/ml") || u.includes("µg/l") || u.includes("ug/l")) return { value }; return null; }
  if (key === "transferrinSaturation" || key === "lipidPeroxidation") return u.includes("%") ? { value } : null;
  if (key === "membranePotential") return u.includes("mv") ? { value } : null;
  return { value };
}

const IDENTIFIER = /(name|dob|birth|mrn|record|accession|address|phone|email|ssn|nhs|patient.?id)/i;

export function parseCsv(text: string): { entries: UserEntry[]; error?: string } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
  if (header.some((h) => IDENTIFIER.test(h))) return { entries: [], error: "This file has a column that looks like a personal identifier (name, birth date, record number). Remove it and upload again." };
  if (header[0] !== "test" || header[1] !== "value") return { entries: [], error: "Use the template: columns test, value, unit." };
  const entries: UserEntry[] = [];
  for (const line of lines.slice(1)) {
    const [k, v, unit] = line.split(",").map((c) => c.trim());
    if (!k || !isMetricKey(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n)) entries.push({ key: k, value: n, unit });
  }
  return entries.length ? { entries } : { entries: [], error: "No recognised tests found. Test names must match the template." };
}

export const csvTemplate = "test,value,unit\n" + patientMetrics.map((m) => `${m.key},,${m.unit}`).join("\n");

export function addUserPatient(d: UserDraft): DemoPatient {
  const base = (d.age < 18 ? demoPatients.find((p) => p.id === "demo-02") : demoPatients.find((p) => p.id === "demo-01"))!;
  const values = { ...base.values };
  const origins: Partial<Record<PatientMetricKey, ValueOrigin>> = {};
  for (const e of d.entries) {
    values[e.key] = e.value;
    origins[e.key] = { origin: "user", citation: d.via === "file" ? "Read from your uploaded report, checked by you" : d.via === "csv" ? "Your CSV upload" : "Entered by you", locator: e.sourceText };
  }
  for (const k of Object.keys(values) as PatientMetricKey[]) if (!origins[k]) origins[k] = { origin: "synthetic", locator: `Synthetic fill from ${base.phenotype.toLowerCase()} profile` };
  if (!origins.lactatePyruvate || origins.lactatePyruvate.origin === "synthetic") {
    values.lactatePyruvate = Number((values.lactate * 1000 / values.pyruvate).toFixed(1));
    const both = origins.lactate?.origin === "user" && origins.pyruvate?.origin === "user";
    origins.lactatePyruvate = both ? { origin: "user", citation: "Calculated from your lactate and pyruvate" } : { origin: "synthetic", locator: "Calculated with at least one synthetic value" };
  }
  const n = users.length + 1;
  const p: DemoPatient = {
    id: `user-${Date.now()}`, label: d.name.trim().slice(0, 40) || `Your results ${n}`, age: d.age, sex: d.sex, nonfasting: !d.fasting,
    phenotype: "Your results", description: `${d.entries.length} of ${metricKeys.length} values from you; the rest are synthetic fill.`,
    context: "Held in this browser tab only, not saved. Not a medical diagnosis.", values, origins, source: "user",
  };
  users = [...users, p];
  emit();
  return p;
}
