import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Geometry, GeometryEffects, Inputs, Outputs } from "@/lib/mito/model";
import { Organelle, type Overlay } from "./3d/Organelle";
import { PAL } from "./3d/parts";
import { partInfo, type PartId } from "./3d/info";
import { layout, presetCamera, type ViewPreset } from "./3d/layout";

export type { Overlay };

// Glides the camera and orbit target to a zoom preset, then hands control back to the user.
function CameraRig({ goal }: { goal: { pos: [number, number, number]; target: [number, number, number]; n: number } }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update: () => void } | null };
  const active = useRef(-1);
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    if (active.current !== goal.n) {
      p.set(...goal.pos);
      t.set(...goal.target);
      const k = 1 - Math.exp(-4 * Math.min(dt, 0.05));
      camera.position.lerp(p, k);
      if (controls) {
        controls.target.lerp(t, k);
        controls.update();
      }
      if (camera.position.distanceTo(p) < 0.002) active.current = goal.n;
    }
  });
  return null;
}

const PRESETS: [ViewPreset, string][] = [
  ["whole", "Whole organelle"],
  ["crista", "Crista close-up"],
  ["complex", "Complex close-up"],
  ["fes", "Fe-S cluster"],
];

const LEGEND: [string, string][] = [
  [PAL.ci, "CI"],
  [PAL.cii, "CII"],
  [PAL.ciii, "CIII"],
  [PAL.civ, "CIV"],
  [PAL.atp, "ATP synthase"],
  [PAL.electron, "e-"],
  [PAL.proton, "H+"],
  [PAL.ros, "ROS"],
  [PAL.fe, "Fe"],
  [PAL.s, "S"],
];

export default function Cristae3D({ geo, ge, out, overlay, onPick, selected, inputs, onStepClick }: { geo: Geometry; ge: GeometryEffects; out: Outputs; overlay: Overlay; onPick?: ((id: PartId | null) => void) | undefined; selected?: PartId | null | undefined; inputs?: Inputs | undefined; onStepClick?: ((stepIndex: number) => void) | undefined }) {
  const lay = useMemo(() => layout(geo), [geo]);
  const [view, setView] = useState<ViewPreset>("whole");
  const [n, setN] = useState(0);
  const [labels, setLabels] = useState(true);
  const [sel, setSelRaw] = useState<PartId | null>(null);
  const setSel = (id: PartId | null) => {
    setSelRaw(id);
    onPick?.(id);
  };
  useEffect(() => {
    if (selected !== undefined) setSelRaw(selected);
  }, [selected]);
  const goal = useMemo(() => ({ ...presetCamera(lay, view), n }), [lay, view, n]);
  const info = sel ? partInfo(sel, out, ge) : null;

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-md sm:h-[560px]">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 1.6, 6.6], fov: 42, near: 0.01, far: 60 }} aria-label="3D mitochondrion" onPointerMissed={() => setSel(null)}>
        <color attach="background" args={[PAL.bg]} />
        <fog attach="fog" args={[PAL.bg, 8, 20]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} />
        <pointLight position={[-4, -2, 3]} intensity={5} color="#ff9bd0" distance={12} />
        <pointLight position={[3, 1, 2]} intensity={3} color="#9fd8ff" distance={10} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#fcb" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
          <Lightformer intensity={0.8} color="#9df" position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Organelle geo={geo} ge={ge} out={out} overlay={overlay} lay={lay} labels={labels && view === "whole"} evLabels={view === "complex"} onPick={setSel} inputs={inputs} onStepClick={onStepClick} />
        <OrbitControls enablePan={false} minDistance={0.08} maxDistance={12} makeDefault />
        <CameraRig goal={goal} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1.1} luminanceSmoothing={0.25} resolutionScale={0.5} />
        </EffectComposer>
      </Canvas>

      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
        {PRESETS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setView(k);
              setN((x) => x + 1);
            }}
            className={`rounded border px-2 py-1 font-mono text-[11px] ${view === k ? "border-primary bg-primary/20 text-primary" : "border-border bg-card/80 text-foreground"}`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setLabels((v) => !v)}
          className="rounded border border-border bg-card/80 px-2 py-1 font-mono text-[11px] text-foreground"
        >
          Labels {labels ? "on" : "off"}
        </button>
      </div>

      {info && (
        <div className="absolute right-2 top-2 max-w-[260px] rounded-md border border-border bg-card/90 p-3 text-xs shadow-lg">
          <div className="font-semibold text-foreground">{info.name}</div>
          <p className="mt-1 text-muted-foreground">{info.role}</p>
          <p className="mt-2 font-mono text-primary">{info.live}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
        {view === "complex" && (
          <span className="flex items-center gap-2 rounded border border-border bg-card/80 px-2 py-1">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "rgba(78,222,174,0.6)" }} />
              <span style={{ color: "#e7fff7" }}>green: live ATP/pr at or above standard, cost at or under 0.52 eV/ATP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "rgba(255,190,92,0.75)" }} />
              <span style={{ color: "#ffe9c4" }}>amber: yield below standard or cost above 0.52 eV/ATP</span>
            </span>
          </span>
        )}
        {LEGEND.map(([c, l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
            {l}
          </span>
        ))}
        <span className="ml-auto">click any part for details, drag to rotate, scroll to zoom</span>
      </div>
    </div>
  );
}
