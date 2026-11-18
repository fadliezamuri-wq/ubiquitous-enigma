import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { ip, hop, squashFromHop, autoBlink, type Vec3 } from "../anim";
import { Crown, Durian, Manggis, Rambutan } from "../Characters";
import {
  CameraRig,
  Ground,
  HeroTree,
  Hills,
  Orchard,
  Stage,
  fontFamily,
} from "../World";
import { Aroma, DURI_R, faceCam } from "../shared";

const C: Vec3 = [0.75, DURI_R, -0.5];

export const Penutup: React.FC = () => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.sin);
  const ang = ip(f, [0, 150], [-0.35, 0.45], e);
  const rad = ip(f, [0, 150], [6.2, 8.5], e);
  const cam: Vec3 = [
    C[0] + Math.sin(ang) * rad,
    ip(f, [0, 150], [1.8, 3.6], e),
    C[2] + Math.cos(ang) * rad,
  ];
  const target: Vec3 = [C[0], 1.0, C[2]];

  const dh = hop(f, 18);
  const friends = [0, 1].map((i) => {
    const a = f * 0.045 + i * Math.PI + 0.6;
    const h = hop(f, 15, i * 7);
    const pos: Vec3 = [
      C[0] + Math.cos(a) * 1.7,
      (i ? 0.4 : 0.45) + h * 0.45,
      C[2] + Math.sin(a) * 1.7,
    ];
    return { pos, h };
  });
  const moral = ip(f, [12, 30], [0, 1], Easing.out(Easing.back(1.6)));
  const end = ip(f, [88, 105], [0, 1]);
  const fadeOut = ip(f, [135, 150], [0, 1]);
  const duriPos: Vec3 = [C[0], C[1] + dh * 0.18, C[2]];

  return (
    <Stage
      time="morning"
      overlay={
        <>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 80 }}>
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 88,
                color: "#fff",
                WebkitTextStroke: "8px #5a3208",
                paintOrder: "stroke fill",
                scale: String(moral),
                opacity: Math.min(moral, 1 - end),
              }}
            >
              Keras di luar, manis di dalam.
            </div>
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              opacity: end,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 170,
                color: "#ffd43b",
                WebkitTextStroke: "12px #4a2a08",
                paintOrder: "stroke fill",
                translate: `0 ${(1 - end) * 30 - 180}px`,
              }}
            >
              TAMAT
            </div>
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 52,
                color: "#fff",
                textShadow: "0 3px 10px rgba(0,0,0,0.5)",
                translate: "0 -170px",
              }}
            >
              Dusun Durian Aku
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
        </>
      }
    >
      <CameraRig position={cam} target={target} fov={40} />
      <Ground time="morning" />
      <Hills />
      <Orchard skipNear />
      <HeroTree />
      <Durian
        position={duriPos}
        rotation={[0, faceCam(C, cam), 0]}
        squash={squashFromHop(dh)}
        glow={0.5}
        mood={1}
        mouthOpen={0.65}
        blink={autoBlink(f, 10)}
      />
      <Crown
        position={[duriPos[0], duriPos[1] + DURI_R * 1.06 + 0.02, duriPos[2]]}
        rotationY={f * 0.01}
        scale={0.95}
      />
      <Aroma
        frame={f + 240}
        origin={[C[0], 0.3, C[2]]}
        strength={0.8}
        count={30}
      />
      <Manggis
        position={friends[0].pos}
        rotation={[0, faceCam(friends[0].pos, cam), 0]}
        squash={squashFromHop(friends[0].h)}
        mood={1}
        mouthOpen={0.55}
        blink={autoBlink(f, 30)}
      />
      <Rambutan
        position={friends[1].pos}
        rotation={[0, faceCam(friends[1].pos, cam), 0]}
        squash={squashFromHop(friends[1].h)}
        mood={1}
        mouthOpen={0.6}
        blink={autoBlink(f, 60)}
      />
    </Stage>
  );
};
