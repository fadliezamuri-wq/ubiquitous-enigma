import { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Color } from "three";
import { CameraRig, Scene3D } from "./shared";

// Siri 3: Grid kiub yang beralun seperti ombak
export const Siri3Gelombang: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const N = 16;

  const cells = useMemo(
    () =>
      new Array(N * N).fill(0).map((_, i) => {
        const x = (i % N) - (N - 1) / 2;
        const z = Math.floor(i / N) - (N - 1) / 2;
        return { x, z, d: Math.sqrt(x * x + z * z) };
      }),
    [],
  );
  const low = useMemo(() => new Color("#0e7490"), []);
  const high = useMemo(() => new Color("#f0abfc"), []);

  const amp = interpolate(frame, [0, 1.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <Scene3D
      name="Siri 3 - Gelombang"
      background="linear-gradient(180deg, #082f49 0%, #05060f 80%)"
      title="Beralun"
      subtitle="Siri 3 · Gelombang"
      accent="#67e8f9"
    >
      <CameraRig
        position={[Math.cos(frame * 0.012) * 12, 8, Math.sin(frame * 0.012) * 12]}
        lookAt={[0, -2.6, 0]}
      />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 4]} intensity={2} />
      <pointLight position={[0, 4, 0]} intensity={60} color="#e879f9" />
      <group position={[0, 0, 0]} scale={0.45}>
        {cells.map((c, i) => {
          const h = (Math.sin(c.d * 0.7 - frame * 0.15) * 0.5 + 0.5) * amp;
          return (
            <mesh key={i} position={[c.x * 1.1, h * 2, c.z * 1.1]} scale={[1, 0.4 + h * 4, 1]}>
              <boxGeometry args={[0.9, 1, 0.9]} />
              <meshStandardMaterial color={low.clone().lerp(high, h)} metalness={0.3} roughness={0.35} />
            </mesh>
          );
        })}
      </group>
    </Scene3D>
  );
};
