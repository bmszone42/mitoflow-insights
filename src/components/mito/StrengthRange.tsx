// Pick a strength range and see where each profile's effective ROS-induced
// strength (its own override, else the saved default, else 1.0x) falls.
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { savedRirrStrength, useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";
import { DEFAULT_RIRR_STRENGTH } from "@/lib/mito/scenarios";
import type { DemoPatient } from "@/lib/mito/patientReference";

export function StrengthRange({ pool }: { pool: DemoPatient[] }) {
  const saved = useSavedRirr();
  const [overrides] = useProfileRirr();
  const [lo, setLo] = useState(0.5);
  const [hi, setHi] = useState(1.0);

  const effective = (id: string) => overrides[id] ?? saved ?? savedRirrStrength() ?? DEFAULT_RIRR_STRENGTH * 2; // 1.0x model default
  const source = (id: string) => (overrides[id] != null ? "profile's own" : saved != null ? "saved default" : "model default");

  const rows = pool.map((p) => {
    const s = effective(p.id);
    return { p, s, src: source(p.id), inside: s >= lo && s <= hi };
  });
  const inCount = rows.filter((r) => r.inside).length;

  return (
    <section className="space-y-3 rounded-lg border border-border p-4" data-testid="strength-range">
      <div>
        <h2 className="text-lg font-medium">Strength range check</h2>
        <p className="text-sm text-muted-foreground">
          Pick a range and see where each profile's effective ROS-induced strength falls. Effective means the profile's own strength when set, else your saved default, else the 1.0x model default.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs">Range low: <span className="font-mono" data-testid="sr-lo">{lo.toFixed(2)}x</span></div>
          <Slider aria-label="Range low" className="mt-2" min={0} max={1.5} step={0.05} value={[lo]}
            onValueChange={(v) => setLo(Math.min(v[0] ?? lo, hi))} />
        </div>
        <div>
          <div className="text-xs">Range high: <span className="font-mono" data-testid="sr-hi">{hi.toFixed(2)}x</span></div>
          <Slider aria-label="Range high" className="mt-2" min={0} max={1.5} step={0.05} value={[hi]}
            onValueChange={(v) => setHi(Math.max(v[0] ?? hi, lo))} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground" data-testid="sr-count">{inCount} of {rows.length} profiles inside {lo.toFixed(2)}x to {hi.toFixed(2)}x.</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground">
          <th className="py-1 font-normal">Profile</th>
          <th className="font-normal">Effective strength</th>
          <th className="font-normal">Source</th>
          <th className="font-normal">In range</th>
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.p.id} className="border-t border-border" data-testid="sr-row">
            <td className="py-1 pr-2">{r.p.label}</td>
            <td className="pr-2 font-mono">{r.s.toFixed(2)}x</td>
            <td className="pr-2 text-muted-foreground">{r.src}</td>
            <td className={r.inside ? "text-primary" : "text-destructive"} data-testid="sr-inside">{r.inside ? "inside" : "outside"}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}
