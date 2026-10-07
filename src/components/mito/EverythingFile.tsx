import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportEverything, importEverything } from "@/lib/mito/backup";

export function EverythingFile() {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

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

  return (
    <section className="mt-6 rounded-md border border-border p-3" data-testid="everything-file">
      <h2 className="text-sm font-semibold">Move everything to another browser</h2>
      <p className="text-[11px] text-muted-foreground">One file with your saved visits, logged runs, snap plan, band, default and per-profile strengths, strength history and selected profile. Loading it adds visits and runs (duplicates skipped) and replaces the settings here, then reloads the page.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={download}>Download everything</Button>
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>Load everything file</Button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" aria-label="Everything file" onChange={(e) => upload(e.target.files?.[0])} />
        {msg && <span className="text-xs text-muted-foreground" role="status">{msg}</span>}
      </div>
    </section>
  );
}
