import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Geometry, GeometryEffects, Inputs, Outputs } from "@/lib/mito/model";
import { etcSteps, liveAtpPerPair, atpPerPair, stdAtpPerPair, ATP_COST_EV } from "@/lib/mito/reference";
import { FeSCluster, Inst, PAL, ramp, type Xf } from "./parts";
import type { PartId } from "./info";
import type { Crista, Layout } from "./layout";
import { Cap, MatrixGrains, Rim, capsuleProfile, useLipidBump } from "./look";

export type Overlay = "potential" | "superoxide" | "complexes";

const CUT = Math.PI * 0.42; // half-angle of the cutaway wedge facing the camera

function Label3D({ text, position, size = 0.28, onClick, tone = "ok" }: { text: string; position: [number, number, number]; size?: number; onClick?: (() => void) | undefined; tone?: "ok" | "warn" }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const scale = 2;
    const fontSize = 22;
    const padX = 14;
    const padY = 8;
    const font = `${fontSize}px monospace`;
    if (!context) return new THREE.CanvasTexture(canvas);
    context.font = font;
    canvas.width = Math.ceil(context.measureText(text).width + padX * 2) * scale;
    canvas.height = (fontSize + padY * 2) * scale;
    context.scale(scale, scale);
    context.font = font;
    context.textBaseline = "middle";
    const warn = tone === "warn";
    context.fillStyle = warn ? "rgba(40, 26, 6, 0.9)" : "rgba(8, 28, 25, 0.9)";
    context.strokeStyle = warn ? "rgba(255, 190, 92, 0.75)" : "rgba(78, 222, 174, 0.6)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(0.5, 0.5, canvas.width / scale - 1, canvas.height / scale - 1, 5);
    context.fill();
    context.stroke();
    context.fillStyle = warn ? "#ffe9c4" : "#e7fff7";
    context.fillText(text, padX, canvas.height / scale / 2);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.minFilter = THREE.LinearFilter;
    return next;
  }, [text, tone]);
  useEffect(() => () => texture.dispose(), [texture]);
  const aspect = texture.image.width / texture.image.height;
  return (
    <sprite
      position={position}
      scale={[size * aspect, size, 1]}
      renderOrder={20}
      {...(onClick
        ? {
            onClick: (e: { stopPropagation: () => void }) => {
              e.stopPropagation();
              onClick();
            },
          }
        : {})}
    >
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

// Lipid heads on both leaflets along the cut edges, so the bilayer reads at the section.
function bilayer(R: number, H: number, t: number, step: number): { heads: Xf[]; tails: Xf[] } {
  const heads: Xf[] = [];
  const tails: Xf[] = [];
  const prof = capsuleProfile(R, H, 40);
  let acc = 0;
  for (let k = 1; k < prof.length; k++) {
    const a = prof[k - 1]!;
    const b = prof[k]!;
    const seg = a.distanceTo(b);
    acc += seg;
    if (acc < step) continue;
    acc = 0;
    const tan = b.clone().sub(a).normalize();
    const nrm = new THREE.Vector2(tan.y, -tan.x);
    for (const phi of [CUT, 2 * Math.PI - CUT]) {
      for (const side of [1, -1]) {
        const p = b.clone().add(nrm.clone().multiplyScalar(side * t));
        const q = b.clone().add(nrm.clone().multiplyScalar(side * t * 0.35));
        heads.push({ p: [p.x * Math.sin(phi), p.y, p.x * Math.cos(phi)] });
        tails.push({ p: [q.x * Math.sin(phi), q.y, q.x * Math.cos(phi)], r: [0, 0, Math.atan2(nrm.y, nrm.x) - Math.PI / 2] });
      }
    }
  }
  return { heads, tails };
}

function Membrane({ R, H, color, opacity, emissive, id, onPick, thz, rim, band }: { R: number; H: number; color: string; opacity: number; emissive: number; id: PartId; onPick: (p: PartId) => void; thz?: number; rim: string; band: number }) {
  const geom = useMemo(() => new THREE.LatheGeometry(capsuleProfile(R, H, 24), 96, CUT, 2 * Math.PI - 2 * CUT), [R, H]);
  const bl = useMemo(() => bilayer(R, H, 0.022, 0.035), [R, H]);
  const bump = useLipidBump();
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current && thz !== undefined) {
      mat.current.emissiveIntensity = emissive + thz * 0.25 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 6));
    }
  });
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh
        geometry={geom}
        onClick={(e) => {
          e.stopPropagation();
          onPick(id);
        }}
      >
        <meshPhysicalMaterial
          ref={mat}
          color={color}
          emissive={thz !== undefined ? PAL.thz : color}
          emissiveIntensity={emissive}
          transparent
          opacity={opacity}
          roughness={0.55}
          bumpMap={bump}
          bumpScale={0.6}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
          sheen={0.6}
          sheenRoughness={0.4}
          sheenColor={rim}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Rim geometry={geom} color={rim} intensity={0.55} />
      {[CUT, 2 * Math.PI - CUT].map((phi) => (
        <Cap key={phi} Ro={R + band} Ri={R - band} H={H} phi={phi} color={color} opacity={0.85} emissive={0.12} />
      ))}
      <Inst items={bl.heads}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={PAL.head} roughness={0.35} emissive={PAL.head} emissiveIntensity={0.15} />
      </Inst>
      <Inst items={bl.tails}>
        <cylinderGeometry args={[0.004, 0.004, 0.018, 4]} />
        <meshStandardMaterial color={PAL.tail} roughness={0.8} />
      </Inst>
    </group>
  );
}

