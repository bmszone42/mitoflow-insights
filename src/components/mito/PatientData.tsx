import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, FlaskConical, Minus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Inputs, Outputs } from "@/lib/mito/model";
import { cohortStats, demoPatients, isCohortOutlier, isReferenceOutlier, patientGroups, patientMetrics, type PatientMetric } from "@/lib/mito/patientReference";

type Status = "Within range" | "Literature outlier" | "Cohort outlier" | "Both outliers" | "Cohort only";

function statusFor(value: number, metric: PatientMetric): Status {
  const reference = isReferenceOutlier(value, metric);
  const cohort = isCohortOutlier(value, metric.key);
  if (!metric.reference) return cohort ? "Cohort outlier" : "Cohort only";
  if (reference && cohort) return "Both outliers";
  if (reference) return "Literature outlier";
  if (cohort) return "Cohort outlier";
  return "Within range";
}

function formatRange(metric: PatientMetric) {
  const range = metric.reference;
  if (!range) return "No transferable interval";
  if (range.lo === undefined) return `≤ ${range.hi}`;
  if (range.hi === undefined) return `≥ ${range.lo}`;
  return `${range.lo}–${range.hi}`;
}

const formatValue = (value: number, decimals: number) => value.toFixed(decimals);

export function PatientData({ inputs, out }: { inputs: Inputs; out: Outputs }) {
  const [patientId, setPatientId] = useState("demo-02");
  const patient = demoPatients.find((entry) => entry.id === patientId) ?? demoPatients[0];
  const rows = useMemo(() => patientMetrics.map((metric) => {
    const value = patient.values[metric.key];
    return { metric, value, modelValue: metric.modelValue?.(inputs, out), stats: cohortStats(metric.key), status: statusFor(value, metric) };
  }), [inputs, out, patient]);
  const flagged = rows.filter((row) => row.status.includes("outlier")).length;
  const comparable = rows.filter((row) => row.modelValue !== undefined).length;

  return (
    <div className="space-y-6" data-testid="patient-data-view">
      <Alert className="border-warning/60 bg-warning/10">
        <FlaskConical className="size-4 text-warning" aria-hidden />
        <AlertTitle>Synthetic demo data</AlertTitle>
        <AlertDescription>These records are invented and contain no patient information. Flags support research exploration only and are not diagnoses.</AlertDescription>
      </Alert>

      <div className="grid gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <div className="mono-label">Patient-to-model comparison</div>
          <h2 className="mt-1 text-xl font-semibold">Patient data</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Compare a synthetic laboratory profile with the live Simulator. Direct comparisons appear only when units and biological context align; other measurements remain clinical context.</p>
        </div>
        <div>
          <label htmlFor="demo-patient" className="mb-1.5 block text-xs font-medium">Synthetic record</label>
          <Select value={patient.id} onValueChange={setPatientId}>
            <SelectTrigger id="demo-patient" data-testid="patient-selector" aria-label="Synthetic patient record"><SelectValue /></SelectTrigger>
            <SelectContent>{demoPatients.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label} · {entry.phenotype}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <section className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4" aria-label="Patient summary">
        <Summary label="Selected phenotype" value={patient.phenotype} detail={patient.description} />
        <Summary label="Flagged measurements" value={`${flagged} of ${rows.length}`} detail="Literature, cohort, or both" alert={flagged > 0} />
        <Summary label="Model comparisons" value={`${comparable} direct or proxy`} detail="Matched by units and context" />
        <Summary label="Clinical context only" value={`${rows.length - comparable} measurements`} detail="No safe model equivalent" muted />
      </section>

      <div className="flex flex-wrap gap-2 text-[10px]" aria-label="Status legend">
        <Badge variant="outline" className="border-primary/60 text-primary">Within range</Badge>
        <Badge variant="destructive">Outlier</Badge>
        <Badge variant="secondary">Cohort only</Badge>
        <Badge variant="outline" className="text-muted-foreground">No model match</Badge>
      </div>

      {patientGroups.map((group) => {
        const groupRows = rows.filter((row) => row.metric.group === group);
        const groupFlags = groupRows.filter((row) => row.status.includes("outlier")).length;
        const headingId = `patient-${group.replaceAll(" ", "-").toLowerCase()}`;
        return (
          <section key={group} aria-labelledby={headingId}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={headingId} className="text-sm font-semibold">{group}</h3>
              <span className={`font-mono text-xs ${groupFlags ? "text-destructive" : "text-primary"}`}>{groupFlags} flagged</span>
            </div>
            <div className="overflow-x-auto border-y border-border">
              <table className="w-full min-w-[1120px] text-left text-xs" data-testid="patient-measurements">
                <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr>
                  {['Measurement', 'Patient', 'Live model', 'Published range', 'Demo cohort', 'Status', 'Source and limits'].map((label) => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}
                </tr></thead>
                <tbody>{groupRows.map(({ metric, value, modelValue, stats, status }) => {
                  const isFlagged = status.includes("outlier");
                  const displayedModel = modelValue === undefined ? null : `${formatValue(modelValue, metric.decimals)} ${metric.unit}`;
                  return (
                    <tr key={metric.key} data-testid="patient-measurement" data-status={status} className={`border-t border-border/60 ${isFlagged ? "bg-destructive/10" : ""}`}>
                      <th scope="row" className="px-3 py-3 font-medium">{metric.label}<span className="mt-0.5 block font-normal text-muted-foreground">{metric.specimen} · {metric.method}</span></th>
                      <td className={`px-3 py-3 font-mono font-medium ${isFlagged ? "text-destructive" : "text-foreground"}`}>{formatValue(value, metric.decimals)} {metric.unit}</td>
                      <td className="px-3 py-3 font-mono">{displayedModel === null ? <span className="inline-flex items-center gap-1 font-sans text-muted-foreground"><Minus className="size-3.5" aria-hidden />Not modeled</span> : <>{displayedModel}<span className="mt-0.5 block font-sans text-[10px] text-muted-foreground">{metric.modelLabel}</span></>}</td>
                      <td className="px-3 py-3 font-mono">{formatRange(metric)} {metric.reference ? metric.unit : ""}{metric.reference && <span className="mt-0.5 block font-sans text-[10px] text-muted-foreground">{metric.reference.label}</span>}</td>
                      <td className="px-3 py-3 font-mono">{formatValue(stats.median, metric.decimals)} median<span className="mt-0.5 block text-[10px] text-muted-foreground">{formatValue(stats.min, metric.decimals)}–{formatValue(stats.max, metric.decimals)} range</span></td>
                      <td className={`px-3 py-3 font-medium ${isFlagged ? "text-destructive" : status === "Within range" ? "text-primary" : "text-muted-foreground"}`}>{isFlagged ? <AlertTriangle className="mr-1 inline size-3.5" aria-hidden /> : status === "Within range" ? <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden /> : <AlertCircle className="mr-1 inline size-3.5" aria-hidden />}{status}</td>
                      <td className="max-w-[330px] px-3 py-3 text-muted-foreground"><a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary">{metric.sourceCitation}</a><span className="mt-1 block text-[10px] leading-relaxed">{metric.note}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="text-xs leading-relaxed text-muted-foreground">Cohort flags use a robust modified z-score greater than 3.5 based on the six synthetic records. They describe this demo cohort only. Published intervals are assay-specific and may not apply across tissues, ages, collection methods, or laboratories. Model proxies are normalized for side-by-side exploration and must not be interpreted as measured patient values.</p>
    </div>
  );
}

function Summary({ label, value, detail, alert = false, muted = false }: { label: string; value: string; detail: string; alert?: boolean; muted?: boolean }) {
  return <div className="min-h-28 bg-background p-4"><div className="mono-label">{label}</div><div className={`mt-2 text-lg font-semibold ${alert ? "text-destructive" : muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p></div>;
}