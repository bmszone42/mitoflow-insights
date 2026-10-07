import { useSelectedProfile } from "@/lib/mito/selectedProfile";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultGeometry, defaultInputs, inputRanges, type Inputs } from "@/lib/mito/model";
import { demoPatients } from "@/lib/mito/patientReference";
import { modelSettingRows } from "@/lib/mito/settingsReference";
import { ATP_COST_TEXTBOOK, atpCostFlagCause, atpFlagContext, atpNetworkRangeFlags, effectiveAtpCost, etcSteps, liveAtpPerPair } from "@/lib/mito/reference";

export const Route = createFileRoute("/patient-baseline")({
  head: () => ({ meta: [
    { title: "Synthetic patient baseline comparison | Cristae Lab" },
    { name: "description", content: "Compare synthetic patient profiles with a healthy illustrative baseline, cited model setting bands, and conditional ATP step flags." },
    { property: "og:title", content: "Synthetic patient baseline comparison | Cristae Lab" },
    { property: "og:description", content: "Inspect which available profile values drift from cited setting bands and which ATP steps flag in a conditional simulation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PatientBaselinePage,
});

const healthy = demoPatients.find((patient) => patient.id === "demo-01");
const standardCost = effectiveAtpCost(defaultInputs.deltaPsi, defaultInputs.uncoupling);

function patientState(psi: number): Inputs {
  return { ...defaultInputs, deltaPsi: psi };
}

function PatientBaselinePage() {
  const [selectedId, setSelectedId] = useSelectedProfile("demo-15");
  const selected = demoPatients.find((patient) => patient.id === selectedId) ?? demoPatients[0];
  if (!healthy || !selected) return null;

  const baselineInputs = patientState(healthy.values.membranePotential);
  const currentInputs = patientState(selected.values.membranePotential);
  const baselineRows = modelSettingRows(baselineInputs, defaultGeometry);
  const currentRows = modelSettingRows(currentInputs, defaultGeometry);
  const membraneRow = currentRows.find((row) => row.id === "deltaPsi");
  const healthyMembraneRow = baselineRows.find((row) => row.id === "deltaPsi");
  const applicable = selected.age >= 18;
  const sliderFlag = applicable && membraneRow?.status === "Outside range";
  const cost = effectiveAtpCost(currentInputs.deltaPsi, currentInputs.uncoupling);
  const healthyCost = effectiveAtpCost(baselineInputs.deltaPsi, baselineInputs.uncoupling);
  const stepRows = etcSteps.map((step) => {
    const flags = atpNetworkRangeFlags(step, healthyCost, cost);
    const healthyFlags = atpNetworkRangeFlags(step, standardCost, healthyCost);
    const cause = flags.costBOutside ? atpCostFlagCause(step, atpFlagContext(currentInputs.deltaPsi, currentInputs.uncoupling)) : null;
    return { step, flags, healthyFlags, cause, flagged: flags.evOutside || flags.costBOutside };
  });
  const flaggedSteps = stepRows.filter((row) => row.flagged);
  const profiles = demoPatients.map((patient) => {
    const row = modelSettingRows(patientState(patient.values.membranePotential), defaultGeometry).find((item) => item.id === "deltaPsi");
    const count = etcSteps.filter((step) => { const f = atpNetworkRangeFlags(step, standardCost, effectiveAtpCost(patient.values.membranePotential, defaultInputs.uncoupling)); return f.evOutside || f.costBOutside; }).length;
    return { patient, outside: patient.age >= 18 && row?.status === "Outside range", count };
  });

  return <main className="mx-auto max-w-[1400px] space-y-7 px-4 py-6 sm:px-8" data-testid="patient-baseline-page">
    <header className="border-b border-border pb-5">
      <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft aria-hidden /> Cristae Lab</Link></Button>
      <div className="mono-label mt-5">Physiology / synthetic profiles</div>
      <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Patient profiles vs healthy baseline</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Healthy adult (age {healthy.age}) is an invented reference-like profile, not a measured control. Only membrane potential maps directly to a profile slider. ATP steps below are conditional simulations with every other setting held at the model default.</p>
    </header>

    <section aria-label="All synthetic profiles" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-lg font-semibold">All profiles</h2><span className="font-mono text-xs text-muted-foreground">{profiles.length} synthetic records</span></div>
      <div className="divide-y divide-border border-y border-border sm:hidden">{profiles.map(({ patient, outside, count }) => <div key={patient.id} className={`flex items-center justify-between gap-3 py-3 ${selected.id === patient.id ? "bg-primary/10" : ""}`} data-testid="profile-baseline-mobile-row"><div className="min-w-0"><div className="text-xs font-medium">{patient.phenotype} <span className="font-normal text-muted-foreground">· {patient.age}y</span></div><div className={`mt-1 text-[11px] ${outside ? "text-destructive" : "text-muted-foreground"}`}>{patient.values.membranePotential} mV · {patient.age < 18 ? "Adult band not applied" : outside ? "Outside band" : "Within band"} · {count}/{etcSteps.length} ATP</div></div><Button size="sm" variant={selected.id === patient.id ? "secondary" : "ghost"} onClick={() => setSelectedId(patient.id)} aria-label={`View ${patient.phenotype}`}>View</Button></div>)}</div>
      <div className="hidden overflow-x-auto border-y border-border sm:block"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr><th className="px-3 py-3">Profile</th><th className="px-3 py-3">Age</th><th className="px-3 py-3">Potential</th><th className="px-3 py-3">Cited slider band</th><th className="px-3 py-3">ATP model flags</th><th className="px-3 py-3">View</th></tr></thead><tbody>{profiles.map(({ patient, outside, count }) => <tr key={patient.id} className={`border-t border-border/60 ${selected.id === patient.id ? "bg-primary/10" : ""}`} data-testid="profile-baseline-row"><th scope="row" className="px-3 py-2 font-medium">{patient.phenotype}</th><td className="px-3 py-2">{patient.age}</td><td className="px-3 py-2 font-mono">{patient.values.membranePotential} mV</td><td className={`px-3 py-2 ${outside ? "text-destructive" : "text-muted-foreground"}`}>{patient.age < 18 ? "Adult band not applied" : outside ? "Outside band" : "Within band"}</td><td className="px-3 py-2 font-mono">{count}/{etcSteps.length}</td><td className="px-3 py-2"><Button size="sm" variant={selected.id === patient.id ? "secondary" : "ghost"} onClick={() => setSelectedId(patient.id)} aria-label={`View ${patient.phenotype}`}>View</Button></td></tr>)}</tbody></table></div>
    </section>

    <section className="space-y-4" aria-label="Selected profile comparison">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3"><div><div className="mono-label">Selected comparison</div><h2 className="mt-1 text-xl font-semibold">{selected.phenotype}</h2></div><Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger className="w-full sm:w-72" aria-label="Select patient profile"><SelectValue /></SelectTrigger><SelectContent className="max-h-[min(70vh,440px)]">{demoPatients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.phenotype} · {patient.age}y</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-3"><div className="bg-card p-3"><div className="mono-label">Healthy baseline</div><div className="mt-2 font-mono text-lg">{healthy.values.membranePotential} mV</div><div className="text-xs text-muted-foreground">{healthyMembraneRow?.status} · synthetic</div></div><div className="bg-card p-3"><div className="mono-label">Selected profile</div><div className="mt-2 font-mono text-lg">{selected.values.membranePotential} mV</div><div className={`text-xs ${sliderFlag ? "text-destructive" : "text-muted-foreground"}`}>{!applicable ? "Adult band not applied" : membraneRow?.status}</div></div><div className="bg-card p-3"><div className="mono-label">ATP simulation</div><div className="mt-2 font-mono text-lg">{flaggedSteps.length}/{etcSteps.length} flagged</div><div className="text-xs text-muted-foreground">Potential only · {Math.round(defaultInputs.uncoupling * 100)}% default uncoupling</div></div></div>
      <p className="text-xs text-muted-foreground">{selected.context} The profile’s illustrative P/O and ATP-linked respiration are separate measurements; neither is inverted to infer uncoupling or other settings.</p>
    </section>

    <section aria-label="Slider comparison" className="space-y-3"><h2 className="text-lg font-semibold">Model sliders</h2><p className="text-xs text-muted-foreground">Only directly mapped profile values are evaluated. The remaining sliders are unknown, not normal. Their defaults are used solely for the ATP projection.</p><div className="divide-y divide-border border-y border-border">{(Object.keys(inputRanges) as (keyof Inputs)[]).map((key) => { const definition = inputRanges[key]; const row = currentRows.find((item) => item.id === key); const isPotential = key === "deltaPsi"; return <div key={key} className="grid gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1.3fr)_minmax(0,.8fr)_minmax(0,1.4fr)]" data-testid="patient-slider-row" data-setting={key}><div className="font-medium">{definition.label}<span className="mt-1 block font-normal text-muted-foreground">Healthy: {isPotential ? `${healthy.values.membranePotential} mV` : "Not recorded"}</span></div><div><span className="font-mono">{isPotential ? `${selected.values.membranePotential} mV` : "Not recorded"}</span><span className={`mt-1 flex items-center gap-1 ${isPotential && sliderFlag ? "text-destructive" : "text-muted-foreground"}`}>{isPotential ? applicable ? sliderFlag ? <><AlertTriangle className="size-3" /> Outside band</> : <><CheckCircle2 className="size-3" /> Within band</> : <><CircleHelp className="size-3" /> Adult band not applied</> : <><CircleHelp className="size-3" /> Unknown</>}</span></div><div className="text-muted-foreground">{row?.reference}<span className="mt-1 block">{isPotential && sliderFlag ? row?.drift : row?.note}</span>{row && <a href={row.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-primary underline decoration-border underline-offset-2">{row.source}</a>}</div></div>; })}</div></section>

    <section aria-label="ATP step comparison" className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-2"><h2 className="text-lg font-semibold">ATP step flags</h2><span className="font-mono text-xs text-muted-foreground">{flaggedSteps.length} of {etcSteps.length} flagged</span></div><p className="text-xs text-muted-foreground">Both runs hold geometry and all unrecorded inputs at model defaults. The healthy run uses {healthy.values.membranePotential} mV; the selected run uses {selected.values.membranePotential} mV. Cost {healthyCost.toFixed(2)} → {cost.toFixed(2)} eV/ATP against the model proxy {ATP_COST_TEXTBOOK.lo.toFixed(2)}–{ATP_COST_TEXTBOOK.hi.toFixed(2)} eV/ATP. The redox bands are literature-informed; they do not measure this profile’s ATP output.</p><div className="divide-y divide-border border-y border-border">{stepRows.map(({ step, flags, healthyFlags, cause, flagged }) => <div key={step.step} className={`grid gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_minmax(0,.8fr)_minmax(0,1.5fr)] ${flagged ? "bg-destructive/10" : ""}`} data-testid="patient-atp-step" data-outside={flagged}><div className="px-2 font-medium">{step.step}{step.step.startsWith("Overall") && <span className="block text-[10px] font-normal text-muted-foreground">Chain summary, not an additional reaction</span>}</div><div className="px-2 font-mono">Healthy {liveAtpPerPair(step, baselineInputs.deltaPsi, baselineInputs.uncoupling).proton.toFixed(2)} ATP/pair{(healthyFlags.evOutside || healthyFlags.costBOutside) && <span className="block text-destructive">Baseline flagged</span>}</div><div className="px-2 font-mono">Profile {liveAtpPerPair(step, currentInputs.deltaPsi, currentInputs.uncoupling).proton.toFixed(2)} ATP/pair</div><div className={`px-2 ${flagged ? "text-destructive" : "text-muted-foreground"}`}>{flagged ? <><AlertTriangle className="mr-1 inline size-3" />{flags.evOutside ? "Fixed redox drop outside cited band. " : ""}{flags.costBOutside ? `Cost outside model band. ${cause ?? "Potential-dependent model cost."}` : ""}</> : <><CheckCircle2 className="mr-1 inline size-3" />No step flag</>}<a href={step.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-primary underline decoration-border underline-offset-2">{step.sourceCitation}</a></div></div>)}</div><p className="text-xs text-muted-foreground">These flags are model predictions, not patient ATP measurements. An adult citation band is not applied to a child’s membrane-potential value, but the conditional ATP simulation still runs at that illustrative value.</p></section>
  </main>;
}