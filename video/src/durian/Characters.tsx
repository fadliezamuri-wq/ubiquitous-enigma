import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "./anim";

export type FaceProps = {
  /** 0 = open, 1 = closed */
  blink?: number;
  /** -1 = sad/scared frown, 1 = big smile */
  mood?: number;
  /** 0..1 how wide the mouth is open */
  mouthOpen?: number;
  /** -1..1 eye direction */
  look?: [number, number];
  /** 0..1 worried eyebrows */
  worry?: number;
  /** eye size multiplier (surprise) */
  eyeScale?: number;
  mouthColor?: string;
};

const UP = new THREE.Vector3(0, 1, 0);

// Points evenly spread on a sphere (Fibonacci lattice).
const spherePoints = (n: number) => {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return pts;
};

// The face area in front (+z) is kept clear of spikes/hair.
const inFaceZone = (n: THREE.Vector3) =>
  n.z > 0.45 && n.y < 0.62 && n.y > -0.62;

const Spikes: React.FC<{
  r: number;
  count: number;
  radius: number;
  length: number;
  color: string;
  segments?: number;
}> = ({ r, count, radius, length, color, segments = 6 }) => {
  const items = useMemo(
    () =>
      spherePoints(count)
        .filter((n) => !inFaceZone(n) && n.y > -0.92)
        .map((n) => ({
          pos: n
            .clone()
            .multiplyScalar(r + length / 2 - r * 0.04)
            .toArray() as Vec3,
          quat: new THREE.Quaternion().setFromUnitVectors(UP, n).toArray() as [
            number,
            number,
            number,
            number,
          ],
        })),
    [r, count, length],
  );
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} quaternion={it.quat} castShadow>
          <coneGeometry args={[radius, length, segments]} />
          <meshStandardMaterial color={color} roughness={0.55} flatShading />
        </mesh>
      ))}
    </>
  );
};

export const Face: React.FC<FaceProps & { r: number }> = ({
  r,
  blink = 0,
  mood = 0.5,
  mouthOpen = 0,
  look = [0, 0],
  worry = 0,
  eyeScale = 1,
  mouthColor = "#3b1a12",
}) => {
  const eyeR = 0.24 * r * eyeScale;
  const ex = 0.3 * r;
  const ey = 0.14 * r;
  const ez = Math.sqrt(Math.max(r * r - ex * ex - ey * ey, 0)) * 0.93;
  const my = -0.22 * r;
  const mz = Math.sqrt(r * r - my * my) * 1.01;
  const moodY = Math.sign(mood || 1) * Math.max(Math.abs(mood), 0.12);
  const open = 1 - Math.min(Math.max(blink, 0), 1) * 0.92;

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * ex, ey, ez]}>
          <group scale={[1, open, 1]}>
            <mesh>
              <sphereGeometry args={[eyeR, 32, 32]} />
              <meshPhysicalMaterial
                color="#ffffff"
                roughness={0.15}
                clearcoat={1}
              />
            </mesh>
            <group position={[look[0] * eyeR * 0.28, look[1] * eyeR * 0.28, 0]}>
              <mesh position={[0, 0, eyeR * 0.8]} scale={[1, 1, 0.45]}>
                <sphereGeometry args={[eyeR * 0.55, 24, 24]} />
                <meshStandardMaterial color="#5a3414" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, eyeR * 0.95]} scale={[1, 1, 0.4]}>
                <sphereGeometry args={[eyeR * 0.3, 20, 20]} />
                <meshStandardMaterial color="#0b0604" roughness={0.2} />
              </mesh>
              <mesh position={[eyeR * 0.16, eyeR * 0.2, eyeR * 1.06]}>
                <sphereGeometry args={[eyeR * 0.12, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          </group>
          {/* eyebrow */}
          <mesh
            position={[0, eyeR * 1.35 + worry * eyeR * 0.1, eyeR * 0.3]}
            rotation={[0, 0, Math.PI / 2 - side * worry * 0.45]}
          >
            <capsuleGeometry args={[r * 0.035, eyeR * 0.9, 6, 12]} />
            <meshStandardMaterial color="#3a2410" />
          </mesh>
        </group>
      ))}
      {/* mouth line */}
      <mesh
        position={[0, my, mz]}
        rotation={[0, 0, Math.PI]}
        scale={[1, moodY, 1]}
      >
        <torusGeometry args={[0.15 * r, 0.028 * r, 12, 32, Math.PI]} />
        <meshStandardMaterial color={mouthColor} />
      </mesh>
      {/* open mouth */}
      {mouthOpen > 0.02 ? (
        <mesh
          position={[0, my - 0.06 * r, mz - 0.02 * r]}
          scale={[1, mouthOpen * 0.9, 0.35]}
        >
          <sphereGeometry args={[0.13 * r, 24, 24]} />
          <meshStandardMaterial color="#4a1410" />
        </mesh>
      ) : null}
      {/* cheeks */}
      {[-1, 1].map((side) => (
        <mesh
          key={`c${side}`}
          position={[
            side * 0.46 * r,
            -0.12 * r,
            Math.sqrt(r * r * (1 - 0.21 - 0.0144)) * 0.98,
          ]}
          scale={[1, 0.6, 0.25]}
        >
          <sphereGeometry args={[0.1 * r, 16, 16]} />
          <meshStandardMaterial color="#ff7a7a" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
};

type CharProps = FaceProps & {
  position?: Vec3;
  rotation?: Vec3;
  /** vertical squash/stretch, volume preserved */
  squash?: number;
  scale?: number;
};

const SquashGroup: React.FC<{
  position?: Vec3;
  rotation?: Vec3;
  squash: number;
  scale: number;
  r: number;
  children: React.ReactNode;
}> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  squash,
  scale,
  r,
  children,
}) => {
  const side = 1 / Math.sqrt(squash);
  // pivot at the bottom so squashing keeps the feet on the ground
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, -r, 0]} scale={[side, squash, side]}>
        <group position={[0, r, 0]}>{children}</group>
      </group>
    </group>
  );
};

