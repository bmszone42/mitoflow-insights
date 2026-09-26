import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Outputs } from "@/lib/mito/model";

type Geometry = {
  cristaeCount: number;
  cristaeDepth: number;
  junctionWidth: number;
  matrixWidth: number;
  length: number;
};

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

export function StructureModeler({ out }: { out: Outputs }) {
  const [geo, setGeo] = useState<Geometry>({
    cristaeCount: 9,
    cristaeDepth: 62,
    junctionWidth: 10,
    matrixWidth: 150,
    length: 420,
  });
  const [showComplexes, setShowComplexes] = useState(true);
  const [showRos, setShowRos] = useState(true);
  const [selected, setSelected] = useState<string>("CIV");

  const surfaceArea = useMemo(() => {
    const perCrista = 2 * geo.cristaeDepth * 0.9 + 2 * geo.junctionWidth;
    return Math.round(geo.cristaeCount * perCrista + 2 * geo.length);
  }, [geo]);

  const cristaeDensity = (geo.cristaeCount / (geo.length / 100)).toFixed(1);
  const rosOpacity = Math.min(0.9, 0.12 + out.redoxStress / 120);
  const glow = Math.min(1, out.emission71THz / 110);

  const cristae = Array.from({ length: geo.cristaeCount }, (_, k) => {
    const spacing = geo.length / (geo.cristaeCount + 1);
    const x = 60 + spacing * (k + 1);
    const fromTop = k % 2 === 0;
    return { x, fromTop, key: k };
  });

  const setGeoKey = (k: keyof Geometry, v: number) => setGeo({ ...geo, [k]: v });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="panel space-y-5 p-4">
        <h2 className="text-sm font-semibold">Geometry</h2>
        {(
          [
            { k: "cristaeCount", label: "Cristae count", min: 2, max: 22, step: 1 },
            { k: "cristaeDepth", label: "Crista depth", min: 20, max: 110, step: 1 },
            { k: "junctionWidth", label: "Junction width", min: 4, max: 34, step: 1 },
            { k: "matrixWidth", label: "Matrix width", min: 110, max: 230, step: 1 },
            { k: "length", label: "Organelle length", min: 240, max: 620, step: 10 },
          ] as const
        ).map((c) => (
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Structure view</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-mono text-[11px]">
                71 THz {out.emission71THz.toFixed(0)}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px]">
                stress {out.redoxStress.toFixed(0)}
              </Badge>
            </div>
          </div>
          <svg
            viewBox={`0 0 ${geo.length + 120} ${geo.matrixWidth + 120}`}
            className="mt-3 w-full"
            role="img"
            aria-label="Cross section of a mitochondrion with cristae and respiratory complexes"
          >
            <defs>
              <linearGradient id="matrixFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-secondary)" />
                <stop offset="100%" stopColor="var(--color-card)" />
              </linearGradient>
              <radialGradient id="rosField">
                <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={rosOpacity} />
                <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
              </radialGradient>
              <filter id="soft">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            <rect
              x="20"
              y="20"
              width={geo.length + 80}
              height={geo.matrixWidth + 80}
              rx="90"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="3"
            />
            <rect
              x="40"
              y="40"
              width={geo.length + 40}
              height={geo.matrixWidth + 40}
              rx="70"
              fill="url(#matrixFill)"
              stroke="var(--color-primary)"
              strokeOpacity={0.35 + glow * 0.5}
              strokeWidth="3"
            />

            {showRos && (
              <circle
                cx={(geo.length + 120) / 2}
                cy={(geo.matrixWidth + 120) / 2}
                r={geo.matrixWidth * 0.7}
                fill="url(#rosField)"
                filter="url(#soft)"
              />
            )}

            {cristae.map((c) => {
              const top = 40;
              const bottom = geo.matrixWidth + 80;
              const y1 = c.fromTop ? top + 12 : bottom - 12;
              const y2 = c.fromTop ? top + 12 + geo.cristaeDepth : bottom - 12 - geo.cristaeDepth;
              return (
                <g key={c.key}>
                  <path
                    d={`M ${c.x - geo.junctionWidth / 2} ${y1} L ${c.x - geo.junctionWidth / 2} ${y2} Q ${c.x} ${y2 + (c.fromTop ? 18 : -18)} ${c.x + geo.junctionWidth / 2} ${y2} L ${c.x + geo.junctionWidth / 2} ${y1}`}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeOpacity={0.55 + glow * 0.4}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {showComplexes &&
                    ["CI", "CIII", "CIV", "CV"].map((cx, idx) => {
                      const t = (idx + 1) / 5;
                      const cy = y1 + (y2 - y1) * t;
                      const colors: Record<string, string> = {
                        CI: "var(--color-chart-1)",
                        CIII: "var(--color-chart-4)",
                        CIV: "var(--color-chart-2)",
                        CV: "var(--color-chart-3)",
                      };
                      return (
                        <circle
                          key={cx}
                          cx={c.x}
                          cy={cy}
                          r={selected === cx ? 6.5 : 4.5}
                          fill={colors[cx]}
                          opacity={selected === cx ? 1 : 0.75}
                          className="cursor-pointer"
                          onClick={() => setSelected(cx)}
                        />
                      );
                    })}
                </g>
              );
            })}

            {showComplexes && (
              <g
                className="cursor-pointer"
                onClick={() => setSelected("ISC")}
                transform={`translate(${(geo.length + 120) / 2 - 26}, ${(geo.matrixWidth + 120) / 2 - 10})`}
              >
                <rect
                  width="52"
                  height="20"
                  rx="6"
                  fill="var(--color-accent)"
                  opacity={selected === "ISC" ? 0.95 : 0.6}
                />
                <text x="26" y="14" textAnchor="middle" fontSize="10" fill="var(--color-background)">
                  Fe-S
                </text>
              </g>
            )}
          </svg>
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
