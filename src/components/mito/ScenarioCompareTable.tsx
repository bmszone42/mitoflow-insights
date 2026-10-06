import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { simulate, defaultInputs, defaultGeometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { defencesGapFromInputs, DEFAULT_RIRR_STRENGTH, listScenarios, scenarioDefencesGap, scenarioGeometry, scenarioStrength, scenarioStrengthLabel, scenarioStrengthSource, type Scenario } from "@/lib/mito/scenarios";
import { useStrengthRange } from "@/lib/mito/rangeState";

// The gap bar chart is lazy-loaded so recharts stays out of the Dashboard and
// Diagnosis bundles, exactly like the other chart modules.
const ScenarioGapChart = lazy(() => import("./ScenarioGapChart").then((m) => ({ default: m.ScenarioGapChart })));


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

  // Strength band shared with the Strength range check sliders, the Strength
  // history chart and the Recalibrate curve: a row reads green when the
  // strength it was run at sits inside the band and red when outside, the same
  // rule that colors the history dots.
  const [range] = useStrengthRange();
  const rowStrength = (s: Scenario) => scenarioStrength(s) ?? DEFAULT_RIRR_STRENGTH;
  const inBand = (v: number) => v >= range.lo && v <= range.hi;
  const rowTone = (v: number) =>
    inBand(v)
      ? "border-l-2 border-l-primary bg-primary/5"
      : "border-l-2 border-l-destructive bg-destructive/5";
  const strengthTone = (v: number) => (inBand(v) ? "text-primary" : "text-destructive");
  // The reference row is run from the profile's own inputs, which already carry
  // its own or the saved default strength; the healthy row uses model defaults.
  const referenceStrength = referenceInputs?.rirrStrength ?? defaultInputs.rirrStrength;

  // When the reference already IS the healthy adult, the extra row would duplicate it.
  const sameAsHealthy =
    Math.abs(referenceOut.superoxide - healthyOut.superoxide) < 1e-9 && Math.abs(referenceOut.atpFlux - healthyOut.atpFlux) < 1e-6;

  const pct = (v: number, base: number, label: string) =>
    base === 0 ? "" : `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}% ${label}`;

  // Defences-only gap: shared helper in scenarios.ts (same matched-healthy
  // comparison as the Dashboard and Timeline, and the same numbers the JSON
  // export summary carries).
  const defencesGap = (s: Scenario) => scenarioDefencesGap(s);
  const gapText = (g: number) => `${g >= 0 ? "+" : ""}${g.toFixed(0)}%`;

  // Same matched-healthy gap for the reference profile itself, from its inputs.
  const referenceGap = useMemo(
    () => (referenceInputs ? defencesGapFromInputs(referenceInputs) : null),
    [referenceInputs]
  );

  // Bars for the chart below: every saved scenario plus the reference profile,
  // each with its own defences-only gap. The chart sorts weakest first itself,
  // so this list stays in saved order.
  const gapRows = useMemo(
    () => [
      ...(referenceGap === null ? [] : [{ name: `${referenceLabel} (reference)`, gap: referenceGap, kind: "reference" as const }]),
      ...items.map((s) => ({ name: s.name, gap: scenarioDefencesGap(s), kind: "scenario" as const })),
    ],
    [items, referenceGap, referenceLabel]
  );

  // Scenario rows sorted by the picked key, worst first: defences gap (weakest
  // defences at the top), superoxide (highest at the top) or last updated
  // (newest at the top). Ties keep the saved order; healthy and reference rows
  // stay pinned above.
  const [sortKey, setSortKey] = useState<"gap" | "superoxide" | "updated">("gap");
  const [sourceFilter, setSourceFilter] = useState<"all" | "default" | "profile">("all");
  const sortedItems = useMemo(
    () =>
      items
        .filter((s) => {
          if (sourceFilter === "all") return true;
          const src = scenarioStrengthSource(s).toLowerCase();
          return sourceFilter === "default" ? src.includes("saved default") : src.includes("profile's own");
        })
        .map((s) => ({ s, gap: defencesGap(s), so: simulate(s.inputs, scenarioGeometry(s)).superoxide }))
        .sort((a, b) =>
          sortKey === "gap" ? b.gap - a.gap : sortKey === "superoxide" ? b.so - a.so : b.s.updatedAt - a.s.updatedAt
        )
        .map((r) => r.s),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, sortKey, sourceFilter]
  );
  // Counted over the rows actually shown, so the source filter changes it too.
  const insideCount = sortedItems.filter((s) => inBand(rowStrength(s))).length;

  // CSV mirrors the table above and carries the same fields as the JSON export
  // summary (id, name, ROS-induced strength + whether it was noted, preset,
  // readouts, updatedAt), so tuned scenarios can be shared as a flat file.
  const downloadCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push("Row type,Scenario,Superoxide (nM),Superoxide vs healthy (%),Superoxide vs profile (%),ATP (uM/s),ATP vs healthy (%),ATP vs profile (%),Free iron (uM),Free iron vs healthy (%),Free iron vs profile (%),Peroxide (nM),Peroxide vs healthy (%),Peroxide vs profile (%),Defences-only gap (%),ROS-induced strength,Strength noted,Strength source,Preset,Scenario ID,Updated");
    const pctOnly = (v: number, base: number) => (base === 0 ? "" : `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}%`);
    const row = (cells: (string | number)[]) => lines.push(cells.map((c) => esc(String(c))).join(","));
    row(["healthy reference", "Healthy adult (model)", healthyOut.superoxide.toFixed(4), "", "", healthyOut.atpFlux.toFixed(1), "", "", healthyOut.freeIron.toFixed(2), "", "", healthyOut.hydrogenPeroxide.toFixed(1), "", "", "0%", "model defaults", "", "model defaults", "", "", ""]);
    row(["reference profile", `${referenceLabel} (reference)`, referenceOut.superoxide.toFixed(4), "", "", referenceOut.atpFlux.toFixed(1), "", "", referenceOut.freeIron.toFixed(2), "", "", referenceOut.hydrogenPeroxide.toFixed(1), "", "", referenceGap === null ? "" : gapText(referenceGap), "profile settings", "", "profile settings", "", "", ""]);
    for (const s of sortedItems) {
      const o = simulate(s.inputs, scenarioGeometry(s));
      const strength = scenarioStrength(s);
      row([
        "scenario", s.name,
        o.superoxide.toFixed(4), pctOnly(o.superoxide, healthyOut.superoxide), pctOnly(o.superoxide, referenceOut.superoxide),
        o.atpFlux.toFixed(1), pctOnly(o.atpFlux, healthyOut.atpFlux), pctOnly(o.atpFlux, referenceOut.atpFlux),
        o.freeIron.toFixed(2), pctOnly(o.freeIron, healthyOut.freeIron), pctOnly(o.freeIron, referenceOut.freeIron),
        o.hydrogenPeroxide.toFixed(1), pctOnly(o.hydrogenPeroxide, healthyOut.hydrogenPeroxide), pctOnly(o.hydrogenPeroxide, referenceOut.hydrogenPeroxide),
        gapText(defencesGap(s)),
        scenarioStrengthLabel(s), strength == null ? "no" : "yes", scenarioStrengthSource(s), s.preset ?? "", s.id, new Date(s.updatedAt).toISOString(),
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
      <div className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Sort by</span>
        {(
          [
            { key: "gap", label: "Defences gap", test: "spc-sort-gap" },
            { key: "superoxide", label: "Superoxide", test: "spc-sort-superoxide" },
            { key: "updated", label: "Last updated", test: "spc-sort-updated" },
          ] as const
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            data-testid={o.test}
            aria-pressed={sortKey === o.key}
            onClick={() => setSortKey(o.key)}
            className={`rounded-full border px-2 py-0.5 transition-colors ${
              sortKey === o.key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-3">Strength source</span>
        {(
          [
            { key: "all", label: "All" },
            { key: "default", label: "Saved default" },
            { key: "profile", label: "Profile's own" },
          ] as const
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            data-testid={`spc-src-${o.key}`}
            aria-pressed={sourceFilter === o.key}
            onClick={() => setSourceFilter(o.key)}
            className={`rounded-full border px-2 py-0.5 transition-colors ${
              sourceFilter === o.key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {items.length > 0 && (
        <p className="mb-1 text-[10px] text-muted-foreground" data-testid="spc-band-count">
          {insideCount} of {sortedItems.length} scenarios inside the band ({range.lo.toFixed(2)}x-{range.hi.toFixed(2)}x), {sortedItems.length - insideCount} outside.
          Rows are green inside the band and red outside, judged by the strength each row was run at.
        </p>
      )}
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
            <th className="font-normal">Strength source</th>
          </tr>
        </thead>
        <tbody>
          {!sameAsHealthy && (
            <tr className={`border-t border-border ${rowTone(defaultInputs.rirrStrength)}`} data-testid="spc-healthy" data-strength={defaultInputs.rirrStrength} data-in-band={inBand(defaultInputs.rirrStrength) ? "yes" : "no"}>
              <td className="py-1 pr-2 font-medium">Healthy adult (model)</td>
              <td>{healthyOut.superoxide.toFixed(4)}</td>
              <td>{healthyOut.atpFlux.toFixed(1)}</td>
              <td>{healthyOut.freeIron.toFixed(2)}</td>
              <td>{healthyOut.hydrogenPeroxide.toFixed(1)}</td>
              <td className="text-primary">0%</td>
              <td className={strengthTone(defaultInputs.rirrStrength)}>model defaults ({defaultInputs.rirrStrength}x)</td>
            </tr>
          )}
          <tr className={`border-t border-border ${rowTone(referenceStrength)}`} data-testid="spc-reference" data-strength={referenceStrength} data-in-band={inBand(referenceStrength) ? "yes" : "no"}>
            <td className="py-1 pr-2 font-medium">{referenceLabel} (reference)</td>
            <td>{referenceOut.superoxide.toFixed(4)}</td>
            <td>{referenceOut.atpFlux.toFixed(1)}</td>
            <td>{referenceOut.freeIron.toFixed(2)}</td>
            <td>{referenceOut.hydrogenPeroxide.toFixed(1)}</td>
            <td className={referenceGap !== null && referenceGap > 0 ? "text-destructive" : "text-primary"} data-testid="spc-reference-gap">
              {referenceGap === null ? "—" : gapText(referenceGap)}
            </td>
            <td className={strengthTone(referenceStrength)} data-testid="spc-reference-strength">profile settings ({referenceStrength}x)</td>
          </tr>
          {sortedItems.map((s) => {
            const o = simulate(s.inputs, scenarioGeometry(s));
            const vsHealthy = pct(o.superoxide, healthyOut.superoxide, "vs healthy");
            const vsProfile = pct(o.superoxide, referenceOut.superoxide, "vs profile");
            return (
              <tr
                key={s.id}
                className={`border-t border-border ${rowTone(rowStrength(s))}`}
                data-testid="spc-row"
                data-strength={rowStrength(s)}
                data-in-band={inBand(rowStrength(s)) ? "yes" : "no"}
              >
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
                  {/* ATP is good: red when BELOW the healthy level, green at or above */}
                  <div
                    className={`text-[10px] ${o.atpFlux < healthyOut.atpFlux ? "text-destructive" : "text-primary"}`}
                    data-testid="spc-vs-healthy-atp"
                  >
                    {pct(o.atpFlux, healthyOut.atpFlux, "vs healthy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.atpFlux, referenceOut.atpFlux, "vs profile")}</div>
                </td>
                <td>
                  {o.freeIron.toFixed(2)}
                  <div
                    className={`text-[10px] ${o.freeIron > healthyOut.freeIron ? "text-destructive" : "text-primary"}`}
                    data-testid="spc-vs-healthy-fe"
                  >
                    {pct(o.freeIron, healthyOut.freeIron, "vs healthy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.freeIron, referenceOut.freeIron, "vs profile")}</div>
                </td>
                <td>
                  {o.hydrogenPeroxide.toFixed(1)}
                  <div
                    className={`text-[10px] ${o.hydrogenPeroxide > healthyOut.hydrogenPeroxide ? "text-destructive" : "text-primary"}`}
                    data-testid="spc-vs-healthy-h2o2"
                  >
                    {pct(o.hydrogenPeroxide, healthyOut.hydrogenPeroxide, "vs healthy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{pct(o.hydrogenPeroxide, referenceOut.hydrogenPeroxide, "vs profile")}</div>
                </td>
                <td className={defencesGap(s) > 0 ? "text-destructive" : "text-primary"} data-testid="spc-defences-gap">
                  {gapText(defencesGap(s))}
                </td>
                <td className={strengthTone(rowStrength(s))} data-testid="spc-row-strength">{scenarioStrengthLabel(s)}</td>
                <td className="text-muted-foreground" data-testid="spc-strength-source">{scenarioStrengthSource(s)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">No saved scenarios yet. Save one on the Simulator to compare it here.</p>
      )}
      {items.length > 0 && (
        <Suspense fallback={<div className="mt-3 h-48 animate-pulse rounded-md bg-secondary/40" />}>
          <ScenarioGapChart rows={gapRows} />
        </Suspense>
      )}
      {items.length > 0 && (
        <Button size="sm" variant="outline" className="mt-2" data-testid="spc-csv" onClick={downloadCsv}>
          Download CSV
        </Button>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        Sorted by the picked key, worst first: defences gap (weakest defences first), superoxide (highest first) or last updated (newest first).
        Scenarios are recomputed with the current model from their own saved settings,
        not the saved snapshot. "vs healthy" compares with the
        healthy adult's simulated values (model defaults), colored red when the value is worse than normal
        (higher superoxide, free iron or peroxide, lower ATP) and green at or better; "vs profile" compares with {referenceLabel}'s simulated values, not lab measurements.
        Row tint follows the saved strength band: green when the strength that row was run at is inside the band, red when outside, the same rule as the Strength history chart dots.
        Model estimates only.
      </p>

    </div>
  );
}
