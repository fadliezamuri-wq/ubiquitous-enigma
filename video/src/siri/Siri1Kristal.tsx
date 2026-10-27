import { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Scene3D } from "./shared";

// Siri 1: Kristal bercahaya dengan zarah mengorbit
export const Siri1Kristal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(
    () =>
      new Array(60).fill(0).map((_, i) => ({
        radius: 2.4 + random(`r${i}`) * 1.4,
        speed: 0.01 + random(`s${i}`) * 0.025,
        phase: random(`p${i}`) * Math.PI * 2,
        tilt: (random(`t${i}`) - 0.5) * 1.6,
        size: 0.03 + random(`z${i}`) * 0.05,
      })),
    [],
  );

  const grow = interpolate(frame, [0, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 9 }),
  });

  return (
    <Scene3D
      name="Siri 1 - Kristal"
      background="radial-gradient(circle at 50% 40%, #312e81 0%, #05060f 75%)"
      title="Helo!"
      subtitle="Siri 1 · Kristal"
      accent="#a5b4fc"
    >
      <CameraRig position={[Math.sin(frame * 0.01) * 2, 0.8, 9 - frame * 0.01]} lookAt={[0, 0.6, 0]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={80} color="#818cf8" />
      <pointLight position={[-4, -2, 3]} intensity={60} color="#f472b6" />
      <group position={[0, 0.8, 0]}>
        <mesh scale={grow * 1.6} rotation={[frame * 0.012, frame * 0.02, 0]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.15} flatShading />
        </mesh>
        <mesh scale={grow * 2.05} rotation={[-frame * 0.008, -frame * 0.015, 0]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#c7d2fe" wireframe transparent opacity={0.35} />
        </mesh>
        {particles.map((p, i) => {
          const a = p.phase + frame * p.speed;
          return (
            <mesh
              key={i}
              scale={grow}
              position={[Math.cos(a) * p.radius, Math.sin(a) * p.radius * p.tilt * 0.5, Math.sin(a) * p.radius]}
            >
              <sphereGeometry args={[p.size, 8, 8]} />
              <meshBasicMaterial color={i % 2 ? "#f9a8d4" : "#a5b4fc"} />
            </mesh>
          );
        })}
      </group>
    </Scene3D>
  );
};
