import { useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addUserPatient, updateUserPatientValue, type UserDraft } from "@/lib/mito/userPatients";
import { formatRangeText, outsideText, patientMetrics, referenceFor, type DemoPatient } from "@/lib/mito/patientReference";

const metric = patientMetrics.find((m) => m.key === "membranePotential")!;

// Quick membrane potential reading entry. Feeds the selected user profile, or
// creates one holding only this reading, so the Patient Comparison slider
// drift check has a real value to flag against the cited 150-180 mV band.
export function MembranePotentialEntry({ patient, onAdded }: { patient: DemoPatient; onAdded: (id: string) => void }) {
  const [mv, setMv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const isUser = patient.source === "user";
  const ref = referenceFor(patient, metric);
  const current = patient.values.membranePotential;
  const currentOutside = ref.range ? outsideText(current, ref.range) : null;

  const apply = () => {
    const n = Number(mv);
    if (!Number.isFinite(n) || n < 0 || n > 300) { setMsg("Enter a reading between 0 and 300 mV."); return; }
    if (isUser) {
      updateUserPatientValue(patient.id, "membranePotential", n);
      setMsg(`Updated ${patient.label} to ${n} mV. Patient Comparison now flags it against the research band.`);
    } else {
      const draft: UserDraft = { name: `${patient.phenotype} with your reading`, age: patient.age, sex: patient.sex ?? "F", fasting: !patient.nonfasting, entries: [{ key: "membranePotential", value: n, unit: "mV" }], via: "manual" };
      const p = addUserPatient(draft);
      onAdded(p.id);
      setMsg(`Created "${p.label}" with your ${n} mV reading; all other values are synthetic fill.`);
    }
    setMv("");
  };

  return <section className="border border-border p-4" data-testid="membrane-entry">
    <div className="flex items-center gap-2"><Activity className="size-4 text-primary" aria-hidden /><h3 className="text-sm font-semibold">Membrane potential reading</h3></div>
    <p className="mt-1 text-xs text-muted-foreground">Enter a measured reading (for example from a potentiometric fluorescent probe) to give the Patient Comparison slider drift check a real value. The cited band is a research measurement, not a lab range.</p>
    <p className="mt-2 font-mono text-xs" data-testid="membrane-current">Selected profile: {current.toFixed(0)} mV{ref.range ? <> · band {formatRangeText(ref.range)} mV · <span className={currentOutside ? "text-destructive" : "text-primary"}>{currentOutside ?? "Within research band"}</span></> : <span className="text-muted-foreground"> · {ref.reason}</span>}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input type="number" inputMode="decimal" min={0} max={300} step={1} value={mv} onChange={(e) => setMv(e.target.value)} placeholder="Reading in mV" aria-label="Membrane potential reading in mV" data-testid="membrane-input" className="h-8 w-36 border border-input bg-background px-2 font-mono text-xs" />
      <Button size="sm" onClick={apply} data-testid="membrane-apply">{isUser ? "Update this profile" : "Add as your profile"}</Button>
    </div>
    {msg && <p className="mt-2 text-xs text-primary" role="status" data-testid="membrane-msg">{msg}</p>}
    <p className="mt-2 text-[11px] text-muted-foreground">{isUser ? "Updates the selected profile in this tab only." : "The selected profile is a fixed demo record, so your reading becomes a new tab-only profile carrying this age, sex and fasting state."} Probe calibration, cell type and preparation shift absolute values; the band is approximate (Zorova et al., Anal Biochem 2018).</p>
  </section>;
}
