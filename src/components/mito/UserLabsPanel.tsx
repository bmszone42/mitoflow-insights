import { useRef, useState } from "react";
import { FileUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoPatients, formatRangeText, outsideText, patientMetrics, referenceFor, type PatientMetricKey } from "@/lib/mito/patientReference";
import { addUserPatient, csvTemplate, parseCsv, removeUserPatient, toAppUnit, useUserPatients, type UserEntry } from "@/lib/mito/userPatients";

type Row = { key: PatientMetricKey; raw: string; unit: string; printedRange?: string | null; sourceText?: string };
const metricUnit = (k: PatientMetricKey) => patientMetrics.find((m) => m.key === k)!.unit;

async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, 2000 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
const readDataUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });

export function UserLabsPanel({ onAdded }: { onAdded?: (id: string) => void }) {
  const users = useUserPatients();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [age, setAge] = useState("40");
  const [sex, setSex] = useState<"F" | "M">("F");
  const [fasting, setFasting] = useState(true);
  const [name, setName] = useState("");
  const [via, setVia] = useState<"manual" | "csv" | "file">("manual");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const reset = () => { setRows([]); setMsg(null); setVia("manual"); setName(""); };

  async function onFile(f: File) {
    setMsg(null);
    if (f.size > 8_000_000) { setMsg("File too large. Use one under 8 MB."); return; }
    setBusy(true);
    try {
      const isPdf = f.type === "application/pdf";
      if (isPdf && f.size > 4_000_000) { setMsg("PDF too large. Use one under 4 MB, or a photo of the page."); return; }
      const data = isPdf ? await readDataUrl(f) : await shrinkImage(f);
      const res = await fetch("/api/extract-labs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: data, filename: f.name.replace(/[^\w.-]/g, "").slice(0, 80) }) });
      const j = await res.json();
      if (!res.ok) { setMsg(j.error ?? "Reading failed."); return; }
      setRows(j.items.map((i: { key: PatientMetricKey; value: number; unit: string; printedRange?: string | null; sourceText: string }) => ({ key: i.key, raw: String(i.value), unit: i.unit, printedRange: i.printedRange, sourceText: i.sourceText })));
      if (typeof j.age === "number") setAge(String(j.age));
      if (j.sex) setSex(j.sex);
      if (typeof j.fasting === "boolean") setFasting(j.fasting);
      setVia("file");
      setMsg(j.items.length ? `Read ${j.items.length} values. Check each one against your report before adding. ${j.notes ?? ""}` : `No matching tests found. ${j.notes ?? ""}`);
    } catch { setMsg("Reading failed. Please try again."); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function onCsv(f: File) {
    const { entries, error } = parseCsv(await f.text());
    if (error) { setMsg(error); return; }
    setRows(entries.map((e) => ({ key: e.key, raw: String(e.value), unit: e.unit ?? metricUnit(e.key) })));
    setVia("csv"); setMsg(`Loaded ${entries.length} values from CSV.`);
    if (csvRef.current) csvRef.current.value = "";
  }

  const converted = rows.map((r) => {
    const n = Number(r.raw);
    if (r.raw.trim() === "" || !Number.isFinite(n)) return { r, ok: false as const, why: "Not a number" };
    const c = toAppUnit(r.key, n, r.unit);
    if (!c) return { r, ok: false as const, why: `Unit "${r.unit}" not understood; expected ${metricUnit(r.key)}` };
    return { r, ok: true as const, value: c.value, note: c.note };
  });
  const usable = converted.filter((c) => c.ok);
  const ageNum = Number(age);
  const draft = { ...demoPatients[0], age: Number.isFinite(ageNum) ? ageNum : 40, sex, fasting };
  const rangeFor = (k: PatientMetricKey) => referenceFor(draft, patientMetrics.find((m) => m.key === k)!);

  function add() {
    if (!usable.length || !Number.isFinite(ageNum) || ageNum < 0 || ageNum > 120) return;
    const entries: UserEntry[] = usable.map((c) => ({ key: c.r.key, value: c.value!, unit: metricUnit(c.r.key), sourceText: c.r.sourceText }));
    const p = addUserPatient({ name, age: Math.round(ageNum), sex, fasting, entries, via });
    reset(); setOpen(false); onAdded?.(p.id);
  }

  const download = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csvTemplate], { type: "text/csv" })); a.download = "lab-results-template.csv"; a.click(); };

  return <section aria-label="Your lab results" className="space-y-3 border border-border p-4" data-testid="user-labs">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-sm font-semibold">Your lab results</h3><p className="text-xs text-muted-foreground">Add de-identified results by hand, CSV, or a PDF or photo of a lab report. Kept in this tab only.</p></div>
      <Button size="sm" variant={open ? "ghost" : "outline"} onClick={() => { setOpen(!open); reset(); }} data-testid="user-labs-toggle">{open ? "Close" : <><Plus className="mr-1 size-4" aria-hidden />Add results</>}</Button>
    </div>
    {users.length > 0 && <ul className="flex flex-wrap gap-2 text-xs">{users.map((u) => <li key={u.id} className="flex items-center gap-1 border border-border px-2 py-1">{u.label} · {u.age}y<button aria-label={`Remove ${u.label}`} onClick={() => removeUserPatient(u.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button></li>)}</ul>}
    {open && <div className="space-y-3">
      <p className="border-l-2 border-destructive pl-3 text-xs" role="note">Before uploading, cover or crop names, birth dates, record numbers and addresses. A photo or PDF is sent once to the AI for reading and is never stored. Nothing here is saved. Not a medical diagnosis.</p>
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" data-testid="user-labs-file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-1 size-4 animate-spin" aria-hidden /> : <FileUp className="mr-1 size-4" aria-hidden />}{busy ? "Reading report..." : "Upload PDF or photo"}</Button>
        <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" data-testid="user-labs-csv" onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])} />
        <Button size="sm" variant="outline" onClick={() => csvRef.current?.click()}><Upload className="mr-1 size-4" aria-hidden />Upload CSV</Button>
        <Button size="sm" variant="ghost" onClick={download}>CSV template</Button>
        <Button size="sm" variant="ghost" onClick={() => setRows([...rows, { key: "lactate", raw: "", unit: metricUnit("lactate") }])}>Add a test by hand</Button>
      </div>
      {msg && <p className="text-xs" role="status" data-testid="user-labs-msg">{msg}</p>}
      <div className="grid gap-2 sm:grid-cols-4">
        <label className="text-xs">Label (no names)<Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Sample A" className="mt-1 h-8" /></label>
        <label className="text-xs">Age<Input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" className="mt-1 h-8" /></label>
        <label className="text-xs">Sex<select value={sex} onChange={(e) => setSex(e.target.value as "F" | "M")} className="mt-1 h-8 w-full border border-input bg-background px-2"><option value="F">Female</option><option value="M">Male</option></select></label>
        <label className="flex items-end gap-2 text-xs"><input type="checkbox" checked={fasting} onChange={(e) => setFasting(e.target.checked)} />Fasting sample</label>
      </div>
      {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs" data-testid="user-labs-review">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="py-1">Test</th><th>Value</th><th>Unit</th><th>Used as</th><th>Healthy range</th><th>From report</th><th /></tr></thead>
        <tbody>{converted.map((c, i) => <tr key={i} className="border-t border-border/60">
          <td className="py-1 pr-2"><select value={c.r.key} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, key: e.target.value as PatientMetricKey } : r))} className="h-7 border border-input bg-background px-1">{patientMetrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></td>
          <td className="pr-2"><Input value={c.r.raw} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, raw: e.target.value } : r))} className="h-7 w-24" /></td>
          <td className="pr-2"><Input value={c.r.unit} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, unit: e.target.value } : r))} className="h-7 w-28" /></td>
          <td className={`pr-2 font-mono ${c.ok ? "" : "text-destructive"}`}>{c.ok ? `${c.value} ${metricUnit(c.r.key)}${c.note ? ` (${c.note})` : ""}` : c.why}</td>
          <td className="max-w-[200px] pr-2">{(() => { if (!c.ok) return <span className="text-muted-foreground">-</span>; const rr = rangeFor(c.r.key); if (!rr.range) return <span className="text-muted-foreground">{rr.reason}</span>; const out = outsideText(c.value, rr.range); return <span>{formatRangeText(rr.range)} {rr.range.unit}{rr.range.kind === "Research" ? " (research band, not a lab range)" : ""}{out ? <span className="block text-destructive">{out}</span> : <span className="block text-muted-foreground">Within range</span>}</span>; })()}</td>
          <td className="max-w-[220px] pr-2 text-muted-foreground">{c.r.sourceText ?? ""}{c.r.printedRange ? ` · range ${c.r.printedRange}` : ""}</td>
          <td><button aria-label="Remove row" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="flex items-center gap-3"><Button size="sm" onClick={add} disabled={!usable.length} data-testid="user-labs-add">Add as profile ({usable.length} values)</Button><span className="text-[11px] text-muted-foreground">Missing tests are filled from the healthy synthetic profile and marked as synthetic.</span></div>
    </div>}
  </section>;
}
