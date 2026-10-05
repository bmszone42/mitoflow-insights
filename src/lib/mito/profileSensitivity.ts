import { demoPatients, type DemoPatient } from "@/lib/mito/patientReference";
import { profileInputs } from "@/lib/mito/treatment";
import { inputRanges, simulate, type Geometry, type Inputs } from "@/lib/mito/model";

export const profileSensKeys = ["rirrStrength", "mitoHalfLife", "antioxidantCapacity", "labileIron", "deltaPsi"] as const;
export type ProfileSensKey = (typeof profileSensKeys)[number];
export const profileSensOutputs = [
  { key: "superoxide", label: "Superoxide" },
  { key: "atpFlux", label: "ATP" },
  { key: "freeIron", label: "Free iron" },
] as const;
export type ProfileSensOut = (typeof profileSensOutputs)[number]["key"];
export const shortLabel: Record<ProfileSensKey, string> = {
  rirrStrength: "ROS-induced ROS release (partly published)",
  mitoHalfLife: "Turnover half-life",
  antioxidantCapacity: "Antioxidant capacity",
  labileIron: "Labile iron",
  deltaPsi: "Membrane potential",
};

type Pct = Record<ProfileSensOut, number>;
export interface ProfileSensRow {
  patient: DemoPatient;
  base: Record<ProfileSensOut, number>;
  effects: Record<ProfileSensKey, { down: Pct; up: Pct }>;
  dominant: ProfileSensKey;
}

const pick = (i: Inputs, geo: Geometry) => {
  const o = simulate(i, geo);
  return { superoxide: o.superoxide, atpFlux: o.atpFlux, freeIron: o.freeIron };
};
const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);

/** One-at-a-time nudge of each setting on each profile's own baseline. Effects do not add. */
export function profileSensitivity(geo: Geometry, delta: number, patients = demoPatients): ProfileSensRow[] {
  return patients.map((p) => {
    const b = profileInputs(p);
    const base = pick(b, geo);
    const effects = {} as ProfileSensRow["effects"];
    for (const k of profileSensKeys) {
      const r = inputRanges[k];
      const step = (r.max - r.min) * delta;
      const run = (v: number) => {
        const o = pick({ ...b, [k]: Math.min(r.max, Math.max(r.min, v)) }, geo);
        return { superoxide: pct(o.superoxide, base.superoxide), atpFlux: pct(o.atpFlux, base.atpFlux), freeIron: pct(o.freeIron, base.freeIron) };
      };
      effects[k] = { down: run(b[k] - step), up: run(b[k] + step) };
    }
    const swing = (k: ProfileSensKey) => Math.abs(effects[k].up.superoxide - effects[k].down.superoxide);
    const dominant = [...profileSensKeys].sort((x, y) => swing(y) - swing(x))[0]!;
    return { patient: p, base, effects, dominant };
  });
}

/** Superoxide across each setting's full range (x = 0-100% of range) for one profile. */
export function profileSweep(p: DemoPatient, geo: Geometry, n = 21) {
  const b = profileInputs(p);
  return Array.from({ length: n }, (_, j) => {
    const f = j / (n - 1);
    const row: Record<string, number> = { x: f * 100 };
    for (const k of profileSensKeys) {
      const r = inputRanges[k];
      row[k] = simulate({ ...b, [k]: r.min + f * (r.max - r.min) }, geo).superoxide;
    }
    return row;
  });
}

export function profileSensCsv(rows: ProfileSensRow[], delta: number): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [
    `Cristae Lab profile sensitivity (step +/-${(delta * 100).toFixed(0)}% of range; model estimates; one setting at a time; effects do not add)`,
    "profile,phenotype,setting,output,baseline,down_pct,up_pct,dominant_superoxide_setting",
  ];
  for (const r of rows)
    for (const k of profileSensKeys)
      for (const o of profileSensOutputs)
        lines.push([esc(r.patient.label), esc(r.patient.phenotype), esc(shortLabel[k]), o.label, Number(r.base[o.key].toPrecision(6)), r.effects[k].down[o.key].toFixed(3), r.effects[k].up[o.key].toFixed(3), esc(shortLabel[r.dominant])].join(","));
  return lines.join("\n");
}
