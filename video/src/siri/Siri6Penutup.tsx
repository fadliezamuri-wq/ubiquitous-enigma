import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Scene3D } from "./shared";

// Siri 6: Simpulan torus berkilat dengan cincin berpusing — penutup siri
export const Siri6Penutup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ringColors = ["#fbbf24", "#f472b6", "#60a5fa"];

  const grow = interpolate(frame, [0, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10 }),
  });

  return (
    <Scene3D
      name="Siri 6 - Penutup"
      background="radial-gradient(circle at 50% 40%, #4c1d95 0%, #05060f 75%)"
      title="Terima Kasih"
      subtitle="ubiquitous enigma · Siri 6"
      accent="#fbbf24"
    >
      <CameraRig position={[Math.sin(frame * 0.015) * 3, 1, 9]} lookAt={[0, 0.6, 0]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 4, 5]} intensity={90} color="#fde68a" />
      <pointLight position={[-4, -3, 2]} intensity={70} color="#c084fc" />
      <group position={[0, 1.2, 0]} scale={grow * 0.82}>
        <mesh rotation={[frame * 0.01, frame * 0.02, 0]}>
          <torusKnotGeometry args={[1, 0.32, 200, 32, 2, 3]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        {ringColors.map((color, i) => (
          <mesh key={color} rotation={[frame * (0.01 + i * 0.006) + i, i * 1.1, frame * 0.012 * (i - 1)]}>
            <torusGeometry args={[2.1 + i * 0.25, 0.025, 16, 120]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
    </Scene3D>
  );
};
