import { useMemo } from "react";
import { AdditiveBlending, CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { random } from "remotion";

// Lantai kayu dilukis sekali pada kanvas
const useWoodTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    const tones = ["#c98b4f", "#d29758", "#bf8045", "#d9a066"];
    for (let i = 0; i < 8; i++) {
      g.fillStyle = tones[i % tones.length];
      g.fillRect(0, i * 64, 512, 64);
      g.fillStyle = "rgba(90,50,20,0.35)";
      g.fillRect(0, i * 64, 512, 3);
      g.fillRect(((i * 197) % 400) + 60, i * 64, 3, 64);
    }
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(3, 3);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);

const SkyTexture = () => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#7cc4f2");
    grad.addColorStop(0.6, "#ffe2a8");
    grad.addColorStop(1, "#ffb870");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 256);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  return <meshBasicMaterial map={tex} toneMapped={false} />;
};

const Window: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={[0.6, 3.1, -3.95]}>
    <mesh>
      <planeGeometry args={[2.6, 2.2]} />
      <SkyTexture />
    </mesh>
    {/* Matahari pagi */}
    <mesh position={[0.5, -0.35 + Math.min(frame, 600) * 0.0004, 0.01]}>
      <circleGeometry args={[0.32, 32]} />
      <meshBasicMaterial color="#fff3c4" toneMapped={false} />
    </mesh>
    <mesh position={[-0.6, -0.75, 0.012]} scale={[1.3, 0.35, 1]}>
      <circleGeometry args={[0.5, 24]} />
      <meshBasicMaterial color="#6fbf73" toneMapped={false} />
    </mesh>
    {[
      [0, 1.1, 2.8, 0.12],
      [0, -1.1, 2.8, 0.12],
      [1.35, 0, 0.12, 2.3],
      [-1.35, 0, 0.12, 2.3],
      [0, 0, 0.08, 2.2],
      [0, 0, 2.6, 0.08],
    ].map(([x, y, w, h], i) => (
      <mesh key={i} position={[x, y, 0.05]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#fffaf0" />
      </mesh>
    ))}
    {/* Langsir beralun lembut */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 1.7, -0.1, 0.15]} rotation={[0, 0, Math.sin(frame * 0.04 + s) * 0.03]}>
        <boxGeometry args={[0.6, 2.7, 0.08]} />
        <meshStandardMaterial color="#f9a8d4" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

const SunShafts: React.FC<{ frame: number; strength: number }> = ({ frame, strength }) => (
  <group>
    {[0, 1, 2, 3].map((i) => (
      <mesh
        key={i}
        position={[0.2 + i * 0.45, 1.9, -1.6]}
        rotation={[-0.75, 0, 0.18]}
      >
        <planeGeometry args={[0.35 + (i % 2) * 0.2, 5.5]} />
        <meshBasicMaterial
          color="#ffe9a8"
          transparent
          opacity={(0.07 + Math.sin(frame * 0.03 + i * 1.7) * 0.025) * strength}
          blending={AdditiveBlending}
          depthWrite={false}
          side={2}
        />
      </mesh>
    ))}
  </group>
);

