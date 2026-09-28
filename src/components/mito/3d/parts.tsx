import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Canvas cannot read Tailwind tokens; these mirror the app palette in styles.css.
export const PAL = {
  bg: "#04120F",
  outer: "#e8927c",
  outerEdge: "#f4b8a4",
  inner: "#f0a58f",
  crista: "#e98a73",
  matrix: "#5a1f2a",
  head: "#9fd8ff",
  tail: "#f6d7a8",
  ci: "#5aa9ff",
  cii: "#8f7cff",
  ciii: "#ff6b7a",
  civ: "#7fd6ff",
  atp: "#ffc94a",
  cytc: "#8fe3ff",
  q: "#ffd65a",
  fe: "#d0662a",
  s: "#f2cf2e",
  dna: "#b77cff",
  tca: "#e6f5ee",
  electron: "#e8fbff",
  proton: "#ff9bd0",
  ros: "#ff3d7f",
  red: "#ff2a2a",
  nir: "#b21a40",
  thz: "#b98cff",
  low: new THREE.Color("#3a1a4f"),
  mid: new THREE.Color("#e98a73"),
  high: new THREE.Color("#ff3d7f"),
};

export function ramp(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? PAL.low.clone().lerp(PAL.mid, x * 2) : PAL.mid.clone().lerp(PAL.high, (x - 0.5) * 2);
}

export type Xf = { p: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number] };

// One draw call for many copies of the same shape.
export function Inst({
  items,
  children,
  onClick,
  name,
}: {
  items: Xf[];
  children: React.ReactNode;
  onClick?: () => void;
  name?: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    items.forEach((it, k) => {
      o.position.set(...it.p);
      o.rotation.set(...(it.r ?? [0, 0, 0]));
      const s = it.s ?? 1;
      if (typeof s === "number") o.scale.setScalar(s);
      else o.scale.set(...s);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    });
    m.count = items.length;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[undefined, undefined, Math.max(1, items.length)]}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={onClick ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = "") : undefined}
    >
      {children}
    </instancedMesh>
  );
}

// Ball-and-stick [2Fe-2S] or [4Fe-4S] cluster. `intact` 0-1 fades and loosens the cube as clusters erode.
export function FeSCluster({ kind, intact, scale = 1 }: { kind: "2Fe2S" | "4Fe4S"; intact: number; scale?: number }) {
  const atoms = useMemo(() => {
    if (kind === "2Fe2S")
      return [
        { p: [-0.5, 0, 0], fe: true },
        { p: [0.5, 0, 0], fe: true },
        { p: [0, 0.55, 0], fe: false },
        { p: [0, -0.55, 0], fe: false },
      ] as { p: [number, number, number]; fe: boolean }[];
    const c: { p: [number, number, number]; fe: boolean }[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const fe = x * y * z > 0;
      c.push({ p: [x * 0.45, y * 0.45, z * 0.45], fe });
    }
    return c;
  }, [kind]);
  const bonds = useMemo(() => {
    const b: [THREE.Vector3, THREE.Vector3][] = [];
    for (let a = 0; a < atoms.length; a++)
      for (let c = a + 1; c < atoms.length; c++) {
        if (atoms[a].fe === atoms[c].fe) continue;
        const va = new THREE.Vector3(...atoms[a].p);
        const vc = new THREE.Vector3(...atoms[c].p);
        if (va.distanceTo(vc) < 1.35) b.push([va, vc]);
      }
    return b;
  }, [atoms]);
  const loose = 1 + (1 - intact) * 0.8;
  return (
    <group scale={scale}>
      {atoms.map((a, k) => (
        <mesh key={k} position={a.p.map((v) => v * loose) as [number, number, number]}>
          <sphereGeometry args={[a.fe ? 0.24 : 0.28, 20, 20]} />
          <meshStandardMaterial
            color={a.fe ? PAL.fe : PAL.s}
            metalness={a.fe ? 0.6 : 0.1}
            roughness={0.3}
            emissive={a.fe ? PAL.fe : PAL.s}
            emissiveIntensity={a.fe ? 0.15 + (1 - intact) * 1.2 : 0.1}
          />
        </mesh>
      ))}
      {bonds.map(([a, b], k) => {
        const mid = a.clone().add(b).multiplyScalar(0.5 * loose);
        const len = a.distanceTo(b) * loose;
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        return (
          <mesh key={k} position={mid} quaternion={q}>
            <cylinderGeometry args={[0.05, 0.05, len, 8]} />
            <meshStandardMaterial color="#b9a99a" roughness={0.5} transparent opacity={0.4 + 0.6 * intact} />
          </mesh>
        );
      })}
    </group>
  );
}
