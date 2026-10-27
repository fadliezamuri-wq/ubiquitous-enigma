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

type Look = {
  scale: number;
  body: string;
  spikeA: string;
  spikeB: string;
  face: string;
  limb: string;
  iris: string;
};

// Rupa mengikut rujukan: duri piramid, muka bujur licin, mata ambar berkilat
const LOOK: Record<Kind, Look> = {
  duri: { scale: 0.72, body: "#86a823", spikeA: "#7f9f1f", spikeB: "#98b82d", face: "#cadc6c", limb: "#9cc43a", iris: "#9a5b12" },
  mak: { scale: 1, body: "#93ab2a", spikeA: "#8ca52a", spikeB: "#a6bc37", face: "#d6e27c", limb: "#a8c94a", iris: "#7c4a12" },
  bapa: { scale: 1.18, body: "#5f7e17", spikeA: "#5a7a15", spikeB: "#6f911f", face: "#b9cf5c", limb: "#82a92f", iris: "#5b3510" },
};

const PINK = "#f472b6";
const R = 1;
const FACE = { y: 0.0, w: 0.78, h: 0.56 };

// Duri piramid besar digabung jadi dua geometri (dua tona warna)
const useSpikes = () =>
  useMemo(() => {
    const a: ConeGeometry[] = [];
    const b: ConeGeometry[] = [];
    const count = 270;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const dir = new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r);
      const inFace = dir.z > 0.25 && (dir.x / (FACE.w + 0.08)) ** 2 + ((dir.y - FACE.y) / (FACE.h + 0.08)) ** 2 < 1;
      if (inFace) continue;
      const lower = dir.y < -0.55 ? 1.25 : 1;
      const cone = new ConeGeometry(0.13, 0.3 * lower, 4);
      cone.translate(0, 0.15 * lower, 0);
      cone.rotateY((i * 0.7) % Math.PI);
      cone.applyQuaternion(new Quaternion().setFromUnitVectors(up, dir));
      cone.translate(dir.x * 0.95, dir.y * 0.95, dir.z * 0.95);
      (i % 3 === 0 ? b : a).push(cone);
    }
    return [mergeGeometries(a), mergeGeometries(b)];
  }, []);

// Permata kecil berwarna di celah duri, seperti dalam rujukan
const GEMS: [number, number, number, string][] = [
  [-0.82, -0.2, 0.55, "#f472b6"],
  [0.78, -0.45, 0.5, "#fb923c"],
  [-0.35, -0.85, 0.5, "#c084fc"],
  [0.25, -0.88, 0.45, "#f43f5e"],
  [0.62, 0.62, 0.5, "#f472b6"],
];

const FRECKLES: [number, number, number, string][] = [
  [-0.1, 0.36, 0.055, "#ef6f6c"],
  [0.08, 0.38, 0.045, "#4ade80"],
  [0.2, 0.33, 0.035, "#ef6f6c"],
  [0.0, 0.28, 0.028, "#4ade80"],
  [-0.05, 0.2, 0.022, "#ef6f6c"],
  [0.12, 0.24, 0.025, "#ef6f6c"],
  [0.16, 0.16, 0.02, "#4ade80"],
  [-0.14, 0.27, 0.02, "#ef6f6c"],
];

