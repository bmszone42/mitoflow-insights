import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultGeometry, simulate } from "@/lib/mito/model";
import { demoPatients, lpMapping, patientSex, h2o2BandCheck, projectedH2o2, projectedMitoSox, readoutChecks } from "@/lib/mito/patientReference";
import { useUserPatients } from "@/lib/mito/userPatients";
import { diagnoseProfile, flagOverlaps } from "@/lib/mito/diagnosis";
import { applyTherapyDose, calculatorDoses, metrics, profileInputs, therapies, type Therapy } from "@/lib/mito/treatment";
// Lazy so recharts and the chart code stay out of the initial dashboard bundle; loaded on first open.
const TherapyProfileChart = lazy(() => import("@/components/mito/TherapyProfileChart").then((m) => ({ default: m.TherapyProfileChart })));
const BaselineProfileChart = lazy(() => import("@/components/mito/BaselineProfileChart").then((m) => ({ default: m.BaselineProfileChart })));

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Patient dashboard: ATP, ROS and flags | Cristae Lab" },
    { name: "description", content: "Every patient profile with simulated ATP and ROS readouts, flag counts, top mechanism and overlapping disorders, linked to Diagnosis and the Simulator." },
    { property: "og:title", content: "Patient dashboard | Cristae Lab" },
    { property: "og:description", content: "One table of all profiles: model ATP and ROS, flags, top mechanism and disorder overlap. Research model only." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : Number(v.toPrecision(3)).toString());
const pct = (v: number, b: number) => { const d = b ? v / b - 1 : 0; return `${d >= 0 ? "+" : ""}${Math.round(d * 100)}%`; };

/** Full effect of one therapy on one profile at the given model dose, including sub-1% changes. */
function therapyEffect(p: Parameters<typeof profileInputs>[0], dose: number, t: Therapy) {
  const base = profileInputs(p);
  const b = metrics(base);
  const a = metrics(applyTherapyDose(base, t, dose));
  const ch = (x: number, y: number) => (x ? y / x - 1 : 0);
  const atp = ch(b.atp, a.atp), so = ch(b.superoxide, a.superoxide), h2 = ch(b.h2o2, a.h2o2);
  const cleared = (b.atpFlags - a.atpFlags) + (b.rosFlags - a.rosFlags);
  const readoutParts = [atp >= 0.01 && `ATP +${Math.round(atp * 100)}%`, so <= -0.01 && `superoxide ${Math.round(so * 100)}%`, h2 <= -0.01 && `H2O2 ${Math.round(h2 * 100)}%`].filter(Boolean) as string[];
  const parts = [...readoutParts, cleared > 0 && `${cleared} flag${cleared > 1 ? "s" : ""} cleared`].filter(Boolean) as string[];
  return { atp, so, h2, cleared, readoutParts, parts, hasReadout: readoutParts.length > 0 };
}

/** Therapies that improve this profile at the given model dose: ATP up, superoxide or H2O2 down (>=1%), or fewer ATP/ROS flags. Ranked by flags cleared first, then readout change; not efficacy. */
function responders(p: Parameters<typeof profileInputs>[0], dose = 1) {
  return therapies.map((t) => ({ t, ...therapyEffect(p, dose, t) }))
    .filter((r) => r.parts.length)
    .sort((a, b) => (100 * Math.max(b.cleared, 0) + Math.max(b.atp, 0) - Math.min(b.so, 0) - Math.min(b.h2, 0))
      - (100 * Math.max(a.cleared, 0) + Math.max(a.atp, 0) - Math.min(a.so, 0) - Math.min(a.h2, 0)));
}

