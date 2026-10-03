import type { Geometry, Inputs } from "@/lib/mito/model";
import { lpMapping, type DemoPatient } from "@/lib/mito/patientReference";
import type { Therapy } from "@/lib/mito/treatment";
import { PatientRunReadouts } from "./PatientRunReadouts";

// Banner shown above the Simulator when sliders were set from a patient profile.
export function PatientRunBanner({ label, patient, inputs, geo, therapy, onReset }: {
  label: string;
  patient: DemoPatient | null;
  inputs: Inputs;
  geo: Geometry;
  therapy: Therapy | null;
  onReset: () => void;
}) {
  return (
    <>
      <p className="mb-3 border-l-2 border-primary pl-3 text-xs" data-testid="patient-run-banner">Sliders set from {label}: membrane potential, labile iron and antioxidant capacity (inverse MitoSOX proxy). {patient ? <span data-testid="patient-run-lp">{lpMapping(patient).note}. </span> : null}A therapy, if named, is applied on top of that baseline. All other settings are simulated defaults; ATP-linked respiration, P/O and peroxide have no slider. <button type="button" className="text-primary underline underline-offset-2" onClick={onReset}>Reset to defaults</button></p>
      {patient && <PatientRunReadouts patient={patient} inputs={inputs} geo={geo} therapy={therapy} />}
    </>
  );
}
