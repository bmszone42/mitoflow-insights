import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import type { Geometry, Inputs } from "@/lib/mito/model";
import { demoPatients } from "@/lib/mito/patientReference";
import { buildInterpretation, interpretationFacts } from "@/lib/mito/interpretation";
import { rosInputNames } from "@/lib/mito/rosPhysiology";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const healthy = demoPatients.find((p) => p.id === "demo-01")!;
const n = (v: number) => (v === 0 ? "0" : Number(v.toPrecision(3)).toString());

export function ClinicalInterpretation({ inputs, geo }: { inputs: Inputs; geo: Geometry }) {
  const [profileId, setProfileId] = useState("default");
  const profile = demoPatients.find((p) => p.id === profileId);
  const result = useMemo(() => buildInterpretation(inputs, geo, profile, healthy), [inputs, geo, profile]);
  const [ai, setAi] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const abort = useRef<AbortController | null>(null);

  async function expand() {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setAi(""); setAiState("loading");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ condition: `Flag interpretation vs ${result.comparisonName}`, inputs: { ...inputs }, outputs: {}, narrative: interpretationFacts(result) }),
      });
      if (!res.ok || !res.body) { const e = await res.json().catch(() => ({})); setAi(e.error ?? "AI request failed."); setAiState("error"); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; setAi((t) => t + dec.decode(value, { stream: true })); }
      setAiState("idle");
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setAi("AI request failed."); setAiState("error"); }
    }
  }

  const flagCount = result.atpFlagged.length + result.rosFlagged.length;
  return <section className="space-y-6" data-testid="clinical-interpretation" aria-labelledby="interp-heading">
    <div className="border-b border-border pb-4">
      <div className="mono-label">Model narrative</div>
      <h2 id="interp-heading" className="mt-1 text-xl font-semibold">Clinical interpretation</h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Research and teaching use only. This explains model flags from your current settings; it is not a diagnosis and uses no real patient data.</p>
    </div>

    <div>
      <label className="block text-xs font-medium" htmlFor="interp-profile">Comparison profile</label>
      <Select value={profileId} onValueChange={(v) => { setProfileId(v); setAi(""); }}>
        <SelectTrigger id="interp-profile" aria-label="Comparison profile" className="mt-2 w-full max-w-md" data-testid="interp-profile-select"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-[min(70vh,440px)]">
          <SelectItem value="default">Simulated default</SelectItem>
          {demoPatients.map((p) => <SelectItem key={p.id} value={p.id}>{p.label} · {p.age}y · {p.phenotype}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <section aria-label="Summary" className={`border-l-2 py-1 pl-3 ${flagCount ? "border-destructive" : "border-primary"}`}>
      <h3 className="text-sm font-semibold">Summary</h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed" data-testid="interp-summary">{result.summary}</p>
    </section>

    <section aria-label="Most likely causes">
      <h3 className="text-sm font-semibold">Most likely causes</h3>
      {result.causes.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">No changed setting has a detectable effect on a flagged row.</p> :
      <ol className="mt-2 space-y-3">{result.causes.map((c, i) => <li key={c.key} className="border-b border-border/60 pb-3 text-xs last:border-b-0" data-testid="interp-cause">
        <div className="font-medium"><span className="font-mono text-primary">{i + 1}.</span> {c.name}: {n(c.from)} to {n(c.to)} <span className="ml-2 font-mono text-muted-foreground">score {c.score.toFixed(2)}</span></div>
        {c.atpSteps.length > 0 && <p className="mt-1 text-muted-foreground">ATP: shifts effective cost for {c.atpSteps.join(", ")}.</p>}
        {c.rosSources.length > 0 && <p className="mt-1 text-muted-foreground">ROS: {c.rosSources.map((s) => `${s.label} ${s.delta > 0 ? "raised" : "lowered"} ${n(Math.abs(s.delta))} µM/s${s.direct ? "" : " (indirect)"}`).join("; ")}.</p>}
      </li>)}</ol>}
      <p className="mt-2 text-[11px] text-muted-foreground">Score = each one-at-a-time effect divided by its flag threshold (ATP cost band width, or 25% of the comparison ROS rate). A ranking aid, not a probability.</p>
    </section>

    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <section aria-label="Flagged ATP steps" className="min-w-0">
        <h3 className="text-sm font-semibold">ATP steps</h3>
        {result.atpFlagged.length === 0 ? <p className="mt-1 flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-3.5" aria-hidden />No ATP step flagged.</p> :
        <ul className="mt-2 space-y-2">{result.atpFlagged.map((s) => <li key={s.step} className="bg-destructive/10 px-2 py-2 text-xs" data-testid="interp-atp-step">
          <div className="flex items-center gap-2 font-medium"><AlertTriangle className="size-3.5 text-destructive" aria-hidden />{s.step}</div>
          {s.cause && <p className="mt-1 pl-5 text-muted-foreground">Slider cause: {s.cause}</p>}
          {s.evOutside && <p className="mt-1 pl-5 text-muted-foreground">Model parameter: fixed redox drop, not a slider change.</p>}
        </li>)}</ul>}
        <p className="mt-2 text-[11px] text-muted-foreground">Cost {result.cost.toFixed(2)} eV/ATP · NADH P/O {result.poNadh.toFixed(2)} (standard {result.poStd.toFixed(2)}).</p>
      </section>
      <section aria-label="Flagged ROS sources" className="min-w-0">
        <h3 className="text-sm font-semibold">ROS sources</h3>
        {result.rosFlagged.length === 0 ? <p className="mt-1 flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-3.5" aria-hidden />No ROS source flagged.</p> :
        <ul className="mt-2 space-y-2">{result.rosFlagged.map(({ row, effects, assay }) => <li key={row.label} className="bg-destructive/10 px-2 py-2 text-xs" data-testid="interp-ros-source">
          <div className="flex items-center gap-2 font-medium"><AlertTriangle className="size-3.5 text-destructive" aria-hidden /><span className="font-mono text-primary">{row.species}</span> {row.label}</div>
          <p className="mt-1 pl-5 text-muted-foreground">{n(row.base)} to {n(row.live)} µM/s. {effects[0] ? `Largest input effect: ${rosInputNames[effects[0].key]} (${effects[0].delta > 0 ? "+" : ""}${n(effects[0].delta)} µM/s${effects[0].direct ? "" : ", indirect"}).` : "No single changed input has a detectable effect; do not assign a cause."}</p>
          {assay && <p className="mt-1 pl-5 text-muted-foreground">Profile {assay.label}: {assay.percent >= 0 ? "+" : ""}{assay.percent.toFixed(0)}% vs healthy, {assay.flagged ? "also flagged (agrees)" : "not flagged (disagrees)"}.</p>}
        </li>)}</ul>}
      </section>
    </div>

    <section aria-label="AI expansion" className="space-y-2">
      <Button size="sm" variant="outline" onClick={expand} disabled={aiState === "loading"} data-testid="interp-ai-button"><Sparkles className="mr-1 size-4" aria-hidden />{aiState === "loading" ? "Writing…" : "Ask AI to expand"}</Button>
      {ai && <div className={`whitespace-pre-wrap border border-border p-3 text-xs leading-relaxed ${aiState === "error" ? "text-destructive" : ""}`} data-testid="interp-ai">{ai}</div>}
    </section>

    <section aria-label="Limits" className="text-xs leading-relaxed text-muted-foreground">
      <h3 className="text-sm font-semibold text-foreground">Limits</h3>
      <p className="mt-1">Effects come from resetting one setting at a time at the current state; they interact and do not add up. ATP cost uses a model-wide proxy band; ROS flags are a ±25% change from a simulation, not normal ranges. Profile assay flags are species-level, shared by every site of that ROS type, and come from synthetic data. Nothing here is saved.</p>
    </section>
  </section>;
}
