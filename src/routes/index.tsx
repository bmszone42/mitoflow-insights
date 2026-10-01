import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { AccountButton } from "@/components/mito/AccountButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Simulator } from "@/components/mito/Simulator";
import { termsFor, DRIVER_PART } from "@/components/mito/3d/terms";
import { partInfo, type PartId } from "@/components/mito/3d/info";
import { PathwayMap, ThzHypotheses, EtcEnergyCard } from "@/components/mito/PathwayMap";
import { StructureModeler } from "@/components/mito/StructureModeler";
import { Sensitivity } from "@/components/mito/Sensitivity";
import { ReferenceLibrary } from "@/components/mito/ReferenceLibrary";
import { Scenarios } from "@/components/mito/Scenarios";
import { Compare } from "@/components/mito/Compare";
import { Interpreter } from "@/components/mito/Interpreter";
import { WarburgDashboard } from "@/components/mito/WarburgDashboard";
import { WarburgPhysiology } from "@/components/mito/WarburgPhysiology";
import { PhysiologyOverview } from "@/components/mito/PhysiologyOverview";
import { PhysiologyReferences } from "@/components/mito/PhysiologyReferences";
import { RosPhysiology } from "@/components/mito/RosPhysiology";
import { PatientData } from "@/components/mito/PatientData";
import { MicrographAnalyzer } from "@/components/mito/MicrographAnalyzer";
import { scenarioGeometry, type Scenario } from "@/lib/mito/scenarios";
import { defaultGeometry, defaultInputs, geometryEffects, simulate, type Geometry, type Inputs } from "@/lib/mito/model";

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
  const [geo, setGeo] = useState<Geometry>(defaultGeometry);
  const [tab, setTab] = useState("sim");
  const [stepFocus, setStepFocus] = useState<number | null>(null);
  const [mapTerm, setMapTerm] = useState<{ id: string; n: number } | null>(null);
  const selectTerm = (id: string) => {
    setMapTerm((m) => ({ id, n: (m?.n ?? 0) + 1 }));
    if (id === "glyco") {
      setTab("sim");
      requestAnimationFrame(() => document.querySelector('[data-testid="glycolysis-readout"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setTab("sens");
  };
  const out = useMemo(() => simulate(inputs, geo), [inputs, geo]);
  const [picked, setPicked] = useState<PartId | null>(null);
  const pickedName = picked ? partInfo(picked, out, geometryEffects(geo)).name : undefined;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Scenario["interpretation"]>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [compareKey, setCompareKey] = useState(0);
  const onAuthChange = useCallback(() => {
    setActiveId(null);
    setRefreshKey((k) => k + 1);
  }, []);
  const onLoad = (s: Scenario) => {
    setInputs({ ...defaultInputs, ...s.inputs });
    setGeo(scenarioGeometry(s));
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
        <div className="mt-3">
          <AccountButton onChange={onAuthChange} />
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-[1500px]">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="sim">Simulator</TabsTrigger>
            <TabsTrigger value="sens">Sensitivity</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="warburg">Warburg</TabsTrigger>
            <TabsTrigger value="physiology">Physiology</TabsTrigger>
            <TabsTrigger value="patients">Patient Data</TabsTrigger>
            <TabsTrigger value="library">Reference</TabsTrigger>
          </TabsList>
          <TabsContent value="sim" className="mt-4">
            <Simulator inputs={inputs} setInputs={setInputs} geo={geo} out={out} onSaved={() => setRefreshKey((k) => k + 1)} />
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <PathwayMap out={out} inputs={inputs} highlight={termsFor(picked)} source={pickedName} onSelect={selectTerm} complex={picked} />
              <ThzHypotheses out={out} />
            </div>
            <div className="mt-4">
              <EtcEnergyCard out={out} inputs={inputs} focusStep={stepFocus} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <Scenarios
                inputs={inputs}
                geo={geo}
                out={out}
                onLoad={onLoad}
                activeId={activeId}
                setActiveId={setActiveId}
                refreshKey={refreshKey}
                onChanged={() => setCompareKey((k) => k + 1)}
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
              <Compare
                refreshKey={refreshKey + compareKey}
                onViewShape={(g) => {
                  setGeo(g);
                  setTab("structure");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="sens" className="mt-4">
            <div className="mb-4">
              <PathwayMap out={out} inputs={inputs} highlight={mapTerm ? (mapTerm.id === "warburg" ? ["nadh", "succ", "etc", "glyco"] : [mapTerm.id]) : []} source={undefined} onSelect={selectTerm} />
            </div>
            <Sensitivity inputs={inputs} geo={geo} term={mapTerm} onDriverClick={(k) => { const p = DRIVER_PART[k]; if (p) { setPicked(p); setTab("structure"); window.scrollTo({ top: 0 }); } }} onSaved={() => setRefreshKey((k) => k + 1)} />
          </TabsContent>
          <TabsContent value="structure" className="mt-4">
            <StructureModeler out={out} inputs={inputs} geo={geo} setGeo={setGeo} onPick={setPicked} selected={picked} onStepClick={(i) => { setStepFocus(i); setTab("sim"); }} />
            <div className="mt-4">
              <PathwayMap out={out} inputs={inputs} highlight={termsFor(picked)} source={pickedName} onSelect={selectTerm} complex={picked} />
            </div>
            <div className="mt-4">
              <MicrographAnalyzer
                inputs={inputs}
                setInputs={setInputs}
                out={out}
                geo={geo}
                setGeo={setGeo}
                activeId={activeId}
                onSaved={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </TabsContent>
          <TabsContent value="warburg" className="mt-4">
            <Tabs defaultValue="dashboard" data-testid="warburg-tabs">
              <TabsList aria-label="Warburg views">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="physiology">Physiology</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="mt-4">
                <WarburgDashboard inputs={inputs} setInputs={setInputs} geo={geo} out={out} onOpenSimulator={() => { setTab("sim"); requestAnimationFrame(() => document.querySelector('[data-testid="glycolysis-readout"]')?.scrollIntoView({ behavior: "smooth", block: "center" })); }} />
              </TabsContent>
              <TabsContent value="physiology" className="mt-4">
                <WarburgPhysiology inputs={inputs} geo={geo} out={out} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="physiology" className="mt-4">
            <Tabs defaultValue="overview" data-testid="physiology-tabs">
              <TabsList aria-label="Physiology views">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ros">ROS physiology</TabsTrigger>
                <TabsTrigger value="references">References</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4"><PhysiologyOverview inputs={inputs} geo={geo} out={out} refreshKey={refreshKey} /></TabsContent>
              <TabsContent value="ros" className="mt-4"><RosPhysiology inputs={inputs} geo={geo} out={out} /></TabsContent>
              <TabsContent value="references" className="mt-4"><PhysiologyReferences /></TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="patients" className="mt-4">
            <PatientData inputs={inputs} out={out} />
          </TabsContent>
          <TabsContent value="library" className="mt-4">
            <ReferenceLibrary onWarburg={() => { selectTerm("warburg"); window.scrollTo({ top: 0 }); }} />
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
