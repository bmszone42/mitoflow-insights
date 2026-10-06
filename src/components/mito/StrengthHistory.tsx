// History of every ROS-induced strength value used in this browser, with dates,
// so past runs can be compared. Reads localStorage after mount only.
import { lazy, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RIRR_HISTORY_EVENT, clearStrengthHistory, saveRirrStrength, strengthHistory, type StrengthHistoryEntry } from "@/lib/mito/rirrDefault";

const StrengthHistoryChart = lazy(() => import("./StrengthHistoryChart").then((m) => ({ default: m.StrengthHistoryChart })));


const KIND_LABEL: Record<StrengthHistoryEntry["kind"], string> = {
  "default-saved": "Default saved",
  "default-cleared": "Default cleared",
  "profile-set": "Profile strength set",
  "profile-cleared": "Profile strength cleared",
  "batch-run": "Batch run",
};

export function StrengthHistory() {
  const [rows, setRows] = useState<StrengthHistoryEntry[]>([]);
  const [all, setAll] = useState(false);
  useEffect(() => {
    const load = () => setRows(strengthHistory());
    load();
    window.addEventListener(RIRR_HISTORY_EVENT, load);
    return () => window.removeEventListener(RIRR_HISTORY_EVENT, load);
  }, []);

  function csv() {
    const lines = ["date,event,strength,detail", ...rows.map((r) =>
      [r.at, KIND_LABEL[r.kind], r.strength ?? "", `"${r.detail.replace(/"/g, '""')}"`].join(","))];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "strength-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const shown = all ? rows : rows.slice(0, 15);
  return <section className="space-y-2 rounded-lg border border-border p-4" data-testid="strength-history">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-medium">Strength history</h2>
        <p className="text-sm text-muted-foreground">Every ROS-induced strength you saved, cleared, set per profile or ran as a batch, newest first. Stored in this browser only.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!rows.length} onClick={csv}>Download CSV</Button>
        <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => { if (window.confirm("Clear the strength history?")) clearStrengthHistory(); }}>Clear history</Button>
      </div>
    </div>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No strength changes logged yet.</p> : <>
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded bg-muted" />}>
        <StrengthHistoryChart rows={rows} />
      </Suspense>

      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground"><tr><th className="py-1">Date</th><th>Event</th><th>Strength</th><th>Detail</th></tr></thead>
        <tbody>{shown.map((r, i) => <tr key={r.at + i} className="border-t border-border">
          <td className="py-1 pr-2 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
          <td className="pr-2">{KIND_LABEL[r.kind]}</td>
          <td className="pr-2 font-mono">{r.strength === null ? "default" : `${r.strength}x`}</td>
          <td className="text-muted-foreground">{r.detail}</td>
        </tr>)}</tbody>
      </table>
      {rows.length > 15 && <Button variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${rows.length}`}</Button>}
    </>}
  </section>;
}
