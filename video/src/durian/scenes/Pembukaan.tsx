import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { ip, autoBlink, type Vec3 } from "../anim";
import {
  CameraRig,
  Ground,
  Hills,
  HeroTree,
  Orchard,
  Stage,
  fontFamily,
} from "../World";
import { HangingDuri } from "../shared";

export const Pembukaan: React.FC = () => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.quad);
  const cam: Vec3 = [
    ip(f, [0, 170], [0, 1.8], e),
    ip(f, [0, 170], [15, 3.0], e),
    ip(f, [0, 170], [34, 8.5], e),
  ];
  const target: Vec3 = [
    ip(f, [0, 170], [0, 0.4], e),
    ip(f, [0, 170], [5, 2.5], e),
    ip(f, [0, 170], [-12, -0.5], e),
  ];
  const titleIn = ip(f, [30, 48], [0, 1], Easing.out(Easing.back(2)));
  const subIn = ip(f, [55, 70], [0, 1]);
  const out = ip(f, [140, 165], [1, 0]);

  return (
    <Stage
      time="day"
      overlay={
        <AbsoluteFill
          style={{ alignItems: "center", paddingTop: 110, opacity: out }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 190,
              color: "#ffd43b",
              WebkitTextStroke: "12px #4a2a08",
              paintOrder: "stroke fill",
              textShadow: "0 14px 0 rgba(74,42,8,0.6)",
              scale: String(titleIn),
              opacity: titleIn,
              letterSpacing: 6,
            }}
          >
            SI DURI
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 54,
              color: "#fff",
              textShadow: "0 3px 10px rgba(0,0,0,0.45)",
              WebkitTextStroke: "6px #3a5a1a",
              paintOrder: "stroke fill",
              opacity: subIn,
              translate: `0 ${(1 - subIn) * 20}px`,
              marginTop: 10,
            }}
          >
            Sebuah cerita dari dusun durian aku
          </div>
        </AbsoluteFill>
      }
    >
      <CameraRig position={cam} target={target} fov={42} />
      <Ground time="day" />
      <Hills />
      <Orchard sway={Math.sin(f / 25) * 0.02} />
      <HeroTree sway={Math.sin(f / 30) * 0.015} />
      <HangingDuri
        swing={Math.sin(f / 22) * 0.06}
        blink={ip(f, [100, 115], [1, 0]) || autoBlink(f)}
        mood={0.4}
        yaw={0.2}
      />
    </Stage>
  );
};
