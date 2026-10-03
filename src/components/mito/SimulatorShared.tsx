export const chartStyle = {
  grid: "var(--color-border)",
  axis: "var(--color-muted-foreground)",
};

export function Metric({
  label,
  value,
  unit,
  tone = "primary",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "primary" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <div className="mono-label">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${toneClass}`}>
        {value}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function tooltipProps() {
  return {
    contentStyle: {
      background: "var(--color-popover)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      color: "var(--color-popover-foreground)",
      fontSize: "12px",
    },
    labelStyle: { color: "var(--color-muted-foreground)" },
  };
}

export function BudgetBar({ title, parts }: { title: string; parts: Record<string, number> }) {
  const entries = Object.entries(parts);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const cls = ["bg-primary", "bg-accent", "bg-warning", "bg-destructive", "bg-muted-foreground"];
  return (
    <div className="space-y-1">
      <div className="mono-label">{title}</div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {entries.map(([k, v], n) => (
          <div key={k} className={cls[n % cls.length]} style={{ width: `${(v / total) * 100}%` }} title={`${k}: ${v.toExponential(2)} µM/s`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {entries.map(([k, v], n) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block size-2 rounded-full ${cls[n % cls.length]}`} />
            {k} {((v / total) * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
