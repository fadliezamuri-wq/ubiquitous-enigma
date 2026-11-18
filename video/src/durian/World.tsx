import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/fonts";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ip, type Vec3 } from "./anim";

export const fontFamily = "Inter";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Inter-ExtraBold.otf"),
  weight: "800",
});

export type TimeOfDay = "day" | "morning" | "night";

const PALETTE: Record<
  TimeOfDay,
  {
    skyTop: string;
    skyBottom: string;
    fog: string;
    hemiSky: string;
    hemiGround: string;
    hemi: number;
    sun: string;
    sunI: number;
    sunPos: Vec3;
    ground: string;
  }
> = {
  day: {
    skyTop: "#69b9f0",
    skyBottom: "#fbe7bd",
    fog: "#d6ecdf",
    hemiSky: "#cfe9ff",
    hemiGround: "#6f9a3c",
    hemi: 1.4,
    sun: "#fff0d2",
    sunI: 2.6,
    sunPos: [6, 11, 7],
    ground: "#7dc451",
  },
  morning: {
    skyTop: "#8cc3ea",
    skyBottom: "#ffc97e",
    fog: "#f6d9a6",
    hemiSky: "#ffe2b8",
    hemiGround: "#7a9a3c",
    hemi: 1.3,
    sun: "#ffc978",
    sunI: 3.0,
    sunPos: [-8, 6, 8],
    ground: "#86c454",
  },
  night: {
    skyTop: "#070d24",
    skyBottom: "#24345f",
    fog: "#1b2747",
    hemiSky: "#5a72c0",
    hemiGround: "#162212",
    hemi: 0.75,
    sun: "#a9c0ff",
    sunI: 1.2,
    sunPos: [-5, 10, 4],
    ground: "#3c6a3a",
  },
};

export const CameraRig: React.FC<{
  position: Vec3;
  target: Vec3;
  fov?: number;
}> = ({ position, target, fov = 40 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 200;
    camera.lookAt(new THREE.Vector3(...target));
    camera.updateProjectionMatrix();
  });
  return null;
};

const Lights: React.FC<{ time: TimeOfDay; flash: number }> = ({
  time,
  flash,
}) => {
  const p = PALETTE[time];
  return (
    <>
      <hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemi + flash * 3]} />
      <directionalLight
        position={p.sunPos}
        color={p.sun}
        intensity={p.sunI}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
      {/* cool rim light from behind, the classic animated-film look */}
      <directionalLight
        position={[-4, 4, -8]}
        color={time === "night" ? "#7f9cff" : "#bfe2ff"}
        intensity={1.4}
      />
    </>
  );
};

