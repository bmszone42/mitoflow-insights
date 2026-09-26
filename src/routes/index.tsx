import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Simulator } from "@/components/mito/Simulator";
import { StructureModeler } from "@/components/mito/StructureModeler";
import { Sensitivity } from "@/components/mito/Sensitivity";
import { ReferenceLibrary } from "@/components/mito/ReferenceLibrary";
import { Scenarios } from "@/components/mito/Scenarios";
import { Compare } from "@/components/mito/Compare";
import { Interpreter } from "@/components/mito/Interpreter";
import type { Scenario } from "@/lib/mito/scenarios";
import { defaultInputs, simulate, type Inputs } from "@/lib/mito/model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cristae Lab | Mitochondrial ROS, Fe-S and photon modeling" },
      {
        name: "description",
        content:
          "Model mitochondrial structure, all major ROS species, Fe-S clusters and iron metabolism, with red and near-infrared photon input and a 71 THz output band.",
      },
      { property: "og:title", content: "Cristae Lab | Mitochondrial modeling workspace" },
      {
        property: "og:description",
        content:
          "Literature-parameterized simulator for ROS, Fe-S clusters, iron handling, photon dose response and mid-infrared output.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const out = useMemo(() => simulate(inputs), [inputs]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Scenario["interpretation"]>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const onLoad = (s: Scenario) => {
    setInputs({ ...defaultInputs, ...s.inputs });
    setActiveId(s.id);
    setLoaded(s.interpretation);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <header className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label">Mitochondrial modeling workspace</div>
            <h1 className="text-glow mt-1 text-3xl font-bold sm:text-4xl">Cristae Lab</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Structure, reactive species, iron and light in one model. Electron flux drives ROS
              production, superoxide attacks Fe-S clusters, released iron feeds Fenton chemistry, and
              red or near-infrared photons shift cytochrome c oxidase turnover and the 71 THz output
              band.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="font-mono text-[11px]">ATP {out.atpFlux.toFixed(0)} µM/s</Badge>
            <Badge variant="secondary" className="font-mono text-[11px]">
              O2•- {out.superoxide.toFixed(2)} nM
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              71 THz {out.emission71THz.toFixed(0)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-[1500px]">
        <Tabs defaultValue="sim">
          <TabsList>
            <TabsTrigger value="sim">Simulator</TabsTrigger>
            <TabsTrigger value="sens">Sensitivity</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="library">Reference</TabsTrigger>
          </TabsList>
          <TabsContent value="sim" className="mt-4">
            <Simulator inputs={inputs} setInputs={setInputs} out={out} />
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <Scenarios
                inputs={inputs}
                out={out}
                onLoad={onLoad}
                activeId={activeId}
                setActiveId={setActiveId}
                refreshKey={refreshKey}
              />
              <Interpreter
                inputs={inputs}
                setInputs={setInputs}
                out={out}
                activeId={activeId}
                initial={loaded}
                onSaved={() => setRefreshKey((k) => k + 1)}
              />
            </div>
            <div className="mt-4">
              <Compare refreshKey={refreshKey} />
            </div>
          </TabsContent>
          <TabsContent value="sens" className="mt-4">
            <Sensitivity inputs={inputs} />
          </TabsContent>
          <TabsContent value="structure" className="mt-4">
            <StructureModeler out={out} />
          </TabsContent>
          <TabsContent value="library" className="mt-4">
            <ReferenceLibrary />
          </TabsContent>
        </Tabs>
        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          Rate constants and dose optima follow published values noted in the model source. Outputs
          are lumped steady-state estimates for exploration and teaching, not clinical or
          experimental predictions. The 71 THz band is modeled as a relative coherence and coupling
          index, not an absolute radiometric quantity.
        </p>
      </main>
    </div>
  );
}
