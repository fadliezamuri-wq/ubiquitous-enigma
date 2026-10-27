import { useMemo } from "react";
import { ConeGeometry, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Kind = "duri" | "mak" | "bapa";

export type Pose = {
  x: number;
  z: number;
  rotY: number;
  bob: number;
  squash: number;
  // Sudut bahu: 0 = tangan ke bawah, PI/2 = mendepa
  armL: number;
  armR: number;
  // Hayun tangan ke hadapan (untuk memeluk)
  fwdL: number;
  fwdR: number;
  eyeOpen: number;
  lookX: number;
  lookY: number;
  smile: number;
  mouthOpen: number;
  brow: number;
  blush: number;
  tear: number;
  tilt: number;
  broom: boolean;
  spatula: boolean;
  visible: boolean;
};

export const basePose = (x: number, z: number): Pose => ({
  x,
  z,
  rotY: 0,
  bob: 0,
  squash: 1,
  armL: 0.35,
  armR: 0.35,
  fwdL: 0,
  fwdR: 0,
  eyeOpen: 1,
  lookX: 0,
  lookY: 0,
  smile: 0.6,
  mouthOpen: 0,
  brow: 0,
  blush: 0.5,
  tear: 0,
  tilt: 0,
  broom: false,
  spatula: false,
  visible: true,
});

const LOOK: Record<
  Kind,
  { scale: number; body: string; spike: string; limb: string }
> = {
  duri: { scale: 0.72, body: "#8fc31f", spike: "#b5e04a", limb: "#6e9a14" },
  mak: { scale: 1, body: "#9bbf22", spike: "#c4dd4f", limb: "#738f16" },
  bapa: { scale: 1.18, body: "#5f8f16", spike: "#86b72a", limb: "#4a7010" },
};

const R = 1;

// Duri-duri digabung jadi satu geometri, kawasan muka dibiarkan licin
const useSpikes = () =>
  useMemo(() => {
    const parts = [];
    const count = 170;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const dir = new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r);
      if (dir.z > 0.35 && dir.y > -0.75 && dir.y < 0.6 && Math.abs(dir.x) < 0.8) continue;
      const cone = new ConeGeometry(0.085, 0.26, 5);
      cone.translate(0, 0.13, 0);
      cone.applyQuaternion(new Quaternion().setFromUnitVectors(up, dir));
      cone.translate(dir.x * 0.97, dir.y * 0.97, dir.z * 0.97);
      parts.push(cone);
    }
    return mergeGeometries(parts);
  }, []);

