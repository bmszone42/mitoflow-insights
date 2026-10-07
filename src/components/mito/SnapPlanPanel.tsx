import { demoPatients } from "@/lib/mito/patientReference";
import { useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";
import { useStrengthRange } from "@/lib/mito/rangeState";
import { useSnapPlan } from "@/lib/mito/snapPlan";
import { SnapPlanPicker, type ProfileRow } from "@/components/mito/SnapPlanPicker";
import { SnapPlanSchedule } from "@/components/mito/SnapPlanSchedule";
import { SnapPlanProgress } from "@/components/mito/SnapPlanProgress";

export function SnapPlanPanel() {
  const saved = useSavedRirr();
  const [overrides, setOverride] = useProfileRirr();
  const [{ lo, hi }] = useStrengthRange();
  const plan = useSnapPlan();

  const rows: ProfileRow[] = demoPatients.map((p) => {
    const s = overrides[p.id] ?? saved ?? 1.0;
    const src = overrides[p.id] != null ? "profile's own" : saved != null ? "saved default" : "model default";
    return { id: p.id, label: p.label, s, src, inside: s >= lo - 1e-9 && s <= hi + 1e-9 };
  });

  return (
    <div className="space-y-6" data-testid="snap-plan-panel">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Schedule strength snaps per profile against your saved band ({lo.toFixed(2)}x-{hi.toFixed(2)}x). Nothing applies on its own: a date only marks a snap due, and you confirm it. Everything stays in this browser.
        </p>
      </header>
      <SnapPlanProgress plan={plan} rows={rows} lo={lo} hi={hi} />
      <SnapPlanSchedule plan={plan} overrides={overrides} setOverride={setOverride} lo={lo} hi={hi} />
      <SnapPlanPicker rows={rows} lo={lo} hi={hi} />
    </div>
  );
}
