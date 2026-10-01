import { useState } from "react";
import { AlertTriangle, CheckCircle2, Minus } from "lucide-react";
import { defaultInputs, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { demoPatients } from "@/lib/mito/patientReference";
import { rosAssayFlag, rosDriverAttributions, rosFlagPercent, rosInputNames, rosSourceRows } from "@/lib/mito/rosPhysiology";

const healthyControl = demoPatients.find((patient) => patient.id === "demo-01")!;
import { studyReferences } from "@/lib/mito/studyReferences";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RosDriverNetwork } from "./RosDriverNetwork";

function rate(value: number) {
  return value === 0 ? "0" : value.toPrecision(3);
}

export function RosPhysiology({ inputs, geo, out }: { inputs: Inputs; geo: Geometry; out: Outputs }) {
  const [focus, setFocus] = useState<number | null>(null);
  const [profileId, setProfileId] = useState("default");
  const profile = demoPatients.find((patient) => patient.id === profileId);
  // A profile contributes only its illustrative membrane-potential measurement.
  // Fluorescent ROS signals cannot be inverted into site-specific production rates.
  const comparisonInputs: Inputs = profile ? { ...defaultInputs, deltaPsi: profile.values.membranePotential } : defaultInputs;
  const baseline = simulate(comparisonInputs, geo);
  const rows = rosSourceRows(out, baseline, inputs, comparisonInputs);
  const attributions = rosDriverAttributions(rows, inputs, comparisonInputs, geo);
  const flagged = rows.filter((row) => row.flagged);
  const comparisonName = profile ? `${profile.label} simulated comparison` : "same-geometry simulated default";

  return <section className="space-y-5" data-testid="ros-physiology">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div>
        <div className="mono-label">Source-resolved redox comparison</div>
        <h2 className="mt-1 text-xl font-semibold">ROS physiology</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Modeled production rates versus {comparisonName} at the current membrane geometry. Source citations describe mechanisms and kinetic context, not disorder-specific normal production-rate ranges.</p>
      </div>
      <span className={`flex items-center gap-2 font-mono text-sm ${flagged.length ? "text-destructive" : "text-primary"}`} role="status" data-testid="ros-flag-count">
        {flagged.length ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
        {flagged.length} / {rows.length} changed beyond model band
      </span>
    </div>

    <div className="border-y border-border py-4" data-testid="ros-profile-comparison">
      <label className="block text-xs font-medium" htmlFor="ros-profile-select">Comparison profile</label>
      <Select value={profileId} onValueChange={(value) => { setProfileId(value); setFocus(null); }}>
        <SelectTrigger id="ros-profile-select" aria-label="Comparison profile" className="mt-2 w-full max-w-md" data-testid="ros-profile-select"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-[min(70vh,440px)]">
          <SelectItem value="default">Simulated default</SelectItem>
          {demoPatients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.label} · {patient.age}y · {patient.phenotype}</SelectItem>)}
        </SelectContent>
      </Select>
      {profile ? <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground" data-testid="ros-profile-context">Synthetic {profile.phenotype}, age {profile.age}. Comparison simulation uses its illustrative membrane potential ({profile.values.membranePotential} mV); every other input stays at the simulated default and geometry stays current. Profile MitoSOX {profile.values.mitosox.toFixed(2)}× control, H₂O₂ {profile.values.h2o2.toFixed(2)}× control and lipid oxidation {profile.values.lipidPeroxidation}% control are hypothetical assay signals, not site-specific rates or textbook limits.</p> : <p className="mt-2 text-xs text-muted-foreground">No patient measurements are used in the simulated default.</p>}
    </div>

    {flagged.length > 0 && <div className="border-l-2 border-destructive py-1 pl-3 text-xs" data-testid="ros-flag-summary">
      <span className="font-semibold">Flagged sources: </span>{flagged.map((row) => row.label).join(" · ")}
    </div>}

    <RosDriverNetwork rows={rows} attributions={attributions} focus={focus} onFocus={setFocus} baselineLabel={comparisonName} />

    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[930px] text-left text-xs">
        <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr>
          <th scope="col" className="px-3 py-3 font-medium">ROS / source</th>
          <th scope="col" className="px-3 py-3 font-medium">Comparison rate</th>
          <th scope="col" className="px-3 py-3 font-medium">Current rate</th>
          <th scope="col" className="px-3 py-3 font-medium">Model flag / drivers</th>
          <th scope="col" className="px-3 py-3 font-medium">Paper / cited range</th>
        </tr></thead>
        <tbody>{rows.map((row, index) => { const leading = attributions[index]?.[0]; const paper = studyReferences.find((study) => study.url === row.url); return <tr key={`${row.species}-${row.label}`} data-testid="ros-source-row" data-ros-source-index={index} data-selected={focus === index} data-outside={row.flagged} className={`border-t border-border/60 align-top ${row.flagged ? "bg-destructive/10" : ""} ${focus === index ? "ring-1 ring-inset ring-primary bg-primary/10" : ""}`}>
          <th scope="row" className="px-3 py-3 font-medium"><span className="font-mono text-primary">{row.species}</span><span className="mt-1 block">{row.label}</span><span className="mt-1 block max-w-[200px] text-[10px] font-normal leading-relaxed text-muted-foreground">{row.mechanism}</span></th>
          <td className="px-3 py-3 font-mono tabular-nums">{rate(row.base)} <span className="block text-[10px] text-muted-foreground">µM/s</span></td>
          <td className="px-3 py-3 font-mono tabular-nums">{rate(row.live)} <span className="block text-[10px] text-muted-foreground">µM/s</span></td>
          <td className={`max-w-[240px] px-3 py-3 ${row.flagged ? "text-destructive" : "text-primary"}`}>
            {row.flagged ? <AlertTriangle className="mr-1 inline size-3.5" aria-hidden /> : <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden />}
            {row.base === 0 ? row.live > 0 ? "Newly active" : "Inactive in both runs" : `${row.percent !== null && row.percent >= 0 ? "+" : ""}${row.percent?.toFixed(0)}% vs comparison`}
            <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{row.base > 0 ? `Flag at ±${rosFlagPercent}% of comparison simulation.` : "Zero baseline: flag if source becomes active."}</span>
            {row.changedDrivers.length > 0 && <span className="mt-1 block text-[10px] leading-relaxed text-foreground">Changed relevant settings: {row.changedDrivers.map((key) => rosInputNames[key]).join(", ")}. These are possible drivers, not isolated causal effects.</span>}
            {row.flagged && leading ? <span className="mt-1 block text-[10px] leading-relaxed text-destructive" data-testid="ros-flag-cause">Largest modeled input effect: {rosInputNames[leading.key]} ({leading.delta > 0 ? "+" : ""}{rate(leading.delta)} µM/s{leading.direct ? "" : ", indirect"}). See network for all input effects.</span> : null}
          </td>
          <td className="max-w-[280px] px-3 py-3 text-muted-foreground">
            <span className="block font-medium text-foreground" data-testid="ros-cited-range">Cited µM/s range: not established for this source</span>
            <span className="mt-1 block leading-relaxed">{row.literatureValue}</span>
            {paper && <span className="mt-2 block leading-relaxed">{paper.authors} ({paper.year}). {paper.title}. <cite>{paper.journal}</cite>, {paper.location}.</span>}
            <a href={row.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-foreground underline decoration-border underline-offset-2 hover:text-primary">{paper?.doi ?? row.citation}</a>
          </td>
        </tr>})}</tbody>
      </table>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">Site-resolved ex vivo measurements in isolated skeletal-muscle mitochondria are preparation-, substrate- and assay-dependent: <a href="https://doi.org/10.1074/jbc.M114.619072" target="_blank" rel="noopener noreferrer" className="underline">Goncalves, Quinlan, Perevoshchikova, Hey-Mogensen &amp; Brand (2015), J Biol Chem 290:209–227</a>. Their protein-normalized H₂O₂ release rates cannot be compared numerically to these modeled volume-normalized µM/s source rates. Thus no source can be classified inside or outside a cited experimental interval. The ±{rosFlagPercent}% flag is only a change from the selected simulation; a zero comparison rate flags on activation. Singlet oxygen and lipid peroxyl lack source-resolved rates here. <Minus className="inline size-3" aria-hidden /> No claim of clinical abnormality.</p>
  </section>;
}