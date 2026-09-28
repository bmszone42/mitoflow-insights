import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultInputs, inputRanges, simulate, type Inputs, type Outputs } from "@/lib/mito/model";
import { listScenarios, type Scenario } from "@/lib/mito/scenarios";

const outRows: { key: keyof Outputs; label: string; unit: string }[] = [
  { key: "atpFlux", label: "ATP flux", unit: "µM/s" },
  { key: "superoxide", label: "O2•-", unit: "nM" },
  { key: "hydrogenPeroxide", label: "H2O2", unit: "nM" },
  { key: "hydroxylRadical", label: "•OH", unit: "pM" },
  { key: "peroxynitrite", label: "ONOO-", unit: "nM" },
  { key: "singletOxygen", label: "1O2", unit: "pM" },
  { key: "lipidPeroxyl", label: "LOO•", unit: "nM" },
  { key: "fesIntact", label: "Fe-S intact", unit: "fraction" },
  { key: "aconitaseActivity", label: "Aconitase", unit: "%" },
  { key: "freeIron", label: "Free Fe2+", unit: "µM" },
  { key: "emission71THz", label: "71 THz (relative)", unit: "rel" },
  { key: "redoxStress", label: "Redox stress", unit: "index" },
  { key: "plooh", label: "PLOOH", unit: "nM" },
  { key: "cardiolipinOx", label: "Cardiolipin oxidized", unit: "%" },
  { key: "ferroptosisRisk", label: "Ferroptosis risk", unit: "/100" },
];
const rosKeys = ["superoxide", "hydrogenPeroxide", "peroxynitrite", "lipidPeroxyl"] as const;
const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 },
};

function Delta({ a, b }: { a: number; b: number }) {
  const d = b - a;
  const pct = a === 0 ? 0 : (d / Math.abs(a)) * 100;
  if (Math.abs(pct) < 0.5 && Math.abs(d) < 1e-9) return <span className="text-muted-foreground">0</span>;
  return (
    <span className={d > 0 ? "text-accent" : "text-primary"}>
      {d > 0 ? "+" : ""}
      {Number(d.toPrecision(3))} ({pct > 0 ? "+" : ""}
      {pct.toFixed(0)}%)
    </span>
  );
}

