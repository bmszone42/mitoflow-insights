import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assayStatus, patientRosAssays, type AssayObservation, type RosAssayKey } from "@/lib/mito/patientRosAssays";

const empty = (): AssayObservation => ({ value: "", controlLo: "", controlHi: "" });

export function PatientRosAssays() {
  const [observations, setObservations] = useState<Record<RosAssayKey, AssayObservation>>({ dcfh: empty(), fluorDhpe: empty(), mitosox: empty(), c11: empty() });
  const [confirmed, setConfirmed] = useState(false);
  const update = (key: RosAssayKey, field: keyof AssayObservation, value: string) => setObservations((old) => ({ ...old, [key]: { ...old[key], [field]: value } }));

  return <section className="space-y-4 border-y border-border py-5" data-testid="patient-ros-assays" aria-labelledby="patient-ros-assays-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="mono-label">Assay-matched comparison</div>
        <h3 id="patient-ros-assays-heading" className="mt-1 text-base font-semibold">ROS measurements</h3>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Published controls are shown for research context. Only your own matched control limits can flag an entered measurement; synthetic patient values and model outputs are never treated as assay results.</p>
      </div>
      {confirmed && <Button variant="outline" size="sm" onClick={() => { setObservations({ dcfh: empty(), fluorDhpe: empty(), mitosox: empty(), c11: empty() }); setConfirmed(false); }}>Clear measurements</Button>}
    </div>
    {!confirmed ? <div className="flex items-center gap-3 text-xs"><Button variant="outline" size="sm" onClick={() => setConfirmed(true)}>Enter assay results</Button><span className="text-muted-foreground">Do not enter names or other identifying details. Entries remain in this open page only.</span></div> : <div className="grid gap-5 lg:grid-cols-2">{patientRosAssays.map((assay) => {
      const observation = observations[assay.key];
      const status = assayStatus(observation);
      const outside = status === "Above local controls" || status === "Below local controls";
      const concerning = outside && (assay.direction === "high" ? status === "Above local controls" : status === "Below local controls");
      return <article key={assay.key} className={`border-l-2 pl-3 ${outside ? "border-destructive" : "border-border"}`} data-testid="patient-ros-assay" data-assay={assay.key} data-status={status}>
        <h4 className="text-sm font-medium">{assay.name}</h4>
        <p className="mt-1 text-[11px] text-muted-foreground">{assay.specimen} · {assay.readout}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([['value', 'Assay result'], ['controlLo', 'Control low'], ['controlHi', 'Control high']] as const).map(([field, label]) => <label key={field} className="min-w-0 text-[11px] text-muted-foreground">{label}<Input type="number" min="0" step="any" inputMode="decimal" aria-label={`${assay.name} ${label}`} value={observation[field]} onChange={(event) => update(assay.key, field, event.target.value)} className="mt-1 h-8 px-2 text-xs" /></label>)}
        </div>
        <p className={`mt-2 text-xs font-medium ${outside ? "text-destructive" : "text-muted-foreground"}`} role="status">{status}{concerning ? " · direction consistent with more oxidation" : outside ? " · opposite direction; check assay and controls" : ""}</p>
        {assay.published && <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Published control context: {assay.published}. Not a cutoff.</p>}
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{assay.note} <a href={assay.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">{assay.source}</a></p>
      </article>;
    })}</div>}
    <p className="text-[11px] leading-relaxed text-muted-foreground">Use results from the same probe, specimen, staining, cytometer/gain, gating, preparation and control population. Limits should come from your performing laboratory's matched controls, not the published mean ± SEM. An outside flag is a local assay comparison, not a diagnosis or a calibrated comparison with simulated µM/s rates. No entries are saved or sent to the server.</p>
  </section>;
}