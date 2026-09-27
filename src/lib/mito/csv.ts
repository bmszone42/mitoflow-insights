import {
  grid2d,
  inputRanges,
  sensitivity,
  sensOutputs,
  sweep,
  type Inputs,
} from "@/lib/mito/model";

const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const num = (v: number) => Number(v.toPrecision(6));

/** Build a multi-section CSV report of everything shown in the Sensitivity tab. */
export function sensitivityCsv(
  inputs: Inputs,
  delta: number,
  sweepKey: keyof Inputs,
  lightKey: "redDose" | "nirDose",
): string {
  const lines: string[] = [];

  lines.push("Cristae Lab sensitivity report");
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");

  lines.push("Baseline inputs");
  lines.push("input,value,unit");
  for (const [k, r] of Object.entries(inputRanges)) {
    lines.push(`${esc(r.label)},${num(inputs[k as keyof Inputs])},${esc(r.unit)}`);
  }
  lines.push("");

  lines.push(`Sensitivity table (step +/-${(delta * 100).toFixed(0)}% of range, percent change)`);
  lines.push("driver,group,output,down_pct,up_pct");
  for (const s of sensitivity(inputs, delta)) {
    for (const o of sensOutputs) {
      lines.push(
        `${esc(s.driver.label)},${esc(s.driver.group)},${esc(o.label)},${num(s.down[o.key])},${num(s.up[o.key])}`,
      );
    }
  }
  lines.push("");

  const sw = sweep(inputs, sweepKey);
  lines.push(`Sweep: ${esc(inputRanges[sweepKey].label)} across full range`);
  lines.push(["driver_value", ...sensOutputs.map((o) => esc(o.label))].join(","));
  for (const row of sw) {
    lines.push([num(row["x"] ?? 0), ...sensOutputs.map((o) => num(row[o.key] ?? 0))].join(","));
  }
  lines.push("");

  const g = grid2d(inputs, "labileIron", lightKey);
  lines.push(`Interaction map: labile iron x ${esc(g.dy.label)}`);
  lines.push(["labile_iron_uM", "light_dose_J_per_cm2", ...sensOutputs.map((o) => esc(o.label))].join(","));
  for (const row of g.cells) {
    for (const c of row) {
      lines.push(
        [num(c["x"] ?? 0), num(c["y"] ?? 0), ...sensOutputs.map((o) => num(c[o.key] ?? 0))].join(","),
      );
    }
  }
  lines.push("");

  return lines.join("\n");
}
