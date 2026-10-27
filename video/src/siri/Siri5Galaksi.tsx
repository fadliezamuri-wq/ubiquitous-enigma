import { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BufferAttribute, BufferGeometry, Color } from "three";
import { CameraRig, Scene3D } from "./shared";

// Siri 5: Galaksi lingkaran dengan kamera terbang masuk
export const Siri5Galaksi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const geometry = useMemo(() => {
    const count = 6000;
    const arms = 4;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const inner = new Color("#fde68a");
    const outer = new Color("#6366f1");
    for (let i = 0; i < count; i++) {
      const r = Math.pow(random(`r${i}`), 1.5) * 6;
      const branch = ((i % arms) / arms) * Math.PI * 2;
      const spin = r * 1.1;
      const jitter = (axis: string) => (random(`j${i}${axis}`) - 0.5) * 0.4 * (1 + r * 0.3);
      positions[i * 3] = Math.cos(branch + spin) * r + jitter("x");
      positions[i * 3 + 1] = jitter("y") * 0.5;
      positions[i * 3 + 2] = Math.sin(branch + spin) * r + jitter("z");
      const c = inner.clone().lerp(outer, r / 6);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("color", new BufferAttribute(colors, 3));
    return g;
  }, []);

  const dist = interpolate(frame, [0, 5 * fps], [16, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <Scene3D
      name="Siri 5 - Galaksi"
      background="radial-gradient(circle at 50% 40%, #1e1b4b 0%, #000000 80%)"
      title="Angkasa"
      subtitle="Siri 5 · Galaksi"
      accent="#fde68a"
    >
      <CameraRig position={[0, dist * 0.55, dist]} lookAt={[0, 0, 0]} />
      <group rotation={[0.15, frame * 0.008, 0]} position={[0, 0.6, 0]}>
        <points geometry={geometry}>
          <pointsMaterial size={0.05} vertexColors sizeAttenuation transparent opacity={0.9} depthWrite={false} />
        </points>
        <mesh>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshBasicMaterial color="#fff7ed" />
        </mesh>
      </group>
    </Scene3D>
  );
};
