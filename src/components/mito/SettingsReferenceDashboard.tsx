import { AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";
import { useMemo } from "react";
import type { Geometry, Inputs } from "@/lib/mito/model";
import { modelSettingRows, settingsGroups, type SettingRow } from "@/lib/mito/settingsReference";

const statusClass: Record<SettingRow["status"], string> = {
  "Outside range": "text-destructive",
  "Within range": "text-primary",
  "Context dependent": "text-muted-foreground",
};

function StatusIcon({ status }: { status: SettingRow["status"] }) {
  if (status === "Outside range") return <AlertTriangle className="size-3.5 shrink-0" aria-hidden />;
  if (status === "Within range") return <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />;
  return <CircleHelp className="size-3.5 shrink-0" aria-hidden />;
}

export function SettingsReferenceDashboard({ inputs, geo }: { inputs: Inputs; geo: Geometry }) {
  const rows = useMemo(() => modelSettingRows(inputs, geo), [inputs, geo]);
  const outside = rows.filter((row) => row.status === "Outside range");
  const within = rows.filter((row) => row.status === "Within range").length;
  const contextual = rows.length - outside.length - within;

  return (
    <section className="space-y-4" aria-labelledby="settings-reference-title" data-testid="settings-reference-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="mono-label">All live controls</div>
          <h2 id="settings-reference-title" className="mt-1 text-xl font-semibold">Model settings reference dashboard</h2>
          <p className="mt-1 text-xs text-muted-foreground">Current settings against comparable published context, where one exists.</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{rows.length} settings</span>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3" role="status" aria-label="Settings reference summary">
        {[
          { label: "Outside range", count: outside.length, tone: "text-destructive", Icon: AlertTriangle },
          { label: "Within range", count: within, tone: "text-primary", Icon: CheckCircle2 },
          { label: "Context dependent", count: contextual, tone: "text-muted-foreground", Icon: CircleHelp },
        ].map(({ label, count, tone, Icon }) => (
          <div key={label} className="flex items-center gap-3 bg-card p-3">
            <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden />
            <span className={`font-mono text-xl ${tone}`}>{count}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className={`border-l-2 px-3 py-2 text-xs ${outside.length ? "border-destructive bg-destructive/5 text-destructive" : "border-primary bg-primary/5 text-primary"}`} data-testid="settings-drift-summary">
        <span className="font-semibold">Settings outside range:</span>{" "}
        {outside.length ? outside.map((row) => `${row.label} (${row.drift})`).join("; ") : "None of the comparable settings."}
      </div>

      <p className="text-[11px] text-muted-foreground">Context dependent means no defensible universal interval for this model control, not that it is normal. Slider limits and model defaults are not textbook ranges. These flags are research context, not diagnoses.</p>

      {settingsGroups.map((group) => {
        const groupRows = rows.filter((row) => row.group === group);
        return (
          <div key={group} className="min-w-0" data-testid="settings-reference-group">
            <div className="mb-2 flex items-baseline justify-between border-b border-border pb-1">
              <h3 className="text-sm font-semibold">{group}</h3>
              <span className="font-mono text-[10px] text-muted-foreground">{groupRows.length} settings</span>
            </div>
            <div className="overflow-x-auto border-b border-border">
              <table className="w-full min-w-[780px] table-fixed text-left text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-[19%] px-3 py-2 font-medium">Setting</th>
                    <th scope="col" className="w-[11%] px-3 py-2 font-medium">Live</th>
                    <th scope="col" className="w-[10%] px-3 py-2 font-medium">Default</th>
                    <th scope="col" className="w-[21%] px-3 py-2 font-medium">Published context</th>
                    <th scope="col" className="w-[17%] px-3 py-2 font-medium">Status / drift</th>
                    <th scope="col" className="w-[22%] px-3 py-2 font-medium">Source / limits</th>
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((row) => (
                    <tr key={row.id} className={`border-t border-border/60 align-top ${row.status === "Outside range" ? "bg-destructive/5" : ""}`} data-testid="settings-reference-row" data-setting={row.id} data-status={row.status}>
                      <th scope="row" className="break-words px-3 py-3 font-medium">{row.label}</th>
                      <td className={`px-3 py-3 font-mono ${statusClass[row.status]}`}>{row.live}</td>
                      <td className="px-3 py-3 font-mono text-muted-foreground">{row.baseline}</td>
                      <td className="break-words px-3 py-3 text-muted-foreground">{row.reference}</td>
                      <td className={`break-words px-3 py-3 ${statusClass[row.status]}`}>
                        <span className="inline-flex items-center gap-1 font-medium"><StatusIcon status={row.status} />{row.status}</span>
                        {row.drift && <span className="mt-1 block text-[10px] leading-relaxed">{row.drift}</span>}
                      </td>
                      <td className="break-words px-3 py-3 text-muted-foreground">
                        <a href={row.url} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary">{row.source}</a>
                        <span className="mt-1 block text-[10px] leading-relaxed">{row.note}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}