const Dust: React.FC<{ frame: number }> = ({ frame }) => {
  const motes = useMemo(
    () =>
      new Array(40).fill(0).map((_, i) => ({
        x: random(`dx${i}`) * 3 - 0.8,
        y: random(`dy${i}`) * 3 + 0.3,
        z: random(`dz${i}`) * 3 - 3,
        s: random(`ds${i}`) * 0.02 + 0.012,
        p: random(`dp${i}`) * 10,
      })),
    [],
  );
  return (
    <group>
      {motes.map((m, i) => (
        <mesh
          key={i}
          position={[m.x + Math.sin(frame * 0.01 + m.p) * 0.2, m.y + Math.sin(frame * 0.013 + m.p * 2) * 0.15, m.z]}
        >
          <sphereGeometry args={[m.s, 6, 6]} />
          <meshBasicMaterial color="#fff7d6" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const Kitchen: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={[-2.4, 0, -2.9]}>
    <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 1.4, 1.1]} />
      <meshStandardMaterial color="#fef3c7" roughness={0.7} />
    </mesh>
    <mesh position={[0, 1.43, 0]} receiveShadow>
      <boxGeometry args={[3.1, 0.08, 1.2]} />
      <meshStandardMaterial color="#a16207" roughness={0.5} />
    </mesh>
    {[-0.75, 0.75].map((x) => (
      <mesh key={x} position={[x, 0.7, 0.56]}>
        <boxGeometry args={[1.3, 1.1, 0.02]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
    ))}
    {/* Dapur dan kuali */}
    <mesh position={[0.6, 1.5, 0]}>
      <boxGeometry args={[1, 0.08, 0.8]} />
      <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0.6, 1.62, 0]}>
      <cylinderGeometry args={[0.38, 0.3, 0.14, 32]} />
      <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
    </mesh>
    <mesh position={[0.6, 1.7, 0]} scale={[0.26, 0.03, 0.22]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[0.62, 1.73, 0.02]} scale={[0.09, 0.05, 0.09]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.2} />
    </mesh>
    {/* Wap */}
    {[0, 1, 2, 3].map((i) => {
      const t = ((frame * 0.012 + i * 0.25) % 1 + 1) % 1;
      return (
        <mesh key={i} position={[0.6 + Math.sin(t * 6 + i) * 0.08, 1.8 + t * 1.1, 0]} scale={0.1 + t * 0.15}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={(1 - t) * 0.35} depthWrite={false} />
        </mesh>
      );
    })}
    {/* Periuk nasi dan pinggan */}
    <mesh position={[-0.7, 1.65, -0.1]}>
      <cylinderGeometry args={[0.3, 0.28, 0.4, 24]} />
      <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
    </mesh>
    <mesh position={[-0.7, 1.88, -0.1]}>
      <sphereGeometry args={[0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
    </mesh>
    {/* Rak dinding */}
    <mesh position={[0, 3, -0.45]}>
      <boxGeometry args={[2.4, 0.08, 0.35]} />
      <meshStandardMaterial color="#a16207" />
    </mesh>
    {["#60a5fa", "#f87171", "#34d399", "#fbbf24"].map((c, i) => (
      <mesh key={c} position={[-0.8 + i * 0.5, 3.18, -0.45]}>
        <cylinderGeometry args={[0.12, 0.1, 0.28, 16]} />
        <meshStandardMaterial color={c} roughness={0.4} />
      </mesh>
    ))}
  </group>
);

const DiningTable: React.FC = () => (
  <group position={[3.1, 0, -2.1]}>
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.95, 0.95, 0.08, 40]} />
      <meshStandardMaterial color="#fde4ef" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.1, 0.25, 1, 16]} />
      <meshStandardMaterial color="#92400e" />
    </mesh>
    {[
      [-0.4, 0.2],
      [0.35, -0.3],
      [0.3, 0.35],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 1.06, z]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.18, 0.04, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.06, 0]} scale={[0.12, 0.07, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#fffbeb" />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 1.2, 0]}>
      <cylinderGeometry args={[0.08, 0.06, 0.25, 16]} />
      <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} />
    </mesh>
  </group>
);

const FamilyFrame: React.FC = () => (
  <group position={[3.2, 3.3, -3.92]}>
    <mesh>
      <boxGeometry args={[1, 0.8, 0.06]} />
      <meshStandardMaterial color="#b45309" />
    </mesh>
    <mesh position={[0, 0, 0.035]}>
      <planeGeometry args={[0.82, 0.62]} />
      <meshStandardMaterial color="#fef9c3" />
    </mesh>
    {[-0.22, 0, 0.22].map((x, i) => (
      <mesh key={x} position={[x, -0.08, 0.05]} scale={i === 1 ? 0.1 : 0.14}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#84cc16" />
      </mesh>
    ))}
  </group>
);

const Plant: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.22, 0.6, 20]} />
      <meshStandardMaterial color="#ea580c" roughness={0.7} />
    </mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <mesh
        key={i}
        position={[Math.cos(i) * 0.15, 0.9 + (i % 3) * 0.15, Math.sin(i) * 0.15]}
        rotation={[Math.cos(i) * 0.6, i, Math.sin(i) * 0.6]}
        scale={[0.1, 0.45, 0.04]}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
    ))}
  </group>
);

export const Rumah: React.FC<{ frame: number; sun: number }> = ({ frame, sun }) => {
  const wood = useWoodTexture();
  return (
    <group>
      <hemisphereLight args={["#fff1d6", "#c98b4f", 0.9]} />
      <ambientLight intensity={0.25} color="#ffe8c2" />
      <directionalLight
        position={[3, 7, -6]}
        intensity={2.6 * sun}
        color="#ffd89a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-2, 5, 8]} intensity={1.1} color="#fff6e5" />
      <pointLight position={[0.6, 3, -3]} intensity={12 * sun} color="#ffcf7a" distance={8} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial map={wood} roughness={0.8} />
      </mesh>
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#fdecc8" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.25, -3.98]}>
        <planeGeometry args={[16, 0.5]} />
        <meshStandardMaterial color="#e9c48d" />
      </mesh>
      <mesh position={[-6, 4, 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#fbe3b4" roughness={0.95} />
      </mesh>
      {/* Permaidani */}
      <mesh position={[0.4, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.3, 48]} />
        <meshStandardMaterial color="#fca5a5" roughness={1} />
      </mesh>
      <mesh position={[0.4, 0.015, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.85, 48]} />
        <meshStandardMaterial color="#fef3c7" roughness={1} />
      </mesh>

      <Window frame={frame} />
      <SunShafts frame={frame} strength={sun} />
      <Dust frame={frame} />
      <Kitchen frame={frame} />
      <DiningTable />
      <FamilyFrame />
      <Plant x={5} z={-3} />
      <Plant x={-5.2} z={0.5} />
    </group>
  );
};
