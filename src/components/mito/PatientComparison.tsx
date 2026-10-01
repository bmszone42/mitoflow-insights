import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoPatients, isReferenceOutlier, patientGroups, patientMetrics, type DemoPatient, type PatientMetric } from "@/lib/mito/patientReference";

function applicable(patient: DemoPatient, metric: PatientMetric) {
  return patient.age >= 18 && !(metric.key === "glucose" && ["demo-13", "demo-14", "demo-15"].includes(patient.id));
}

function status(patient: DemoPatient, metric: PatientMetric) {
  if (!metric.reference || !applicable(patient, metric)) return "No comparable band" as const;
  return isReferenceOutlier(patient.values[metric.key], metric) ? "Outside band" as const : "Within band" as const;
}

function ProfileValue({ patient, metric }: { patient: DemoPatient; metric: PatientMetric }) {
  const result = status(patient, metric);
  const Icon = result === "Outside band" ? AlertTriangle : result === "Within band" ? CheckCircle2 : CircleHelp;
  return (
    <div className={`min-w-0 border-l-2 pl-3 ${result === "Outside band" ? "border-destructive text-destructive" : result === "Within band" ? "border-primary" : "border-border"}`} data-testid="patient-comparison-value" data-status={result}>
      <div className="font-mono text-sm font-semibold">{patient.values[metric.key].toFixed(metric.decimals)} <span className="text-[11px] font-normal">{metric.unit}</span></div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] ${result === "Outside band" ? "text-destructive" : "text-muted-foreground"}`}><Icon className="size-3 shrink-0" aria-hidden />{result}</div>
      {metric.reference && !applicable(patient, metric) && <div className="mt-1 text-[10px] text-muted-foreground">{patient.age < 18 ? "Adult band not applied" : "Nonfasting acute sample"}</div>}
    </div>
  );
}

function ProfilePicker({ label, patient, onChange }: { label: string; patient: DemoPatient; onChange: (id: string) => void }) {
  return <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-medium">{label}</label>
    <Select value={patient.id} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full" data-testid={`comparison-${label.toLowerCase().replace(" ", "-")}`}><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-[min(70vh,440px)]">{demoPatients.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label} · {entry.age}y · {entry.phenotype}</SelectItem>)}</SelectContent>
    </Select>
    <p className="mt-2 text-xs text-muted-foreground">Age {patient.age} · {patient.phenotype}</p>
  </div>;
}

export function PatientComparison() {
  const [leftId, setLeftId] = useState("demo-01");
  const [rightId, setRightId] = useState("demo-15");
  const left = demoPatients.find((patient) => patient.id === leftId) ?? demoPatients[0];
  const right = demoPatients.find((patient) => patient.id === rightId) ?? demoPatients[1];
  const flagged = patientMetrics.filter((metric) => status(left, metric) === "Outside band" || status(right, metric) === "Outside band");
  const sliderMetrics = patientMetrics.filter((metric) => metric.key === "membranePotential" || metric.key === "labileIron");
  const sliderFlags = sliderMetrics.filter((metric) => status(left, metric) === "Outside band" || status(right, metric) === "Outside band");

  return <section className="space-y-6" data-testid="patient-comparison">
    <div className="border-b border-border pb-4">
      <div className="mono-label">Synthetic profiles</div>
      <h2 className="mt-1 text-xl font-semibold">Patient comparison</h2>
      <p className="mt-1 text-xs text-muted-foreground">Illustrative values only. Published bands are assay- and context-specific, not diagnoses or universal textbook ranges.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <ProfilePicker label="Profile A" patient={left} onChange={setLeftId} />
      <ProfilePicker label="Profile B" patient={right} onChange={setRightId} />
    </div>

    <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-2" data-testid="patient-comparison-summary">
      {[left, right].map((patient, index) => <div key={`${index}-${patient.id}`}>
        <div className="mono-label">Profile {index === 0 ? "A" : "B"} · {patient.phenotype}</div>
        <p className="mt-1 text-sm font-medium">{patientMetrics.filter((metric) => status(patient, metric) === "Outside band").length} outside applicable bands</p>
      </div>)}
    </div>

    <div className={`border-l-2 px-3 py-2 text-xs ${flagged.length ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5"}`} data-testid="patient-comparison-drift">
      <p className="font-semibold">Comparable model sliders outside published bands: {sliderFlags.length ? sliderFlags.map((metric) => `${metric.label} (${status(left, metric) === "Outside band" ? "A" : ""}${status(left, metric) === "Outside band" && status(right, metric) === "Outside band" ? " & " : ""}${status(right, metric) === "Outside band" ? "B" : ""})`).join("; ") : "None"}.</p>
      <p className="mt-1 text-muted-foreground">Only membrane potential has a transferable band among the matched sliders. Labile iron is assay-specific. P/O is a derived efficiency, not a slider; all other profile measurements are not direct slider settings.</p>
      {flagged.length > 0 && <p className="mt-1">Other measurements outside applicable bands: {flagged.filter((metric) => !sliderMetrics.includes(metric)).map((metric) => metric.label).join(", ") || "None"}.</p>}
    </div>

    {patientGroups.map((group) => <div key={group}>
      <h3 className="mb-2 border-b border-border pb-2 text-sm font-semibold">{group}</h3>
      <div className="divide-y divide-border">
        {patientMetrics.filter((metric) => metric.group === group).map((metric) => <div key={metric.key} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]" data-testid="patient-comparison-row" data-metric={metric.key}>
          <div className="min-w-0">
            <div className="text-xs font-semibold">{metric.label}{sliderMetrics.includes(metric) && <span className="ml-2 font-normal text-primary">Model slider</span>}{metric.key === "poNadh" && <span className="ml-2 font-normal text-muted-foreground">Derived readout</span>}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">{metric.reference ? `${metric.reference.lo === undefined ? "≤ " : ""}${metric.reference.lo !== undefined ? `${metric.reference.lo}–` : ""}${metric.reference.hi ?? ""} ${metric.unit} · ${metric.reference.label}` : "No transferable band"}</p>
            <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline decoration-border underline-offset-2">{metric.sourceCitation}</a>
          </div>
          <div className="sm:hidden text-[10px] font-semibold uppercase text-muted-foreground">Profile A</div>
          <ProfileValue patient={left} metric={metric} />
          <div className="sm:hidden text-[10px] font-semibold uppercase text-muted-foreground">Profile B</div>
          <ProfileValue patient={right} metric={metric} />
        </div>)}
      </div>
    </div>)}
    <p className="text-[11px] leading-relaxed text-muted-foreground">These profiles are invented and contain no patient measurements. Adult bands are not applied to children, and fasting glucose is not flagged for acute nonfasting profiles. Assay-specific ROS signals, iron pools, and model controls without comparable ranges remain unflagged, not normal.</p>
  </section>;
}