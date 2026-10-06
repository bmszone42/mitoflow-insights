import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoPatients, type DemoPatient } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { therapies } from "@/lib/mito/treatment";
import { clearRuns, listRuns, type RunRecord, type RunSource } from "@/lib/mito/runs";
import { NotYetRun } from "@/components/mito/NotYetRun";
import { StrengthHistory } from "@/components/mito/StrengthHistory";
import { RecalibrateStrength } from "@/components/mito/RecalibrateStrength";
import { StrengthRange } from "@/components/mito/StrengthRange";
import { useStrengthRange } from "@/lib/mito/rangeState";

// Lazy so recharts stays out of the initial Progress bundle.
const RunHistoryChart = lazy(() =>
  import("@/components/mito/RunHistoryChart").then((m) => ({ default: m.RunHistoryChart })),
);

export const Route = createFileRoute("/runs")({
  head: () => ({
    meta: [
      { title: "Scenario progress - Cristae Lab" },
      { name: "description", content: "Local log of which patient profiles, therapies and model doses have been simulated, so runs are not repeated. Stored in this browser only." },
      { property: "og:title", content: "Scenario progress - Cristae Lab" },
      { property: "og:description", content: "Local log of simulated profile, therapy and dose combinations. Research model only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RunsPage,
});

const sourceLabels: Record<RunSource, string> = {
  dashboard: "Dashboard sweep",
  calculator: "Dose calculator",
  compare: "Therapy comparison",
  plan: "Therapy plan",
  timeline: "Timeline",
  progress: "Run missing (Progress)",
  scenario: "Scenario full run",
};

const therapyName = (id: string) => therapies.find((t) => t.id === id)?.name ?? id;
const doseLabel = (d: number) => (d === 0 ? "all doses" : `${d}x`);

function RunsPage() {
  const users = useUserPatients();
  const pool = useMemo(() => [...users, ...demoPatients], [users]);
  const [runs, setRuns] = useState<RunRecord[] | null>(null);
  const [range] = useStrengthRange();

  useEffect(() => { listRuns().then(setRuns); }, []);

  const byPatient = useMemo(() => {
    const m = new Map<string, RunRecord[]>();
    for (const r of runs ?? []) {
      const list = m.get(r.patientId) ?? [];
      list.push(r);
      m.set(r.patientId, list);
    }
    return m;
  }, [runs]);

  const profileOf = (id: string): DemoPatient | undefined => pool.find((p) => p.id === id);

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">Scenario progress</h1>
      <p className="text-sm text-muted-foreground">Which profiles, therapies and model doses you have already run, so simulations are not repeated. The log lives in this browser only; nothing is sent anywhere. Research model only, not medical advice.</p>
    </header>

    {runs === null && <p className="text-sm text-muted-foreground">Loading…</p>}
    {runs !== null && <RecalibrateStrength pool={pool} onRan={() => listRuns().then(setRuns)} />}
    {runs !== null && <StrengthHistory />}
    {runs !== null && <StrengthRange pool={pool} onRan={() => listRuns().then(setRuns)} />}
    {runs !== null && <NotYetRun pool={pool} runs={runs} onRan={() => listRuns().then(setRuns)} />}
    {runs !== null && runs.length === 0 && (
      <p className="text-sm text-muted-foreground" data-testid="runs-empty">Nothing logged yet. Open the <Link className="text-primary underline underline-offset-2" to="/dashboard">Dashboard</Link>, <Link className="text-primary underline underline-offset-2" to="/therapy-tools">Therapy tools</Link> or <Link className="text-primary underline underline-offset-2" to="/therapy-plan">Therapy plan</Link> and each combination you run appears here.</p>
    )}

    {runs !== null && runs.length > 0 && (
      <>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground" data-testid="runs-count">{runs.length} unique combinations across {byPatient.size} profiles.</p>
          <p className="text-xs text-muted-foreground" data-testid="runs-band-count">
            {runs.filter((r) => r.rirrStrength != null && r.rirrStrength >= range.lo && r.rirrStrength <= range.hi).length} of {runs.length} runs inside the band ({range.lo.toFixed(2)}x-{range.hi.toFixed(2)}x); rows are green inside and red outside or with no strength noted.
          </p>
          <Button variant="outline" size="sm" data-testid="runs-clear" onClick={async () => { await clearRuns(); setRuns([]); }}>
            <Trash2 className="size-4" aria-hidden /> Clear log
          </Button>
        </div>

        <section className="space-y-2" data-testid="runs-chart-section">
          <h2 className="text-lg font-medium">Superoxide change over time</h2>
          <p className="text-xs text-muted-foreground">Each dot is a logged run with a recorded superoxide change. Green means the run's ROS-induced strength sat inside your saved range, red means outside or not noted.</p>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading chart…</p>}>
            <RunHistoryChart runs={runs} range={range} />
          </Suspense>
        </section>

        {[...byPatient.entries()].map(([pid, list]) => {
          const p = profileOf(pid);
          return (
            <section key={pid} className="space-y-2" data-testid={`runs-profile-${pid}`}>
              <h2 className="text-lg font-medium">{p ? p.label : pid} <span className="text-sm font-normal text-muted-foreground">({list.length} combinations)</span></h2>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground">
                  <th className="py-1 font-normal">Where</th>
                  <th className="font-normal">Model dose</th>
                  <th className="font-normal">Therapies</th>
                  <th className="font-normal">ROS-induced strength</th>
                  <th className="font-normal">Real dose</th>
                  <th className="font-normal">Superoxide change</th>
                  <th className="font-normal">Times run</th>
                  <th className="font-normal">Last run</th>
                </tr></thead>
                <tbody>{list.map((r) => {
                  const inBand = r.rirrStrength != null && r.rirrStrength >= range.lo && r.rirrStrength <= range.hi;
                  return (
                  <tr key={r.id} data-testid="runs-row" className={inBand
                    ? "border-t border-border border-l-2 border-l-primary bg-primary/5"
                    : "border-t border-border border-l-2 border-l-destructive bg-destructive/5"}>
                    <td className="py-1">{sourceLabels[r.source]}</td>
                    <td>{doseLabel(r.dose)}</td>
                    <td className="max-w-md"><span className="text-muted-foreground">{r.therapyIds.map(therapyName).join(", ")}</span></td>
                    <td data-testid="runs-rirr" className={inBand ? "text-primary" : "text-destructive"}>{r.rirrStrength != null ? `${r.rirrStrength}x` : "not noted"}</td>
                    <td data-testid="runs-real-dose">{r.realDose ?? "-"}</td>
                    <td data-testid="runs-so-change">{r.soChangePct != null ? `${r.soChangePct.toFixed(1)}%` : "-"}</td>
                    <td>{r.count}{r.count > 1 && <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">repeated</span>}</td>
                    <td className="text-muted-foreground">{new Date(r.at).toLocaleString()}</td>
                  </tr>
                  );
                })}</tbody>
              </table>
            </section>
          );
        })}
      </>
    )}
  </main>;
}
