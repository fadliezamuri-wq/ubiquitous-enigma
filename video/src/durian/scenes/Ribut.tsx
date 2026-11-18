import { useMemo } from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { ip, type Vec3 } from "../anim";
import { Durian } from "../Characters";
import {
  BRANCH_TIP,
  Caption,
  CameraRig,
  Ground,
  HeroTree,
  Hills,
  Orchard,
  PopWord,
  Stage,
  mulberry,
} from "../World";
import { DURI_R, HANG, HangingDuri } from "../shared";

const BREAK = 100;
const swingAt = (f: number) => Math.sin(f / 6) * (0.18 + f / 400);

const Rain: React.FC = () => {
  const f = useCurrentFrame();
  const drops = useMemo(() => {
    const r = mulberry(11);
    return Array.from({ length: 140 }).map(() => ({
      x: r() * 120 - 10,
      y: r() * 1200,
      l: 30 + r() * 40,
    }));
  }, []);
  return (
    <AbsoluteFill>
      {drops.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: ((d.y + f * 55) % 1300) - 120,
            width: 3,
            height: d.l,
            background: "rgba(190,210,255,0.45)",
            rotate: "14deg",
            borderRadius: 3,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Ribut: React.FC = () => {
  const f = useCurrentFrame();
  const flash = Math.max(
    ip(f, [55, 57], [0, 1], Easing.linear) * ip(f, [57, 64], [1, 0]),
    ip(f, [80, 82], [0, 0.8]) * ip(f, [82, 87], [1, 0]),
  );

  // Duri position: hanging until BREAK, then free fall + bounce
  const a0 = swingAt(BREAK);
  const x0 = BRANCH_TIP[0] + Math.sin(a0) * HANG;
  const y0 = BRANCH_TIP[1] - Math.cos(a0) * HANG;
  const groundY = DURI_R;
  const fallFrames = 16;
  const g = (2 * (y0 - groundY)) / (fallFrames * fallFrames);
  const tf = f - BREAK;
  const landed = tf >= fallFrames;
  const tl = tf - fallFrames;
  const duriPos: Vec3 = [
    x0 + Math.min(tf, fallFrames) * 0.012,
    landed
      ? groundY + 0.35 * Math.abs(Math.sin(tl * 0.28)) * Math.exp(-tl * 0.14)
      : y0 - 0.5 * g * tf * tf,
    BRANCH_TIP[2],
  ];
  const squash = landed
    ? 1 - 0.38 * Math.cos(tl * 0.55) * Math.exp(-tl * 0.16)
    : 1 + Math.min(tf, fallFrames) * 0.008;

  const shake = landed ? Math.exp(-tl * 0.18) * 0.12 : 0;
  const cam: Vec3 = [
    0.3 + Math.sin(f * 2.1) * shake,
    2.1 + Math.cos(f * 2.7) * shake,
    6.6,
  ];
  const target: Vec3 = [0.4, ip(f, [BREAK, BREAK + 18], [2.0, 1.0]), -0.4];

  const wind = Math.sin(f / 6) * 0.06;
  const scaredFace = { eyeScale: 1.25, mood: -0.8, mouthOpen: 0.5, worry: 0.9 };

  return (
    <Stage
      time="night"
      flash={flash}
      overlay={
        <>
          <Rain />
          <Caption
            text="Satu malam, ribut datang. Angin bertiup kencang..."
            from={5}
            to={95}
          />
          <PopWord
            text="GEDEBUK!"
            at={BREAK + fallFrames}
            x="60%"
            y="38%"
            color="#ffcf3a"
          />
          <Caption text="Aduh... Duri terjatuh ke tanah." from={138} to={180} />
        </>
      }
    >
      <CameraRig position={cam} target={target} fov={42} />
      <pointLight
        position={[0.6, 2.6, 2.6]}
        color="#b8c8ff"
        intensity={9}
        distance={9}
      />
      <Ground time="night" />
      <Hills />
      <Orchard sway={wind} skipNear />
      <HeroTree sway={wind * 0.8} />
      {f < BREAK ? (
        <HangingDuri swing={swingAt(f)} yaw={0.15} {...scaredFace} />
      ) : (
        <>
          <HangingDuri withDuri={false} swing={swingAt(f) * 0.6} />
          <Durian
            position={duriPos}
            rotation={[0, 0.15, landed ? 0 : -tf * 0.02]}
            squash={squash}
            {...(landed && tl > 12
              ? { blink: 1, mood: -0.3, mouthOpen: 0.15, worry: 0.6 }
              : { ...scaredFace, mouthOpen: 1 })}
          />
          {landed && tl > 12
            ? [0, 1, 2].map((i) => {
                const a = f * 0.18 + (i * Math.PI * 2) / 3;
                return (
                  <mesh
                    key={i}
                    position={[
                      duriPos[0] + Math.cos(a) * 0.6,
                      1.45,
                      duriPos[2] + Math.sin(a) * 0.6,
                    ]}
                    rotation={[0, a, 0.5]}
                    scale={0.08}
                  >
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color="#ffe14a" />
                  </mesh>
                );
              })
            : null}
        </>
      )}
    </Stage>
  );
};
