import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { inputRanges, type Inputs, type Outputs } from "@/lib/mito/model";
import { listScenarios, putScenario } from "@/lib/mito/scenarios";

type Suggestion = { key: keyof Inputs; value: number; reason: string; confidence: string };
const COOLDOWN_MS = 10_000;

export function Interpreter({
  inputs,
  setInputs,
  out,
  activeId,
  initial,
  onSaved,
}: {
  inputs: Inputs;
  setInputs: (fn: (p: Inputs) => Inputs) => void;
  out: Outputs;
  activeId: string | null;
  initial?: { condition: string; text: string } | undefined;
  onSaved: () => void;
}) {
  const [condition, setCondition] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<null | "interpret" | "suggest">(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCondition(initial?.condition ?? "");
    setText(initial?.text ?? "");
    setError(null);
  }, [initial]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [cooldownUntil]);
  const cooling = Math.max(0, Math.ceil((cooldownUntil - Math.max(now, Date.now())) / 1000));

  const start = (kind: "interpret" | "suggest") => {
    setBusy(kind);
    setError(null);
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    setNow(Date.now());
    const ac = new AbortController();
    abortRef.current = ac;
    return ac;
  };
  const trackRemaining = (res: Response) => {
    const r = res.headers.get("X-RateLimit-Remaining");
    if (r !== null) setRemaining(Number(r));
  };

  const run = async () => {
    const ac = start("interpret");
    setText("");
    const { emissionSpectrum: _s, ...scalar } = out;
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, inputs, outputs: scalar }),
        signal: ac.signal,
      });
      trackRemaining(res);
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  };

  const suggest = async () => {
    const ac = start("suggest");
    setSuggestions([]);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, inputs }),
        signal: ac.signal,
      });
      trackRemaining(res);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`);
      const list = (j.suggestions ?? []) as Suggestion[];
      if (!list.length) toast.message("No slider changes suggested for this condition");
      setSuggestions(list);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  };

  const apply = (list: Suggestion[]) => {
    setInputs((p) => {
      const n = { ...p };
      for (const s of list) n[s.key] = s.value;
      return n;
    });
    setSuggestions((cur) => cur.filter((c) => !list.includes(c)));
    toast.success(`Applied ${list.length} setting(s)`);
  };

  const saveToScenario = async () => {
    const s = (await listScenarios()).find((x) => x.id === activeId);
    if (!s) return;
    await putScenario({ ...s, interpretation: { condition, text, at: Date.now() }, updatedAt: Date.now() });
    toast.success(`Saved to ${s.name}`);
    onSaved();
  };

  const disabled = !!busy || condition.trim().length < 3 || cooling > 0 || remaining === 0;

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="mono-label">Mechanistic interpretation (AI)</div>
        {remaining !== null && (
          <span className="font-mono text-[10px] text-muted-foreground">{remaining} of 10 left (10 min)</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Describe the experimental condition. Interpret explains the current model state; Suggest
        settings proposes slider values for the condition.
      </p>
      <Textarea
        value={condition}
        maxLength={2000}
        onChange={(e) => setCondition(e.target.value)}
        placeholder="e.g. HepG2 cells, 50 µM deferoxamine for 24 h, then 660 nm at 10 J/cm2 under 5% O2"
        className="mt-3 min-h-[90px]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={disabled}>
          {busy === "interpret" ? "Interpreting..." : "Interpret"}
        </Button>
        <Button variant="secondary" onClick={suggest} disabled={disabled}>
          {busy === "suggest" ? "Suggesting..." : "Suggest settings"}
        </Button>
        {busy && (
          <Button variant="outline" onClick={() => abortRef.current?.abort()}>
            Stop
          </Button>
        )}
        {!busy && text && activeId && (
          <Button variant="ghost" onClick={saveToScenario}>
            Save to scenario
          </Button>
        )}
        {!busy && cooling > 0 && (
          <span className="text-[11px] text-muted-foreground">Ready in {cooling}s</span>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {suggestions.length > 0 && (
        <div className="mt-4 rounded-md border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="mono-label">Suggested settings</div>
            <Button size="sm" onClick={() => apply(suggestions)}>
              Apply all
            </Button>
          </div>
          <ul className="mt-2 space-y-2">
            {suggestions.map((s) => {
              const r = inputRanges[s.key];
              return (
                <li key={s.key} className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-medium">
                      {r.label}:{" "}
                      <span className="font-mono text-muted-foreground">
                        {inputs[s.key].toPrecision(3)} to {s.value.toPrecision(3)} {r.unit}
                      </span>{" "}
                      <span className="text-[10px] uppercase text-muted-foreground">{s.confidence}</span>
                    </div>
                    <div className="text-muted-foreground">{s.reason}</div>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => apply([s])}>
                    Apply
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {busy === "interpret" && !text && (
        <p className="mt-3 animate-pulse text-xs text-muted-foreground">Thinking...</p>
      )}
      {text && (
        <div className="prose prose-sm prose-invert mt-4 max-w-none text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h2]:text-primary">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}
