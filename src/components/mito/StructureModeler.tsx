import type { PartId } from "./3d/info";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { geometryEffects, geometryRanges, simulate, type Geometry, type Inputs, type Outputs } from "@/lib/mito/model";
import type { Overlay } from "./Cristae3D";

const Cristae3D = lazy(() => import("./Cristae3D"));
import { CrossSection } from "./CrossSection";

const complexInfo: Record<string, { title: string; body: string }> = {
  CI: {
    title: "Complex I, NADH:ubiquinone oxidoreductase",
    body: "45 subunits, 8 Fe-S clusters plus FMN. Superoxide leaves at the flavin site under high NADH/NAD+ and at site IQ during reverse electron transport.",
  },
  CII: {
    title: "Complex II, succinate dehydrogenase",
    body: "SDHB carries [2Fe-2S], [4Fe-4S] and [3Fe-4S]. Succinate accumulation pushes electrons backwards into Complex I.",
  },
  CIII: {
    title: "Complex III, cytochrome bc1",
    body: "Rieske [2Fe-2S] bifurcates electrons at the Qo site. A stalled semiquinone there releases superoxide to both sides of the membrane.",
  },
  CIV: {
    title: "Complex IV, cytochrome c oxidase",
    body: "The photon acceptor. Heme a3-CuB and CuA absorb 660 nm and 810 nm light, and nitric oxide bound at the binuclear centre is photodissociated.",
  },
  CV: {
    title: "Complex V, ATP synthase",
    body: "Proton flow through the c-ring drives rotary catalysis. Dimer rows shape cristae curvature and set the local electric field.",
  },
  ISC: {
    title: "Fe-S assembly core",
    body: "NFS1-ISD11-ACP2 with ISCU, frataxin and ferredoxin-2 builds clusters in the matrix and hands them to apo-proteins via HSC20.",
  },
};

