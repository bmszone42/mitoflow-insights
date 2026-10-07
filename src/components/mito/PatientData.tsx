import { useSelectedProfile } from "@/lib/mito/selectedProfile";
import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, FlaskConical, Minus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { PatientRosAssays } from "@/components/mito/PatientRosAssays";
import type { Inputs, Outputs } from "@/lib/mito/model";
import { PublishedFlagShift } from "@/components/mito/PublishedFlagShift";
import { MembranePotentialEntry } from "@/components/mito/MembranePotentialEntry";
import { UserLabsPanel } from "@/components/mito/UserLabsPanel";
import { useUserPatients } from "@/lib/mito/userPatients";
import { cohortStats, demoPatients, h2o2NmBand, lpMapping, originOf, formatRangeText, isCohortOutlier, outsideText, patientGroups, patientMetrics, patientSex, percentOutside, referenceFor, type RangeResult } from "@/lib/mito/patientReference";

type Status = "Within range" | "Lab outlier" | "Literature outlier" | "Cohort outlier" | "Both outliers" | "Cohort only";

function statusFor(value: number, key: Parameters<typeof isCohortOutlier>[1], ref: RangeResult): Status {
  const reference = ref.range ? percentOutside(value, ref.range) !== 0 : false;
  const cohort = isCohortOutlier(value, key);
  if (!ref.range) return cohort ? "Cohort outlier" : "Cohort only";
  if (reference && cohort) return "Both outliers";
  if (reference) return ref.range.kind === "Lab" ? "Lab outlier" : "Literature outlier";
  if (cohort) return "Cohort outlier";
  return "Within range";
}

const formatValue = (value: number, decimals: number) => value.toFixed(decimals);

