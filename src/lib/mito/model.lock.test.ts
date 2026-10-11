// Locks today's model results. If a science change shifts any number, this
// test fails and the snapshot diff shows exactly what moved. When the change
// is intended, accept it with: bunx vitest run -u
import { describe, expect, it } from "vitest";
import { simulate, defaultInputs, defaultGeometry, inputRanges, timeCourse, type Inputs } from "./model";
import { diagnoseAll } from "./diagnosis";

const round = (v: unknown): unknown => {
  if (typeof v === "number") return Number.isFinite(v) ? Number(v.toPrecision(6)) : String(v);
  if (Array.isArray(v)) return v.map(round);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)]));
  return v;
};

describe("model lock", () => {
  it("default simulation", () => {
    expect(round(simulate(defaultInputs, defaultGeometry))).toMatchSnapshot();
  });

  it("each input at its min and max", () => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(inputRanges) as (keyof Inputs)[]) {
      const r = inputRanges[k];
      out[`${k}@min`] = round(simulate({ ...defaultInputs, [k]: r.min }, defaultGeometry));
      out[`${k}@max`] = round(simulate({ ...defaultInputs, [k]: r.max }, defaultGeometry));
    }
    expect(out).toMatchSnapshot();
  });

  it("48 h time course", () => {
    expect(round(timeCourse(defaultInputs, 48, 12))).toMatchSnapshot();
  });

  it("every demo profile's flags and fit at 1x", () => {
    const rows = diagnoseAll([], 1).map((d) => ({
      id: d.patient.id,
      fit: d.fit,
      top: d.top?.mechanism ?? null,
      flags: [...d.patientFlags, ...d.rosAssayFlags, ...d.atpAssayFlags, ...d.modelFlags, ...d.therapyFlags, ...d.projectedFlags].map((f) => `${f.label} | ${f.detail}`),
    }));
    expect(rows).toMatchSnapshot();
  });
});
