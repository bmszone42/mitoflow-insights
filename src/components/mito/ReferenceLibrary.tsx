import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fesClusters, ferroptosisNotes, ironSteps, photonNotes, rosSpecies, warburgNotes } from "@/lib/mito/reference";

export function ReferenceLibrary() {
  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-sm font-semibold">Reactive oxygen and nitrogen species</h2>
        <p className="mono-label mt-1">seven species, sources, sinks and targets</p>
        <Accordion type="single" collapsible className="mt-3">
          {rosSpecies.map((r) => (
            <AccordionItem key={r.name} value={r.name}>
              <AccordionTrigger className="text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  {r.name}
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {r.formula}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  {[
                    ["Half-life", r.halfLife],
                    ["Diffusion", r.diffusion],
                    ["Sources", r.sources],
                    ["Removal", r.removal],
                    ["Targets", r.targets],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="mono-label">{k}</dt>
                      <dd className="text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">{r.note}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Fe-S clusters</h2>
          <p className="mono-label mt-1">position, role and superoxide vulnerability</p>
          <div className="mt-3 space-y-3">
            {fesClusters.map((f) => (
              <div key={f.protein} className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-primary">{f.protein}</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {f.cluster}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-foreground">{f.role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.vulnerability}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Iron metabolism route</h2>
            <p className="mono-label mt-1">uptake to ferritinophagy</p>
            <ol className="mt-3 space-y-3">
              {ironSteps.map((s, i) => (
                <li key={s.step} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{s.step}</div>
                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Ferroptosis defence</h2>
            <div className="mt-3 space-y-3">
              {ferroptosisNotes.map((p) => (
                <div key={p.title}>
                  <div className="mono-label">{p.title}</div>
                  <p className="text-xs text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Warburg effect and aerobic glycolysis</h2>
            <div className="mt-3 space-y-3">
              {warburgNotes.map((p) => (
                <div key={p.title}>
                  <div className="mono-label">{p.title}</div>
                  <p className="text-xs text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Photons in, mid-infrared out</h2>
            <div className="mt-3 space-y-3">
              {photonNotes.map((p) => (
                <div key={p.title}>
                  <div className="mono-label">{p.title}</div>
                  <p className="text-xs text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
