import { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Quaternion, Vector3 } from "three";
import { CameraRig, Scene3D } from "./shared";

// Siri 2: Durian 3D — duri tumbuh keluar satu demi satu
export const Siri2Durian: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spikes = useMemo(() => {
    const count = 140;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const up = new Vector3(0, 1, 0);
    return new Array(count).fill(0).map((_, i) => {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const dir = new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r);
      const q = new Quaternion().setFromUnitVectors(up, dir);
      return { dir, q, delay: (1 - y) * 0.5 };
    });
  }, []);

  const bodyScale = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10 }),
  });

  return (
    <Scene3D
      name="Siri 2 - Durian"
      background="radial-gradient(circle at 50% 40%, #365314 0%, #05060f 75%)"
      title="Raja Buah"
      subtitle="Siri 2 · Durian 3D"
      accent="#bef264"
    >
      <CameraRig position={[0, 1.2 + Math.sin(frame * 0.03) * 0.4, 9]} lookAt={[0, 0.8, 0]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 5]} intensity={2.2} color="#fef9c3" />
      <pointLight position={[-4, -1, 3]} intensity={40} color="#84cc16" />
      <group
        position={[0, 0.8 + Math.sin(frame * 0.06) * 0.12, 0]}
        rotation={[0.25, frame * 0.025, 0]}
        scale={[bodyScale * 1.5, bodyScale * 1.75, bodyScale * 1.5]}
      >
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color="#65a30d" roughness={0.7} />
        </mesh>
        {spikes.map((s, i) => {
          const grow = interpolate(frame, [(0.6 + s.delay) * fps, (1.1 + s.delay) * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 8 }),
          });
          return (
            <mesh
              key={i}
              position={s.dir.clone().multiplyScalar(0.98 + grow * 0.1).toArray()}
              quaternion={s.q}
              scale={[1, Math.max(grow, 0.001), 1]}
            >
              <coneGeometry args={[0.09, 0.3, 6]} />
              <meshStandardMaterial color="#a3e635" roughness={0.5} flatShading />
            </mesh>
          );
        })}
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.06, 0.1, 0.35, 8]} />
          <meshStandardMaterial color="#713f12" />
        </mesh>
      </group>
    </Scene3D>
  );
};
