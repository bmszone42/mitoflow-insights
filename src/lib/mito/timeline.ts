import { useSyncExternalStore } from "react";
import { openDB, type IDBPDatabase } from "idb";
import { demoPatients, patientMetrics, projectedMitoSox, projectedH2o2, mitoSoxBand, h2o2NmBand, type DemoPatient, type PatientMetricKey } from "./patientReference";
import { diagnoseProfile } from "./diagnosis";
import { rankTherapies, therapies, applyTherapyDose, profileInputs, metrics } from "./treatment";
import { defaultGeometry, melovHeartCheck, simulate } from "./model";

// Timeline visits persist in this browser via IndexedDB ("cristae-lab-visits"), like runs.
// Baseline and synthetic visits are regenerated from the demo data; only user/real/plan rows are stored.
/** origin "real": a real-world visit with measured labs and the actual doses taken (free text, e.g. "20 mg/day"); actualDoses are recorded only, the model still uses `doses`. */
export type Visit = { id: string; patientId: string; date: string; values: Record<PatientMetricKey, number>; h2o2Nm?: number | undefined; therapies: string[]; doses?: Record<string, number> | undefined; actualDoses?: Record<string, string> | undefined; origin: "baseline" | "synthetic" | "user" | "plan" | "real" };

let visits: Visit[] = [];
const listeners = new Set<() => void>();
const emit = () => { visits = [...visits]; listeners.forEach((l) => l()); };
export const useVisits = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => visits, () => visits);
export const addVisit = (v: Omit<Visit, "id" | "origin">, origin: "user" | "real" = "user") => { visits.push({ ...v, id: `v-${Date.now()}-${Math.round(Math.random() * 1e6)}`, origin }); emit(); };
/** Plan row: therapies and doses only, no new labs. Labs are filled from the latest earlier non-plan visit in patientTimeline. */
export const addPlan = (v: Pick<Visit, "patientId" | "date" | "therapies" | "doses">) => { visits.push({ ...v, id: `p-${Date.now()}-${Math.round(Math.random() * 1e6)}`, values: {} as Record<PatientMetricKey, number>, origin: "plan" }); emit(); };
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
  const sorted = [baseline, ...syntheticVisits(p), ...user.filter((v) => v.patientId === p.id)].sort((a, b) => a.date.localeCompare(b.date));
  // Plan rows carry no labs: fill from the latest earlier non-plan visit so readouts and projections still compute.
  let lastReal: Visit = baseline;
  return sorted.map((v) => {
    if (v.origin !== "plan") { lastReal = v; return v; }
    return { ...v, values: lastReal.values, h2o2Nm: lastReal.h2o2Nm };
  });
}

const visitProfile = (p: DemoPatient, v: Visit): DemoPatient => {
  if (v.origin === "baseline") return p;
  const origin = v.origin === "synthetic" ? "synthetic" as const : "user" as const;
  return { ...p, values: v.values, origins: Object.fromEntries(patientMetrics.map((m) => [m.key, { origin }])) } as DemoPatient;
};

/** Full simulation at a visit: that visit's labs mapped to sliders, then each selected therapy applied at its model dose (default 1x). Model dose is a slider value, never a drug dose. */
export function visitSim(p: DemoPatient, v: Visit) {
  return simulate(visitSimInputs(p, v), defaultGeometry);
}

/** Simulated readouts at a visit: that visit's labs mapped to sliders, then each selected therapy applied at its model dose (default 1x). Model dose is a slider value, never a drug dose. */
export function visitReadouts(p: DemoPatient, v: Visit) {
  return metrics(visitSimInputs(p, v));
}

function visitSimInputs(p: DemoPatient, v: Visit) {
  let inputs = profileInputs(visitProfile(p, v));
  for (const id of v.therapies) { const t = therapies.find((x) => x.id === id); if (t) inputs = applyTherapyDose(inputs, t, v.doses?.[id] ?? 1); }
  return inputs;
}

/** Diagnosis at a visit: same rules as the Diagnosis page, run on that visit's values. onlyId pins the projected-flag therapy pick to one therapy, matching the dashboard's Batch therapy choice. */
export function diagnoseVisit(p: DemoPatient, v: Visit, onlyId?: string) {
  if (v.origin === "baseline") return diagnoseProfile(p, 1, onlyId);
  const origin = v.origin === "synthetic" ? "synthetic" as const : "user" as const;
  const origins = Object.fromEntries(patientMetrics.map((m) => [m.key, { origin }]));
  return diagnoseProfile({ ...p, values: v.values, origins }, 1, onlyId);
}

/**
 * Projected MitoSOX and peroxide at a visit: the visit's measured value scaled by
 * the model's change from that visit's labs alone to labs plus its therapies at
 * their model doses. Same scaling as the Simulator and Diagnosis; model estimate,
 * not a measurement. Null when the visit has no therapies.
 */
export function visitProjection(p: DemoPatient, v: Visit) {
  if (!v.therapies.length) return null;
  const before = metrics(profileInputs(visitProfile(p, v)));
  const after = visitReadouts(p, v);
  const ms = projectedMitoSox(v.values.mitosox, before.superoxide, after.superoxide);
  const h2 = v.h2o2Nm === undefined ? null : projectedH2o2(v.h2o2Nm, before.h2o2, after.h2o2);
  const msMeasuredOut = v.values.mitosox < mitoSoxBand.lo || v.values.mitosox > mitoSoxBand.hi;
  const h2MeasuredOut = v.h2o2Nm !== undefined && v.h2o2Nm > h2o2NmBand.hi;
  return { ms, h2, msMeasuredOut, h2MeasuredOut };
}