export function PatientData({ inputs, out }: { inputs: Inputs; out: Outputs }) {
  const [patientId, setPatientId] = useSelectedProfile("demo-01");
  const users = useUserPatients();
  const all = [...users, ...demoPatients];
  const patient = all.find((entry) => entry.id === patientId) ?? demoPatients[0];
  const rows = useMemo(() => patientMetrics.map((metric) => {
    const value = patient.values[metric.key];
    const ref = referenceFor(patient, metric);
    return { metric, value, modelValue: metric.modelValue?.(inputs, out), stats: cohortStats(metric.key), status: statusFor(value, metric.key, ref), ref };
  }), [inputs, out, patient]);
  const flagged = rows.filter((row) => row.status.includes("outlier")).length;
  const comparable = rows.filter((row) => row.modelValue !== undefined).length;

  return (
    <div className="space-y-6" data-testid="patient-data-view">
      <Alert className="border-warning/60 bg-warning/10">
        <FlaskConical className="size-4 text-warning" aria-hidden />
        <AlertTitle>Synthetic demo data</AlertTitle>
         <AlertDescription>These {demoPatients.length} records are invented, not real patients, except values tagged Published (from cited case reports or cohort tables) or Yours (from results you add). Untagged values are synthetic fill. Invented values are or disease-specific measured distributions. The ROS measurements section below accepts separate assay results for local comparison. Synthetic flags are not diagnoses.</AlertDescription>
      </Alert>

      <div className="grid gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <div className="mono-label">Patient-to-model comparison</div>
          <h2 className="mt-1 text-xl font-semibold">Patient data</h2>
           <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Compare illustrative profiles with the live Simulator. Model values are mathematical states or proxies, never patient assays.</p>
        </div>
        <div>
          <label htmlFor="demo-patient" className="mb-1.5 block text-xs font-medium">Synthetic record</label>
          <Select value={patient.id} onValueChange={setPatientId}>
            <SelectTrigger id="demo-patient" data-testid="patient-selector" aria-label="Synthetic patient record"><SelectValue /></SelectTrigger>
             <SelectContent className="max-h-[min(70vh,440px)]">{all.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label} · {entry.age}y · {entry.phenotype}</SelectItem>)}</SelectContent>
          </Select>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full" data-testid="patient-run-sim">
            <Link to="/" search={{ patient: patient.id }}>
              <Play className="size-3.5" aria-hidden />Run in Simulator
            </Link>
          </Button>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Loads this profile's membrane potential, labile iron, antioxidant proxy and lactate:pyruvate ratio (as the NADH redox slider) into the Simulator; unmapped measurements stay at defaults.</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground" data-testid="patient-lp-note">{lpMapping(patient).note}</p>
        </div>
      </div>

      <section className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4" aria-label="Patient summary">
         <Summary label={`Synthetic profile · age ${patient.age}`} value={patient.phenotype} detail={`${patient.description} ${patient.context}`} />
        <Summary label="Flagged measurements" value={`${flagged} of ${rows.length}`} detail="Literature, cohort, or both" alert={flagged > 0} />
         <Summary label="Model readouts" value={`${comparable} states or proxies`} detail="Not measured patient equivalents" />
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
                  {['Measurement', 'Patient', 'Live model', 'Reference range', 'Demo cohort', 'Status', 'Source and limits'].map((label) => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}
                </tr></thead>
                 <tbody>{groupRows.map(({ metric, value, modelValue, stats, status, ref }) => {
                  const isFlagged = status.includes("outlier");
                  const displayedModel = modelValue === undefined ? null : `${formatValue(modelValue, metric.decimals)} ${metric.unit}`;
                  return (
                    <tr key={metric.key} data-testid="patient-measurement" data-status={status} className={`border-t border-border/60 ${isFlagged ? "bg-destructive/10" : ""}`}>
                      <th scope="row" className="px-3 py-3 font-medium">{metric.label}<span className="mt-0.5 block font-normal text-muted-foreground">{metric.specimen} · {metric.method}</span></th>
                      <td className={`px-3 py-3 font-mono font-medium ${isFlagged ? "text-destructive" : "text-foreground"}`}>{formatValue(value, metric.decimals)} {metric.unit}<OriginTag o={originOf(patient, metric.key)} /></td>
                      <td className="px-3 py-3 font-mono">{displayedModel === null ? <span className="inline-flex items-center gap-1 font-sans text-muted-foreground"><Minus className="size-3.5" aria-hidden />Not modeled</span> : <>{displayedModel}<span className="mt-0.5 block font-sans text-[10px] text-muted-foreground">{metric.modelLabel}</span></>}</td>
                       <td className="px-3 py-3 font-mono" data-testid="patient-range">{ref.range ? <>{formatRangeText(ref.range)} {metric.unit}<span className="mt-0.5 block font-sans text-[10px] text-muted-foreground">{ref.range.kind === "Lab" ? "Lab range" : "Research band, not a lab range"} · {ref.range.label}</span>{ref.range.url && <a href={ref.range.url} target="_blank" rel="noreferrer" className="mt-0.5 block font-sans text-[10px] text-primary underline decoration-border underline-offset-2">{ref.range.source}{ref.range.verified ? "" : " (unverified)"}</a>}<span className={`mt-0.5 block font-sans text-[10px] ${outsideText(value, ref.range) ? "text-destructive" : "text-muted-foreground"}`} data-testid="patient-outside">{outsideText(value, ref.range) ?? (ref.range.kind === "Lab" ? "Within lab range" : "Within research band")}</span></> : <span className="font-sans text-muted-foreground">{ref.reason}</span>}</td>
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

      <section aria-label="Measured peroxide concentration" className="border border-border p-4 text-xs" data-testid="patient-h2o2-nm">
        <h3 className="text-sm font-semibold">Measured hydrogen peroxide (nM)</h3>
        {patient.h2o2Nm === undefined
          ? <p className="mt-1 text-muted-foreground" data-testid="patient-h2o2-nm-status">Not measured. Add a peroxide concentration in nM under Your lab results below to compare it with the 1-100 nM band. The fold-control probe signal above cannot be placed on this scale.</p>
          : <p className="mt-1" data-testid="patient-h2o2-nm-status"><span className={`font-mono font-medium ${patient.h2o2Nm > h2o2NmBand.hi ? "text-destructive" : "text-primary"}`}>{patient.h2o2Nm} nM</span> · {outsideText(patient.h2o2Nm, { hi: h2o2NmBand.hi }) ?? "Within research band (at or below 100 nM)"}<span className="mt-0.5 block text-[10px] text-muted-foreground">Research band, not a lab range: {h2o2NmBand.label}. <a href={h2o2NmBand.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{h2o2NmBand.source}</a>. Used in the Patient Comparison drift check in place of the model value. P/O is a separate measurement and is not affected.</span></p>}
      </section>

      <PublishedFlagShift selectedId={patientId} />
      <MembranePotentialEntry patient={patient} onAdded={setPatientId} />
      <UserLabsPanel onAdded={setPatientId} />

      <PatientRosAssays />

       <p className="text-xs leading-relaxed text-muted-foreground">Synthetic cohort flags use a robust modified z-score greater than 3.5 across {demoPatients.length} deliberately mixed invented profiles, not a healthy reference population. Blood tests use Mayo Clinic Laboratories intervals (age and sex specific where published; profile sex is invented) and show the percent beyond the nearest limit; acute nonfasting cases use the random glucose interval. Research assays have no lab reference range, and their research bands are not applied to children. No model slider has a lab range: membrane potential, the only directly mapped slider, is a research measurement. The separate ROS assay flags use only entered measurements and matched local controls. P/O, mitochondrial voltage, synthetic ROS and Fe-S values are hypothetical, not validated disease-specific patient data. Clinical interpretation requires real, paired, assay-matched measurements.</p>
    </div>
  );
}

function Summary({ label, value, detail, alert = false, muted = false }: { label: string; value: string; detail: string; alert?: boolean; muted?: boolean }) {
  return <div className="min-h-28 bg-background p-4"><div className="mono-label">{label}</div><div className={`mt-2 text-lg font-semibold ${alert ? "text-destructive" : muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p></div>;
}
function OriginTag({ o }: { o: ReturnType<typeof originOf> }) {
  if (o.origin === "synthetic") return <span className="mt-0.5 block font-sans text-[10px] font-normal text-muted-foreground" data-testid="origin-tag" data-origin="synthetic">Synthetic{o.locator ? ` · ${o.locator}` : ""}</span>;
  const label = o.origin === "published" ? "Published" : "Yours";
  return <span className="mt-0.5 block font-sans text-[10px] font-normal text-primary" data-testid="origin-tag" data-origin={o.origin}>{o.url ? <a href={o.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{label}: {o.citation}</a> : `${label}: ${o.citation ?? ""}`}{o.locator ? <span className="block text-muted-foreground">{o.locator}</span> : null}</span>;
}
