import { useSyncExternalStore } from "react";
import { demoPatients, patientMetrics, type DemoPatient, type PatientMetricKey } from "./patientReference";
import { diagnoseProfile } from "./diagnosis";
import { rankTherapies, therapies, applyTherapyDose, profileInputs, metrics } from "./treatment";

// Timeline visits live in module memory only (tab-only, never persisted or sent anywhere).
export type Visit = { id: string; patientId: string; date: string; values: Record<PatientMetricKey, number>; h2o2Nm?: number | undefined; therapies: string[]; doses?: Record<string, number> | undefined; origin: "baseline" | "synthetic" | "user" };

let visits: Visit[] = [];
const listeners = new Set<() => void>();
const emit = () => { visits = [...visits]; listeners.forEach((l) => l()); };
export const useVisits = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => visits, () => visits);
export const addVisit = (v: Omit<Visit, "id" | "origin">) => { visits.push({ ...v, id: `v-${Date.now()}-${Math.round(Math.random() * 1e6)}`, origin: "user" }); emit(); };
export const removeVisit = (id: string) => { visits = visits.filter((v) => v.id !== id); emit(); };

/** L:P is derived: lactate (mmol/L) x 1000 / pyruvate (µmol/L). */
export const withDerived = (values: Record<PatientMetricKey, number>) => ({ ...values, lactatePyruvate: values.pyruvate > 0 ? Math.round((values.lactate * 1000 / values.pyruvate) * 10) / 10 : values.lactatePyruvate });

const healthy = demoPatients[0];
const BASE_DATE = "2026-01-15";
const addMonths = (iso: string, m: number) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString().slice(0, 10); };

/** Invented follow-ups: each visit moves values a fixed share toward the healthy demo, with a deterministic wobble. Labeled synthetic. */
export function syntheticVisits(p: DemoPatient): Visit[] {
  if (p.source === "user") return [];
  const therapy = rankTherapies(diagnoseProfile(p)).find((r) => r.targeted.length)?.therapy.id;
  const steps = [0.15, 0.3, 0.4];
  return steps.map((share, i) => {
    const values = { ...p.values };
    for (const m of patientMetrics) {
      const wobble = 1 + 0.03 * Math.sin((i + 1) * (m.key.length + 3));
      const v = (p.values[m.key] + (healthy.values[m.key] - p.values[m.key]) * share) * wobble;
      values[m.key] = Math.round(v * 10 ** m.decimals) / 10 ** m.decimals;
    }
    const h2o2Nm = p.h2o2Nm === undefined ? undefined : Math.round((p.h2o2Nm + (30 - p.h2o2Nm) * share) * (1 + 0.03 * Math.sin(i + 7)));
    return { id: `${p.id}-s${i + 1}`, patientId: p.id, date: addMonths(BASE_DATE, (i + 1) * 3), values: withDerived(values), h2o2Nm, therapies: therapy ? [therapy] : [], origin: "synthetic" as const };
  });
}

export function patientTimeline(p: DemoPatient, user: Visit[]): Visit[] {
  const baseline: Visit = { id: `${p.id}-b`, patientId: p.id, date: BASE_DATE, values: p.values, h2o2Nm: p.h2o2Nm, therapies: [], origin: "baseline" };
  return [baseline, ...syntheticVisits(p), ...user.filter((v) => v.patientId === p.id)].sort((a, b) => a.date.localeCompare(b.date));
}

const visitProfile = (p: DemoPatient, v: Visit): DemoPatient => {
  if (v.origin === "baseline") return p;
  const origin = v.origin === "user" ? "user" as const : "synthetic" as const;
  return { ...p, values: v.values, origins: Object.fromEntries(patientMetrics.map((m) => [m.key, { origin }])) } as DemoPatient;
};

/** Simulated readouts at a visit: that visit's labs mapped to sliders, then each selected therapy applied at its model dose (default 1x). Model dose is a slider value, never a drug dose. */
export function visitReadouts(p: DemoPatient, v: Visit) {
  let inputs = profileInputs(visitProfile(p, v));
  for (const id of v.therapies) { const t = therapies.find((x) => x.id === id); if (t) inputs = applyTherapyDose(inputs, t, v.doses?.[id] ?? 1); }
  return metrics(inputs);
}

/** Diagnosis at a visit: same rules as the Diagnosis page, run on that visit's values. */
export function diagnoseVisit(p: DemoPatient, v: Visit) {
  if (v.origin === "baseline") return diagnoseProfile(p);
  const origin = v.origin === "user" ? "user" as const : "synthetic" as const;
  const origins = Object.fromEntries(patientMetrics.map((m) => [m.key, { origin }]));
  return diagnoseProfile({ ...p, values: v.values, origins });
}
