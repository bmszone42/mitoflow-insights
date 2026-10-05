import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import {
  deleteScenario,
  isScenario,
  listScenarios,
  putScenario,
  scenarioGeometry,
  type Scenario,
} from "@/lib/mito/scenarios";

export function snapshotOf(out: Outputs) {
  return {
    atpFlux: out.atpFlux,
    superoxide: out.superoxide,
    hydrogenPeroxide: out.hydrogenPeroxide,
    fesIntact: out.fesIntact,
    freeIron: out.freeIron,
    emission71THz: out.emission71THz,
  };
}

export function Scenarios({
  inputs,
  geo,
  out,
  onLoad,
  activeId,
  setActiveId,
  refreshKey,
  onChanged,
}: {
  inputs: Inputs;
  geo: Geometry;
  out: Outputs;
  onLoad: (s: Scenario) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  refreshKey: number;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<Scenario[]>([]);
  const [name, setName] = useState("");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const toggleCompare = (id: string) =>
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => listScenarios().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    refresh();
  }, [refreshKey]);

  const save = async (asNew: boolean) => {
    const now = Date.now();
    const existing = !asNew ? items.find((i) => i.id === activeId) : undefined;
    const s: Scenario = existing
      ? { ...existing, inputs, geometry: { ...geo }, snapshot: snapshotOf(out), updatedAt: now, name: name.trim() || existing.name }
      : {
          id: crypto.randomUUID(),
          name: name.trim() || `Scenario ${items.length + 1}`,
          notes: "",
          inputs,
          geometry: { ...geo },
          snapshot: snapshotOf(out),
          createdAt: now,
          updatedAt: now,
        };
    await putScenario(s);
    setActiveId(s.id);
    setName("");
    toast.success(existing ? "Scenario updated" : "Scenario saved");
    refresh();
    onChanged?.();
  };

  const rename = async (s: Scenario) => {
    const n = window.prompt("Rename scenario", s.name)?.trim();
    if (!n) return;
    await putScenario({ ...s, name: n, updatedAt: Date.now() });
    refresh();
    onChanged?.();
  };

  // Each scenario carries its own ROS-induced ROS release strength (assumed setting),
  // so loading it never falls back to whatever the Simulator currently shows.
  const setStrength = async (s: Scenario, value: number) => {
    const updated: Scenario = { ...s, inputs: { ...s.inputs, rirrStrength: value }, updatedAt: Date.now() };
    await putScenario(updated);
    if (s.id === activeId) onLoad(updated);
    refresh();
    onChanged?.();
  };

  const remove = async (s: Scenario) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    await deleteScenario(s.id);
    if (activeId === s.id) setActiveId(null);
    refresh();
    onChanged?.();
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cristae-lab-scenarios.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const list = (Array.isArray(data) ? data : [data]).filter(isScenario);
      for (const s of list) await putScenario(s);
      toast.success(`Imported ${list.length} scenario(s)`);
      refresh();
      onChanged?.();
    } catch {
      toast.error("Could not read that file");
    }
  };

  const active = items.find((i) => i.id === activeId);

  return (
    <section className="panel p-4">
      <div className="mono-label">Scenarios, saved in this browser</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={active ? `Name (current: ${active.name})` : "Scenario name"}
          className="min-w-[180px] flex-1"
        />
        {active && (
          <Button variant="secondary" onClick={() => save(false)}>
            Update
          </Button>
        )}
        <Button onClick={() => save(true)}>Save new</Button>
      </div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" onClick={exportAll} disabled={!items.length}>
          Export JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground">No saved scenarios yet.</li>
        )}
        {items.map((s) => (
          <li
            key={s.id}
            className={`rounded-md border p-2 text-xs ${s.id === activeId ? "border-primary" : "border-border"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <button className="text-left font-medium hover:text-primary" onClick={() => onLoad(s)}>
                {s.name}
              </button>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => rename(s)}>
                  Rename
                </Button>
                <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => remove(s)}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {new Date(s.updatedAt).toLocaleString()} | ATP {s.snapshot.atpFlux?.toFixed(0)} | O2•-{" "}
              {s.snapshot.superoxide?.toFixed(2)} nM | Fe-S {((s.snapshot.fesIntact ?? 0) * 100).toFixed(0)}%
              {s.interpretation ? " | AI note" : ""}
            </div>
            <label className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              ROS-induced strength (assumed):
              <select
                className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]"
                value={s.inputs.rirrStrength ?? 0.5}
                onChange={(e) => setStrength(s, Number(e.target.value))}
              >
                {[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5].map((v) => (
                  <option key={v} value={v}>
                    {v}x
                  </option>
                ))}
              </select>
              {s.inputs.rirrStrength == null && <span>(was Simulator default)</span>}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
