import { useState } from "react";
import { applyTherapy, moveLabel, therapies } from "@/lib/mito/treatment";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { defaultInputs, simulate, type Geometry, type Inputs } from "@/lib/mito/model";
import { putScenario, type Scenario } from "@/lib/mito/scenarios";
import { snapshotOf } from "./Scenarios";
import { doseAnchors, doseToFactor } from "@/lib/mito/doseAnchors";
import { DoseAnchorNote, DoseBadge } from "./DoseAnchorNote";

// Left column of the Simulator: therapy levers, drug and combo presets, and every model slider.
type ControlDef = {
  key: keyof Inputs;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: "substrate" | "iron" | "photon" | "ferroptosis";
  hint: string;
};

const controls: ControlDef[] = [
  {
    key: "nadhRatio",
    label: "NADH / NAD+ pool",
    unit: "",
    min: 0,
    max: 1,
    step: 0.01,
    group: "substrate",
    hint: "Complex I reduction state",
  },
  {
    key: "succinate",
    label: "Succinate drive",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "substrate",
    hint: "Above 1.0 reverse electron transport starts",
  },
  {
    key: "oxygen",
    label: "Oxygen",
    unit: "µM",
    min: 0.5,
    max: 120,
    step: 0.5,
    group: "substrate",
    hint: "Complex IV Km near 0.5 to 1 µM",
  },
  {
    key: "deltaPsi",
    label: "Membrane potential",
    unit: "mV",
    min: 90,
    max: 210,
    step: 1,
    group: "substrate",
    hint: "Leak rises steeply above 150 mV",
  },
  {
    key: "adp",
    label: "ADP",
    unit: "µM",
    min: 0,
    max: 400,
    step: 5,
    group: "substrate",
    hint: "State 4 to state 3 respiratory control",
  },
  {
    key: "uncoupling",
    label: "Mild uncoupling",
    unit: "frac",
    min: 0,
    max: 1,
    step: 0.01,
    group: "substrate",
    hint: "UCP or protonophore activity",
  },
  {
    key: "labileIron",
    label: "Labile Fe2+ pool",
    unit: "µM",
    min: 0,
    max: 20,
    step: 0.1,
    group: "iron",
    hint: "Fenton substrate",
  },
  {
    key: "mitoHalfLife",
    label: "Mitochondrial turnover half-life",
    unit: "days",
    min: 2,
    max: 60,
    step: 0.1,
    group: "iron",
    hint: "Mitophagy; mouse liver 4.3, heart 17.2, brain 25.7 d (Kim 2012, Stauch 2023)",
  },
  {
    key: "nitricOxide",
    label: "Nitric oxide",
    unit: "nM",
    min: 0,
    max: 400,
    step: 5,
    group: "iron",
    hint: "Competes with O2 at Complex IV",
  },
  {
    key: "antioxidantCapacity",
    label: "Antioxidant capacity",
    unit: "rel",
    min: 0.2,
    max: 2,
    step: 0.05,
    group: "iron",
    hint: "Prx3, GPx, GSH and thioredoxin-2",
  },
  {
    key: "redDose",
    label: "660 nm red dose",
    unit: "J/cm2",
    min: 0,
    max: 60,
    step: 0.5,
    group: "photon",
    hint: "Heme a3 and CuA absorption",
  },
  {
    key: "nirDose",
    label: "810 nm NIR dose",
    unit: "J/cm2",
    min: 0,
    max: 60,
    step: 0.5,
    group: "photon",
    hint: "CuA band, NO photodissociation",
  },
  {
    key: "irradiance",
    label: "Irradiance",
    unit: "mW/cm2",
    min: 1,
    max: 200,
    step: 1,
    group: "photon",
    hint: "Dose rate; high values saturate chromophores and heat",
  },
  {
    key: "tissueDepth",
    label: "Tissue depth",
    unit: "mm",
    min: 0,
    max: 20,
    step: 0.5,
    group: "photon",
    hint: "0 = cultured cells; 810 nm reaches deeper",
  },
  {
    key: "gpx4",
    label: "GPx4 activity",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "ferroptosis",
    hint: "0 mimics RSL3 or ML162 inhibition",
  },
  {
    key: "fsp1",
    label: "FSP1 / CoQ10H2",
    unit: "rel",
    min: 0,
    max: 2,
    step: 0.05,
    group: "ferroptosis",
    hint: "GPx4-independent radical trapping",
  },
  {
    key: "cardiolipinPufa",
    label: "Cardiolipin PUFA fraction",
    unit: "frac",
    min: 0.2,
    max: 1,
    step: 0.01,
    group: "ferroptosis",
    hint: "ACSL4-driven substrate for peroxidation",
  },
];

