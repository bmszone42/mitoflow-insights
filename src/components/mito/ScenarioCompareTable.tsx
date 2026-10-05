import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { simulate, defaultInputs, defaultGeometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { listScenarios, scenarioGeometry, scenarioStrength, scenarioStrengthLabel, type Scenario } from "@/lib/mito/scenarios";


/**
 * Saved scenarios recomputed live and compared with a reference run
 * (a patient profile) and with the healthy adult (model defaults).
 * Percentages are vs the reference; the healthy line shows where each
 * scenario falls short of normal levels.
 */
export function ScenarioCompareTable({ referenceLabel, referenceOut, referenceInputs }: { referenceLabel: string; referenceOut: Outputs; referenceInputs?: Inputs }) {
  const [items, setItems] = useState<Scenario[]>([]);
  useEffect(() => {
    listScenarios().then(setItems).catch(() => setItems([]));
  }, []);

  const healthyOut = useMemo(() => simulate(defaultInputs, defaultGeometry), []);

  // When the reference already IS the healthy adult, the extra row would duplicate it.
  const sameAsHealthy =
    Math.abs(referenceOut.superoxide - healthyOut.superoxide) < 1e-9 && Math.abs(referenceOut.atpFlux - healthyOut.atpFlux) < 1e-6;

  const pct = (v: number, base: number, label: string) =>
    base === 0 ? "" : `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}% ${label}`;

  // Defences-only gap: same matched-healthy comparison as the Dashboard and
  // Timeline. Healthy defaults are re-run at the scenario's own membrane
  // potential (iron and L:P held at healthy) with healthy vs the scenario's
  // antioxidant capacity, so only defences and ROS-induced release show.
  const defencesGap = (s: Scenario) => {
    const geo = scenarioGeometry(s);
    const matched = (ac: number) =>
      simulate({ ...defaultInputs, deltaPsi: s.inputs.deltaPsi, antioxidantCapacity: ac }, geo).superoxide;
    const base = matched(defaultInputs.antioxidantCapacity);
    const val = matched(s.inputs.antioxidantCapacity);
    return base === 0 ? 0 : ((val - base) / base) * 100;
  };
  const gapText = (g: number) => `${g >= 0 ? "+" : ""}${g.toFixed(0)}%`;

  // CSV mirrors the table above and carries the same fields as the JSON export
  // summary (id, name, ROS-induced strength + whether it was noted, preset,
  // readouts, updatedAt), so tuned scenarios can be shared as a flat file.
  const downloadCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push("Row type,Scenario,Superoxide (nM),Superoxide vs healthy (%),Superoxide vs profile (%),ATP (uM/s),ATP vs healthy (%),ATP vs profile (%),Free iron (uM),Free iron vs healthy (%),Free iron vs profile (%),Peroxide (nM),Peroxide vs healthy (%),Peroxide vs profile (%),Defences-only gap (%),ROS-induced strength,Strength noted,Preset,Scenario ID,Updated");
    const pctOnly = (v: number, base: number) => (base === 0 ? "" : `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}%`);
    const row = (cells: (string | number)[]) => lines.push(cells.map((c) => esc(String(c))).join(","));
    row(["healthy reference", "Healthy adult (model)", healthyOut.superoxide.toFixed(4), "", "", healthyOut.atpFlux.toFixed(1), "", "", healthyOut.freeIron.toFixed(2), "", "", healthyOut.hydrogenPeroxide.toFixed(1), "", "", "0%", "model defaults", "", "", "", ""]);
    row(["reference profile", `${referenceLabel} (reference)`, referenceOut.superoxide.toFixed(4), "", "", referenceOut.atpFlux.toFixed(1), "", "", referenceOut.freeIron.toFixed(2), "", "", referenceOut.hydrogenPeroxide.toFixed(1), "", "", "", "profile settings", "", "", "", ""]);
    for (const s of items) {
      const o = simulate(s.inputs, scenarioGeometry(s));
      const strength = scenarioStrength(s);
      row([
        "scenario", s.name,
        o.superoxide.toFixed(4), pctOnly(o.superoxide, healthyOut.superoxide), pctOnly(o.superoxide, referenceOut.superoxide),
        o.atpFlux.toFixed(1), pctOnly(o.atpFlux, healthyOut.atpFlux), pctOnly(o.atpFlux, referenceOut.atpFlux),
        o.freeIron.toFixed(2), pctOnly(o.freeIron, healthyOut.freeIron), pctOnly(o.freeIron, referenceOut.freeIron),
        o.hydrogenPeroxide.toFixed(1), pctOnly(o.hydrogenPeroxide, healthyOut.hydrogenPeroxide), pctOnly(o.hydrogenPeroxide, referenceOut.hydrogenPeroxide),
        gapText(defencesGap(s)),
        scenarioStrengthLabel(s), strength == null ? "no" : "yes", s.preset ?? "", s.id, new Date(s.updatedAt).toISOString(),
      ]);
    }
    lines.push("");
    lines.push(esc("Readouts recomputed live with the current model from each scenario's own saved settings, not the saved snapshot. 'vs healthy' compares with the healthy adult's simulated values (model defaults); 'vs profile' compares with the reference profile's simulated values, not lab measurements. ROS-induced strength is the assumed setting each scenario was run at; 'not noted' means it was saved before the setting existed. Model estimates, not a diagnosis. Generated by Cristae Lab."));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cristae-lab-scenario-compare.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (

    <div className="overflow-x-auto" data-testid="scenario-profile-compare">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1 font-normal">Scenario</th>
            <th className="font-normal">Superoxide (nM)</th>
            <th className="font-normal">ATP (µM/s)</th>
            <th className="font-normal">Free iron (µM)</th>
            <th className="font-normal">Peroxide (nM)</th>
            <th className="font-normal">Defences only</th>
            <th className="font-normal">ROS-induced strength (partly published)</th>
          </tr>
        </thead>
        <tbody>
          {!sameAsHealthy && (
            <tr className="border-t border-border" data-testid="spc-healthy">
              <td className="py-1 pr-2 font-medium">Healthy adult (model)</td>
              <td>{healthyOut.superoxide.toFixed(4)}</td>
              <td>{healthyOut.atpFlux.toFixed(1)}</td>
              <td>{healthyOut.freeIron.toFixed(2)}</td>
              <td>{healthyOut.hydrogenPeroxide.toFixed(1)}</td>
              <td className="text-primary">0%</td>
              <td className="text-muted-foreground">model defaults</td>
            </tr>
          )}
          <tr className="border-t border-border" data-testid="spc-reference">
            <td className="py-1 pr-2 font-medium">{referenceLabel} (reference)</td>
            <td>{referenceOut.superoxide.toFixed(4)}</td>
            <td>{referenceOut.atpFlux.toFixed(1)}</td>
            <td>{referenceOut.freeIron.toFixed(2)}</td>
            <td>{referenceOut.hydrogenPeroxide.toFixed(1)}</td>
            <td className="text-muted-foreground">—</td>
            <td className="text-muted-foreground">profile settings</td>
          </tr>
          {items.map((s) => {
            const o = simulate(s.inputs, scenarioGeometry(s));
            const vsHealthy = pct(o.superoxide, healthyOut.superoxide, "vs healthy");
            const vsProfile = pct(o.superoxide, referenceOut.superoxide, "vs profile");
            return (
              <tr key={s.id} className="border-t border-border" data-testid="spc-row">
                <td className="py-1 pr-2 font-medium">{s.name}</td>
                <td>
                  {o.superoxide.toFixed(4)}
                  <div
                    className={`text-[10px] ${o.superoxide > healthyOut.superoxide ? "text-destructive" : "text-primary"}`}
                    data-testid="spc-vs-healthy-so"
                  >
                    {vsHealthy}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{vsProfile}</div>
                </td>
                <td>
                  {o.atpFlux.toFixed(1)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.atpFlux, healthyOut.atpFlux, "vs healthy")}</div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.atpFlux, referenceOut.atpFlux, "vs profile")}</div>
                </td>
                <td>
                  {o.freeIron.toFixed(2)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.freeIron, healthyOut.freeIron, "vs healthy")}</div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.freeIron, referenceOut.freeIron, "vs profile")}</div>
                </td>
                <td>
                  {o.hydrogenPeroxide.toFixed(1)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.hydrogenPeroxide, healthyOut.hydrogenPeroxide, "vs healthy")}</div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.hydrogenPeroxide, referenceOut.hydrogenPeroxide, "vs profile")}</div>
                </td>
                <td className={defencesGap(s) > 0 ? "text-destructive" : "text-primary"} data-testid="spc-defences-gap">
                  {gapText(defencesGap(s))}
                </td>
                <td className="text-muted-foreground">{scenarioStrengthLabel(s)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">No saved scenarios yet. Save one on the Simulator to compare it here.</p>
      )}
      {items.length > 0 && (
        <Button size="sm" variant="outline" className="mt-2" data-testid="spc-csv" onClick={downloadCsv}>
          Download CSV
        </Button>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Scenarios are recomputed with the current model from their own saved settings, not the saved snapshot. "vs healthy" compares with the
        healthy adult's simulated values (model defaults); "vs profile" compares with {referenceLabel}'s simulated values, not lab measurements.
        Model estimates only.
      </p>

    </div>
  );
}
