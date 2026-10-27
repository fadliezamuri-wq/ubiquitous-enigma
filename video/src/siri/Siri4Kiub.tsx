import { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Scene3D } from "./shared";

const colors = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#a855f7"];

// Siri 4: Kiub bertaburan berkumpul menjadi satu blok teka-teki
export const Siri4Kiub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cubes = useMemo(() => {
    const list = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const k = `${x}${y}${z}`;
          list.push({
            target: [x, y, z] as const,
            from: [(random(`x${k}`) - 0.5) * 14, (random(`y${k}`) - 0.5) * 14, (random(`z${k}`) - 0.5) * 10] as const,
            spin: random(`s${k}`) * 6,
            delay: random(`d${k}`) * 0.8,
            color: colors[Math.floor(random(`c${k}`) * colors.length)],
          });
        }
    return list;
  }, []);

  return (
    <Scene3D
      name="Siri 4 - Kiub"
      background="radial-gradient(circle at 50% 40%, #7c2d12 0%, #05060f 75%)"
      title="Teka-teki"
      subtitle="Siri 4 · Kiub Ajaib"
      accent="#fbbf24"
    >
      <CameraRig position={[6.5, 5, 10.5]} lookAt={[0, 0, 0]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={2.4} />
      <pointLight position={[-5, -2, 2]} intensity={40} color="#fb923c" />
      <group position={[0, 1.1, 0]} rotation={[0.2, frame * 0.02, 0]}>
        {cubes.map((c, i) => {
          const t = interpolate(frame, [c.delay * fps, (c.delay + 1.6) * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 11 }),
          });
          const pos = c.target.map((v, j) => c.from[j] + (v * 1.05 - c.from[j]) * t) as [number, number, number];
          const r = (1 - t) * c.spin;
          return (
            <mesh key={i} position={pos} rotation={[r, r * 0.7, r * 0.3]}>
              <boxGeometry args={[0.96, 0.96, 0.96]} />
              <meshStandardMaterial color={c.color} roughness={0.25} metalness={0.2} />
            </mesh>
          );
        })}
      </group>
    </Scene3D>
  );
};
