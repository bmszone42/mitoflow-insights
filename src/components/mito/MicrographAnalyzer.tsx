import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  geometryRanges,
  inputRanges,
  type Geometry,
  type Inputs,
  type Outputs,
} from "@/lib/mito/model";
import { listScenarios, putScenario } from "@/lib/mito/scenarios";

type Props = {
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  out: Outputs;
  geo: Geometry;
  setGeo: (g: Geometry) => void;
  activeId: string | null;
  onSaved: () => void;
};

type Parsed = {
  geometry: Partial<Geometry>;
  sliders: { key: keyof Inputs; value: number; reason: string }[];
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function resize(file: File, maxSide: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function parseTail(text: string): { prose: string; parsed: Parsed | null } {
  const i = text.indexOf("```json");
  if (i < 0) return { prose: text, parsed: null };
  const prose = text.slice(0, i).trim();
  const m = text.slice(i + 7).split("```")[0];
  try {
    const j = JSON.parse(m ?? "") as { geometry?: Record<string, unknown>; sliders?: unknown[] };
    const geometry: Partial<Geometry> = {};
    for (const [k, v] of Object.entries(j.geometry ?? {})) {
      const r = geometryRanges[k as keyof Geometry];
      if (r && typeof v === "number" && Number.isFinite(v))
        geometry[k as keyof Geometry] = Math.round(clamp(v, r.min, r.max) / r.step) * r.step;
    }
    const sliders: Parsed["sliders"] = [];
    for (const s of j.sliders ?? []) {
      const o = s as { key?: string; value?: unknown; reason?: unknown };
      const r = inputRanges[o.key as keyof Inputs];
      if (r && typeof o.value === "number" && Number.isFinite(o.value))
        sliders.push({
          key: o.key as keyof Inputs,
          value: clamp(o.value, r.min, r.max),
          reason: typeof o.reason === "string" ? o.reason : "",
        });
    }
    return { prose, parsed: { geometry, sliders } };
  } catch {
    return { prose, parsed: null };
  }
}

export function MicrographAnalyzer({ inputs, setInputs, out, geo, setGeo, activeId, onSaved }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [modality, setModality] = useState("");
  const [sample, setSample] = useState("");
  const [scale, setScale] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { prose, parsed } = useMemo(() => parseTail(text), [text]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast.error("Use a PNG, JPEG or WebP image.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB.");
    try {
      setImage(await resize(file, 1600, 0.85));
      setThumb(await resize(file, 240, 0.7));
      setText("");
      setError(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const analyze = async () => {
    if (!image) return;
    setBusy(true);
    setText("");
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, modality, sample, scale, inputs, outputs: out, geometry: geo }),
        signal: ac.signal,
      });
      setRemaining(res.headers.get("X-RateLimit-Remaining"));
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setText(acc);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const applyGeometry = () => {
    if (!parsed) return;
    setGeo({ ...geo, ...parsed.geometry });
    toast.success("Structure view updated");
  };
  const applySliders = (only?: keyof Inputs) => {
    if (!parsed) return;
    const next = { ...inputs };
    for (const s of parsed.sliders) if (!only || s.key === only) next[s.key] = s.value;
    setInputs(next);
    toast.success("Model sliders updated");
  };

  const save = async () => {
    if (!activeId || !thumb) return;
    const s = (await listScenarios()).find((x) => x.id === activeId);
    if (!s) return toast.error("Active scenario not found");
    await putScenario({ ...s, micrograph: { thumb, analysis: text, at: Date.now() }, updatedAt: Date.now() });
    onSaved();
    toast.success(`Saved into ${s.name}`);
  };

  const geoEntries = parsed ? (Object.entries(parsed.geometry) as [keyof Geometry, number][]) : [];

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Analyze a micrograph</h2>
        {remaining !== null && (
          <span className="font-mono text-[11px] text-muted-foreground">{remaining} AI requests left</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Upload a TEM, cryo-ET, confocal or super-resolution image. The AI identifies structural
        features and explains how they could shift ROS, Fe-S, iron and photon-response predictions.
        The image is sent to an AI provider and is not stored on the server; avoid uploading data you
        cannot share.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void onFile(e.dataTransfer.files[0]);
            }}
            className={`flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed text-center text-xs text-muted-foreground ${drag ? "border-primary" : "border-border"}`}
          >
            {image ? (
              <img src={image} alt="Uploaded micrograph" className="h-full w-full object-contain" />
            ) : (
              <span className="px-4">Drop an image here or click to choose. PNG, JPEG or WebP, up to 8 MB.</span>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Upload micrograph"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          <Input placeholder="Modality, e.g. TEM, 80 kV" value={modality} maxLength={120} onChange={(e) => setModality(e.target.value)} />
          <Input placeholder="Scale, e.g. 2.1 nm per px" value={scale} maxLength={120} onChange={(e) => setScale(e.target.value)} />
          <Textarea placeholder="Sample or condition (optional)" value={sample} maxLength={600} rows={3} onChange={(e) => setSample(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={analyze} disabled={!image || busy} className="flex-1">
              {busy ? "Analyzing..." : "Analyze"}
            </Button>
            {busy && (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                Stop
              </Button>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!text && !error && (
            <p className="text-sm text-muted-foreground">Results appear here as they stream in.</p>
          )}
          {prose && (
            <div className="prose prose-sm prose-invert max-w-none text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h2]:text-primary">
              <ReactMarkdown>{prose}</ReactMarkdown>
            </div>
          )}

          {parsed && !busy && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="mono-label">Suggested geometry</div>
                  <Button size="sm" variant="secondary" disabled={!geoEntries.length} onClick={applyGeometry}>
                    Apply
                  </Button>
                </div>
                {geoEntries.length === 0 && <p className="mt-2 text-xs text-muted-foreground">None suggested.</p>}
                {geoEntries.map(([k, v]) => (
                  <div key={k} className="mt-1 flex justify-between font-mono text-xs">
                    <span>{geometryRanges[k].label}</span>
                    <span>
                      {geo[k]} to <span className="text-primary">{v}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="mono-label">Suggested sliders</div>
                  <Button size="sm" variant="secondary" disabled={!parsed.sliders.length} onClick={() => applySliders()}>
                    Apply all
                  </Button>
                </div>
                {parsed.sliders.length === 0 && <p className="mt-2 text-xs text-muted-foreground">None suggested.</p>}
                {parsed.sliders.map((s) => (
                  <div key={s.key} className="mt-2 text-xs">
                    <div className="flex items-center justify-between gap-2 font-mono">
                      <span>{inputRanges[s.key].label}</span>
                      <span>
                        {Number(inputs[s.key].toPrecision(3))} to{" "}
                        <span className="text-primary">{Number(s.value.toPrecision(3))}</span>{" "}
                        {inputRanges[s.key].unit}
                        <Button size="sm" variant="ghost" className="ml-1 h-6 px-2" onClick={() => applySliders(s.key)}>
                          Apply
                        </Button>
                      </span>
                    </div>
                    {s.reason && <p className="text-muted-foreground">{s.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {text && !busy && (
            <div className="mt-4">
              <Button size="sm" variant="outline" disabled={!activeId} onClick={save}>
                {activeId ? "Save analysis into active scenario" : "Load or save a scenario to keep this analysis"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
