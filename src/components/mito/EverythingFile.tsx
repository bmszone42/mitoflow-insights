import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { describeBackup, exportEverything, importEverything } from "@/lib/mito/backup";
import { useVisits } from "@/lib/mito/timeline";
import { RANGE_EVENT } from "@/lib/mito/rangeState";
import { RIRR_HISTORY_EVENT } from "@/lib/mito/rirrDefault";

type Summary = Awaited<ReturnType<typeof describeBackup>>;

const EVENTS = [
  RANGE_EVENT,
  RIRR_HISTORY_EVENT,
  "cristae-lab-snap-plan",
  "cristae-lab-profile",
];

export function EverythingFile() {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const visits = useVisits();

  const refresh = useCallback(() => {
    describeBackup().then(setSummary).catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    refresh();
    for (const e of EVENTS) window.addEventListener(e, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      for (const e of EVENTS) window.removeEventListener(e, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh, visits]);

  const download = async () => {
    const blob = new Blob([JSON.stringify(await exportEverything(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cristae-lab-everything-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      const r = await importEverything(JSON.parse(await f.text()));
      setMsg(`Loaded ${r.visits} visits, ${r.runs} runs and ${r.settings} settings. Reloading...`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not read this file."); }
    if (input.current) input.current.value = "";
  };

  const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

  return (
    <section className="mt-6 rounded-md border border-border p-3" data-testid="everything-file">
      <h2 className="text-sm font-semibold">Move everything to another browser</h2>
      <p className="text-[11px] text-muted-foreground">One file with your saved visits, logged runs, snap plan, band, default and per-profile strengths, strength history and selected profile. Loading it adds visits and runs (duplicates skipped) and replaces the settings here, then reloads the page.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={download} data-testid="everything-download">Download everything</Button>
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>Load everything file</Button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" aria-label="Everything file" onChange={(e) => upload(e.target.files?.[0])} />
        {msg && <span className="text-[11px] text-muted-foreground" role="status">{msg}</span>}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground" data-testid="everything-summary">
        {summary
          ? `This file holds ${n(summary.visits, "saved visit")}, ${n(summary.runs, "logged run")}, ${n(summary.snaps, "snap plan row")}, a band of ${summary.band.lo.toFixed(2)}x-${summary.band.hi.toFixed(2)}x, ${summary.defaultStrength == null ? "no default strength" : `default strength ${summary.defaultStrength.toFixed(2)}x`}, ${n(summary.profileStrengths, "profile strength")}, ${n(summary.history, "strength history entry", "strength history entries")}${summary.selected ? `, selected profile ${summary.selected}` : ""}. Format version ${summary.version}, reference data version ${summary.referenceVersion}.`
          : "Counting what this file would carry..."}
      </p>
    </section>
  );
}
