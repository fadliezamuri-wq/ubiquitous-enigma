import { Easing, useCurrentFrame } from "remotion";
import { ip, hop, squashFromHop, autoBlink, type Vec3 } from "../anim";
import { Crown, Durian, Manggis, Rambutan } from "../Characters";
import {
  Caption,
  CameraRig,
  Ground,
  HeroTree,
  Hills,
  Orchard,
  PopWord,
  Stage,
} from "../World";
import { Aroma, Burst, DURI_R, HangingDuri, faceCam } from "../shared";

const DURI: Vec3 = [0.75, DURI_R, -0.5];

export const Pagi: React.FC = () => {
  const f = useCurrentFrame();
  const e = Easing.inOut(Easing.cubic);

  const cam: Vec3 = [
    ip(f, [90, 160], [0.75, 0.6], e),
    ip(f, [90, 160], [1.3, 2.0], e),
    ip(f, [90, 160], [4.2, 7.4], e),
  ];
  const target: Vec3 = [
    0.7,
    ip(f, [90, 160], [0.85, 0.9], e),
    ip(f, [90, 160], [-0.5, 0], e),
  ];

  const glow = ip(f, [45, 85], [0, 0.7]);
  const crownY = ip(
    f,
    [168, 188],
    [4.5, DURI[1] + DURI_R * 1.06 + 0.02],
    Easing.bezier(0.5, 0, 0.75, 1.3),
  );
  const crowned = f >= 188;
  const joy = ip(f, [186, 196], [0, 1]);

  // friends hop in from both sides
  const walkM = ip(f, [90, 150], [0, 1], Easing.out(Easing.quad));
  const walkR = ip(f, [100, 158], [0, 1], Easing.out(Easing.quad));
  const mh = walkM < 1 || crowned ? hop(f, 16) : 0;
  const rh = walkR < 1 || crowned ? hop(f, 14, 5) : 0;
  const mPos: Vec3 = [-5 + walkM * 4.2, 0.45 + mh * 0.45, 0.9 - walkM * 0.2];
  const rPos: Vec3 = [6.5 - walkR * 4.4, 0.4 + rh * 0.5, 0.9 - walkR * 0.2];
  const bliss = {
    blink: crowned ? autoBlink(f, 3) : 0.85,
    mood: 1,
    mouthOpen: crowned ? 0.6 : 0.2,
  };

  return (
    <Stage
      time="morning"
      overlay={
        <>
          <Caption
            text="Pagi itu, Duri dah masak ranum... bau harumnya tersebar ke seluruh dusun!"
            from={42}
            to={118}
          />
          <Caption
            text="Kawan-kawan datang. Rupa-rupanya Duri tak menakutkan, dia istimewa!"
            from={122}
            to={186}
          />
          <PopWord
            text="RAJA BUAH!"
            at={190}
            x="50%"
            y="22%"
            color="#ffd43b"
            size={120}
          />
          <Caption text="Duri, Raja Segala Buah!" from={198} to={240} />
        </>
      }
    >
      <CameraRig position={cam} target={target} fov={40} />
      <Ground time="morning" />
      <Hills />
      <Orchard skipNear />
      <HeroTree />
      <HangingDuri withDuri={false} />
      <Durian
        position={DURI}
        rotation={[0, faceCam(DURI, cam) * 0.7, 0]}
        glow={glow}
        squash={
          crowned
            ? 1 - 0.12 * Math.sin((f - 188) * 0.5) * Math.exp(-(f - 188) * 0.1)
            : 1
        }
        blink={f < 35 ? ip(f, [8, 32], [1, 0]) : autoBlink(f, 50)}
        mouthOpen={
          f < 32
            ? ip(f, [10, 18], [0, 0.8]) * ip(f, [24, 32], [1, 0])
            : joy * 0.75
        }
        mood={0.4 + joy * 0.6}
        look={[
          f < 75 ? ip(f, [38, 52], [-0.7, 0]) + ip(f, [56, 70], [0, 0.7]) : 0,
          0.1,
        ]}
        eyeScale={1 + joy * 0.1}
      />
      <Aroma frame={f} origin={[DURI[0], 0.3, DURI[2]]} strength={glow / 0.7} />
      <Crown
        position={[DURI[0], crownY, DURI[2]]}
        rotationY={f * 0.01}
        scale={0.95}
      />
      <Burst frame={f} at={188} origin={[DURI[0], crownY + 0.2, DURI[2]]} />
      <Manggis
        position={mPos}
        rotation={[0, ip(f, [140, 160], [1.2, faceCam(mPos, cam)]), 0]}
        squash={squashFromHop(mh)}
        {...bliss}
      />
      <Rambutan
        position={rPos}
        rotation={[0, ip(f, [148, 168], [-1.2, faceCam(rPos, cam)]), 0]}
        squash={squashFromHop(rh)}
        {...bliss}
      />
    </Stage>
  );
};
