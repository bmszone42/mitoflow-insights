import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoPatients, originOf, outsideText, patientMetrics, percentOutside, referenceFor, type DemoPatient, type PatientMetric } from "@/lib/mito/patientReference";

const cases = demoPatients.filter((p) => p.source === "published-case" && p.id !== "demo-01");
const healthy = demoPatients[0];

function flag(p: DemoPatient, m: PatientMetric, v: number) {
  const r = referenceFor(p, m);
  if (!r.range) return { pct: null as number | null, text: r.reason };
  const pct = percentOutside(v, r.range);
  return { pct, text: outsideText(v, r.range) ?? `Within ${r.range.lo ?? ""}${r.range.lo !== undefined && r.range.hi !== undefined ? "-" : ""}${r.range.hi ?? ""}` };
}

function move(a: number | null, b: number | null) {
  if (a === null || b === null) return "No range";
  if (a === 0 && b === 0) return "Stays within";
  if (a === 0) return "Flag appears";
  if (b === 0) return "Flag clears";
  if (Math.sign(a) !== Math.sign(b)) return "Flips direction";
  return Math.abs(b) > Math.abs(a) ? "Flag grows" : Math.abs(b) < Math.abs(a) ? "Flag shrinks" : "Unchanged";
}

/** Published case values vs the invented profile and vs the healthy adult, per published test. */
export function PublishedFlagShift({ selectedId }: { selectedId: string }) {
  const [id, setId] = useState(cases.some((c) => c.id === selectedId) ? selectedId : cases[0]!.id);
  const p = cases.find((c) => c.id === id) ?? cases[0]!;
  const keys = patientMetrics.filter((m) => originOf(p, m.key).origin === "published");
  const cite = originOf(p, keys[0]!.key);
  return <section className="panel space-y-3 p-4 text-xs" data-testid="published-flag-shift">
    <div>
      <h3 className="text-sm font-semibold">How flags move with published patient values</h3>
      <p className="mt-1 text-muted-foreground">Each published test is flagged twice: against the invented value it replaced, and against the healthy adult. Lab ranges use this patient's age and sex. Research only, not a diagnosis.</p>
    </div>
    <Select value={id} onValueChange={setId}>
      <SelectTrigger aria-label="Published case" className="w-full max-w-md" data-testid="pfs-select"><SelectValue /></SelectTrigger>
      <SelectContent>{cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.label} · {c.age}y · {c.phenotype}</SelectItem>)}</SelectContent>
    </Select>
    <p className="text-muted-foreground">Source: <a className="text-primary underline underline-offset-2" href={cite.url} target="_blank" rel="noopener noreferrer">{cite.citation}</a></p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="text-muted-foreground"><tr><th className="py-1 pr-2 font-normal">Test</th><th className="pr-2 font-normal">Published</th><th className="pr-2 font-normal">vs invented value</th><th className="pr-2 font-normal">vs healthy adult</th></tr></thead>
        <tbody>{keys.map((m) => {
          const real = p.values[m.key], inv = p.inventedValues?.[m.key] ?? real, h = healthy.values[m.key];
          const fr = flag(p, m, real), fi = flag(p, m, inv), fh = flag(healthy, m, h);
          return <tr key={m.key} className="border-t border-border align-top" data-testid="pfs-row">
            <td className="py-1.5 pr-2 font-medium">{m.label}<div className="text-[10px] font-normal text-muted-foreground">{originOf(p, m.key).locator}</div></td>
            <td className="pr-2 font-mono">{real} {m.unit}<div className={fr.pct ? "text-destructive" : "text-muted-foreground"}>{fr.text}</div></td>
            <td className="pr-2 font-mono">{inv} {m.unit}<div className="text-muted-foreground">{fi.text}</div><div className="font-sans font-medium" data-testid="pfs-move-invented">{move(fi.pct, fr.pct)}</div></td>
            <td className="pr-2 font-mono">{h} {m.unit}<div className="text-muted-foreground">{fh.text}</div><div className="font-sans font-medium" data-testid="pfs-move-healthy">{move(fh.pct, fr.pct)}</div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="text-muted-foreground">Only tests reported in the paper are shown; the profile's other values are still invented. Healthy adult values are invented apart from ATP-linked respiration. Published values may come from different samples or time points.</p>
  </section>;
}
