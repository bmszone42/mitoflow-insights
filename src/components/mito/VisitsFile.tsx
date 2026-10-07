import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportVisits, importVisits, useVisits } from "@/lib/mito/timeline";

export function VisitsFile() {
  const all = useVisits();
  const saved = all.filter((v) => v.origin === "user" || v.origin === "real" || v.origin === "plan").length;
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const download = () => {
    const blob = new Blob([JSON.stringify(exportVisits(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cristae-lab-visits-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    try {
      const r = importVisits(JSON.parse(await f.text()));
      setMsg(`Added ${r.added} visit${r.added === 1 ? "" : "s"}, skipped ${r.skipped} already here${r.invalid ? `, ${r.invalid} unreadable` : ""}.`);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not read this file."); }
    if (input.current) input.current.value = "";
  };

  return (
    <section className="mt-6 rounded-md border border-border p-3" data-testid="visits-file">
      <h2 className="text-sm font-semibold">Move saved visits between browsers</h2>
      <p className="text-[11px] text-muted-foreground">Saves your added visits, real measurements and plan rows ({saved} now) to a file. Opening that file in another browser adds them there; visits already present are skipped.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={download} disabled={!saved}>Download visits file</Button>
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>Load visits file</Button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" aria-label="Visits file" onChange={(e) => upload(e.target.files?.[0])} />
        {msg && <span className="text-xs text-muted-foreground" role="status">{msg}</span>}
      </div>
    </section>
  );
}
