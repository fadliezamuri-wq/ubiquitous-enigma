import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Shape } from "three";
import { CameraRig, fontFamily } from "../siri/shared";
import { DIALOG, DURATION, FPS, keadaan, TEKS_MORAL, type Dialog } from "./cerita";
import { Durian } from "./Durian";
import { Rumah } from "./Rumah";

const WARNA: Record<Dialog["who"], string> = {
  Narator: "#fde68a",
  Duri: "#a3e635",
  Mak: "#f9a8d4",
  Bapa: "#93c5fd",
};

const useHeartShape = () =>
  useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0.25);
    s.bezierCurveTo(0, 0.5, -0.45, 0.55, -0.45, 0.2);
    s.bezierCurveTo(-0.45, -0.05, -0.15, -0.25, 0, -0.45);
    s.bezierCurveTo(0.15, -0.25, 0.45, -0.05, 0.45, 0.2);
    s.bezierCurveTo(0.45, 0.55, 0, 0.5, 0, 0.25);
    return s;
  }, []);

const Hearts: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => {
  const shape = useHeartShape();
  const hearts = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        x: (random(`hx${i}`) - 0.5) * 4.5,
        z: random(`hz${i}`) * 1.5 - 0.5,
        speed: 0.008 + random(`hs${i}`) * 0.008,
        phase: random(`hp${i}`),
        size: 0.18 + random(`hz2${i}`) * 0.2,
        color: ["#f43f5e", "#fb7185", "#f472b6"][i % 3],
      })),
    [],
  );
  if (amount <= 0) return null;
  return (
    <group>
      {hearts.map((h, i) => {
        const t = (frame * h.speed + h.phase) % 1;
        return (
          <mesh
            key={i}
            position={[h.x + Math.sin(t * 8 + i) * 0.2, 1.5 + t * 3.2, h.z]}
            rotation={[0, Math.sin(frame * 0.05 + i) * 0.5, 0]}
            scale={h.size * amount * Math.sin(t * Math.PI)}
          >
            <extrudeGeometry args={[shape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }]} />
            <meshStandardMaterial color={h.color} emissive={h.color} emissiveIntensity={0.35} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

const SweepSparkles: React.FC<{ frame: number; x: number; amount: number }> = ({ frame, x, amount }) => {
  if (amount <= 0) return null;
  return (
    <group position={[x, 0.15, 1.3]}>
      {new Array(10).fill(0).map((_, i) => {
        const t = (frame * 0.04 + i / 10) % 1;
        return (
          <mesh key={i} position={[Math.sin(i * 2.3) * 0.5 + t * 0.4, t * 0.8, Math.cos(i * 1.7) * 0.3]} scale={0.04 * (1 - t) * amount}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#fff7c2" toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const Babak3D: React.FC = () => {
  const frame = useCurrentFrame();
  const s = keadaan(frame);
  return (
    <>
      <CameraRig position={s.cam.pos} lookAt={s.cam.look} />
      <Rumah frame={frame} sun={s.sun} />
      <Durian kind="mak" pose={s.mak} />
      <Durian kind="bapa" pose={s.bapa} />
      <Durian kind="duri" pose={s.duri} />
      <Hearts frame={frame} amount={s.hearts} />
      <SweepSparkles frame={frame} x={s.duri.x} amount={s.dustSweep} />
    </>
  );
};

const Gelembung: React.FC<{ d: Dialog }> = ({ d }) => {
  const frame = useCurrentFrame();
  const len = d.to - d.from;
  const narator = d.who === "Narator";
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: narator ? 230 : 250, paddingLeft: 60, paddingRight: 60 }}>
      <Interactive.Div
        name={`Dialog ${d.who}`}
        style={{
          position: "relative",
          maxWidth: 940,
          padding: narator ? "30px 44px" : "34px 46px 38px",
          borderRadius: narator ? 28 : 48,
          background: narator ? "rgba(41, 24, 8, 0.72)" : "rgba(255, 255, 255, 0.96)",
          color: narator ? "#fff8e7" : "#2b1a07",
          border: `6px solid ${WARNA[d.who]}`,
          boxShadow: "0 18px 50px rgba(60, 30, 0, 0.35)",
          fontFamily,
          fontSize: narator ? 50 : 58,
          fontWeight: narator ? 400 : 800,
          fontStyle: narator ? "italic" : "normal",
          lineHeight: 1.22,
          textAlign: "center",
          opacity: interpolate(frame, [0, 6, len - 6, len], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 10], [0.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -34,
            left: "50%",
            translate: "-50% 0",
            padding: "6px 26px",
            borderRadius: 999,
            background: WARNA[d.who],
            color: "#2b1a07",
            fontSize: 34,
            fontWeight: 800,
            fontStyle: "normal",
            whiteSpace: "nowrap",
          }}
        >
          {d.luarSkrin ? `${d.who} (dari dapur)` : d.who}
        </div>
        {d.text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const TajukEpisod: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, fontFamily }}>
      <Interactive.Div
        name="Tajuk episod"
        style={{
          textAlign: "center",
          color: "white",
          textShadow: "0 6px 30px rgba(120, 60, 0, 0.7)",
          opacity: interpolate(frame, [0, 10, 55, 68], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 14], ["0px -40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
          }),
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 800, color: "#bef264", lineHeight: 1 }}>Duri Durian</div>
        <div style={{ fontSize: 46, fontWeight: 400, marginTop: 14 }}>Episod 3 · Anak yang Baik</div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const TeksMoral: React.FC = () => {
  const frame = useCurrentFrame();
  const len = TEKS_MORAL.to - TEKS_MORAL.from;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 70, fontFamily }}>
      <Interactive.Div
        name="Teks moral"
        style={{
          textAlign: "center",
          fontSize: 118,
          fontWeight: 800,
          lineHeight: 1.08,
          color: "#ffffff",
          WebkitTextStroke: "4px #b45309",
          paintOrder: "stroke fill",
          textShadow: "0 10px 40px rgba(244, 63, 94, 0.6)",
          opacity: interpolate(frame, [0, 10, len - 10, len], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 18], [0.5, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 9 }),
            output: "perceptual-scale",
          }),
        }}
      >
        SAYANGI, HORMATI
        <br />
        DAN TAATI
        <br />
        IBU BAPA ❤️
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const KESAN: { from: number; src: string; volume: number }[] = [
  { from: 20, src: "duri/boing.wav", volume: 0.35 },
  { from: 334, src: "duri/chime.wav", volume: 0.45 },
  ...[400, 430, 460, 490].map((from) => ({ from, src: "duri/sapu.wav", volume: 0.35 })),
  { from: 590, src: "duri/boing.wav", volume: 0.4 },
  { from: 605, src: "duri/boing.wav", volume: 0.35 },
  { from: 912, src: "duri/chime.wav", volume: 0.5 },
  { from: 960, src: "duri/chime.wav", volume: 0.35 },
  { from: TEKS_MORAL.from, src: "duri/chime.wav", volume: 0.6 },
  ...DIALOG.filter((d) => d.who !== "Narator").map((d) => ({ from: d.from, src: "duri/pop.wav", volume: 0.3 })),
];

export const Episod3: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill name="Episod 3" style={{ backgroundColor: "#fdecc8" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, position: [0, 2.4, 9] }}>
        <Babak3D />
      </ThreeCanvas>

      {/* Kehangatan cahaya pagi dan vignet supaya teks mudah dibaca */}
      <AbsoluteFill
        name="Cahaya pagi"
        style={{
          background:
            "radial-gradient(ellipse at 70% 15%, rgba(255, 214, 140, 0.35) 0%, rgba(255, 214, 140, 0) 55%), linear-gradient(180deg, rgba(40, 20, 0, 0.35) 0%, rgba(40, 20, 0, 0) 30%, rgba(40, 20, 0, 0) 80%, rgba(40, 20, 0, 0.3) 100%)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        name="Redup moral"
        style={{
          backgroundColor: "#fff4dc",
          opacity: interpolate(frame, [TEKS_MORAL.from - 10, TEKS_MORAL.from + 10, TEKS_MORAL.to - 10, TEKS_MORAL.to], [0, 0.45, 0.45, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <Sequence name="Tajuk" durationInFrames={70}>
        <TajukEpisod />
      </Sequence>
      {DIALOG.map((d) => (
        <Sequence key={`${d.from}-${d.who}`} name={`${d.who}: ${d.text.slice(0, 24)}`} from={d.from} durationInFrames={d.to - d.from}>
          <Gelembung d={d} />
          {d.suara ? <Audio src={staticFile(`duri/suara/${d.suara}`)} /> : null}
        </Sequence>
      ))}
      <Sequence name="Teks moral" from={TEKS_MORAL.from} durationInFrames={TEKS_MORAL.to - TEKS_MORAL.from}>
        <TeksMoral />
      </Sequence>

      <Audio
        src={staticFile("duri/muzik.mp3")}
        volume={(f) =>
          interpolate(f, [0, 15, DURATION - 40, DURATION], [0, 0.55, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {KESAN.map((s, i) => (
        <Sequence key={i} name={`Kesan ${s.src}`} from={s.from} durationInFrames={2 * FPS}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

      <AbsoluteFill
        name="Fade"
        style={{
          backgroundColor: "#1c0f02",
          opacity: interpolate(frame, [0, 12, DURATION - 15, DURATION], [1, 0, 0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const DuriDurianCompositions: React.FC = () => (
  <Composition
    id="DuriDurian-Episod3"
    component={Episod3}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

