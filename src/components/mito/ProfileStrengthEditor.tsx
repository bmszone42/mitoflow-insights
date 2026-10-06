import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DemoPatient } from "@/lib/mito/patientReference";
import { useProfileRirr } from "@/lib/mito/rirrDefault";

// Per-profile ROS-induced strength overrides. Each profile can carry its own
// strength (0-1.5x); empty means it follows the saved recalibrated default.
// Stored in this browser only. This is a tuning control, not a measured value.
export function ProfileStrengthEditor({ profiles, onChanged }: { profiles: DemoPatient[]; onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [overrides, setOverride] = useProfileRirr();
  const set = (id: string, raw: string) => {
    const n = Number(raw);
    setOverride(id, raw.trim() === "" || !Number.isFinite(n) ? null : n);
    onChanged?.();
  };
  if (!open) {
    return (
      <div className="border-y border-border py-4">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="dash-show-strength-editor">Set per-profile strength</Button>
      </div>
    );
  }
  return (
    <section className="space-y-2 border-y border-border py-4" data-testid="profile-strength-editor">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium">Per-profile ROS-induced strength</h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Hide</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Give a profile its own strength (0-1.5x) and every page uses it for that profile instead of the saved default. Leave blank to follow the default. Tuning control, not a measured value; stored in this browser only.
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
        {profiles.map((p) => (
          <label key={p.id} className="flex items-center justify-between gap-2">
            <span className="truncate">{p.label} <span className="text-muted-foreground">{p.phenotype}</span></span>
            <input
              data-testid={`profile-strength-${p.id}`}
              inputMode="decimal"
              placeholder="default"
              className="w-16 rounded border border-input bg-background px-1 py-0.5 text-right"
              value={p.id in overrides ? String(overrides[p.id]) : ""}
              onChange={(e) => set(p.id, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