export const Ground: React.FC<{ time: TimeOfDay }> = ({ time }) => {
  const tufts = useMemo(() => {
    const rnd = mulberry(7);
    return Array.from({ length: 70 }).map(() => {
      const a = rnd() * Math.PI * 2;
      const d = 2.5 + rnd() * 18;
      return {
        pos: [Math.cos(a) * d, 0, Math.sin(a) * d] as Vec3,
        s: 0.25 + rnd() * 0.35,
      };
    });
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial color={PALETTE[time].ground} roughness={0.95} />
      </mesh>
      {tufts.map((t, i) => (
        <mesh
          key={i}
          position={t.pos}
          scale={[t.s * 1.6, t.s * 0.5, t.s * 1.6]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial
            color={i % 3 ? "#5fae3f" : "#4b9636"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </>
  );
};

export const Hills: React.FC = () => (
  <>
    {[
      [-30, -14, -50, 26, "#79b267"],
      [10, -16, -60, 30, "#6aa75e"],
      [42, -14, -45, 24, "#83ba6f"],
      [-55, -12, -20, 22, "#6fae62"],
      [55, -12, -10, 20, "#76b064"],
    ].map(([x, y, z, r, c], i) => (
      <mesh key={i} position={[x as number, y as number, z as number]}>
        <sphereGeometry args={[r as number, 32, 32]} />
        <meshStandardMaterial color={c as string} roughness={1} />
      </mesh>
    ))}
  </>
);

const LEAVES = ["#3f8f3a", "#4fa443", "#367d34", "#58ae48"];

export const DurianTree: React.FC<{
  position: Vec3;
  scale?: number;
  sway?: number;
  seed?: number;
  fruits?: boolean;
}> = ({ position, scale = 1, sway = 0, seed = 1, fruits = true }) => {
  const blobs = useMemo(() => {
    const rnd = mulberry(seed);
    return Array.from({ length: 6 }).map(() => ({
      pos: [
        (rnd() - 0.5) * 2.4,
        4.3 + rnd() * 1.6,
        (rnd() - 0.5) * 2.4,
      ] as Vec3,
      r: 1.0 + rnd() * 0.6,
      c: LEAVES[Math.floor(rnd() * LEAVES.length)],
    }));
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.42, 4.4, 12]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      <group rotation={[sway * 0.4, 0, sway]} position={[0, 3.5, 0]}>
        <group position={[0, -3.5, 0]}>
          {blobs.map((b, i) => (
            <mesh key={i} position={b.pos} castShadow receiveShadow>
              <sphereGeometry args={[b.r, 24, 20]} />
              <meshStandardMaterial color={b.c} roughness={0.8} />
            </mesh>
          ))}
          {fruits
            ? [
                [0.9, 3.6, 0.8],
                [-0.8, 3.7, 0.6],
              ].map((p, i) => (
                <mesh key={`f${i}`} position={p as Vec3} castShadow>
                  <icosahedronGeometry args={[0.28, 1]} />
                  <meshStandardMaterial
                    color="#8aa83a"
                    flatShading
                    roughness={0.6}
                  />
                </mesh>
              ))
            : null}
        </group>
      </group>
    </group>
  );
};

/** Ring of orchard trees around the stage, leaving the middle free. */
export const Orchard: React.FC<{ sway?: number; skipNear?: boolean }> = ({
  sway = 0,
  skipNear = false,
}) => {
  const trees = useMemo(() => {
    const rnd = mulberry(42);
    const out: { pos: Vec3; s: number; seed: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2;
      const d = 7 + rnd() * 22;
      const pos: Vec3 = [Math.cos(a) * d, 0, Math.sin(a) * d - 6];
      if (pos[2] > 2 && Math.abs(pos[0]) < 7) continue; // keep camera path clear
      out.push({ pos, s: 0.8 + rnd() * 0.5, seed: i + 3 });
    }
    return out;
  }, []);
  return (
    <>
      {trees
        .filter((t) => !skipNear || Math.hypot(t.pos[0], t.pos[2]) > 9)
        .map((t, i) => (
          <DurianTree
            key={i}
            position={t.pos}
            scale={t.s}
            seed={t.seed}
            sway={sway * Math.sin(i * 1.7)}
          />
        ))}
    </>
  );
};

/** The big tree Duri grows on. Its branch tip sits at BRANCH_TIP. */
export const BRANCH_TIP: Vec3 = [0.6, 3.6, -0.5];
export const HeroTree: React.FC<{ sway?: number }> = ({ sway = 0 }) => {
  const base: Vec3 = [-2.2, 3.1, -1.8];
  const tip = new THREE.Vector3(
    BRANCH_TIP[0] + 0.5,
    BRANCH_TIP[1] + 0.05,
    BRANCH_TIP[2],
  );
  const from = new THREE.Vector3(...base);
  const dir = tip.clone().sub(from);
  const len = dir.length();
  const mid = from.clone().add(dir.clone().multiplyScalar(0.5));
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  return (
    <group>
      <DurianTree
        position={[-2.2, 0, -1.8]}
        scale={1.15}
        seed={99}
        sway={sway}
        fruits={false}
      />
      <mesh position={mid.toArray()} quaternion={quat} castShadow>
        <cylinderGeometry args={[0.07, 0.16, len, 10]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      {[
        [0.2, 3.85, -0.6],
        [1.1, 3.8, -0.4],
        [-0.6, 3.6, -1.0],
      ].map((p, i) => (
        <mesh key={i} position={p as Vec3} scale={[0.7, 0.35, 0.5]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={LEAVES[i]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const Stage: React.FC<{
  time: TimeOfDay;
  flash?: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ time, flash = 0, children, overlay }) => {
  const { width, height } = useVideoConfig();
  const p = PALETTE[time];
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyBottom} 70%)`,
      }}
    >
      {time === "night" ? <Stars /> : <Clouds />}
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={[p.fog, 18, 70]} />
        <Lights time={time} flash={flash} />
        {children}
      </ThreeCanvas>
      {/* soft vignette + warm grade */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,10,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
      {flash > 0 ? (
        <AbsoluteFill
          style={{ background: `rgba(230,240,255,${flash * 0.7})` }}
        />
      ) : null}
      {overlay}
    </AbsoluteFill>
  );
};

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = useMemo(() => {
    const rnd = mulberry(5);
    return Array.from({ length: 90 }).map(() => ({
      x: rnd() * 100,
      y: rnd() * 45,
      s: 1 + rnd() * 2.5,
      p: rnd() * 6,
    }));
  }, []);
  return (
    <AbsoluteFill>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            borderRadius: 99,
            background: "#fff",
            opacity: 0.5 + 0.5 * Math.sin(frame / 9 + s.p),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Clouds: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {[
        [8, 10, 1],
        [55, 6, 1.3],
        [78, 18, 0.9],
      ].map(([x, y, s], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x + frame * 0.02 * (i + 1)}%`,
            top: `${y}%`,
            width: 260 * s,
            height: 80 * s,
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
            filter: "blur(6px)",
            boxShadow: `${60 * s}px -${30 * s}px 0 ${10 * s}px rgba(255,255,255,0.8)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Caption: React.FC<{ text: string; from: number; to: number }> = ({
  text,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  const o = Math.min(
    ip(frame, [from, from + 10], [0, 1]),
    ip(frame, [to - 10, to], [1, 0]),
  );
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 70,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 50,
          color: "#fffaf0",
          textAlign: "center",
          maxWidth: 1500,
          padding: "18px 40px",
          borderRadius: 40,
          background: "rgba(40,22,8,0.55)",
          textShadow: "0 3px 0 rgba(0,0,0,0.35)",
          opacity: o,
          translate: `0 ${(1 - o) * 20}px`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Comic sound word that pops in. */
export const PopWord: React.FC<{
  text: string;
  at: number;
  x: string;
  y: string;
  color: string;
  size?: number;
}> = ({ text, at, x, y, color, size = 130 }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 45) return null;
  const s = ip(
    frame,
    [at, at + 8],
    [0.2, 1],
    (t) => 1 - Math.pow(1 - t, 3) * Math.cos(t * 6),
  );
  const o = ip(frame, [at + 32, at + 45], [1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily,
        fontWeight: 800,
        fontSize: size,
        color,
        WebkitTextStroke: "8px #2a1406",
        paintOrder: "stroke fill",
        scale: String(s),
        rotate: "-8deg",
        opacity: o,
        translate: "-50% -50%",
      }}
    >
      {text}
    </div>
  );
};

export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