export function Compare({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<Scenario[]>([]);
  const [aId, setA] = useState<string>("");
  const [bId, setB] = useState<string>("");
  const [presetsOnly, setPresetsOnly] = useState(false);
  const sel = useRef({ a: "", b: "" });
  sel.current = { a: aId, b: bId };

  const presetCount = items.filter((s) => s.preset).length;
  // When "Presets only" is on, the pickers list just the scenarios saved from
  // preset buttons (tagged with their preset name).
  const shown = presetsOnly ? items.filter((s) => s.preset) : items;

  useEffect(() => {
    listScenarios()
      .then((l) => {
        setItems(l);
        const pool = presetsOnly ? l.filter((x) => x.preset) : l;
        const ids = new Set(pool.map((x) => x.id));
        const b = sel.current.b && ids.has(sel.current.b) ? sel.current.b : (pool[0]?.id ?? "");
        const pa = sel.current.a;
        const a = pa && ids.has(pa) && (pa !== b || pool.length < 2) ? pa : (pool.find((x) => x.id !== b)?.id ?? b);
        setA(a);
        setB(b);
      })
      .catch(() => setItems([]));
  }, [refreshKey, presetsOnly]);

  const a = items.find((i) => i.id === aId);
  const b = items.find((i) => i.id === bId);
  const ia = useMemo(() => (a ? { ...defaultInputs, ...a.inputs } : null), [a]);
  const ib = useMemo(() => (b ? { ...defaultInputs, ...b.inputs } : null), [b]);
  const oa = useMemo(() => (ia ? simulate(ia) : null), [ia]);
  const ob = useMemo(() => (ib ? simulate(ib) : null), [ib]);

  if (items.length < 2)
    return (
      <section className="panel p-4">
        <div className="mono-label">Compare scenarios</div>
        <p className="mt-2 text-xs text-muted-foreground">Save at least two scenarios to compare them.</p>
      </section>
    );

  const picker = (value: string, set: (v: string) => void, tag: string) => (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground">{tag}</span>
      <Select value={value} onValueChange={set}>
        <SelectTrigger className="h-8 w-[200px]">
          <SelectValue placeholder="Pick a scenario" />
        </SelectTrigger>
        <SelectContent>
          {items.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const chart =
    oa && ob
      ? [
          ...rosKeys.map((k) => ({
            name: outRows.find((r) => r.key === k)!.label,
            A: Math.max(1e-4, oa[k] as number),
            B: Math.max(1e-4, ob[k] as number),
          })),
        ]
      : [];
  const feChart =
    oa && ob
      ? [
          { name: "Fe-S intact %", A: oa.fesIntact * 100, B: ob.fesIntact * 100 },
          { name: "Aconitase %", A: oa.aconitaseActivity, B: ob.aconitaseActivity },
          { name: "Free Fe2+ µM", A: oa.freeIron, B: ob.freeIron },
        ]
      : [];

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="mono-label">Compare scenarios</div>
        <div className="flex flex-wrap gap-3">
          {picker(aId, setA, "A")}
          {picker(bId, setB, "B")}
        </div>
      </div>

      {a && b && ia && ib && oa && ob && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 font-normal">Output</th>
                  <th className="font-normal">A</th>
                  <th className="font-normal">B</th>
                  <th className="font-normal">B vs A</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {outRows.map((r) => (
                  <tr key={r.key} className="border-t border-border">
                    <td className="py-1 font-sans">
                      {r.label} <span className="text-[10px] text-muted-foreground">{r.unit}</span>
                    </td>
                    <td>{Number((oa[r.key] as number).toPrecision(3))}</td>
                    <td>{Number((ob[r.key] as number).toPrecision(3))}</td>
                    <td>
                      <Delta a={oa[r.key] as number} b={ob[r.key] as number} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 font-normal">Input</th>
                  <th className="font-normal">A</th>
                  <th className="font-normal">B</th>
                  <th className="font-normal">B vs A</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {(Object.keys(inputRanges) as (keyof Inputs)[]).map((k) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-1 font-sans">
                      {inputRanges[k].label}{" "}
                      <span className="text-[10px] text-muted-foreground">{inputRanges[k].unit}</span>
                    </td>
                    <td>{Number(ia[k].toPrecision(3))}</td>
                    <td>{Number(ib[k].toPrecision(3))}</td>
                    <td>
                      <Delta a={ia[k]} b={ib[k]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-64">
              <div className="mono-label mb-1">ROS, nM (log)</div>
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis scale="log" domain={["auto", "auto"]} allowDataOverflow stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => Number(v).toPrecision(2)} />
                  <Tooltip {...tip} formatter={(v: number) => Number(v).toPrecision(3)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="A" name={a.name} fill="var(--primary)" />
                  <Bar dataKey="B" name={b.name} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <div className="mono-label mb-1">Fe-S and iron</div>
              <ResponsiveContainer>
                <BarChart data={feChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip {...tip} formatter={(v: number) => Number(v).toPrecision(3)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="A" name={a.name} fill="var(--primary)" />
                  <Bar dataKey="B" name={b.name} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {(a.interpretation || b.interpretation) && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {[a, b].map((s, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="mono-label">{i === 0 ? "A" : "B"}: AI note</div>
                  {s.interpretation ? (
                    <div className="prose prose-sm prose-invert mt-2 max-w-none text-xs [&_h2]:text-sm [&_h2]:text-primary">
                      <p className="italic text-muted-foreground">{s.interpretation.condition}</p>
                      <ReactMarkdown>{s.interpretation.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No saved note.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
