import { useMemo } from "react";
import { inputRanges } from "@/lib/mito/model";
import type { DemoPatient } from "@/lib/mito/patientReference";
import { overlapReadouts, therapyOverlap } from "@/lib/mito/treatment";

const arrow = { up: "↑", down: "↓", flat: "–" } as const;

export function TherapyOverlap({ patient }: { patient: DemoPatient }) {
  const o = useMemo(() => therapyOverlap(patient), [patient]);
  return <section aria-label="Therapy overlap" className="space-y-4">
    <header className="space-y-1">
      <h2 className="text-lg font-semibold">Which therapies share these targets</h2>
      <p className="text-xs text-muted-foreground">Each therapy at 1x on {patient.label}'s baseline, grouped by the direction it moves model ATP flux, superoxide and H2O2 (changes under 1% count as flat). Shared targets mean the same model direction, not interchangeable treatments. Research model only.</p>
    </header>
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="px-3 py-2">Target pattern</th><th className="px-3 py-2">Therapies</th></tr></thead>
        <tbody>{o.groups.map((g) => <tr key={g.signature} data-testid="overlap-group" className="border-t border-border/60 align-top">
          <th scope="row" className="px-3 py-2 font-medium">{g.signature}</th>
          <td className="px-3 py-2">{g.members.map((m) => m.therapy.name).join(", ")} <span className="font-mono text-muted-foreground">({g.members.length})</span></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="px-3 py-2">Therapy</th>{overlapReadouts.map((r) => <th key={r.key} className="px-3 py-2">{r.label}</th>)}<th className="px-3 py-2">Shares targets with</th></tr></thead>
        <tbody>{o.perTherapy.map((t) => <tr key={t.therapy.id} data-testid="overlap-row" className="border-t border-border/60 align-top">
          <th scope="row" className="px-3 py-2 font-medium">{t.therapy.name}</th>
          {overlapReadouts.map((r) => <td key={r.key} className="px-3 py-2 font-mono">{arrow[t.dirs[r.key]]}</td>)}
          <td className="px-3 py-2">{t.total === 0 ? <span className="text-muted-foreground">Moves none of these readouts</span>
            : t.partners.length ? t.partners.slice(0, 4).map((p) => <div key={p.therapy.id}>{p.therapy.name} <span className="font-mono text-muted-foreground">{p.shared.length}/{t.total}</span>{p.sliders.length ? <span className="text-muted-foreground"> · same slider: {p.sliders.map((k) => inputRanges[k].label).join(", ")}</span> : null}</div>)
            : <span className="text-muted-foreground">No other therapy shares these</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}
