import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { ip, hop, squashFromHop, autoBlink, type Vec3 } from "../anim";
import { Manggis, Rambutan } from "../Characters";
import {
  Caption,
  CameraRig,
  Ground,
  Hills,
  HeroTree,
  Orchard,
  Stage,
  fontFamily,
} from "../World";
import { DURI_R, HangingDuri, faceCam } from "../shared";

export const Kesepian: React.FC = () => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);

  const cam: Vec3 = [
    ip(f, [165, 235], [0, 0.9], e),
    ip(f, [165, 235], [2.0, 2.55], e),
    ip(f, [165, 235], [7.2, 3.5], e),
  ];
  const target: Vec3 = [
    ip(f, [165, 235], [0.1, 0.6], e),
    ip(f, [165, 235], [1.5, 2.4], e),
    ip(f, [165, 235], [0, -0.5], e),
  ];

  // friends play until they notice Duri
  const playing = f < 125;
  const mh = playing ? hop(f, 24) : 0;
  const rh = playing ? hop(f, 20, 8) : 0;
  // jump back in fear
  const back = ip(f, [135, 158], [0, 1], Easing.out(Easing.quad));
  const backHop = Math.sin(back * Math.PI) * 0.7;
  const mPos: Vec3 = [
    -1.3 - back * 0.7,
    0.45 + mh * 0.5 + backHop,
    1.3 + back * 0.9,
  ];
  const rPos: Vec3 = [
    1.5 + back * 1.1,
    0.4 + rh * 0.55 + backHop,
    1.4 + back * 0.5,
  ];
  const scared = ip(f, [122, 132], [0, 1]);
  const friendFace = {
    eyeScale: 1 + scared * 0.3,
    mood: 0.9 - scared * 1.6,
    mouthOpen: playing ? 0.35 : scared * 0.7,
    look: (playing ? [0, 0] : [0, 0.9]) as [number, number],
    worry: scared,
  };

  // Duri: happy -> eager -> sad
  const eager = f >= 88 && f < 130;
  const sad = ip(f, [160, 190], [0, 1]);
  const swing = eager
    ? Math.sin(f / 3) * 0.12
    : Math.sin(f / 22) * 0.05 * (1 - sad);
  const tearT = ip(f, [200, 235], [0, 1], Easing.in(Easing.quad));

  const bubble =
    f >= 92 && f < 135
      ? ip(f, [92, 100], [0, 1], Easing.out(Easing.back(2))) *
        ip(f, [126, 135], [1, 0])
      : 0;

  return (
    <Stage
      time="day"
      overlay={
        <>
          {bubble > 0 ? (
            <AbsoluteFill>
              <div
                style={{
                  position: "absolute",
                  left: "58%",
                  top: "10%",
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 54,
                  color: "#3a2106",
                  background: "#fffdf3",
                  padding: "22px 40px",
                  borderRadius: 50,
                  boxShadow: "0 10px 0 rgba(0,0,0,0.15)",
                  scale: String(bubble),
                }}
              >
                Hai kawan-kawan! Jom main!
              </div>
            </AbsoluteFill>
          ) : null}
          <Caption
            text="Di dusun durian aku, ada sebiji durian kecil bernama Duri."
            from={5}
            to={92}
          />
          <Caption
            text="Tapi kawan-kawan takut nak dekat... durinya tajam sangat!"
            from={136}
            to={192}
          />
          <Caption text="Duri rasa sedih dan sunyi..." from={196} to={240} />
        </>
      }
    >
      <CameraRig position={cam} target={target} fov={40} />
      <Ground time="day" />
      <Hills />
      <Orchard skipNear />
      <HeroTree sway={Math.sin(f / 30) * 0.015} />
      <HangingDuri
        swing={swing}
        yaw={0.15}
        blink={autoBlink(f, 20)}
        mood={eager ? 1 : 0.6 - sad * 1.4}
        mouthOpen={eager ? 0.6 : 0}
        worry={sad}
        look={[
          ip(f, [170, 190], [-0.1, 0.3]),
          ip(f, [0, 20], [-0.7, -0.7]) * (1 - sad * 0.4),
        ]}
      >
        {tearT > 0 && tearT < 1 ? (
          <mesh
            position={[-0.2, 0.0 - tearT * 0.45, DURI_R * 0.98]}
            scale={[0.045, 0.06, 0.045]}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshPhysicalMaterial
              color="#8fd3ff"
              transmission={0.5}
              roughness={0.05}
            />
          </mesh>
        ) : null}
      </HangingDuri>
      <Manggis
        position={mPos}
        rotation={[0, faceCam(mPos, cam), 0]}
        squash={squashFromHop(mh)}
        blink={autoBlink(f, 40)}
        {...friendFace}
      />
      <Rambutan
        position={rPos}
        rotation={[0, faceCam(rPos, cam), 0]}
        squash={squashFromHop(rh)}
        blink={autoBlink(f, 70)}
        {...friendFace}
      />
    </Stage>
  );
};