export function StructureModeler({
  out,
  inputs,
  geo,
  setGeo,
  onPick,
  onStepClick,

  selected: picked3d,
}: {
  out: Outputs;
  inputs: Inputs;
  geo: Geometry;
  setGeo: (g: Geometry) => void;
  onPick?: (id: PartId | null) => void;
  onStepClick?: (stepIndex: number) => void;
  selected?: PartId | null;
}) {
  const [showComplexes, setShowComplexes] = useState(true);
  const [showRos, setShowRos] = useState(true);
  const [selected, setSelected] = useState<string>("CIV");
  const [overlay, setOverlay] = useState<Overlay>("superoxide");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ge = useMemo(() => geometryEffects(geo), [geo]);
  const base = useMemo(() => simulate(inputs), [inputs]);
  const readout: { label: string; v: number; b: number; unit: string; digits: number }[] = [
    { label: "Electron flux (CIV)", v: out.fluxCIV, b: base.fluxCIV, unit: "e/s rel", digits: 1 },
    { label: "ATP flux", v: out.atpFlux, b: base.atpFlux, unit: "rel", digits: 1 },
    { label: "Local Δψ shift", v: ge.psiShift, b: 0, unit: "mV", digits: 1 },
    { label: "O2•-", v: out.superoxide, b: base.superoxide, unit: "nM", digits: 3 },
    { label: "H2O2", v: out.hydrogenPeroxide, b: base.hydrogenPeroxide, unit: "nM", digits: 1 },
    { label: "•OH", v: out.hydroxylRadical, b: base.hydroxylRadical, unit: "pM", digits: 3 },
    { label: "Fe-S intact", v: out.fesIntact * 100, b: base.fesIntact * 100, unit: "%", digits: 1 },
  ];

  const surfaceArea = useMemo(() => {
    const perCrista = 2 * geo.cristaeDepth * 0.9 + 2 * geo.junctionWidth;
    return Math.round(geo.cristaeCount * perCrista + 2 * geo.length);
  }, [geo]);

  const cristaeDensity = (geo.cristaeCount / (geo.length / 100)).toFixed(1);

  const setGeoKey = (k: keyof Geometry, v: number) => setGeo({ ...geo, [k]: v });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="panel space-y-5 p-4">
        <h2 className="text-sm font-semibold">Membrane shape</h2>
        <p className="text-[11px] text-muted-foreground">
          Outer membrane: length, width, swelling. Inner membrane: cristae count, depth, junction, shape, tip curvature.
          Every change feeds the Simulator.
        </p>
        {(
          [
            "length",
            "matrixWidth",
            "swelling",
            "cristaeCount",
            "cristaeDepth",
            "junctionWidth",
            "cristaeShape",
            "tipCurvature",
          ] as const
        ).map((k) => ({ k, ...geometryRanges[k] })).map((c) => (
          <div key={c.k} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs">{c.label}</span>
              <span className="font-mono text-xs text-primary">{geo[c.k]}</span>
            </div>
            <Slider
              value={[geo[c.k]]}
              min={c.min}
              max={c.max}
              step={c.step}
              onValueChange={(v) => setGeoKey(c.k, v[0] ?? geo[c.k])}
            />
          </div>
        ))}

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cx" className="text-xs">
              Show respiratory complexes
            </Label>
            <Switch id="cx" checked={showComplexes} onCheckedChange={setShowComplexes} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ros" className="text-xs">
              Show ROS field
            </Label>
            <Switch id="ros" checked={showRos} onCheckedChange={setShowRos} />
          </div>
        </div>

        <div className="space-y-1 border-t border-border pt-4">
          <div className="mono-label">Derived</div>
          <p className="font-mono text-xs text-foreground">
            inner membrane index {surfaceArea}
          </p>
          <p className="font-mono text-xs text-foreground">
            cristae density {cristaeDensity} per 100 nm
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tighter cristae raise the local membrane potential and, in the model, the superoxide leak
            per unit of electron flux.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel overflow-hidden p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">3D cristae viewer</h2>
            <div className="flex gap-1" role="group" aria-label="Color overlay">
              {(
                [
                  ["superoxide", "Superoxide"],
                  ["potential", "Local Δψ"],
                  ["complexes", "Complex density"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setOverlay(k)}
                  className={`rounded border px-2 py-1 text-[11px] ${overlay === k ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
            {mounted ? (
              <Suspense fallback={<div className="h-[560px] animate-pulse rounded-md bg-secondary/40" />}>
                <Cristae3D geo={geo} ge={ge} out={out} overlay={overlay} onPick={onPick} selected={picked3d} inputs={inputs} onStepClick={onStepClick} />
              </Suspense>
            ) : (
              <div className="h-[560px] rounded-md bg-secondary/40" />
            )}
            <div className="space-y-2">
              <div className="mono-label">Live outputs vs default shape</div>
              {readout.map((r) => {
                const pct = r.b === 0 ? null : ((r.v - r.b) / Math.abs(r.b)) * 100;
                return (
                  <div key={r.label} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-1">
                    <span className="text-xs">{r.label}</span>
                    <span className="text-right font-mono text-xs">
                      {r.v !== 0 && Math.abs(r.v) < 0.01 ? r.v.toExponential(2) : r.v.toFixed(r.digits)} <span className="text-muted-foreground">{r.unit}</span>
                      {pct !== null && Math.abs(pct) >= 0.1 && (
                        <span className={`ml-1 ${pct > 0 ? "text-accent" : "text-primary"}`}>
                          {pct > 0 ? "+" : ""}
                          {pct.toFixed(0)}%
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              <p className="pt-1 text-[11px] text-muted-foreground">
                Capacity x{ge.capacity.toFixed(2)}, cyt c retention x{ge.cytcRetention.toFixed(2)}, ATP efficiency x
                {ge.atpEfficiency.toFixed(2)}, leak x{ge.leak.toFixed(2)}. Strengths are estimates, not fitted data.
              </p>
            </div>
          </div>
        </div>
        <div className="panel overflow-hidden p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">2D cross section</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-mono text-[11px]">
                71 THz {out.emission71THz.toFixed(0)}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px]">
                stress {out.redoxStress.toFixed(0)}
              </Badge>
            </div>
          </div>
          <CrossSection geo={geo} out={out} showRos={showRos} showComplexes={showComplexes} selected={selected} setSelected={setSelected} />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="panel p-4">
            <div className="mono-label">Selected element</div>
            <h3 className="mt-1 text-sm font-semibold text-primary">
              {(complexInfo[selected] ?? complexInfo["CIV"]!).title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{(complexInfo[selected] ?? complexInfo["CIV"]!).body}</p>
          </div>
          <div className="panel space-y-2 p-4">
            <div className="mono-label">Legend</div>
            {[
              { c: "var(--color-chart-1)", t: "Complex I" },
              { c: "var(--color-chart-4)", t: "Complex III" },
              { c: "var(--color-chart-2)", t: "Complex IV, photon acceptor" },
              { c: "var(--color-chart-3)", t: "ATP synthase" },
              { c: "var(--color-accent)", t: "Fe-S assembly core" },
            ].map((l) => (
              <div key={l.t} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: l.c }}
                  aria-hidden
                />
                {l.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
