import { defaultInputs, simulate, type Geometry, type Inputs } from "./model";
import { ATP_COST_TEXTBOOK, atpCostFlagCause, atpFlagContext, atpNetworkRangeFlags, effectiveAtpCost, etcSteps, poRatio, STD_PSI, STD_UNCOUPLING } from "./reference";
import { rosAssayFlag, rosDriverAttributions, rosFlagPercent, rosInputNames, rosSourceRows, type RosAssayMetric } from "./rosPhysiology";

export type InterpretationProfile = { id: string; label: string; values: Record<RosAssayMetric | "membranePotential", number> };

export type RankedCause = {
  key: keyof Inputs; name: string; from: number; to: number;
  score: number; atpScore: number; rosScore: number;
  atpSteps: string[]; rosSources: { label: string; delta: number; direct: boolean }[];
};

const fmt = (v: number) => (v === 0 ? "0" : Number(v.toPrecision(3)).toString());

// Deterministic narrative built only from existing model flags and
// leave-one-input-out effects. Scores are normalized to each flag threshold
// (ATP: cited cost band width; ROS: ±25% of comparison rate) so they rank
// together; they are not probabilities and do not add.
export function buildInterpretation(inputs: Inputs, geo: Geometry, profile?: InterpretationProfile, healthy?: InterpretationProfile) {
  const comparisonInputs: Inputs = profile ? { ...defaultInputs, deltaPsi: profile.values.membranePotential } : defaultInputs;
  const out = simulate(inputs, geo);
  const baseline = simulate(comparisonInputs, geo);
  const stdCost = effectiveAtpCost(STD_PSI, STD_UNCOUPLING);
  const cost = effectiveAtpCost(inputs.deltaPsi, inputs.uncoupling);
  const context = atpFlagContext(inputs.deltaPsi, inputs.uncoupling);
  const band = ATP_COST_TEXTBOOK.hi - ATP_COST_TEXTBOOK.lo;

  const atpSteps = etcSteps.map((step) => {
    const flags = atpNetworkRangeFlags(step, stdCost, cost);
    return { step: step.step, flagged: flags.evOutside || flags.costBOutside, evOutside: flags.evOutside, costOutside: flags.costBOutside, cause: flags.costBOutside ? atpCostFlagCause(step, context) : null };
  });
  const atpFlagged = atpSteps.filter((s) => s.flagged);
  const costFlagged = atpFlagged.filter((s) => s.costOutside);

  const rows = rosSourceRows(out, baseline, inputs, comparisonInputs);
  const attributions = rosDriverAttributions(rows, inputs, comparisonInputs, geo);
  const assays = rows.map((row) => (profile && healthy ? rosAssayFlag(row.species, profile.values, healthy.values) : null));
  const rosFlagged = rows.map((row, i) => ({ row, effects: attributions[i] ?? [], assay: assays[i] })).filter((x) => x.row.flagged);

  const changed = (Object.keys(comparisonInputs) as (keyof Inputs)[]).filter((k) => inputs[k] !== comparisonInputs[k]);
  const causes: RankedCause[] = changed.map((key) => {
    let atpScore = 0;
    const steps: string[] = [];
    if ((key === "deltaPsi" || key === "uncoupling") && costFlagged.length) {
      const reset = { ...inputs, [key]: defaultInputs[key] };
      const dCost = Math.abs(cost - effectiveAtpCost(reset.deltaPsi, reset.uncoupling));
      atpScore = (dCost / band) * costFlagged.length;
      if (dCost > 1e-9) steps.push(...costFlagged.map((s) => s.step));
    }
    const sources = rosFlagged.flatMap(({ row, effects }) => effects.filter((e) => e.key === key).map((e) => ({ label: row.label, delta: e.delta, direct: e.direct, base: row.base })));
    const rosScore = sources.reduce((sum, s) => sum + (s.base > 0 ? Math.abs(s.delta) / (s.base * rosFlagPercent / 100) : 1), 0);
    return { key, name: rosInputNames[key], from: comparisonInputs[key], to: inputs[key], score: atpScore + rosScore, atpScore, rosScore, atpSteps: steps, rosSources: sources.map(({ label, delta, direct }) => ({ label, delta, direct })) };
  }).filter((c) => c.score > 0).sort((a, b) => b.score - a.score);

  const fixedDrops = atpFlagged.filter((s) => s.evOutside).map((s) => s.step);
  const poNadh = poRatio(inputs.deltaPsi, inputs.uncoupling, "nadh");
  const poStd = poRatio(STD_PSI, STD_UNCOUPLING, "nadh");
  const comparisonName = profile ? `${profile.label} simulated comparison` : "simulated default";

  const summary = !atpFlagged.length && !rosFlagged.length
    ? `No ATP step or ROS source is flagged against the ${comparisonName}. There is nothing to explain at these settings.`
    : [
        `${atpFlagged.length} of ${atpSteps.length} ATP steps and ${rosFlagged.length} of ${rows.length} ROS sources are flagged against the ${comparisonName}.`,
        causes[0] ? `The largest modeled contributor is ${causes[0].name} (${fmt(causes[0].from)} to ${fmt(causes[0].to)})${causes[1] ? `, followed by ${causes[1].name}` : ""}.` : "No single changed setting accounts for the flags.",
        costFlagged.length ? `Effective ATP cost is ${cost.toFixed(2)} eV/ATP against ${ATP_COST_TEXTBOOK.lo.toFixed(2)} to ${ATP_COST_TEXTBOOK.hi.toFixed(2)}, and NADH P/O is ${poNadh.toFixed(2)} versus ${poStd.toFixed(2)} at standard coupling.` : "",
        fixedDrops.length ? `${fixedDrops.join(", ")} flag from a fixed redox drop, a model parameter no slider changes.` : "",
      ].filter(Boolean).join(" ");

  return { comparisonName, summary, causes, atpSteps, atpFlagged, cost, poNadh, poStd, rosRows: rows, rosFlagged, fixedDrops };
}

export type Interpretation = ReturnType<typeof buildInterpretation>;

export function interpretationFacts(i: Interpretation) {
  return [
    `Summary: ${i.summary}`,
    `Ranked causes (name | from to | ATP score | ROS score | ATP steps | ROS sources):`,
    ...i.causes.map((c) => `${c.name} | ${fmt(c.from)} to ${fmt(c.to)} | ${c.atpScore.toFixed(2)} | ${c.rosScore.toFixed(2)} | ${c.atpSteps.join("; ") || "none"} | ${c.rosSources.map((s) => `${s.label} ${s.delta > 0 ? "+" : ""}${fmt(s.delta)} µM/s${s.direct ? "" : " indirect"}`).join("; ") || "none"}`),
    `Flagged ATP steps:`, ...i.atpFlagged.map((s) => `${s.step}: ${[s.cause, s.evOutside ? "fixed redox drop outside cited band" : null].filter(Boolean).join("; ")}`),
    `Flagged ROS sources:`, ...i.rosFlagged.map(({ row, effects, assay }) => `${row.species} ${row.label}: ${fmt(row.base)} to ${fmt(row.live)} µM/s; top effect ${effects[0] ? `${rosInputNames[effects[0].key]} ${fmt(effects[0].delta)}` : "none detected"}${assay ? `; profile assay ${assay.label} ${assay.percent.toFixed(0)}% vs healthy, ${assay.flagged ? "flagged" : "not flagged"}` : ""}`),
  ].join("\n").slice(0, 7900);
}
