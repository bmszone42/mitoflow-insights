import { createFileRoute } from "@tanstack/react-router";
import { demoPatients } from "@/lib/mito/patientReference";
import { useProfileRirr, useSavedRirr } from "@/lib/mito/rirrDefault";
import { useStrengthRange } from "@/lib/mito/rangeState";
import { useSnapPlan } from "@/lib/mito/snapPlan";
import { SnapPlanPicker, type ProfileRow } from "@/components/mito/SnapPlanPicker";
import { SnapPlanSchedule } from "@/components/mito/SnapPlanSchedule";
import { SnapPlanProgress } from "@/components/mito/SnapPlanProgress";

export const Route = createFileRoute("/snap-plan")({
  head: () => ({
    meta: [
      { title: "Snap plan | Cristae Lab" },
      { name: "description", content: "Schedule which profiles snap to your strength band and when, then track progress by date." },
      { property: "og:title", content: "Snap plan | Cristae Lab" },
      { property: "og:description", content: "Pick profiles and dates for strength snaps and follow a progress tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SnapPlanPage,
});

function SnapPlanPage() {
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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Snap plan</h1>
        <p className="text-sm text-muted-foreground">
          Schedule strength snaps per profile against your saved band ({lo.toFixed(2)}x-{hi.toFixed(2)}x). Nothing applies on its own: a date only marks a snap due, and you confirm it. Everything stays in this browser.
        </p>
      </header>
      <SnapPlanProgress plan={plan} rows={rows} lo={lo} hi={hi} />
      <SnapPlanSchedule plan={plan} overrides={overrides} setOverride={setOverride} lo={lo} hi={hi} />
      <SnapPlanPicker rows={rows} lo={lo} hi={hi} />
    </main>
  );
}
