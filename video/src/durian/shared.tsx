import { Durian, type FaceProps } from "./Characters";
import { BRANCH_TIP } from "./World";
import type { Vec3 } from "./anim";

export const DURI_R = 0.55;
/** distance from the branch pivot to Duri's centre */
export const HANG = 1.1;

/** Yaw that turns a character at `pos` towards the camera. */
export const faceCam = (pos: Vec3, cam: Vec3) =>
  Math.atan2(cam[0] - pos[0], cam[2] - pos[2]);

export const HangingDuri: React.FC<
  FaceProps & {
    swing?: number;
    yaw?: number;
    children?: React.ReactNode;
    withDuri?: boolean;
  }
> = ({ swing = 0, yaw = 0, children, withDuri = true, ...face }) => (
  <group position={BRANCH_TIP} rotation={[0, 0, swing]}>
    <mesh position={[0, -0.17, 0]} castShadow>
      <cylinderGeometry args={[0.035, 0.05, 0.36, 8]} />
      <meshStandardMaterial color="#6b4a22" roughness={0.8} />
    </mesh>
    {withDuri ? (
      <group position={[0, -HANG, 0]} rotation={[0, yaw, 0]}>
        <Durian r={DURI_R} {...face} />
        {children}
      </group>
    ) : null}
  </group>
);

/** Golden aroma sparkles spiralling up from a point. */
export const Aroma: React.FC<{
  frame: number;
  origin: Vec3;
  strength: number;
  count?: number;
}> = ({ frame, origin, strength, count = 42 }) => {
  if (strength <= 0) return null;
  return (
    <group position={origin}>
      {Array.from({ length: count }).map((_, i) => {
        const life = 80;
        const t = ((frame + i * 11) % life) / life;
        const a = i * 2.39 + t * 4;
        const rad = 0.5 + t * 1.8;
        const s =
          Math.sin(t * Math.PI) * 0.055 * strength * (1 + (i % 3) * 0.4);
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * rad, 0.2 + t * 3.2, Math.sin(a) * rad]}
            scale={s}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial
              color={i % 4 ? "#ffd54a" : "#fff3b0"}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/** Sparkle burst used when the crown lands. */
export const Burst: React.FC<{ frame: number; at: number; origin: Vec3 }> = ({
  frame,
  at,
  origin,
}) => {
  const t = (frame - at) / 30;
  if (t < 0 || t > 1) return null;
  return (
    <group position={origin}>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const e = (i % 3) * 0.4 - 0.3;
        const d = 0.3 + t * 1.6;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * d, e + t * 0.6, Math.sin(a) * d]}
            scale={(1 - t) * 0.07}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={i % 2 ? "#fff6b0" : "#ffcf3a"} />
          </mesh>
        );
      })}
    </group>
  );
};
