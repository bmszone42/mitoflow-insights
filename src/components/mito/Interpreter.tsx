import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Inputs, Outputs } from "@/lib/mito/model";
import { listScenarios, putScenario } from "@/lib/mito/scenarios";

export function Interpreter({
  inputs,
  out,
  activeId,
  initial,
  onSaved,
}: {
  inputs: Inputs;
  out: Outputs;
  activeId: string | null;
  initial?: { condition: string; text: string };
  onSaved: () => void;
}) {
  const [condition, setCondition] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCondition(initial?.condition ?? "");
    setText(initial?.text ?? "");
    setError(null);
  }, [initial, activeId]);

  const run = async () => {
    setBusy(true);
    setError(null);
    setText("");
    const ac = new AbortController();
    abortRef.current = ac;
    const { emissionSpectrum: _s, ...scalar } = out;
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, inputs, outputs: scalar }),
        signal: ac.signal,
      });
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
      setBusy(false);
      abortRef.current = null;
    }
  };

  const saveToScenario = async () => {
    const s = (await listScenarios()).find((x) => x.id === activeId);
    if (!s) return;
    await putScenario({ ...s, interpretation: { condition, text, at: Date.now() }, updatedAt: Date.now() });
    toast.success(`Saved to ${s.name}`);
    onSaved();
  };

  return (
    <section className="panel p-4">
      <div className="mono-label">Mechanistic interpretation (AI)</div>
      <p className="mt-1 text-xs text-muted-foreground">
        Describe the experimental condition. The current slider settings and model outputs are sent
        along for grounding.
      </p>
      <Textarea
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        placeholder="e.g. HepG2 cells, 50 µM deferoxamine for 24 h, then 660 nm at 10 J/cm2 under 5% O2"
        className="mt-3 min-h-[90px]"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={run} disabled={busy || condition.trim().length < 3}>
          {busy ? "Interpreting..." : "Interpret"}
        </Button>
        {busy && (
          <Button variant="outline" onClick={() => abortRef.current?.abort()}>
            Stop
          </Button>
        )}
        {!busy && text && activeId && (
          <Button variant="secondary" onClick={saveToScenario}>
            Save to scenario
          </Button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {busy && !text && <p className="mt-3 animate-pulse text-xs text-muted-foreground">Thinking...</p>}
      {text && (
        <div className="prose prose-sm prose-invert mt-4 max-w-none text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h2]:text-primary">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}