function Dashboard() {
  const users = useUserPatients();
  // On: only therapies that actually move ATP, superoxide or H2O2 show in "Responds to"; therapies that only clear flags are hidden.
  const [readoutOnly, setReadoutOnly] = useState(true);
  // Model dose for the "Responds to" column (fraction of each therapy's slider move; never a drug dose).
  const [dose, setDose] = useState(1);
  // Charts stay unmounted (and their code unloaded) until the user opens them.
  const [showChart, setShowChart] = useState(false);
  const [showBaselineChart, setShowBaselineChart] = useState(false);
  // Batch CSV therapy filter: "all" exports every responding therapy; a therapy id exports just that one across every profile.
  const [batchTherapy, setBatchTherapy] = useState("all");
  const rows = useMemo(() => {
    const pool = [...users, ...demoPatients];
    const healthy = simulate(profileInputs(demoPatients.find((p) => p.id === "demo-01")!), defaultGeometry);
    const built = pool.map((p) => {
      const out = simulate(profileInputs(p), defaultGeometry);
      const d = diagnoseProfile(p);
      const hb = h2o2BandCheck(p, out.hydrogenPeroxide);
      const ms = readoutChecks(p).find((b) => b.key === "mitosox")!;
      // The peroxide band flag lives in diagnosis rosAssayFlags, so it is
      // counted there, not added again here.
      const labFlags = d.patientFlags.length, assayFlags = d.rosAssayFlags.length + d.atpAssayFlags.length, modelFlags = d.modelFlags.length;
      const all = labFlags + assayFlags + modelFlags;
      const matrix = responders(p, dose);
      // Therapy flags at the chosen dose: therapies targeting a strong cause
      // (score >= 1.5) that move ATP, superoxide or H2O2 by 1% or more.
      const strongMechs = new Set(d.causes.filter((c) => c.score >= 1.5).map((c) => c.mechanism));
      const therapyFlags = therapies
        .filter((t) => t.mechanisms.some((m) => strongMechs.has(m)))
        .map((t) => therapyEffect(p, dose, t))
        .filter((x) => Math.abs(x.atp) >= 0.01 || Math.abs(x.so) >= 0.01 || Math.abs(x.h2) >= 0.01).length;
      const allResp = all > 0 ? matrix : null;
      // Projected peroxide: measured nM (else model nM) scaled by the model's H2O2 change
      // under the batch-picker therapy, or the strongest peroxide-lowering therapy at this dose.
      const pick = batchTherapy !== "all"
        ? therapies.filter((t) => t.id === batchTherapy).map((t) => ({ t, h2: therapyEffect(p, dose, t).h2 }))[0]
        : therapies.map((t) => ({ t, h2: therapyEffect(p, dose, t).h2 })).sort((a, b) => a.h2 - b.h2)[0];
      const projBase = hb.measured ? hb.measured.value : hb.model.value;
      const proj = pick ? { therapy: pick.t.name, base: projBase, measured: !!hb.measured, ...projectedH2o2(projBase, 1, 1 + pick.h2) } : null;
      // Projected MitoSOX: measured fold scaled by the model's superoxide change
      // under the batch-picker therapy, or the strongest superoxide-lowering therapy at this dose.
      const msPick = batchTherapy !== "all"
        ? therapies.filter((t) => t.id === batchTherapy).map((t) => ({ t, so: therapyEffect(p, dose, t).so }))[0]
        : therapies.map((t) => ({ t, so: therapyEffect(p, dose, t).so })).sort((a, b) => a.so - b.so)[0];
      const projMs = msPick ? { therapy: msPick.t.name, ...projectedMitoSox(p.values.mitosox, 1, 1 + msPick.so) } : null;
      return {
        hb, ms, proj, projMs,
        p, out, healthy, top: d.top, lp: lpMapping(p),
        labFlags, assayFlags, modelFlags, therapyFlags,
        overlap: flagOverlaps(p, pool).ranked.slice(0, 3),
        respAll: allResp ? allResp.slice(0, 3) : null,
        respMatrix: matrix,
        flagsOnlyCount: allResp ? allResp.filter((x) => !x.hasReadout).length : 0,
      };
    }).map((r) => ({
      ...r,
      resp: r.respAll === null ? null : readoutOnly
        ? r.respMatrix.filter((x) => x.hasReadout).slice(0, 3).map((x) => ({ ...x, parts: x.readoutParts }))
        : r.respAll,
    }));
    return built.sort((a, b) => {
      const fa = a.labFlags + a.assayFlags + a.modelFlags;
      const fb = b.labFlags + b.assayFlags + b.modelFlags;
      if (fb !== fa) return fb - fa;
      return a.p.label.localeCompare(b.p.label);
    });
  }, [users, readoutOnly, dose, batchTherapy]);

  const downloadCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = ["Profile", "ID", "Phenotype", "Age (years)", "Sex", "Source", "L:P ratio", "ATP flux (uM/s)", "ATP flux vs healthy", "Superoxide (nM)", "Superoxide vs healthy", "H2O2 (nM)", "H2O2 vs healthy", "Measured H2O2 (nM)", "H2O2 vs Sies 2017", "Peroxide flag", `Projected H2O2 (nM, ${dose}x)`, "Projected H2O2 therapy", "Projected peroxide flag", "MitoSOX (fold control)", "MitoSOX vs Gonzalo 2019", `Projected MitoSOX (fold, ${dose}x)`, "Projected MitoSOX therapy", "Projected MitoSOX flag", "Lab flags", "Assay flags", "Model flags", `Therapy flags (${dose}x)`, "Total flags", "Top mechanism", "Top mechanism score", "Top overlapping disorders", `Responds to (model, ${dose}x)`];
    const lines = [header.join(",")];
    for (const r of rows) {
      const src = r.p.source ?? "synthetic";
      lines.push([
        esc(r.p.label), esc(r.p.id), esc(r.p.phenotype), String(r.p.age), patientSex(r.p), src,
        r.p.values.lactatePyruvate.toFixed(1),
        r.out.atpFlux.toFixed(2), pct(r.out.atpFlux, r.healthy.atpFlux),
        r.out.superoxide.toPrecision(3), pct(r.out.superoxide, r.healthy.superoxide),
        r.out.hydrogenPeroxide.toFixed(2), pct(r.out.hydrogenPeroxide, r.healthy.hydrogenPeroxide),
        r.hb.measured ? String(r.hb.measured.value) : "Not measured",
        esc(`model ${r.hb.model.text ?? "within"}; measured ${r.hb.measured ? r.hb.measured.text ?? "within" : "not measured"}`),
        (r.hb.measured?.outside || r.hb.model.outside) ? `Flagged >100 nM${r.hb.measured?.outside ? " (measured)" : " (model)"}` : `Within${r.hb.measured ? "" : " (model only)"}`,
        r.proj ? r.proj.value.toFixed(2) : "", esc(r.proj ? `${r.proj.therapy} (from ${r.proj.measured ? "measured" : "model"} ${r.proj.base.toFixed(1)} nM)` : ""),
        r.proj ? (r.proj.outside ? "Flagged >100 nM (projected)" : r.proj.base > 100 ? "Clears (projected)" : "Within") : "",
        r.p.values.mitosox.toFixed(2),
        r.ms.outside ? `Flagged: ${r.ms.text}${r.p.age < 18 ? " (adult band applied to a child)" : ""}` : "Within",
        r.projMs ? r.projMs.value.toFixed(2) : "", esc(r.projMs ? r.projMs.therapy : ""),
        r.projMs ? (r.projMs.outside ? "Outside band (projected)" : r.ms.outside ? "Clears (projected)" : "Within") : "",
        String(r.labFlags), String(r.assayFlags), String(r.modelFlags), String(r.therapyFlags), String(r.labFlags + r.assayFlags + r.modelFlags),
        esc(r.top ? r.top.name : "No strong cause"), r.top ? r.top.score.toFixed(2) : "",
        esc(r.overlap.map((o) => `${o.phenotype} ${o.shared}/${o.total}`).join("; ")),
        esc(r.respAll === null ? "Not flagged" : r.respAll.length ? r.respAll.map((x) => `${x.t.name} (${x.parts.join(", ")})`).join("; ") : "No model response"),
      ].join(","));
    }
    lines.push("");
    lines.push(esc("Generated by Cristae Lab. Research model, not a diagnosis. Demo profile values are synthetic or published case values; user-added values stay in this browser tab."));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cristae-lab-patient-dashboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch export: one row per profile x therapy that responds at the current model dose, including flags-only therapies.
  // With a therapy picked, one row per profile for that therapy only, including profiles it does not change.
  const downloadBatchCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const only = therapies.find((t) => t.id === batchTherapy) ?? null;
    const header = ["Profile", "ID", "Phenotype", "Total flags", "Therapy flags", "Baseline ATP (µM/s)", "Baseline superoxide (nM)", "Baseline H2O2 (nM)", "Therapy", `Model dose`, "ATP change", "Superoxide change", "H2O2 change", "Flags cleared", "Readout effect only"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const totalFlags = r.labFlags + r.assayFlags + r.modelFlags;
      const base = [r.out.atpFlux.toFixed(2), r.out.superoxide.toPrecision(3), r.out.hydrogenPeroxide.toFixed(2)];
      const push = (therapyName: string, atp: string, so: string, h2: string, cleared: string, readOnly: string) => {
        lines.push([esc(r.p.label), esc(r.p.id), esc(r.p.phenotype), String(totalFlags), String(r.therapyFlags), ...base, esc(therapyName), String(dose), atp, so, h2, cleared, readOnly].join(","));
      };
      if (only) {
        const x = therapyEffect(r.p, dose, only);
        const d = (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`;
        push(only.name, d(x.atp), d(x.so), d(x.h2), x.cleared > 0 ? `${x.cleared} flags cleared` : "0", x.hasReadout ? "no" : "yes");
        continue;
      }
      const all = r.respMatrix;
      if (!all.length) {
        push("(none)", "", "", "", "", "");
        continue;
      }
      for (const x of all) {
        const flagsPart = x.parts.find((p) => p.includes("flag"));
        push(x.t.name,
          x.readoutParts.find((p) => p.startsWith("ATP")) ?? "",
          x.readoutParts.find((p) => p.startsWith("superoxide")) ?? "",
          x.readoutParts.find((p) => p.startsWith("H2O2")) ?? "",
          flagsPart ?? "0",
          x.hasReadout ? "no" : "yes");
      }
    }
    lines.push("");
    lines.push(esc("Generated by Cristae Lab. Research model, not a diagnosis. Every therapy a profile responds to at the chosen model dose, including therapies whose only effect is clearing flags. A model dose is a slider move, never a drug dose."));
    if (only) lines.push(esc(`Filtered to ${only.name} at the ${dose}x model dose; every profile is included, even where the therapy does not change the readouts. Therapy flags count model therapies that target a strong cause and move a readout by 1% or more; they are not abnormal flags and are not part of Total flags.`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = only ? `cristae-lab-therapy-batch-${only.id}.csv` : "cristae-lab-therapy-batch.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
    <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="size-4" aria-hidden />Back to lab</Link></Button>
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Patient dashboard</h1>
        <p className="text-sm text-muted-foreground">Each profile run through the model from its measured baseline (membrane potential, labile iron, inverse MitoSOX, and lactate:pyruvate as the NADH ratio when lactate is at least 2.5 mmol/L and the ratio is measured). Sorted by total flag count, most flagged first. Peroxide above 100 nM (Sies 2017, measured or model) adds one assay flag, and so does a MitoSOX value outside the Gonzalo 2019 band (0.59-1.5x control; an adult study, applied to children with caution). Projected H2O2 scales the measured peroxide (or the model value if not measured) by the model's peroxide change under the Batch therapy pick, or the strongest peroxide-lowering therapy when "All therapies" is picked; a model estimate, not a measurement. The therapy count lists model therapies that target a strong cause and move ATP, superoxide or peroxide by 1% or more; it is not an abnormal flag and is not part of the total. Percentages compare with the healthy adult (demo-01). Top disorders are profiles sharing the most same-direction flags, not likelihoods. "Responds to" lists up to three therapies at the chosen model dose, ranked by flags cleared first, then by readout change; a slider move, not a drug dose or efficacy claim. With "Only therapies that change ATP, superoxide or peroxide" checked, therapies whose only model effect is clearing flags are hidden and only readout changes are shown. Research model, not a diagnosis. Synthetic values are invented.</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="flex items-center gap-2 text-xs" data-testid="dash-dose-label">
          Model dose
          <select value={dose} onChange={(e) => setDose(Number(e.target.value))} data-testid="dash-dose" className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">
            {calculatorDoses.filter((d) => d > 0).map((d) => <option key={d} value={d}>{d}x</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs" data-testid="dash-readout-only-label">
          <input type="checkbox" checked={readoutOnly} onChange={(e) => setReadoutOnly(e.target.checked)} data-testid="dash-readout-only" className="size-3.5 accent-primary" />
          Only therapies that change ATP, superoxide or peroxide
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 text-xs" data-testid="dash-batch-therapy-label">
            Batch therapy
            <select value={batchTherapy} onChange={(e) => setBatchTherapy(e.target.value)} data-testid="dash-batch-therapy" className="max-w-[220px] rounded border border-border bg-background px-1.5 py-0.5 text-xs">
              <option value="all">All therapies</option>
              {therapies.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={downloadCsv} data-testid="dash-csv"><Download className="size-4" aria-hidden />Download CSV</Button>
          <Button variant="outline" size="sm" onClick={downloadBatchCsv} data-testid="dash-batch-csv"><Download className="size-4" aria-hidden />Batch therapy CSV</Button>
        </div>
      </div>
    </header>
    {showBaselineChart ? <Suspense fallback={<p className="border-y border-border py-4 text-xs text-muted-foreground">Loading chart...</p>}>
      <BaselineProfileChart profiles={rows.map((r) => r.p)} />
    </Suspense> : <div className="border-y border-border py-4">
      <Button variant="outline" size="sm" onClick={() => setShowBaselineChart(true)} data-testid="dash-show-baseline-chart">Show baseline chart</Button>
    </div>}
    {showChart ? <Suspense fallback={<p className="border-y border-border py-4 text-xs text-muted-foreground">Loading chart...</p>}>
      <TherapyProfileChart profiles={rows.map((r) => r.p)} dose={dose} flaggedIds={rows.filter((r) => r.respAll !== null).map((r) => r.p.id)} />
    </Suspense> : <div className="border-y border-border py-4">
      <Button variant="outline" size="sm" onClick={() => setShowChart(true)} data-testid="dash-show-chart">Show therapy chart</Button>
    </div>}
    <section className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[1100px] text-left text-xs">
        <thead className="text-[10px] uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2">Profile</th><th className="px-3 py-2">L:P ratio</th><th className="px-3 py-2">ATP flux</th><th className="px-3 py-2">Superoxide</th><th className="px-3 py-2">H2O2 (nM)</th><th className="px-3 py-2">H2O2 band (Sies 2017)</th>
          <th className="px-3 py-2">Peroxide flag</th><th className="px-3 py-2">Projected H2O2 ({dose}x)</th><th className="px-3 py-2">MitoSOX band (Gonzalo 2019)</th><th className="px-3 py-2">Projected MitoSOX ({dose}x)</th><th className="px-3 py-2">Flags: lab / assay / model / therapy ({dose}x)</th><th className="px-3 py-2">Top mechanism</th><th className="px-3 py-2">Top overlapping disorders</th><th className="px-3 py-2">Responds to (model, {dose}x)</th><th className="px-3 py-2">Open</th>
        </tr></thead>
        <tbody>{rows.map((r) => <tr key={r.p.id} data-testid="dash-row" className="border-t border-border/60 align-top">
          <th scope="row" className="px-3 py-2 font-medium">{r.p.label}<div className="font-normal text-muted-foreground">{r.p.phenotype} · {r.p.age}y {patientSex(r.p)}</div></th>
          <td className="px-3 py-2 font-mono" data-testid="dash-lp"><span className={r.p.values.lactatePyruvate > 25 ? "text-destructive" : ""}>{r.p.values.lactatePyruvate.toFixed(1)}</span><div className="font-sans text-[10px] text-muted-foreground" title={r.lp.note}>{r.lp.nadhRatio !== undefined ? `Mapped: NADH ${r.lp.nadhRatio.toFixed(2)}` : "Not mapped"}</div></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.atpFlux)} <span className="text-muted-foreground">{pct(r.out.atpFlux, r.healthy.atpFlux)}</span></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.superoxide)} <span className="text-muted-foreground">{pct(r.out.superoxide, r.healthy.superoxide)}</span></td>
          <td className="px-3 py-2 font-mono">{fmt(r.out.hydrogenPeroxide)} <span className="text-muted-foreground">{pct(r.out.hydrogenPeroxide, r.healthy.hydrogenPeroxide)}</span></td>
          <td className="px-3 py-2" data-testid="dash-h2o2-band"><div className={r.hb.measured?.outside ? "text-destructive" : ""}>Measured: {r.hb.measured ? `${r.hb.measured.value} nM, ${r.hb.measured.text ?? "within"}` : <span className="text-muted-foreground">Not measured</span>}</div><div className={`text-[10px] ${r.hb.model.outside ? "text-destructive" : "text-muted-foreground"}`}>Model: {fmt(r.hb.model.value)} nM, {r.hb.model.text ?? "within"}</div></td>
          <td className="px-3 py-2" data-testid="dash-h2o2-flag">{(r.hb.measured?.outside || r.hb.model.outside) ? <span className="font-medium text-destructive">Flagged &gt;100 nM{r.hb.measured?.outside ? " (measured)" : " (model)"}</span> : <span className="text-muted-foreground">Within{r.hb.measured ? "" : " (model only)"}</span>}</td>
          <td className="px-3 py-2" data-testid="dash-h2o2-projected">{r.proj ? <><div className={r.proj.outside ? "font-medium text-destructive" : ""}>{fmt(r.proj.value)} nM{r.proj.base > 100 && !r.proj.outside ? <span className="font-medium text-primary"> (flag clears)</span> : r.proj.outside ? " (flagged)" : ""}</div><div className="text-[10px] text-muted-foreground">{r.proj.measured ? "Measured" : "Model"} {fmt(r.proj.base)} nM x {r.proj.therapy}</div></> : <span className="text-muted-foreground">None</span>}</td>
          <td className="px-3 py-2" data-testid="dash-mitosox-flag">{r.ms.outside ? <span className="font-medium text-destructive">Flagged: {r.ms.text}{r.p.age < 18 ? " (adult band, child)" : ""}</span> : <span className="text-muted-foreground">Within{r.p.age < 18 ? " (adult band, child)" : ""}</span>}</td>
          <td className="px-3 py-2 font-mono">{r.labFlags} / {r.assayFlags} / {r.modelFlags} / {r.therapyFlags}</td>
          <td className="px-3 py-2">{r.top ? <>{r.top.name} <span className="font-mono text-muted-foreground">{r.top.score.toFixed(2)}</span></> : <span className="text-muted-foreground">No strong cause</span>}</td>
          <td className="px-3 py-2">{r.overlap.length ? r.overlap.map((o) => <div key={o.phenotype}>{o.phenotype} <span className="font-mono text-muted-foreground">{o.shared}/{o.total}</span></div>) : <span className="text-muted-foreground">None</span>}</td>
          <td className="px-3 py-2" data-testid="dash-resp">{(() => {
            if (r.resp === null) return <span className="text-muted-foreground">Not flagged</span>;
            if (!r.resp.length) return <span className="text-muted-foreground">{readoutOnly ? `No readout response${r.flagsOnlyCount ? ` (${r.flagsOnlyCount} clear flags only)` : ""}` : "No model response"}</span>;
            return <>{r.resp.map((x) => <div key={x.t.id}><Link className="text-primary underline-offset-2 hover:underline" to="/therapy-calculator" search={{ profile: r.p.id, therapy: x.t.id }}>{x.t.name}</Link> <span className="text-muted-foreground">{x.parts.join(", ")}</span></div>)}{readoutOnly && r.flagsOnlyCount > 0 && <div className="text-[10px] text-muted-foreground" data-testid="dash-resp-hidden">{r.flagsOnlyCount} clear flags only</div>}</>;
          })()}</td>
          <td className="space-y-1 px-3 py-2">
            <Link className="block text-primary underline-offset-2 hover:underline" to="/diagnosis" search={{ profile: r.p.id }}>Diagnosis</Link>
            <Link className="block text-primary underline-offset-2 hover:underline" to="/" search={{ patient: r.p.id }}>Simulator</Link>
          </td>
        </tr>)}</tbody>
      </table>
    </section>
  </main>;
}