export const Durian: React.FC<
  CharProps & { r?: number; glow?: number; stem?: boolean }
> = ({
  r = 0.55,
  glow = 0,
  stem = true,
  position,
  rotation,
  squash = 1,
  scale = 1,
  ...face
}) => (
  <SquashGroup
    position={position}
    rotation={rotation}
    squash={squash}
    scale={scale}
    r={r}
  >
    <mesh castShadow scale={[1, 1.06, 1]}>
      <sphereGeometry args={[r, 48, 48]} />
      <meshPhysicalMaterial
        color="#93ad3c"
        roughness={0.6}
        sheen={0.6}
        sheenColor="#e8ff9a"
        emissive="#ffc93a"
        emissiveIntensity={glow * 0.5}
      />
    </mesh>
    <Spikes
      r={r}
      count={170}
      radius={r * 0.1}
      length={r * 0.3}
      color="#74902c"
    />
    {stem ? (
      <mesh position={[0, r * 1.15, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[r * 0.06, r * 0.09, r * 0.45, 10]} />
        <meshStandardMaterial color="#6b4a22" roughness={0.8} />
      </mesh>
    ) : null}
    <Face r={r * 1.02} {...face} />
  </SquashGroup>
);

export const Manggis: React.FC<CharProps & { r?: number }> = ({
  r = 0.45,
  position,
  rotation,
  squash = 1,
  scale = 1,
  ...face
}) => (
  <SquashGroup
    position={position}
    rotation={rotation}
    squash={squash}
    scale={scale}
    r={r}
  >
    <mesh castShadow scale={[1, 0.94, 1]}>
      <sphereGeometry args={[r, 48, 48]} />
      <meshPhysicalMaterial
        color="#5a1e4c"
        roughness={0.35}
        clearcoat={0.8}
        clearcoatRoughness={0.3}
      />
    </mesh>
    {[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      return (
        <mesh
          key={i}
          position={[Math.cos(a) * r * 0.32, r * 0.9, Math.sin(a) * r * 0.32]}
          rotation={[0, -a, 0.35]}
          scale={[r * 0.42, r * 0.1, r * 0.26]}
          castShadow
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#4f8a35" roughness={0.6} />
        </mesh>
      );
    })}
    <mesh position={[0, r * 1.08, 0]}>
      <cylinderGeometry args={[r * 0.05, r * 0.07, r * 0.3, 8]} />
      <meshStandardMaterial color="#5c7a2a" />
    </mesh>
    <Face r={r} mouthColor="#f2b7c8" {...face} />
  </SquashGroup>
);

export const Rambutan: React.FC<CharProps & { r?: number }> = ({
  r = 0.4,
  position,
  rotation,
  squash = 1,
  scale = 1,
  ...face
}) => (
  <SquashGroup
    position={position}
    rotation={rotation}
    squash={squash}
    scale={scale}
    r={r}
  >
    <mesh castShadow scale={[1, 1.08, 1]}>
      <sphereGeometry args={[r, 48, 48]} />
      <meshPhysicalMaterial
        color="#d8322a"
        roughness={0.45}
        sheen={0.5}
        sheenColor="#ffb08a"
      />
    </mesh>
    <Spikes
      r={r}
      count={150}
      radius={r * 0.035}
      length={r * 0.42}
      color="#e6542e"
      segments={5}
    />
    <Face r={r * 1.02} mouthColor="#5a120c" {...face} />
  </SquashGroup>
);

export const Crown: React.FC<{
  position?: Vec3;
  scale?: number;
  rotationY?: number;
}> = ({ position = [0, 0, 0], scale = 1, rotationY = 0 }) => (
  <group position={position} scale={scale} rotation={[0.12, rotationY, 0]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.32, 0.3, 0.18, 32, 1, true]} />
      <meshStandardMaterial
        color="#ffc93a"
        metalness={0.85}
        roughness={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
    {Array.from({ length: 7 }).map((_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <group
          key={i}
          position={[Math.cos(a) * 0.31, 0.17, Math.sin(a) * 0.31]}
        >
          <mesh castShadow>
            <coneGeometry args={[0.07, 0.18, 8]} />
            <meshStandardMaterial
              color="#ffc93a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial
              color={i % 2 ? "#e8304a" : "#2f9be8"}
              roughness={0.1}
            />
          </mesh>
        </group>
      );
    })}
  </group>
);
