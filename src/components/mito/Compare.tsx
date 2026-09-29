import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultInputs, geometryRanges, inputRanges, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import { listScenarios, scenarioGeometry, type Scenario } from "@/lib/mito/scenarios";
import { ShapeSketch, ShapeOverlay } from "@/components/mito/ShapeSketch";
import { liveAtpPerPair, etcSteps } from "@/lib/mito/reference";

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

// Estimate: glycolysis covers any shortfall below the default-condition ATP demand, with a 5% basal floor.
const ATP_DEMAND = simulate(defaultInputs).atpFlux;
function atpSplit(o: Outputs) {
  const glyco = Math.max(0.05 * ATP_DEMAND, ATP_DEMAND - o.atpFlux);
  const tot = glyco + o.atpFlux;
  return { respiration: o.atpFlux, glycolysis: glyco, glycolysisPct: tot > 0 ? (glyco / tot) * 100 : 0 };
}
function phenotype(i: Inputs) {
  return i.nadhRatio <= 0.1 && i.succinate <= 0.05 ? "glycolysis only" : i.nadhRatio < 0.4 && i.succinate < 0.4 ? "Warburg shift" : "respiration";
}

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

export function Compare({ refreshKey, onViewShape }: { refreshKey: number; onViewShape?: (g: Geometry) => void }) {
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
  const ga = useMemo(() => (a ? scenarioGeometry(a) : null), [a]);
  const gb = useMemo(() => (b ? scenarioGeometry(b) : null), [b]);
  const oa = useMemo(() => (ia && ga ? simulate(ia, ga) : null), [ia, ga]);
  const ob = useMemo(() => (ib && gb ? simulate(ib, gb) : null), [ib, gb]);

  // Per-step ATP rates and driver shares, shared by the energetics table and its bar chart.
  const etcRows = useMemo(() => {
    if (!oa || !ob || !ia || !ib) return null;
    const fluxOf = (o: Outputs, i: number) => (i <= 2 ? o.fluxCI : i === 3 ? o.fluxCII : o.fluxCIV);
    const rows = etcSteps.map((s, i) => {
      const ya = liveAtpPerPair(s, ia.deltaPsi, ia.uncoupling).proton;
      const yb = liveAtpPerPair(s, ib.deltaPsi, ib.uncoupling).proton;
      const ra = (ya * fluxOf(oa, i)) / 2;
      const rb = (yb * fluxOf(ob, i)) / 2;
      return { s, ya, yb, ra, rb, diff: rb - ra };
    });
    const totalAbs = rows.reduce((acc, r) => acc + Math.abs(r.diff), 0);
    const top = rows.reduce((best, r) => (Math.abs(r.diff) > Math.abs(best.diff) ? r : best), rows[0]!);
    return { rows, totalAbs, top };
  }, [oa, ob, ia, ib]);

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  useEffect(() => { setAiText(""); setAiErr(""); }, [aId, bId]);

  async function interpretDrivers() {
    if (!a || !b || !ia || !ib || !oa || !ob || !etcRows) return;
    setAiBusy(true); setAiErr(""); setAiText("");
    const nums = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "number" && Number.isFinite(v))) as Record<string, number>;
    const deltas: Record<string, number> = {};
    for (const [k, v] of Object.entries(nums(ob))) { const va = (oa as unknown as Record<string, unknown>)[k]; if (typeof va === "number") deltas[k] = v - va; }
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: `Compare scenario A "${a.name}" with scenario B "${b.name}". Explain which ETC steps dominate the ATP change from A to B. Outputs below are B minus A.`.slice(0, 2000),
          inputs: nums(ib),
          outputs: deltas,
          compare: {
            a: a.name.slice(0, 200), b: b.name.slice(0, 200), atpFluxA: oa.atpFlux, atpFluxB: ob.atpFlux,
            energy: (() => {
              const dir = (x: number, y: number) => (y - x > 1e-9 ? "up" : y - x < -1e-9 ? "down" : "none");
              return { a: atpSplit(oa), b: atpSplit(ob), nadhDirection: dir(ia.nadhRatio, ib.nadhRatio), succinateDirection: dir(ia.succinate, ib.succinate), phenotypeA: phenotype(ia), phenotypeB: phenotype(ib) };
            })(),
            steps: etcRows.rows.map((r) => ({
              step: r.s.step.slice(0, 80), ev: r.s.ev, atpPerPairA: r.ya, atpPerPairB: r.yb, rateA: r.ra, rateB: r.rb,
              sharePct: etcRows.totalAbs > 0 ? (Math.abs(r.diff) / etcRows.totalAbs) * 100 : 0,
              direction: r.diff > 1e-9 ? "up" : r.diff < -1e-9 ? "down" : "none",
            })),
          },
        }),
      });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `Request failed (${res.status})`); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setAiText(acc); }
    } catch (e) { setAiErr(e instanceof Error ? e.message : "AI request failed"); }
    finally { setAiBusy(false); }
  }

  if (shown.length < 2)
    return (
      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="mono-label">Compare scenarios</div>
          {presetCount > 0 && (
            <button
              className={`rounded-md border px-2 py-1 text-[11px] ${presetsOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              onClick={() => setPresetsOnly(!presetsOnly)}
            >
              Presets only ({presetCount})
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {presetsOnly ? "No preset scenarios yet. Click a preset button in the Simulator to save one." : "Save at least two scenarios to compare them."}
        </p>
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
          {shown.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.preset ? `${s.name} [${s.preset}]` : s.name}
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
        <div className="flex items-center gap-2">
          <div className="mono-label">Compare scenarios</div>
          {presetCount > 0 && (
            <button
              className={`rounded-md border px-2 py-1 text-[11px] ${presetsOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              onClick={() => setPresetsOnly(!presetsOnly)}
            >
              Presets only ({presetCount})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {picker(aId, setA, "A")}
          {picker(bId, setB, "B")}
        </div>
      </div>

      {a && b && ia && ib && ga && gb && oa && ob && (
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

          <div className="mt-4 border-t border-border pt-3">
            <div className="mono-label mb-2">Membrane shape</div>
            <div className="mb-3 grid gap-4 sm:grid-cols-2">
              {([["A", a, ga, "var(--primary)"], ["B", b, gb, "var(--accent)"]] as const).map(([tag, s, g, c]) => (
                <div key={tag}>
                  <ShapeSketch geo={g} color={c} label={`${tag}: ${s.name}`} />
                  {onViewShape && g && (
                    <button
                      type="button"
                      onClick={() => onViewShape({ ...g })}
                      className="mt-2 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                    >
                      View {tag} in 3D
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-3">
              <ShapeOverlay geoA={ga} geoB={gb} colorA="var(--primary)" colorB="var(--accent)" labelA={a.name} labelB={b.name} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-xs">
                <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-normal">Shape</th><th className="font-normal">A</th><th className="font-normal">B</th><th className="font-normal">B vs A</th></tr></thead>
                <tbody className="font-mono">
                  {(Object.keys(geometryRanges) as (keyof Geometry)[]).map((key) => (
                    <tr key={key} className="border-t border-border">
                      <td className="py-1 font-sans">{geometryRanges[key].label}</td>
                      <td>{ga[key]}</td><td>{gb[key]}</td><td><Delta a={ga[key]} b={gb[key]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!a.geometry || !b.geometry) && <p className="mt-2 text-xs text-muted-foreground">Older scenarios without a saved shape use the default membrane shape.</p>}
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <div className="mono-label mb-1">ETC step energetics</div>
            <p className="mb-2 text-xs text-muted-foreground">
              Live ATP yields, scaled by each scenario's membrane potential and uncoupling, with electron flux routed through the step. ATP rate = ATP per pair x flux / 2, relative units. CI steps use CI flux, CII its own, CIII/CIV/cyt c use CIV flux. Driver share shows how much of the total ATP rate gap each step explains.
            </p>
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 font-normal">Step</th>
                      <th className="font-normal">eV / e-</th>
                      <th className="font-normal">A: ATP / pair</th>
                      <th className="font-normal">B: ATP / pair</th>
                      <th className="font-normal">A: ATP rate</th>
                      <th className="font-normal">B: ATP rate</th>
                      <th className="font-normal">B vs A</th>
                      <th className="font-normal">Driver share</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {etcRows?.rows.map((r) => (
                      <tr key={r.s.step} className={`border-t border-border ${r === etcRows.top && etcRows.totalAbs > 0 ? "bg-primary/10" : ""}`}>
                        <td className="py-1 font-sans">{r.s.step}{r === etcRows.top && etcRows.totalAbs > 0 ? " *" : ""}</td>
                        <td>{r.s.ev > 0 ? "+" : ""}{r.s.ev}</td>
                        <td>{r.ya.toFixed(2)}</td>
                        <td>{r.yb.toFixed(2)}</td>
                        <td>{Number(r.ra.toPrecision(3))}</td>
                        <td>{Number(r.rb.toPrecision(3))}</td>
                        <td><Delta a={r.ra} b={r.rb} /></td>
                        <td>{etcRows.totalAbs > 0 ? `${((Math.abs(r.diff) / etcRows.totalAbs) * 100).toFixed(0)}%` : "-"}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border font-semibold">
                      <td className="py-1 font-sans">Whole chain ATP flux</td>
                      <td></td><td></td><td></td>
                      <td>{Number(oa.atpFlux.toPrecision(3))}</td>
                      <td>{Number(ob.atpFlux.toPrecision(3))}</td>
                      <td><Delta a={oa.atpFlux} b={ob.atpFlux} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {etcRows && etcRows.totalAbs > 0 && (
                <div className="h-72">
                  <div className="mono-label mb-1">Driver share, %</div>
                  <ResponsiveContainer>
                    <BarChart
                      data={etcRows.rows
                        .map((r) => {
                          const pct = r.ra === 0 ? (r.rb === 0 ? 0 : 100) : (r.diff / Math.abs(r.ra)) * 100;
                          return { name: r.s.step.replace("Complex", "C"), share: (Math.abs(r.diff) / etcRows.totalAbs) * 100, up: r.diff >= 0, pct, pctLabel: `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%` };
                        })
                        .sort((x, y) => y.share - x.share)}
                      layout="vertical"
                      margin={{ top: 4, right: 16, bottom: 0, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={10} unit="%" />
                      <YAxis type="category" dataKey="name" width={112} stroke="var(--muted-foreground)" fontSize={10} />
                      <Tooltip {...tip} formatter={(v: number, _n, item) => [`${v.toFixed(0)}% share, ${(item?.payload as { pctLabel?: string } | undefined)?.pctLabel ?? ""} B vs A`, "Driver share"]} />
                      <Bar dataKey="share" radius={[0, 3, 3, 0]}>
                        {etcRows.rows
                          .map((r) => {
                            const pct = r.ra === 0 ? (r.rb === 0 ? 0 : 100) : (r.diff / Math.abs(r.ra)) * 100;
                            return { name: r.s.step.replace("Complex", "C"), share: (Math.abs(r.diff) / etcRows.totalAbs) * 100, up: r.diff >= 0, pct };
                          })
                          .sort((x, y) => y.share - x.share)
                          .map((d, i) => (
                            <Cell key={i} fill={d.up ? "var(--primary)" : "var(--destructive)"} />
                          ))}
                        <LabelList dataKey="pctLabel" position="right" fontSize={10} fill="var(--muted-foreground)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    <span style={{ color: "var(--primary)" }}>Green</span>: B raises that step's ATP rate. <span style={{ color: "var(--destructive)" }}>Red</span>: B lowers it.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={interpretDrivers}
                disabled={aiBusy || !etcRows || etcRows.totalAbs === 0}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/80 disabled:opacity-50"
              >
                {aiBusy ? "Interpreting..." : "Interpret ATP drivers with AI"}
              </button>
              {etcRows && etcRows.totalAbs === 0 && <span className="ml-2 text-xs text-muted-foreground">No ATP gap between A and B to explain.</span>}
              {aiErr && <p className="mt-2 text-xs text-destructive">{aiErr}</p>}
              {aiText && (
                <div data-testid="driver-ai" className="prose prose-sm prose-invert mt-2 max-w-none text-sm">
                  <ReactMarkdown>{aiText}</ReactMarkdown>
                </div>
              )}
            </div>
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