const Eye: React.FC<{ x: number; pose: Pose; look: Look; lashes: boolean }> = ({ x, pose, look, lashes }) => {
  const open = pose.eyeOpen;
  const px = pose.lookX * 0.05;
  const py = pose.lookY * 0.05;
  return (
    <group position={[x, 0.06, 0.96]} rotation={[0, x * 0.55, 0]}>
      {open > 0.25 ? (
        <group scale={[1, Math.min(1.15, open), 1]}>
          <mesh scale={[0.24, 0.25, 0.12]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#fffdf5" roughness={0.15} />
          </mesh>
          {/* Iris ambar dengan cincin keemasan */}
          <mesh position={[px, py, 0.07]} scale={[0.2, 0.21, 0.07]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#d4a017" roughness={0.2} />
          </mesh>
          <mesh position={[px, py, 0.095]} scale={[0.17, 0.18, 0.06]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={look.iris} roughness={0.15} />
          </mesh>
          <mesh position={[px, py - 0.005, 0.12]} scale={[0.125, 0.135, 0.05]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial color="#0d0703" roughness={0.05} metalness={0.2} />
          </mesh>
          <mesh position={[px + 0.06, py + 0.08, 0.165]} scale={[0.055, 0.06, 0.02]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[px - 0.06, py - 0.07, 0.16]} scale={0.022}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ) : (
        // Mata tertutup gembira: lengkung ^
        <mesh position={[0, -0.03, 0.08]} scale={[1, 0.8, 1]}>
          <torusGeometry args={[0.12, 0.028, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#2b1406" />
        </mesh>
      )}
      <mesh
        position={[0, 0.33 + pose.brow * 0.04, 0.06]}
        rotation={[0, 0, Math.PI / 2 + Math.sign(x) * (pose.brow * 0.35 + 0.05)]}
      >
        <capsuleGeometry args={[0.022, 0.12, 4, 8]} />
        <meshStandardMaterial color="#5b6b12" />
      </mesh>
      {lashes && open > 0.25 ? (
        [0, 1].map((i) => (
          <mesh
            key={i}
            position={[Math.sign(x) * (0.2 + i * 0.03), 0.17 - i * 0.07, 0.04]}
            rotation={[0, 0, Math.sign(x) * (-0.9 - i * 0.4)]}
          >
            <capsuleGeometry args={[0.014, 0.08, 4, 6]} />
            <meshStandardMaterial color="#1f1306" />
          </mesh>
        ))
      ) : null}
    </group>
  );
};

const Hand: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh>
      <sphereGeometry args={[0.14, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    {[-0.07, 0, 0.07].map((x) => (
      <mesh key={x} position={[x, -0.11, 0.04]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color={PINK} roughness={0.4} />
      </mesh>
    ))}
  </group>
);

const Arm: React.FC<{ side: 1 | -1; raise: number; fwd: number; color: string; children?: React.ReactNode }> = ({
  side,
  raise,
  fwd,
  color,
  children,
}) => (
  <group position={[side * 0.88, -0.2, 0.15]} rotation={[0, -side * fwd, side * raise]}>
    <mesh position={[0, -0.3, 0]}>
      <capsuleGeometry args={[0.1, 0.42, 6, 12]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh position={[side * 0.08, -0.32, 0.06]} scale={0.03}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={PINK} />
    </mesh>
    <group position={[0, -0.6, 0]}>
      <Hand color={color} />
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

const Mouth: React.FC<{ pose: Pose }> = ({ pose }) => {
  const sad = pose.smile < 0.4 && pose.mouthOpen < 0.1;
  if (sad) {
    return (
      <mesh position={[0, -0.24, 1.03]} rotation={[0, 0, Math.PI]} scale={[0.8, 0.35, 1]}>
        <torusGeometry args={[0.12, 0.026, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#3b0a0a" />
      </mesh>
    );
  }
  const open = 0.55 + pose.mouthOpen * 0.75;
  return (
    <group position={[0, -0.2, 1.02]}>
      {/* Mulut separuh bulatan terbuka seperti senyuman lebar */}
      <mesh scale={[0.17, 0.13 * open, 0.06]}>
        <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#3b0a0a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]} scale={[0.17, 0.06, 1]}>
        <circleGeometry args={[1, 24, 0, Math.PI]} />
        <meshStandardMaterial color="#3b0a0a" side={2} />
      </mesh>
      {/* Lidah merah jambu terjelir */}
      <mesh position={[0.02, -0.1 * open - 0.03, 0.05]} rotation={[0.3, 0, 0.12]} scale={[0.075, 0.075 + pose.smile * 0.02, 0.04]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#f472b6" roughness={0.3} />
      </mesh>
    </group>
  );
};

export const Durian: React.FC<{ kind: Kind; pose: Pose }> = ({ kind, pose }) => {
  const [spikesA, spikesB] = useSpikes();
  const look = LOOK[kind];
  if (!pose.visible) return null;

  const legH = 0.4;
  const bodyY = legH + R * 1.02;
  const sx = 1 / Math.sqrt(pose.squash);

  return (
    <group position={[pose.x, pose.bob, pose.z]} rotation={[0, pose.rotY, pose.tilt]} scale={look.scale}>
      {/* Kaki pendek dengan jari kaki merah jambu */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.4, 0, 0.05]}>
          <mesh position={[0, legH / 2 + 0.06, 0]}>
            <capsuleGeometry args={[0.16, legH - 0.12, 6, 12]} />
            <meshStandardMaterial color={look.limb} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.08, 0.06]} scale={[0.2, 0.1, 0.24]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={look.limb} roughness={0.5} />
          </mesh>
          {[-0.1, -0.03, 0.04, 0.11].map((x) => (
            <mesh key={x} position={[x, 0.05, 0.27]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial color={PINK} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[s * 0.1, 0.3, 0.14]} scale={0.03}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#ef6f6c" />
          </mesh>
        </group>
      ))}

      <group position={[0, bodyY, 0]} scale={[sx, pose.squash, sx]}>
        <mesh castShadow>
          <sphereGeometry args={[R * 0.98, 48, 48]} />
          <meshStandardMaterial color={look.body} roughness={0.6} />
        </mesh>
        <mesh geometry={spikesA} castShadow>
          <meshStandardMaterial color={look.spikeA} roughness={0.42} flatShading />
        </mesh>
        <mesh geometry={spikesB} castShadow>
          <meshStandardMaterial color={look.spikeB} roughness={0.42} flatShading />
        </mesh>
        {GEMS.map(([x, y, s, c], i) => {
          const v = new Vector3(x, y, s).normalize().multiplyScalar(1.0);
          return (
            <mesh key={i} position={v.toArray()} scale={0.035}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} roughness={0.2} />
            </mesh>
          );
        })}

        {/* Muka bujur licin dengan bingkai */}
        <mesh position={[0, FACE.y, 0.6]} scale={[FACE.w, FACE.h, 0.44]}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshStandardMaterial color={look.face} roughness={0.35} />
        </mesh>
        <mesh position={[0, FACE.y, 0.55]} scale={[FACE.w + 0.08, FACE.h + 0.08, 0.45]}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshStandardMaterial color={look.spikeB} roughness={0.45} />
        </mesh>

        {/* Tangkai di kepala */}
        {kind !== "bapa" ? (
          <group position={[0, 1.05, -0.05]} rotation={[-0.1, 0, -0.12]}>
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.06, 0.1, 0.45, 10]} />
              <meshStandardMaterial color="#7c4a1e" roughness={0.6} />
            </mesh>
          </group>
        ) : (
          // Songkok bapa
          <group position={[0, 1.02, 0]} rotation={[-0.08, 0, 0.06]}>
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

        {/* Bunga dan reben mak */}
        {kind === "mak" ? (
          <>
            <group position={[0.55, 0.88, 0.35]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                  key={i}
                  position={[Math.cos((i / 5) * Math.PI * 2) * 0.11, Math.sin((i / 5) * Math.PI * 2) * 0.11, 0]}
                  scale={[0.1, 0.1, 0.045]}
                >
                  <sphereGeometry args={[1, 12, 12]} />
                  <meshStandardMaterial color="#f472b6" />
                </mesh>
              ))}
              <mesh position={[0, 0, 0.035]} scale={0.065}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#fde047" />
              </mesh>
            </group>
            <group position={[-0.5, 0.9, 0.32]} rotation={[0, 0, 0.4]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.13, 0, 0]} rotation={[0, 0, s * 0.5]} scale={[0.14, 0.09, 0.05]}>
                  <sphereGeometry args={[1, 12, 12]} />
                  <meshStandardMaterial color="#ec4899" />
                </mesh>
              ))}
            </group>
          </>
        ) : null}

        {/* Bintik warna di dahi */}
        {FRECKLES.map(([x, y, s, c], i) => (
          <mesh key={i} position={[x, y, 1.0 - Math.abs(x) * 0.2]} scale={[s * 0.7, s * 0.7, 0.01]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}

        <Eye x={-0.32} pose={pose} look={look} lashes={kind === "mak"} />
        <Eye x={0.32} pose={pose} look={look} lashes={kind === "mak"} />

        {/* Pipi merah jambu bergaris */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.5, -0.15, 0.9]} rotation={[0, s * 0.6, 0]}>
            <mesh scale={[0.13, 0.08, 0.03]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#fb7185" transparent opacity={0.35 + pose.blush * 0.5} />
            </mesh>
            {[-0.05, 0, 0.05].map((x) => (
              <mesh key={x} position={[x, 0, 0.03]} rotation={[0, 0, 0.25]}>
                <capsuleGeometry args={[0.01, 0.05, 3, 6]} />
                <meshStandardMaterial color="#e11d48" transparent opacity={0.3 + pose.blush * 0.5} />
              </mesh>
            ))}
          </group>
        ))}

        <Mouth pose={pose} />

        {kind === "bapa" ? (
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.12, -0.12, 1.04]} rotation={[0, 0, s * 1.25]}>
              <capsuleGeometry args={[0.035, 0.15, 4, 8]} />
              <meshStandardMaterial color="#2b1a07" />
            </mesh>
          ))
        ) : null}

        {/* Air mata gembira */}
        {pose.tear > 0 ? (
          <mesh position={[-0.36, -0.08 - pose.tear * 0.3, 1.0]} scale={[0.05, 0.075, 0.04]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.6} transparent opacity={0.9} />
          </mesh>
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
