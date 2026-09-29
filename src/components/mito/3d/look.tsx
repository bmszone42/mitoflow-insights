import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

// Shared visual helpers for the 3D mitochondrion: Fresnel rim shell, section caps,
// lipid bump texture, grainy matrix, and screen-space callout projection.

const rimVert = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const rimFrag = /* glsl */ `
uniform vec3 uColor; uniform float uI; uniform float uP;
varying vec3 vN; varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP);
  gl_FragColor = vec4(uColor * uI * f, f * 0.9);
}`;

// Additive Fresnel shell drawn over a membrane so its edges catch light like a thin film.
export function Rim({ geometry, color, intensity = 0.8, power = 2.6 }: { geometry: THREE.BufferGeometry; color: string; intensity?: number; power?: number }) {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uI: { value: intensity }, uP: { value: power } }), [color, intensity, power]);
  return (
    <mesh geometry={geometry} renderOrder={5} raycast={() => null}>
      <shaderMaterial vertexShader={rimVert} fragmentShader={rimFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Capsule half-profile (x = radius, y = axis), shared with the membrane lathe.
export function capsuleProfile(R: number, H: number, n = 18) {
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k <= n; k++) {
    const a = -Math.PI / 2 + (k / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-3, R * Math.cos(a)), -H + R * Math.sin(a)));
  }
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-3, R * Math.cos(a)), H + R * Math.sin(a)));
  }
  return pts;
}

// Flat band between two capsule profiles, placed on a cut plane at angle phi around the lathe axis.
export function Cap({ Ro, Ri, H, phi, color, opacity, emissive = 0.05 }: { Ro: number; Ri: number; H: number; phi: number; color: string; opacity: number; emissive?: number }) {
  const geom = useMemo(() => {
    const o = capsuleProfile(Ro, H, 24);
    const i = capsuleProfile(Math.max(0.002, Ri), H, 24).reverse();
    const shape = new THREE.Shape([...o, ...i]);
    return new THREE.ShapeGeometry(shape, 1);
  }, [Ro, Ri, H]);
  return (
    <mesh geometry={geom} rotation={[0, phi - Math.PI / 2, 0]} raycast={() => null}>
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// Soft mottled noise used as a bump map so membranes read as a lipid surface, not plastic.
export function useLipidBump() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    if (g) {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, 256, 256);
      let seed = 11;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let k = 0; k < 900; k++) {
        const x = rnd() * 256;
        const y = rnd() * 256;
        const rad = 2 + rnd() * 7;
        const v = Math.round(90 + rnd() * 110);
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
        gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 3);
    return t;
  }, []);
}

// Fine grain filling the matrix: one draw call of points inside the capsule.
export function MatrixGrains({ L, r, count = 1600 }: { L: number; r: number; count?: number }) {
  const geom = useMemo(() => {
    const pos: number[] = [];
    let seed = 23;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const H = L / 2 - r;
    while (pos.length / 3 < count) {
      const x = (rnd() - 0.5) * L;
      const y = (rnd() - 0.5) * 2 * r;
      const z = (rnd() - 0.5) * 2 * r;
      const ax = Math.max(0, Math.abs(x) - H);
      if (ax * ax + y * y + z * z > r * r * 0.88) continue;
      pos.push(x, y, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [L, r, count]);
  return (
    <points geometry={geom} raycast={() => null}>
      <pointsMaterial color="#d7a39a" size={0.011} sizeAttenuation transparent opacity={0.32} depthWrite={false} />
    </points>
  );
}

export type CalloutEls = { box: HTMLDivElement | null; line: SVGLineElement | null; dot: SVGCircleElement | null }[];

// Projects anchors to screen each frame and stacks labels in left/right columns with leader lines,
// nudging them apart so no two overlap.
export function CalloutProjector({ anchors, els }: { anchors: { p: [number, number, number] }[]; els: React.MutableRefObject<CalloutEls> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const pts = anchors.map((a, i) => {
      v.set(...a.p).project(camera);
      return { i, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, vis: v.z < 1 };
    });
    const place = (col: typeof pts, left: boolean) => {
      col.sort((a, b) => a.y - b.y);
      let last = 44;
      const gapPx = 26;
      const bottom = size.height - 44;
      const ys = col.map((p) => (last = Math.max(p.y, last + gapPx)));
      const over = (ys[ys.length - 1] ?? 0) - bottom;
      col.forEach((p, k) => {
        const e = els.current[p.i];
        if (!e?.box || !e.line || !e.dot) return;
        const y = ys[k]! - Math.max(0, over);
        const w = e.box.offsetWidth;
        const bx = left ? 8 : size.width - 8 - w;
        const ex = left ? bx + w : bx;
        e.box.style.transform = `translate(${bx}px, ${y - 10}px)`;
        e.box.style.opacity = p.vis ? "1" : "0";
        e.line.setAttribute("x1", String(ex));
        e.line.setAttribute("y1", String(y));
        e.line.setAttribute("x2", String(p.x));
        e.line.setAttribute("y2", String(p.y));
        e.dot.setAttribute("cx", String(p.x));
        e.dot.setAttribute("cy", String(p.y));
      });
    };
    place(pts.filter((p) => p.x < size.width / 2), true);
    place(pts.filter((p) => p.x >= size.width / 2), false);
  });
  return null;
}