/**
 * Defences-only superoxide gap at a visit, same comparison as the Dashboard:
 * the healthy adult re-run at the visit's membrane potential, with labile iron
 * and L:P (nadhRatio) held at healthy, so only antioxidant capacity (and through
 * it ROS-induced ROS release) differs. "before" uses the visit's labs alone,
 * "after" applies the visit's therapies at their model doses. Percent vs the
 * matched healthy run; positive means more superoxide than healthy.
 */
export function defencesOnlyGap(p: DemoPatient, v: Visit) {
  const healthyInputs = profileInputs(demoPatients[0]);
  const vi = profileInputs(visitProfile(p, v));
  const matched = (deltaPsi: number, ac: number) =>
    simulate({ ...healthyInputs, deltaPsi, antioxidantCapacity: ac }, defaultGeometry).superoxide;
  const base = matched(vi.deltaPsi, healthyInputs.antioxidantCapacity);
  const before = matched(vi.deltaPsi, vi.antioxidantCapacity);
  let ti = vi;
  for (const id of v.therapies) { const t = therapies.find((x) => x.id === id); if (t) ti = applyTherapyDose(ti, t, v.doses?.[id] ?? 1); }
  const after = v.therapies.length ? matched(ti.deltaPsi, ti.antioxidantCapacity) : null;
  const pct = (a: number) => (base === 0 ? 0 : ((a - base) / base) * 100);
  return { before: pct(before), after: after === null ? null : pct(after) };
}

/**
 * Per-therapy gap corridor over a strength range: for each therapy on the
 * visit, the defences-only gap that therapy alone would give at the low and
 * high ends of the strength range (low first, high second, regardless of
 * which is better). Lets charts shade the gap band the saved strength range
 * covers, therapy by therapy. Other therapies on the visit are left out so
 * each corridor is that therapy's own effect.
 */
export function therapyGapCorridor(p: DemoPatient, v: Visit, lo: number, hi: number): Record<string, [number, number]> {
  const healthyInputs = profileInputs(demoPatients[0]);
  const vi = profileInputs(visitProfile(p, v));
  const matched = (deltaPsi: number, ac: number) =>
    simulate({ ...healthyInputs, deltaPsi, antioxidantCapacity: ac }, defaultGeometry).superoxide;
  const base = matched(vi.deltaPsi, healthyInputs.antioxidantCapacity);
  const pct = (a: number) => (base === 0 ? 0 : ((a - base) / base) * 100);
  const out: Record<string, [number, number]> = {};
  for (const id of v.therapies) {
    const t = therapies.find((x) => x.id === id);
    if (!t) continue;
    const at = (d: number) => { const ti = applyTherapyDose(vi, t, d); return matched(ti.deltaPsi, ti.antioxidantCapacity); };
    const a = pct(at(lo));
    const b = pct(at(hi));
    out[id] = [Math.min(a, b), Math.max(a, b)];
  }
  return out;
}

/**
 * Combined gap corridor for a multi-therapy visit: the defences-only gap all
 * the visit's therapies give together at the low and high ends of the strength
 * range (low first, high second, regardless of which is better). Null for
 * visits with fewer than two therapies, where there is no pair to combine.
 */
export function pairGapCorridor(p: DemoPatient, v: Visit, lo: number, hi: number): [number, number] | null {
  if (v.therapies.length < 2) return null;
  const healthyInputs = profileInputs(demoPatients[0]);
  const vi = profileInputs(visitProfile(p, v));
  const matched = (deltaPsi: number, ac: number) =>
    simulate({ ...healthyInputs, deltaPsi, antioxidantCapacity: ac }, defaultGeometry).superoxide;
  const base = matched(vi.deltaPsi, healthyInputs.antioxidantCapacity);
  const pct = (a: number) => (base === 0 ? 0 : ((a - base) / base) * 100);
  const at = (d: number) => {
    let ti = vi;
    for (const id of v.therapies) { const t = therapies.find((x) => x.id === id); if (t) ti = applyTherapyDose(ti, t, d); }
    return matched(ti.deltaPsi, ti.antioxidantCapacity);
  };
  const a = pct(at(lo));
  const b = pct(at(hi));
  return [Math.min(a, b), Math.max(a, b)];
}

/**
 * Heart check at a visit (Melov 1999 Sod2-null heart: complex I 59%, complex II
 * 24% of normal): the model's Fe-S intact % at the visit's own settings, flagged
 * when it falls inside that band. "after" applies the visit's therapies at their
 * model doses. Profile as-is, not the defences-only matched comparison.
 */
export function heartCheck(p: DemoPatient, v: Visit) {
  const vi = profileInputs(visitProfile(p, v));
  const before = simulate(vi, defaultGeometry).aconitaseActivity;
  let ti = vi;
  for (const id of v.therapies) { const t = therapies.find((x) => x.id === id); if (t) ti = applyTherapyDose(ti, t, v.doses?.[id] ?? 1); }
  const after = v.therapies.length ? simulate(ti, defaultGeometry).aconitaseActivity : null;
  return { before: melovHeartCheck(before), after: after === null ? null : melovHeartCheck(after) };
}
