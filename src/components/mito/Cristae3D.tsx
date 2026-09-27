import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Geometry, GeometryEffects, Outputs } from "@/lib/mito/model";

export type Overlay = "potential" | "superoxide" | "complexes";

// Canvas cannot read Tailwind tokens; these mirror the app palette in styles.css.
const PAL = {
  bg: "#04120F",
  outer: "#2f6f63",
  inner: "#34D399",
  low: new THREE.Color("#0f4f45"),
  mid: new THREE.Color("#34D399"),
  high: new THREE.Color("#F472B6"),
};

function ramp(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? PAL.low.clone().lerp(PAL.mid, x * 2) : PAL.mid.clone().lerp(PAL.high, (x - 0.5) * 2);
}

function Organelle({
  geo,
  ge,
  out,
  overlay,
}: {
  geo: Geometry;
  ge: GeometryEffects;
  out: Outputs;
  overlay: Overlay;
}) {
  const L = geo.length / 100;
  const r = geo.matrixWidth / 200;
  const gap = geo.swelling / 100;
  const shape = geo.cristaeShape;
  const curv = geo.tipCurvature;

  const cristae = useMemo(() => {
    const spacing = L / (geo.cristaeCount + 1);
    return Array.from({ length: geo.cristaeCount }, (_, k) => {
      const x = -L / 2 + spacing * (k + 1);
      const top = k % 2 === 0;
      // profile of the capsule body at x: cristae fit inside the inner boundary membrane
      const depth = Math.min((geo.cristaeDepth / 100) * 1.3, 2 * r * 0.85);
      const thick = Math.max(0.05, geo.junctionWidth / 100) * 1.6;
      const zExtent = 2 * r * 0.85 * (1 - 0.75 * shape);
      const y = top ? r - depth / 2 : -r + depth / 2;
      const center = Math.abs(x) / (L / 2); // 0 middle, 1 poles
      return { x, y, depth, thick, zExtent, top, center, key: k };
    });
  }, [L, r, geo.cristaeCount, geo.cristaeDepth, geo.junctionWidth, shape]);

  const colorFor = (c: (typeof cristae)[number]) => {
    if (overlay === "potential") return ramp(0.5 + ge.psiShift / 30 - c.center * 0.15);
    if (overlay === "superoxide") {
      const s = Math.log10(Math.max(out.superoxide, 1e-4)) + 1.5; // ~0.03-3 nM mapped 0-1.5
      return ramp(s / 2 + (ge.leak - 1) * 0.6 + c.center * 0.1);
    }
    return ramp(0.35 + 0.5 * curv * ge.capacity * 0.8);
  };

  const tubular = shape >= 0.5;
  const radius = 0.02 + 0.1 * curv;

  return (
    <group rotation={[0.35, -0.5, 0]}>
      {/* Outer membrane */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[r + gap + 0.08, L, 12, 40]} />
        <meshPhysicalMaterial
          color={PAL.outer}
          transparent
          opacity={0.18}
          roughness={0.4}
          clearcoat={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner boundary membrane */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[r + 0.04, L, 12, 40]} />
        <meshStandardMaterial
          color={PAL.inner}
          transparent
          opacity={0.22}
          roughness={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
          emissive={PAL.inner}
          emissiveIntensity={0.05 + Math.min(0.4, out.emission71THz / 300)}
        />
      </mesh>
      {/* Cristae */}
      {cristae.map((c) => {
        const col = colorFor(c);
        return (
          <group key={c.key} position={[c.x, c.y, 0]}>
            {tubular ? (
              <mesh>
                <capsuleGeometry args={[Math.max(c.thick, c.zExtent / 2) * 0.6, Math.max(0.01, c.depth - c.thick), 6, 16]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.25} roughness={0.45} />
              </mesh>
            ) : (
              <RoundedBox args={[c.thick, c.depth, Math.max(c.zExtent, c.thick)]} radius={Math.min(radius, c.thick / 2 - 0.001)} smoothness={3}>
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.25} roughness={0.45} />
              </RoundedBox>
            )}
            {/* Junction neck: narrower when OPA1 junctions are tight */}
            <mesh position={[0, c.top ? c.depth / 2 : -c.depth / 2, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[c.thick * 0.35, c.thick * 0.35, 0.06, 12]} />
              <meshStandardMaterial color={PAL.inner} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function Cristae3D({
  geo,
  ge,
  out,
  overlay,
}: {
  geo: Geometry;
  ge: GeometryEffects;
  out: Outputs;
  overlay: Overlay;
}) {
  const controls = useRef<{ reset: () => void } | null>(null);
  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-md sm:h-[460px]">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 6.5], fov: 45 }} aria-label="3D mitochondrion">
        <color attach="background" args={[PAL.bg]} />
        <fog attach="fog" args={[PAL.bg, 9, 18]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <pointLight position={[-4, -2, 3]} intensity={6} color="#F472B6" distance={12} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#8fd" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Organelle geo={geo} ge={ge} out={out} overlay={overlay} />
        <OrbitControls ref={controls as never} enablePan={false} minDistance={3} maxDistance={12} makeDefault />
      </Canvas>
      <button
        type="button"
        onClick={() => controls.current?.reset()}
        className="absolute right-2 top-2 rounded border border-border bg-card/80 px-2 py-1 font-mono text-[11px] text-foreground"
      >
        Reset view
      </button>
      <p className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-muted-foreground">
        drag to rotate, scroll or pinch to zoom
      </p>
    </div>
  );
}