function cristaColor(c: Crista, overlay: Overlay, ge: GeometryEffects, out: Outputs, curv: number) {
  if (overlay === "potential") return ramp(0.5 + ge.psiShift / 30 - c.center * 0.15);
  if (overlay === "superoxide") {
    const s = Math.log10(Math.max(out.superoxide, 1e-4)) + 2.5;
    return ramp(s / 2.5 + (ge.leak - 1) * 0.6 + c.center * 0.1);
  }
  return ramp(0.35 + 0.5 * curv * ge.capacity * 0.8);
}

export function Organelle({
  geo,
  ge,
  out,
  overlay,
  lay,
  detail,
  evLabels,
  onPick,
  inputs,
  onStepClick,
}: {
  geo: Geometry;
  ge: GeometryEffects;
  out: Outputs;
  overlay: Overlay;
  lay: Layout;
  detail: boolean;
  evLabels: boolean;
  onPick: (p: PartId) => void;
  inputs?: Inputs | undefined;
  onStepClick?: ((stepIndex: number) => void) | undefined;
}) {
  const { L, r, gap, cristae, yAt, zRows } = lay;
  const H = L / 2 - r;
  const curv = geo.tipCurvature;

  // Static placements of complexes, carriers and matrix contents.
  const place = useMemo(() => {
    const ciArm: Xf[] = [];
    const ciHead: Xf[] = [];
    const cii: Xf[] = [];
    const ciii: Xf[] = [];
    const civ: Xf[] = [];
    const atpStalk: Xf[] = [];
    const atpHead: Xf[] = [];
    const cytc: Xf[] = [];
    const q: Xf[] = [];
    const rosSites: [number, number, number][] = [];
    const civSites: [number, number, number][] = [];
    const chain: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3 }[] = [];
    const pump: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const c of cristae) {
      const tipDir = c.top ? -1 : 1;
      for (const s of [1, -1]) {
        const fx = c.x + s * (c.thick / 2);
        for (const z of zRows(c)) {
          const y1 = yAt(c, 0.25);
          const y2 = yAt(c, 0.36);
          const y3 = yAt(c, 0.5);
          const y4 = yAt(c, 0.68);
          ciArm.push({ p: [fx, y1, z] });
          ciHead.push({ p: [fx + s * 0.05, y1 + tipDir * 0.03, z + 0.05] });
          cii.push({ p: [fx + s * 0.018, y2, z - 0.05] });
          ciii.push({ p: [fx + s * 0.015, y3, z - 0.025] }, { p: [fx + s * 0.015, y3, z + 0.025] });
          civ.push({ p: [fx + s * 0.012, y4, z], r: [0, 0, Math.PI / 2] });
          q.push({ p: [fx, yAt(c, 0.3 + rnd() * 0.15), z + (rnd() - 0.5) * 0.1] });
          rosSites.push([fx + s * 0.07, y1, z], [fx + s * 0.04, y3, z]);
          civSites.push([fx + s * 0.03, y4, z]);
          chain.push({ a: new THREE.Vector3(fx + s * 0.03, y1, z), b: new THREE.Vector3(fx + s * 0.03, y3, z), c: new THREE.Vector3(fx + s * 0.03, y4, z) });
          for (const y of [y1, y3, y4]) pump.push({ from: new THREE.Vector3(fx + s * 0.02, y, z), to: new THREE.Vector3(c.x, y + (rnd() - 0.5) * 0.06, z + (rnd() - 0.5) * 0.08) });
        }
      }
      // ATP synthase dimer rows bend the tip
      const yt = yAt(c, 1);
      const n = Math.max(3, Math.round(c.zExtent / 0.09));
      for (let k = 0; k < n; k++) {
        const z = -c.zExtent / 2 + ((k + 0.5) / n) * c.zExtent;
        for (const s of [1, -1]) {
          const ang = s * (0.35 + 0.5 * curv);
          const dx = Math.sin(ang) * 0.05;
          const dy = tipDir * Math.cos(ang) * 0.05;
          atpStalk.push({ p: [c.x + dx * 0.5, yt + dy * 0.5, z], r: [0, 0, -ang * tipDir] });
          atpHead.push({ p: [c.x + dx * 1.3, yt + dy * 1.3, z] });
        }
      }
      for (let k = 0; k < 6; k++) cytc.push({ p: [c.x + (rnd() - 0.5) * c.thick * 0.5, yAt(c, 0.2 + rnd() * 0.7), (rnd() - 0.5) * c.zExtent * 0.9] });
    }
    // matrix granules
    const gran: Xf[] = [];
    for (let k = 0; k < 40; k++) gran.push({ p: [(rnd() - 0.5) * L * 0.85, (rnd() - 0.5) * r * 0.8, (rnd() - 0.5) * r * 1.4], s: 0.6 + rnd() });
    return { ciArm, ciHead, cii, ciii, civ, atpStalk, atpHead, cytc, q, rosSites, civSites, chain, pump, gran };
  }, [cristae, yAt, zRows, curv, L, r]);

  // mtDNA nucleoids: beads on circles
  const dna = useMemo(() => {
    const beads: Xf[] = [];
    const centers: [number, number, number][] = [
      [-L * 0.28, 0, -r * 0.25],
      [L * 0.3, -0.05, -r * 0.2],
    ];
    for (const c of centers)
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        beads.push({ p: [c[0] + Math.cos(a) * 0.14, c[1] + Math.sin(a) * 0.14 + Math.sin(a * 5) * 0.015, c[2] + Math.sin(a * 3) * 0.02] });
      }
    return { beads, centers };
  }, [L, r]);

  const tcaC: [number, number, number] = [-L * 0.05, 0, r * 0.1];
  const tcaNodes = useMemo(() => Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2;
    return { p: [tcaC[0] + Math.cos(a) * 0.16, tcaC[1] + Math.sin(a) * 0.16, tcaC[2]] as [number, number, number] };
  }), [tcaC[0], tcaC[1], tcaC[2]]);

  // Animated flows
  const eRef = useRef<THREE.InstancedMesh>(null);
  const hRef = useRef<THREE.InstancedMesh>(null);
  const rosRef = useRef<THREE.InstancedMesh>(null);
  const phRef = useRef<THREE.InstancedMesh>(null);
  const feRef = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const eSpeed = Math.max(0.05, out.fluxCI / 25) * 0.35;
  const hSpeed = Math.max(0.05, out.fluxCIV / 26) * 0.6;
  const rosScale = Math.min(3, Math.sqrt(Math.max(out.superoxide, 1e-5) / 0.0124));
  const fluence = out.photoreceptor.fluence.red + out.photoreceptor.fluence.nir;
  const nPh = fluence > 0 ? Math.min(60, 8 + Math.round(Math.log10(1 + fluence) * 25)) : 0;
  const redShare = fluence > 0 ? out.photoreceptor.fluence.red / fluence : 1;
  const nFe = Math.round(Math.min(1, (1 - out.fesIntact) * 3) * 40);
  const E = Math.min(place.chain.length, 90);
  const P = Math.min(place.pump.length, 120);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (eRef.current) {
      for (let k = 0; k < E; k++) {
        const ch = place.chain[(k * 7) % place.chain.length]!;
        const u = (t * eSpeed + k * 0.137) % 1;
        if (u < 0.6) v.lerpVectors(ch.a, ch.b, u / 0.6);
        else v.lerpVectors(ch.b, ch.c, (u - 0.6) / 0.4);
        tmp.position.copy(v);
        tmp.scale.setScalar(1);
        tmp.updateMatrix();
        eRef.current.setMatrixAt(k, tmp.matrix);
      }
      eRef.current.instanceMatrix.needsUpdate = true;
    }
    if (hRef.current) {
      for (let k = 0; k < P; k++) {
        const pp = place.pump[k % place.pump.length]!;
        const u = (t * hSpeed + k * 0.291) % 1;
        v.lerpVectors(pp.from, pp.to, u);
        tmp.position.copy(v);
        tmp.scale.setScalar(Math.sin(u * Math.PI));
        tmp.updateMatrix();
        hRef.current.setMatrixAt(k, tmp.matrix);
      }
      hRef.current.instanceMatrix.needsUpdate = true;
    }
    if (rosRef.current) {
      place.rosSites.forEach((p, k) => {
        const u = (t * 0.8 + k * 0.173) % 1;
        tmp.position.set(p[0], p[1], p[2]);
        tmp.scale.setScalar(rosScale * (0.4 + u) * (1 - u) * 1.6);
        tmp.updateMatrix();
        rosRef.current!.setMatrixAt(k, tmp.matrix);
      });
      rosRef.current.instanceMatrix.needsUpdate = true;
    }
    if (phRef.current && nPh > 0) {
      for (let k = 0; k < nPh; k++) {
        const site = place.civSites[(k * 5) % place.civSites.length]!;
        const u = (t * 0.9 + k * 0.23) % 1;
        const start = new THREE.Vector3(site[0] + 0.4, site[1] + 1.8, site[2] + 3);
        v.lerpVectors(start, new THREE.Vector3(...site), u);
        tmp.position.copy(v);
        tmp.lookAt(site[0], site[1], site[2]);
        tmp.rotateX(Math.PI / 2);
        tmp.scale.set(1, 1 - u * 0.5, 1);
        tmp.updateMatrix();
        phRef.current.setMatrixAt(k, tmp.matrix);
      }
      phRef.current.instanceMatrix.needsUpdate = true;
    }
    if (feRef.current && nFe > 0) {
      for (let k = 0; k < nFe; k++) {
        const a = k * 2.399;
        const u = (t * 0.25 + k * 0.071) % 1;
        tmp.position.set(tcaC[0] + Math.cos(a) * (0.05 + u * 0.4), tcaC[1] + Math.sin(a) * (0.05 + u * 0.3), tcaC[2] + (u - 0.5) * 0.2);
        tmp.scale.setScalar(1 - u);
        tmp.updateMatrix();
        feRef.current.setMatrixAt(k, tmp.matrix);
      }
      feRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const f0 = lay.focus;

  return (
    <group>
      <Membrane R={r + gap + 0.08} H={H} color={PAL.outer} opacity={0.22} emissive={0.04} id="outer" onPick={onPick} rim="#ffe3d6" band={0.018} />
      <Membrane R={r + 0.03} H={H} color={PAL.inner} opacity={0.5} emissive={0.06} id="inner" onPick={onPick} thz={out.coherentFraction} rim="#ffc2a8" band={0.016} />
      {/* Intermembrane space on the cut faces, so the double membrane reads */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {[CUT, 2 * Math.PI - CUT].map((phi) => (
          <Cap key={phi} Ro={r + gap + 0.062} Ri={r + 0.046} H={H} phi={phi} color="#3b1a26" opacity={0.55} emissive={0.02} />
        ))}
        {[CUT, 2 * Math.PI - CUT].map((phi) => (
          <Cap key={`m${phi}`} Ro={r + 0.014} Ri={0.002} H={H} phi={phi} color={PAL.matrix} opacity={0.35} emissive={0.05} />
        ))}
      </group>
      {/* Matrix: dark fill plus fine grain */}
      <mesh rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
        <capsuleGeometry args={[r * 0.98, L - 2 * r, 12, 32]} />
        <meshBasicMaterial color={PAL.matrix} transparent opacity={0.22} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <MatrixGrains L={L} r={r} />

      {cristae.map((c) => {
        const col = new THREE.Color(PAL.crista).lerp(cristaColor(c, overlay, ge, out, curv), 0.55);
        const yMid = (yAt(c, 0) + yAt(c, 1)) / 2;
        const rad = Math.min(c.thick / 2 - 0.001, 0.02 + 0.06 * curv);
        return (
          <group key={c.k}>
            <RoundedBox
              args={[c.thick, c.depth, c.zExtent]}
              radius={rad}
              smoothness={5}
              position={[c.x, yMid, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onPick("crista");
              }}
            >
              <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={0.12} roughness={0.5} clearcoat={0.6} clearcoatRoughness={0.3} transparent opacity={0.78} depthWrite={false} sheen={0.7} sheenColor={PAL.outerEdge} />
            </RoundedBox>
            <mesh
              position={[c.x, c.top ? r - 0.01 : -r + 0.01, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onPick("junction");
              }}
            >
              <cylinderGeometry args={[c.thick * 0.55, c.thick * 0.55, 0.05, 20, 1, true]} />
              <meshStandardMaterial color="#e7a58f" emissive="#e7a58f" emissiveIntensity={0.15} roughness={0.5} transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[c.x, c.top ? r - 0.01 : -r + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[c.thick * 0.55, 0.008, 6, 24]} />
              <meshStandardMaterial color="#ffd9c8" emissive="#ffd9c8" emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}

      {detail && (
        <>
      {/* Respiratory chain */}
      <Inst items={place.ciArm} onClick={() => onPick("ci")}>
        <boxGeometry args={[0.02, 0.03, 0.12]} />
        <meshStandardMaterial color={PAL.ci} roughness={0.4} emissive={PAL.ci} emissiveIntensity={0.15} />
      </Inst>
      <Inst items={place.ciHead} onClick={() => onPick("ci")}>
        <boxGeometry args={[0.08, 0.035, 0.035]} />
        <meshStandardMaterial color={PAL.ci} roughness={0.4} emissive={PAL.ci} emissiveIntensity={0.15} />
      </Inst>
      <Inst items={place.cii} onClick={() => onPick("cii")}>
        <dodecahedronGeometry args={[0.022]} />
        <meshStandardMaterial color={PAL.cii} roughness={0.4} />
      </Inst>
      <Inst items={place.ciii} onClick={() => onPick("ciii")}>
        <icosahedronGeometry args={[0.024, 1]} />
        <meshStandardMaterial color={PAL.ciii} roughness={0.35} emissive={PAL.ciii} emissiveIntensity={0.15} />
      </Inst>
      <Inst items={place.civ} onClick={() => onPick("civ")}>
        <capsuleGeometry args={[0.016, 0.03, 4, 10]} />
        <meshStandardMaterial color={PAL.civ} roughness={0.3} emissive={PAL.civ} emissiveIntensity={0.2 + Math.min(1, out.photoreceptor.civActivation) * 0.8} />
      </Inst>
      <Inst items={place.atpStalk} onClick={() => onPick("atp")}>
        <cylinderGeometry args={[0.006, 0.006, 0.05, 6]} />
        <meshStandardMaterial color={PAL.atp} roughness={0.5} />
      </Inst>
      <Inst items={place.atpHead} onClick={() => onPick("atp")}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color={PAL.atp} roughness={0.3} emissive={PAL.atp} emissiveIntensity={0.1 + Math.min(0.6, out.atpFlux / 150)} />
      </Inst>
      <Inst items={place.cytc} onClick={() => onPick("cytc")}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={PAL.cytc} emissive={PAL.cytc} emissiveIntensity={0.6} />
      </Inst>
      <Inst items={place.q} onClick={() => onPick("q")}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color={PAL.q} emissive={PAL.q} emissiveIntensity={0.5} />
      </Inst>

        </>
      )}

      {/* Matrix contents */}
      <Inst items={place.gran}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#2a0f18" roughness={0.9} />
      </Inst>
      <Inst items={dna.beads} onClick={() => onPick("dna")}>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshStandardMaterial color={PAL.dna} emissive={PAL.dna} emissiveIntensity={0.35} />
      </Inst>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onPick("tca");
        }}
      >
        <mesh position={tcaC}>
          <torusGeometry args={[0.16, 0.006, 8, 48]} />
          <meshStandardMaterial color={PAL.tca} emissive={PAL.tca} emissiveIntensity={0.4} />
        </mesh>
        {tcaNodes.map((n, k) => (
          <mesh key={k} position={n.p}>
            <sphereGeometry args={[0.018, 10, 10]} />
            <meshStandardMaterial color={k === 1 ? PAL.fe : PAL.tca} emissive={k === 1 ? PAL.fe : PAL.tca} emissiveIntensity={0.3} />
          </mesh>
        ))}
        <group position={[tcaNodes[1]!.p[0] + 0.05, tcaNodes[1]!.p[1] + 0.05, tcaNodes[1]!.p[2]]}>
          <FeSCluster kind="4Fe4S" intact={out.fesIntact} scale={0.035} />
        </group>
      </group>
      <group
        position={lay.fesPos}
        onClick={(e) => {
          e.stopPropagation();
          onPick("fes");
        }}
      >
        <FeSCluster kind="4Fe4S" intact={out.fesIntact} scale={0.018} />
        <group position={[-0.04, 0.02, -0.03]}>
          <FeSCluster kind="2Fe2S" intact={out.fesIntact} scale={0.016} />
        </group>
      </group>

      {/* Flows */}
      <instancedMesh ref={eRef} args={[undefined, undefined, E]} visible={detail}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshBasicMaterial color={PAL.electron} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={hRef} args={[undefined, undefined, P]} visible={detail}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshBasicMaterial color={PAL.proton} toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={rosRef}
        args={[undefined, undefined, place.rosSites.length]}
        onClick={(e) => {
          e.stopPropagation();
          onPick("ros");
        }}
      >
        <sphereGeometry args={[0.02, 10, 10]} />
         <meshBasicMaterial color={new THREE.Color(PAL.ros).multiplyScalar(3)} transparent opacity={0.7} toneMapped={false} depthWrite={false} />
      </instancedMesh>
      {nPh > 0 && (
        <instancedMesh
          ref={phRef}
          args={[undefined, undefined, nPh]}
          onClick={(e) => {
            e.stopPropagation();
            onPick("photon");
          }}
        >
          <cylinderGeometry args={[0.006, 0.006, 0.22, 5]} />
           <meshBasicMaterial color={new THREE.Color(redShare >= 0.5 ? PAL.red : PAL.nir).multiplyScalar(3.5)} toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
      )}
      {nFe > 0 && (
        <instancedMesh ref={feRef} args={[undefined, undefined, nFe]}>
          <sphereGeometry args={[0.01, 6, 6]} />
           <meshBasicMaterial color={new THREE.Color(PAL.fe).multiplyScalar(4)} toneMapped={false} />
        </instancedMesh>
      )}

      {/* Per-step eV drops along the focus crista's electron path */}
      {evLabels && f0 &&
            (() => {
              const fx = f0.x + f0.thick / 2 + 0.03;
              const z = zRows(f0)[2] ?? 0;
              const a = yAt(f0, 0.25);
              const b = yAt(f0, 0.5);
              const c = yAt(f0, 0.68);
              const at = (y: number, dz: number): [number, number, number] => [fx + 0.22, y, z + dz];
              // key = etcSteps index, y = chain position, dz = fan-out so labels do not overlap
              const spots: [number, number, number, string][] = [
                [0, a - 0.06, -0.12, "CI entry"], // CI entry
                [1, a, 0.1, "CI Fe-S"], // CI Fe-S relay
                [2, a + (b - a) * 0.4, -0.1, "CI to Q"], // CI to Q
                [4, b, 0.12, "CIII Qo"], // CIII Qo
                [6, b + (c - b) * 0.5, -0.1, "CIV CuA"], // CIV CuA / heme a
                [7, c, 0.1, "CIV to O2"], // CIV to O2
              ];
              const psi = inputs?.deltaPsi ?? 160;
              const unc = inputs?.uncoupling ?? 0.05;
              return spots.map(([i, y, dz, short]) => {
                const s = etcSteps[i]!;
                const la = liveAtpPerPair(s, psi, unc);
                const std = stdAtpPerPair(s).proton;
                const text = `${short} ${s.ev > 0 ? "+" : ""}${s.ev} eV · ${la.proton.toFixed(2)} ATP/pr · ${la.costEv.toFixed(2)} eV/ATP`;
                // amber when live yield drops below the healthy default OR the energy cost per ATP rises above the standard 0.52 eV
                const okTone = la.proton >= std - 1e-9 && la.costEv <= ATP_COST_EV + 1e-9;
                return (
                  <group key={text} position={at(y, dz)}>
                    <Label3D text={text} position={[0, 0, 0]} size={0.013} tone={okTone ? "ok" : "warn"} />
                    {onStepClick && (
                      <mesh
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepClick(i);
                        }}
                      >
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                      </mesh>
                    )}
                  </group>
                );
              });
            })()}
    </group>
  );
}