export function SliderPanel({
  inputs,
  setInputs,
  geo,
  onSaved,
}: {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  geo: Geometry;
  onSaved?: (() => void) | undefined;
}) {

  const set = (key: keyof Inputs, value: number) => setInputs({ ...inputs, [key]: value });

  const groups: { id: ControlDef["group"]; title: string; note: string }[] = [
    { id: "substrate", title: "Bioenergetics", note: "Substrate supply and coupling" },
    { id: "iron", title: "Iron and defence", note: "Fenton substrate and scavenging" },
    { id: "photon", title: "Photon input", note: "Biphasic dose response" },
    { id: "ferroptosis", title: "Ferroptosis defence", note: "Lipid hydroperoxide removal" },
  ];

  // One-click drug presets. Values are relative model settings, not doses:
  // erastin depletes GSH so GPx4 drops, RSL3 inhibits GPx4 directly,
  // ferrostatin-1 adds radical trapping (FSP1-like), chelators (DFO/DFOm)
  // empty the labile iron pool. Combo presets pair a drug with a 10 J/cm2
  // 660 nm light dose as a starting point; tweak the sliders afterward.
  const drugPresets: { name: string; note: string; patch: Partial<Inputs> }[] = [
    { name: "Erastin", note: "Cystine block, GSH falls", patch: { gpx4: 0.2 } },
    { name: "RSL3", note: "Direct GPx4 inhibition", patch: { gpx4: 0 } },
    { name: "Ferrostatin-1", note: "Radical trapping", patch: { fsp1: 2 } },
    { name: "Iron chelator", note: "DFO / DFOm", patch: { labileIron: 0 } },
    { name: "NO donor SNAP", note: "S-nitroso-N-acetylpenicillamine, releases NO that blocks Complex IV", patch: { nitricOxide: 200 } },
    // Warburg presets: mitochondrial fuel supply cut, oxygen left as is (aerobic glycolysis).
    { name: "Respiration", note: "Full oxidative fuel supply, reference run", patch: { nadhRatio: 0.55, succinate: 0.6 } },
    { name: "Warburg shift", note: "Pyruvate diverted to lactate, NADH and succinate drop together", patch: { nadhRatio: 0.25, succinate: 0.2 } },
    { name: "Glycolysis only", note: "Near-zero mitochondrial fuel, ATP from glycolysis (2 per glucose)", patch: { nadhRatio: 0.05, succinate: 0 } },
  ];
  const comboPresets: { name: string; note: string; patch: Partial<Inputs> }[] = [
    { name: "Erastin + 660 nm", note: "GPx4 down plus 10 J/cm2 red light", patch: { gpx4: 0.2, redDose: 10 } },
    { name: "RSL3 + 660 nm", note: "GPx4 blocked plus 10 J/cm2 red light", patch: { gpx4: 0, redDose: 10 } },
    { name: "Chelator + 660 nm", note: "Labile iron emptied plus 10 J/cm2 red light", patch: { labileIron: 0, redDose: 10 } },
    { name: "Erastin + chelator", note: "GPx4 down and labile iron emptied", patch: { gpx4: 0.2, labileIron: 0 } },
    { name: "Erastin + 810 nm", note: "GPx4 down plus 10 J/cm2 near-infrared", patch: { gpx4: 0.2, nirDose: 10, redDose: 0 } },
    { name: "RSL3 + 810 nm", note: "GPx4 blocked plus 10 J/cm2 near-infrared", patch: { gpx4: 0, nirDose: 10, redDose: 0 } },
    { name: "Chelator + 810 nm", note: "Labile iron emptied plus 10 J/cm2 near-infrared", patch: { labileIron: 0, nirDose: 10, redDose: 0 } },
    { name: "Erastin + chelator + light", note: "GPx4 down, iron emptied, 10 J/cm2 red light", patch: { gpx4: 0.2, labileIron: 0, redDose: 10 } },
  ];

  // Apply a preset and save the result as a named scenario so presets can be
  // compared side by side in the Compare tab.
  const [activeTherapy, setActiveTherapy] = useState<string | null>(null);
  // Dose-anchored oxaloacetate lever (trial doses, assumed effect size): moving it
  // patches the real NADH slider by the ratio of the new to the previous factor.
  const [oaa, setOaa] = useState(0);
  const applyOaa = (next: number) => {
    const ratio = doseToFactor(doseAnchors.oaa, next) / doseToFactor(doseAnchors.oaa, oaa);
    setOaa(next);
    set("nadhRatio", Math.min(1, Math.max(0, inputs.nadhRatio * ratio)));
  };
  const [savedPreset, setSavedPreset] = useState<string | null>(null);
  const [savingCombos, setSavingCombos] = useState(false);
  const [comboSaveStatus, setComboSaveStatus] = useState<string | null>(null);
  const makePresetScenario = (name: string, patch: Partial<Inputs>): Scenario => {
    const next = { ...inputs, ...patch };
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      name: `Preset: ${name}`,
      notes: `Saved automatically from the "${name}" preset.`,
      inputs: next,
      geometry: { ...geo },
      preset: name,
      snapshot: snapshotOf(simulate(next, geo)),
      createdAt: now,
      updatedAt: now,
    };
  };
  const applyPreset = (name: string, patch: Partial<Inputs>) => {
    const scenario = makePresetScenario(name, patch);
    setInputs(scenario.inputs);
    void putScenario(scenario)
      .then(() => {
        setSavedPreset(name);
        onSaved?.();
      })
      .catch(() => setSavedPreset(null));
  };
  const saveAllCombos = async () => {
    if (savingCombos) return;
    setSavingCombos(true);
    setComboSaveStatus(null);
    try {
      const results = await Promise.allSettled(comboPresets.map((d) => putScenario(makePresetScenario(d.name, d.patch))));
      const saved = results.filter((r) => r.status === "fulfilled").length;
      setComboSaveStatus(saved === comboPresets.length
        ? `Saved all ${saved} combination scenarios.`
        : `Saved ${saved} of ${comboPresets.length} combination scenarios. Please retry failed saves individually.`);
      if (saved > 0) onSaved?.();
    } catch {
      setComboSaveStatus("Could not prepare combination scenarios. Please try again.");
    } finally {
      setSavingCombos(false);
    }
  };
  return (
      <div className="panel space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Model inputs</h2>
          <Button variant="ghost" size="sm" onClick={() => setInputs(defaultInputs)}>
            Reset
          </Button>
        </div>
        <div className="space-y-1.5" data-testid="sim-therapies">
          <div className="mono-label">Therapy levers</div>
          <div className="flex flex-wrap gap-1.5">
            {therapies.map((t) => (
              <Button key={t.id} variant={activeTherapy === t.id ? "default" : "outline"} size="sm" className="h-7 px-2 text-xs" title={t.moves.map(moveLabel).join("; ")} aria-pressed={activeTherapy === t.id} data-testid="sim-therapy" onClick={() => { setInputs(applyTherapy(inputs, t)); setActiveTherapy(t.id); }}>
                {t.name}
              </Button>
            ))}
          </div>
          {activeTherapy && <p className="text-[11px] text-muted-foreground" data-testid="sim-therapy-applied">Applied: {therapies.find((t) => t.id === activeTherapy)!.moves.map(moveLabel).join("; ")}. Model slider moves from your current settings, not doses.</p>}
        </div>
        <div className="space-y-1.5">
          <div className="mono-label">Drug presets</div>
          <div className="flex flex-wrap gap-1.5">
            {drugPresets.map((d) => (
              <Button
                key={d.name}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                title={d.note}
                onClick={() => applyPreset(d.name, d.patch)}
              >
                {d.name}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Erastin lowers GPx4 to 0.2, RSL3 to 0, ferrostatin-1 raises FSP1 to 2, chelator empties labile iron, SNAP raises NO to 200 nM so it competes for Complex IV. Other sliders stay as set. Each click also saves a named scenario for the Compare tab.
          </p>
          {savedPreset && (
            <p className="text-[11px] text-primary">Saved scenario: Preset: {savedPreset}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="mono-label">Combination presets</div>
            <Button variant="secondary" size="sm" className="h-7 px-2 text-[11px]" disabled={savingCombos} onClick={() => void saveAllCombos()}>
              {savingCombos ? "Saving…" : "Save all 8 combos"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {comboPresets.map((d) => (
              <Button
                key={d.name}
                variant="outline"
                size="sm"
                className="h-7 border-primary/50 px-2 text-[11px] text-primary"
                title={d.note}
                onClick={() => applyPreset(d.name, d.patch)}
              >
                {d.name}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Drug patch plus a 10 J/cm2 dose (660 nm unless the preset says otherwise; 810 nm presets zero the red dose so the near-infrared path is isolated). Adjust the light sliders after clicking if you want a different dose. Each click saves a named scenario for the Compare tab.
          </p>
          {comboSaveStatus && <p role="status" className="text-[11px] text-primary">{comboSaveStatus}</p>}
        </div>
        <div className="space-y-1.5 rounded-md border border-dashed border-border p-3" data-testid="sim-oaa">
          <div className="flex items-center justify-between gap-2">
            <div className="mono-label">{doseAnchors.oaa.label} (fuel presets)</div>
            <DoseBadge />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-28 text-xs">Dose: <span className="font-mono">{oaa.toFixed(1)} {doseAnchors.oaa.unit}</span></span>
            <Slider aria-label="Oxaloacetate dose" min={0} max={doseAnchors.oaa.maxDose} step={doseAnchors.oaa.step} value={[oaa]} onValueChange={(v) => applyOaa(v[0] ?? 0)} className="max-w-xs" />
          </div>
          <DoseAnchorNote a={doseAnchors.oaa} />
        </div>
        {groups.map((g) => (
          <div key={g.id} className="space-y-4">
            <div>
              <div className="mono-label">{g.title}</div>
              <p className="text-xs text-muted-foreground">{g.note}</p>
            </div>
            {controls
              .filter((c) => c.group === g.id)
              .map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-foreground">{c.label}</span>
                    <span className="font-mono text-xs text-primary">
                      {inputs[c.key]}
                      {c.unit ? ` ${c.unit}` : ""}
                    </span>
                  </div>
                  <Slider
                    value={[inputs[c.key]]}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    onValueChange={(v) => set(c.key, v[0] ?? inputs[c.key])}
                  />
                  <p className="text-[11px] text-muted-foreground">{c.hint}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
  );
}
