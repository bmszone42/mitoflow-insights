import { useEffect, useState } from "react";
import { simulate, type Outputs } from "@/lib/mito/model";
import { listScenarios, scenarioGeometry, scenarioStrengthLabel, type Scenario } from "@/lib/mito/scenarios";

/**
 * Saved scenarios recomputed live and compared with a reference run
 * (a patient profile or the healthy adult). Percentages are vs the reference.
 */
export function ScenarioCompareTable({ referenceLabel, referenceOut }: { referenceLabel: string; referenceOut: Outputs }) {
  const [items, setItems] = useState<Scenario[]>([]);
  useEffect(() => {
    listScenarios().then(setItems).catch(() => setItems([]));
  }, []);

  const pct = (v: number, base: number) =>
    base === 0 ? "" : `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}% vs profile`;

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
            return (
              <tr key={s.id} className="border-t border-border" data-testid="spc-row">
                <td className="py-1 pr-2 font-medium">{s.name}</td>
                <td>
                  {o.superoxide.toFixed(4)}
                  <div className={`text-[10px] ${o.superoxide > referenceOut.superoxide ? "text-destructive" : "text-primary"}`}>
                    {pct(o.superoxide, referenceOut.superoxide)}
                  </div>
                </td>
                <td>
                  {o.atpFlux.toFixed(1)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.atpFlux, referenceOut.atpFlux)}</div>
                </td>
                <td>
                  {o.freeIron.toFixed(2)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.freeIron, referenceOut.freeIron)}</div>
                </td>
                <td>
                  {o.hydrogenPeroxide.toFixed(1)}
                  <div className="text-[10px] text-muted-foreground">{pct(o.hydrogenPeroxide, referenceOut.hydrogenPeroxide)}</div>
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
        Scenarios are recomputed with the current model from their own saved settings, not the saved snapshot. Percentages compare with the
        reference profile's simulated values, not its lab measurements. Model estimates only.
      </p>
    </div>
  );
}