const Eye: React.FC<{ x: number; pose: Pose; lashes: boolean }> = ({ x, pose, lashes }) => {
  const open = Math.max(0.06, pose.eyeOpen);
  return (
    <group position={[x, 0.12, 0.9]} rotation={[0, x * 0.5, 0]}>
      <mesh scale={[0.2, 0.25 * open, 0.12]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[pose.lookX * 0.06, pose.lookY * 0.06 * open - 0.02, 0.1]} scale={[0.11, 0.14 * open, 0.06]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#1f1306" roughness={0.2} />
      </mesh>
      {open > 0.3 ? (
        <mesh position={[pose.lookX * 0.06 + 0.04, 0.05 * open, 0.16]} scale={0.035}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ) : null}
      {/* Kening */}
      <mesh
        position={[0, 0.3 + pose.brow * 0.05, 0.06]}
        rotation={[0, 0, Math.PI / 2 + Math.sign(x) * (pose.brow * 0.35 + 0.05)]}
      >
        <capsuleGeometry args={[0.025, 0.16, 4, 8]} />
        <meshStandardMaterial color="#3b2a0e" />
      </mesh>
      {lashes ? (
        <mesh position={[x > 0 ? 0.17 : -0.17, 0.12 * open, 0.04]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
          <capsuleGeometry args={[0.015, 0.08, 4, 6]} />
          <meshStandardMaterial color="#1f1306" />
        </mesh>
      ) : null}
    </group>
  );
};

const Arm: React.FC<{ side: 1 | -1; raise: number; fwd: number; color: string; children?: React.ReactNode }> = ({
  side,
  raise,
  fwd,
  color,
  children,
}) => (
  <group position={[side * 0.9, -0.15, 0.1]} rotation={[0, -side * fwd, side * raise]}>
    <mesh position={[0, -0.32, 0]}>
      <capsuleGeometry args={[0.09, 0.45, 6, 12]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
    <group position={[0, -0.62, 0]}>
      <mesh>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {children}
    </group>
  </group>
);

const Broom: React.FC = () => (
  <group rotation={[0.2, 0, 1.6]} position={[0, 0, 0.1]}>
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 1.5, 8]} />
      <meshStandardMaterial color="#b07a3c" />
    </mesh>
    <mesh position={[0, -1.15, 0]}>
      <coneGeometry args={[0.28, 0.5, 12]} />
      <meshStandardMaterial color="#e8c46a" roughness={0.9} />
    </mesh>
  </group>
);

const Spatula: React.FC = () => (
  <group rotation={[0, 0, 0.3]}>
    <mesh position={[0, -0.25, 0.05]}>
      <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
      <meshStandardMaterial color="#8b5a2b" />
    </mesh>
    <mesh position={[0, -0.58, 0.05]}>
      <boxGeometry args={[0.2, 0.22, 0.03]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
    </mesh>
  </group>
);

export const Durian: React.FC<{ kind: Kind; pose: Pose }> = ({ kind, pose }) => {
  const spikes = useSpikes();
  const look = LOOK[kind];
  if (!pose.visible) return null;

  const legH = 0.45;
  const bodyY = legH + R * 1.05;
  const sx = 1 / Math.sqrt(pose.squash);

  return (
    <group position={[pose.x, pose.bob, pose.z]} rotation={[0, pose.rotY, pose.tilt]} scale={look.scale}>
      {/* Kaki */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.38, 0, 0.05]}>
          <mesh position={[0, legH / 2 + 0.05, 0]}>
            <capsuleGeometry args={[0.1, legH - 0.1, 6, 12]} />
            <meshStandardMaterial color={look.limb} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.07, 0.1]} scale={[0.17, 0.08, 0.24]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={look.limb} roughness={0.6} />
          </mesh>
        </group>
      ))}

      <group position={[0, bodyY, 0]} scale={[sx, pose.squash, sx]}>
        <mesh castShadow scale={[1, 1.05, 1]}>
          <sphereGeometry args={[R, 48, 48]} />
          <meshStandardMaterial color={look.body} roughness={0.75} />
        </mesh>
        <mesh geometry={spikes} castShadow scale={[1, 1.05, 1]}>
          <meshStandardMaterial color={look.spike} roughness={0.55} flatShading />
        </mesh>

        {/* Tangkai di kepala */}
        {kind !== "bapa" ? (
          <group position={[0, 1.08, 0]} rotation={[0, 0, 0.2]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.045, 0.07, 0.28, 8]} />
              <meshStandardMaterial color="#6b4423" />
            </mesh>
            {kind === "duri" ? (
              <mesh position={[0.13, 0.22, 0]} rotation={[0, 0, -0.9]} scale={[0.16, 0.05, 0.09]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#4ade80" />
              </mesh>
            ) : null}
          </group>
        ) : (
          // Songkok bapa
          <group position={[0, 0.98, 0]} rotation={[-0.08, 0, 0.06]}>
            <mesh>
              <cylinderGeometry args={[0.5, 0.52, 0.36, 32]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.525, 0.525, 0.04, 32]} />
              <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* Bunga di kepala mak */}
        {kind === "mak" ? (
          <group position={[0.55, 0.85, 0.35]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh
                key={i}
                position={[Math.cos((i / 5) * Math.PI * 2) * 0.1, Math.sin((i / 5) * Math.PI * 2) * 0.1, 0]}
                scale={[0.09, 0.09, 0.04]}
              >
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#f472b6" />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.03]} scale={0.06}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshStandardMaterial color="#fde047" />
            </mesh>
          </group>
        ) : null}

        {/* Muka */}
        <Eye x={-0.3} pose={pose} lashes={kind === "mak"} />
        <Eye x={0.3} pose={pose} lashes={kind === "mak"} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.5, -0.13, 0.82]} rotation={[0, s * 0.55, 0]} scale={[0.14, 0.08, 0.04]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#fb7185" transparent opacity={pose.blush * 0.8} />
          </mesh>
        ))}
        <group position={[0, -0.28, 0.93]}>
          {/* Mulut: lengkung senyum + rongga apabila bercakap */}
          <mesh rotation={[0, 0, pose.smile >= 0 ? Math.PI : 0]} scale={[1, Math.max(0.25, Math.abs(pose.smile)), 1]}>
            <torusGeometry args={[0.15, 0.028, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#4a1d0a" />
          </mesh>
          {pose.mouthOpen > 0.02 ? (
            <mesh position={[0, -0.06, -0.01]} scale={[0.13, 0.12 * pose.mouthOpen, 0.05]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
          ) : null}
        </group>
        {kind === "bapa" ? (
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.13, -0.15, 0.97]} rotation={[0, 0, s * 1.25]}>
              <capsuleGeometry args={[0.035, 0.16, 4, 8]} />
              <meshStandardMaterial color="#2b1a07" />
            </mesh>
          ))
        ) : null}

        {/* Air mata gembira */}
        {pose.tear > 0 ? (
          <mesh position={[-0.33, 0.0 - pose.tear * 0.35, 0.95]} scale={[0.05, 0.075, 0.04]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.6} transparent opacity={0.9} />
          </mesh>
        ) : null}

        {/* Reben di kepala mak */}
        {kind === "mak" ? (
          <group position={[-0.5, 0.88, 0.32]} rotation={[0, 0, 0.4]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.13, 0, 0]} rotation={[0, 0, s * 0.5]} scale={[0.14, 0.09, 0.05]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#ec4899" />
              </mesh>
            ))}
          </group>
        ) : null}

        <Arm side={-1} raise={pose.armL} fwd={pose.fwdL} color={look.limb} />
        <Arm side={1} raise={pose.armR} fwd={pose.fwdR} color={look.limb}>
          {pose.broom ? <Broom /> : null}
          {pose.spatula ? <Spatula /> : null}
        </Arm>
      </group>
    </group>
  );
};
