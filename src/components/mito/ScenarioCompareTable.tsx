import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { simulate, defaultInputs, defaultGeometry, type Outputs } from "@/lib/mito/model";
import { listScenarios, scenarioGeometry, scenarioStrength, scenarioStrengthLabel, type Scenario } from "@/lib/mito/scenarios";


/**
 * Saved scenarios recomputed live and compared with a reference run
 * (a patient profile) and with the healthy adult (model defaults).
 * Percentages are vs the reference; the healthy line shows where each
 * scenario falls short of normal levels.
 */
export function ScenarioCompareTable({ referenceLabel, referenceOut }: { referenceLabel: string; referenceOut: Outputs }) {
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
              <td className="text-muted-foreground">model defaults</td>
            </tr>
          )}
          <tr className="border-t border-border" data-testid="spc-reference">
            <td className="py-1 pr-2 font-medium">{referenceLabel} (reference)</td>
            <td>{referenceOut.superoxide.toFixed(4)}</td>
            <td>{referenceOut.atpFlux.toFixed(1)}</td>
            <td>{referenceOut.freeIron.toFixed(2)}</td>
            <td>{referenceOut.hydrogenPeroxide.toFixed(1)}</td>
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
                <td className="text-muted-foreground">{scenarioStrengthLabel(s)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">No saved scenarios yet. Save one on the Simulator to compare it here.</p>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Scenarios are recomputed with the current model from their own saved settings, not the saved snapshot. "vs healthy" compares with the
        healthy adult's simulated values (model defaults); "vs profile" compares with {referenceLabel}'s simulated values, not lab measurements.
        Model estimates only.
      </p>
    </div>
  );
}
