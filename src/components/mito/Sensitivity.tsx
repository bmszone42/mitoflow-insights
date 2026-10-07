import { useEffect, useMemo, useRef, useState } from "react";
import { putScenario, type Scenario } from "@/lib/mito/scenarios";
import { snapshotOf } from "./Scenarios";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  simulate,
  sensitivity,
  sensitivityDrivers,
  sensOutputs,
  sweep,
  type Geometry,
  type Inputs,
  type SensOutputKey,
} from "@/lib/mito/model";
import { sensitivityCsv } from "@/lib/mito/csv";
import { IronLightMap, type IronLightPayload } from "./IronLightMap";
import { ProfileSensitivity } from "./ProfileSensitivity";

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
};
const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const TERM_OUTPUT: Record<string, SensOutputKey> = {
  light: "emission71THz", etc: "superoxide", h2o2: "hydrogenPeroxide", onoo: "peroxynitrite",
  nadh: "superoxide", succ: "superoxide", warburg: "superoxide",
  fes: "fesIntact", fe: "freeIron", oh: "hydroxylRadical", lipid: "cardiolipinOx", ferro: "ferroptosisRisk",
};

export function Sensitivity({ inputs, geo, onSaved, term, onDriverClick }: { inputs: Inputs; geo: Geometry; onSaved?: () => void; term?: { id: string; n: number } | null; onDriverClick?: (key: string) => void }) {
  const [delta, setDelta] = useState(0.2);
  const [output, setOutput] = useState<SensOutputKey>("superoxide");
  const [driver, setDriver] = useState<keyof Inputs>("labileIron");
  const [lightKey, setLightKey] = useState<"redDose" | "nirDose">("redDose");
  const [mapOutput, setMapOutput] = useState<SensOutputKey>("hydroxylRadical");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [source, setSource] = useState<"table" | "map">("table");
  useEffect(() => {
    const k = term ? TERM_OUTPUT[term.id] : undefined;
    if (k) setOutput(k);
  }, [term]);
  const [savedName, setSavedName] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [cooldownUntil]);
  const cooling = Math.max(0, Math.ceil((cooldownUntil - Math.max(now, Date.now())) / 1000));

  const sens = useMemo(() => sensitivity(inputs, delta), [inputs, delta]);
  const sweepData = useMemo(
    () =>
      sweep(inputs, driver).map((r) => ({
        ...r,
        fesPct: (r["fesIntact"] ?? 0) * 100,
      })),
    [inputs, driver],
  );

  const WARBURG_KEYS = new Set(["nadhRatio", "succinate"]);
  const fuelFocus = term && ["warburg", "nadh", "succ"].includes(term.id);
  const tornado = sens
    .map((s) => ({
      name: s.driver.label,
      key: s.driver.key as string,
      down: s.down[output],
      up: s.up[output],
      span: Math.abs(s.up[output]) + Math.abs(s.down[output]),
    }))
    .sort((a, b) => b.span - a.span);

  const maxAbs = Math.max(
    1,
    ...sens.flatMap((s) => sensOutputs.map((o) => Math.max(Math.abs(s.up[o.key]), Math.abs(s.down[o.key])))),
  );
  const dDef = sensitivityDrivers.find((d) => d.key === driver)!;
  const outLabel = sensOutputs.find((o) => o.key === output)!.label;
  const thzTop = tornado.slice(0, 3).map((t) => {
    const s = sens.find((x) => x.driver.label === t.name)!;
    return { name: t.name, up: s.up["emission71THz"], down: s.down["emission71THz"] };
  });

  const mapPayloadRef = useRef<IronLightPayload | null>(null);

  const autoSave = async (mode: "table" | "map", body: string) => {
    const lightLabel = lightKey === "redDose" ? "660 nm" : "810 nm";
    const outLbl = sensOutputs.find((o) => o.key === mapOutput)!.label;
    const condition =
      mode === "map"
        ? `Interaction map: labile iron x ${lightLabel} dose, shown output ${outLbl}`
        : `Sensitivity table, step ${(delta * 100).toFixed(0)}% of range`;
    const now = Date.now();
    const name = `${mode === "map" ? `Map: Fe x ${lightLabel} (${outLbl})` : "Sensitivity"} ${new Date(now).toLocaleString()}`;
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      notes: `Saved automatically with the AI interpretation. ${condition}.`,
      inputs,
      geometry: { ...geo },
      snapshot: snapshotOf(simulate(inputs, geo)),
      interpretation: { condition, text: body, at: now },
      createdAt: now,
      updatedAt: now,
    };
    try {
      await putScenario(scenario);
      setSavedName(name);
      onSaved?.();
    } catch (e) {
      setError(`Interpretation done, but saving the scenario failed: ${(e as Error).message}`);
    }
  };

  const explain = async (mode: "table" | "map" = "table") => {
    setBusy(true);
    setError(null);
    setText("");
    setSource(mode);
    setSavedName(null);
    if (mode === "map") panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    let full = "";
    let ok = false;
    setCooldownUntil(Date.now() + 10_000);
    setNow(Date.now());
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/explain-sensitivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta,
          inputs,
          rows:
            mode === "map"
              ? []
              : sens.map((s) => ({
                  driver: s.driver.label,
                  group: s.driver.group,
                  down: s.down,
                  up: s.up,
                })),
          ...(mode === "map" && mapPayloadRef.current ? { map: mapPayloadRef.current } : {}),
        }),
        signal: ac.signal,
      });
      const r = res.headers.get("X-RateLimit-Remaining");
      if (r !== null) setRemaining(Number(r));
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        setText((t) => t + chunk);
      }
      ok = full.trim().length > 0 && !full.includes("[Stream interrupted]");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
    if (ok) await autoSave(mode, full);
  };

  return (
    <div className="space-y-4">
      <section className="panel flex flex-wrap items-end gap-6 p-4">
        <div className="min-w-[220px] flex-1">
          <div className="mono-label">Perturbation step</div>
          <div className="mt-1 text-sm">
            plus or minus {(delta * 100).toFixed(0)}% of each driver's full range
          </div>
          <Slider
            className="mt-3"
            min={0.05}
            max={0.5}
            step={0.05}
            value={[delta]}
            onValueChange={(v) => setDelta(v[0] ?? 0.2)}
          />
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Baseline is the current Simulator settings. Steps are a share of range, not of baseline, so
          drivers starting at zero (like light dose) still show their effect. Values are clamped to
          the slider limits.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const csv = sensitivityCsv(inputs, delta, driver, lightKey);
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "cristae-lab-sensitivity.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download CSV report
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="mono-label">Tornado: what moves {outLabel}</div>
            <Select value={output} onValueChange={(v) => setOutput(v as SensOutputKey)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sensOutputs.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer>
              <BarChart data={tornado} layout="vertical" stackOffset="sign" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip {...tip} formatter={(v: any, n) => [fmt(v), n === "down" ? "Driver down" : "Driver up"]} />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                {(["down", "up"] as const).map((k) => (
                  <Bar key={k} dataKey={k} stackId="a" cursor="pointer" onClick={(d: { payload?: { key?: string } }) => d?.payload?.key && onDriverClick?.(d.payload.key)}>
                    {tornado.map((t, i) => (
                      <Cell key={i} fill={t[k] >= 0 ? "var(--accent)" : "var(--primary)"} stroke={fuelFocus && WARBURG_KEYS.has(t.key) ? "var(--foreground)" : "none"} strokeWidth={fuelFocus && WARBURG_KEYS.has(t.key) ? 2 : 0} fillOpacity={fuelFocus && !WARBURG_KEYS.has(t.key) ? 0.35 : 1} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pink bars raise the output, green bars lower it. Longest bars matter most. Click a bar to highlight its part in the 3D view and the map.
            {term && TERM_OUTPUT[term.id] ? " Set from the pathway map box you clicked." : ""}
          </p>
          {fuelFocus && (() => {
            const f = tornado.filter((t) => WARBURG_KEYS.has(t.key));
            return (
              <p className="mt-1 text-[11px] text-foreground" data-testid="warburg-caption">
                Warburg levers (outlined): {f.map((t) => `${t.name} ${fmt(t.down)} down / ${fmt(t.up)} up`).join("; ")}. A Warburg shift lowers both, so read the down side for how much ETC leak falls when fuel is diverted to lactate.
              </p>
            );
          })()}
          <p className="mt-1 text-[11px] text-muted-foreground" data-testid="thz-caption">
            71 THz for the top {outLabel} drivers:{" "}
            {thzTop.map((t) => `${t.name} ${fmt(t.up)} up / ${fmt(t.down)} down`).join("; ")}.
            {output === "emission71THz" ? "" : " A driver that moves both means this term and the 71 THz coherence share a lever."}
          </p>
        </section>

        <section className="panel overflow-x-auto p-4">
          <div className="mono-label">Heatmap: driver up by one step</div>
          <table className="mt-3 w-full border-separate border-spacing-1 text-[11px]">
            <thead>
              <tr>
                <th />
                {sensOutputs.map((o) => (
                  <th key={o.key} className="font-mono font-normal text-muted-foreground">
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.map((s) => (
                <tr key={s.driver.key}>
                  <td className="whitespace-nowrap pr-2 text-muted-foreground">{s.driver.label}</td>
                  {sensOutputs.map((o) => {
                    const v = s.up[o.key];
                    const a = Math.min(1, Math.abs(v) / maxAbs);
                    const color = v >= 0 ? "var(--accent)" : "var(--primary)";
                    return (
                      <td
                        key={o.key}
                        title={`${s.driver.label} up: ${o.label} ${fmt(v)} (down: ${fmt(s.down[o.key])})`}
                        className="rounded px-1 py-2 text-center font-mono"
                        style={{
                          background: `color-mix(in oklch, ${color} ${Math.round(a * 85)}%, transparent)`,
                        }}
                      >
                        {Math.abs(v) < 0.5 ? "0" : v.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Percent change in each output. Hover a cell for up and down values.
          </p>
        </section>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mono-label">Sweep across full range</div>
          <Select value={driver} onValueChange={(v) => setDriver(v as keyof Inputs)}>
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sensitivityDrivers.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.group}: {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 h-80">
          <ResponsiveContainer>
            <LineChart data={sweepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[dDef.min, dDef.max]}
                tickFormatter={(v) => Number(v).toFixed(1)}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <YAxis
                yAxisId="ros"
                scale="log"
                domain={["auto", "auto"]}
                allowDataOverflow
                tickFormatter={(v) => Number(v).toPrecision(2)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                label={{ value: "ROS nM (log)", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis yAxisId="fe" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tip} formatter={(v: any) => Number(v).toPrecision(3)} labelFormatter={(v) => `${dDef.label} ${Number(v).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="ros" x={inputs[driver]} stroke="var(--foreground)" strokeDasharray="4 4" />
              <Line yAxisId="ros" dataKey="superoxide" name="O2•- nM" stroke="var(--chart-1)" dot={false} />
              <Line yAxisId="ros" dataKey="hydrogenPeroxide" name="H2O2 nM" stroke="var(--chart-2)" dot={false} />
              <Line yAxisId="ros" dataKey="peroxynitrite" name="ONOO- nM" stroke="var(--chart-3)" dot={false} />
              <Line yAxisId="ros" dataKey="lipidPeroxyl" name="LOO• nM" stroke="var(--chart-4)" dot={false} />
              <Line yAxisId="fe" dataKey="fesPct" name="Fe-S intact %" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line yAxisId="fe" dataKey="freeIron" name="Free Fe2+ µM" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Left axis: ROS on a log scale. Right axis: Fe-S intact (%) and free Fe2+ (µM). Dashed line
          marks the current baseline.
        </p>
      </section>

      <IronLightMap
        inputs={inputs}
        geo={geo}
        lightKey={lightKey}
        onLightKeyChange={setLightKey}
        mapOutput={mapOutput}
        onMapOutputChange={setMapOutput}
        interpreting={busy && source === "map"}
        onInterpret={(payload) => {
          mapPayloadRef.current = payload;
          void explain("map");
        }}
      />

      <section ref={panelRef} className="panel scroll-mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="mono-label">
            {source === "map" ? "Interaction map interpretation (AI)" : "Explain these results (AI)"}
          </div>
          {remaining !== null && (
            <span className="font-mono text-[10px] text-muted-foreground">{remaining} of 10 left (10 min)</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Sends the sensitivity table above to the AI and streams back an explanation of the dominant
          drivers, key parameter interactions and what they imply for ROS and Fe-S outputs.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => explain("table")} disabled={busy || cooling > 0 || remaining === 0}>
            {busy ? "Explaining..." : "Explain these results"}
          </Button>
          {busy && (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              Stop
            </Button>
          )}
          {!busy && cooling > 0 && (
            <span className="text-[11px] text-muted-foreground">Ready in {cooling}s</span>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {savedName && (
          <p className="mt-3 text-xs text-primary">Saved as scenario "{savedName}". Open it in Scenarios or Compare.</p>
        )}
        {busy && !text && (
          <p className="mt-3 animate-pulse text-xs text-muted-foreground">Thinking...</p>
        )}
        {text && (
          <div className="prose prose-sm prose-invert mt-4 max-w-none text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h2]:text-primary">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </section>
      <ProfileSensitivity geo={geo} />
    </div>
  );
}
