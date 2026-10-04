import type { DoseAnchor } from "@/lib/mito/doseAnchors";

export function DoseAnchorNote({ a }: { a: DoseAnchor }) {
  return (
    <p className="text-[11px] text-muted-foreground">
      {a.finding} Assumed effect: {a.maxDose} {a.unit} moves the {a.lever} to {a.maxFactor}x, linear from 1x at 0. Sources:{" "}
      {a.sources.map((s, i) => (
        <span key={s.url}>{i > 0 && "; "}<a className="text-primary underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
      ))}
      . Exploration only: never changes flags, scenarios or Diagnosis.
    </p>
  );
}

export const DoseBadge = () => (
  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">Dose from trials, effect size assumed</span>
);
