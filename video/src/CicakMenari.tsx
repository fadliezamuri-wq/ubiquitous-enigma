import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Arm,
  base,
  blinkAt,
  CharDefs,
  clamp,
  Durian,
  Face,
  lerp,
  Pisang,
  Pose,
  poseA,
  poseB,
  poseC,
  poseD,
  poseE,
  rand,
  Rambutan,
  smooth,
} from "./BuahMenari";
import song from "./lagu-cicak.json";

/*
 * Cicak Comel Menari: cicak turun dari dinding & menari bersama
 * Durian, Pisang dan Rambutan. Lirik karaoke ikut lagu-cicak.json.
 */

const FPS = 30;
const BAR = 60; // 120 BPM, 4 ketukan
const EIGHTH = BAR / 8;
const DURATION = song.bars * BAR + 30;
const P = Math.PI;
const ci = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const JUMP_START = 8 * BAR; // "Cicak pun turun..."
const JUMP_END = JUMP_START + 40;
const CHASE = [10 * BAR, 14 * BAR];

export const CicakMenariComposition = () => (
  <Composition
    id="CicakMenari"
    component={CicakMenari}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

/* ------------------------------------------------------------ pose */

type Sec = [number, (f: number) => Pose];

const poseCrawl = (f: number): Pose => {
  const s = Math.sin((P * f) / 10);
  return {
    ...base,
    armL: 120 + 30 * s,
    armR: 120 - 30 * s,
    legL: 12 * Math.max(0, s),
    legR: 12 * Math.max(0, -s),
    head: 8 * Math.sin(f / 14),
    mouth: 0.3,
  };
};

const poseWallIdle = (f: number): Pose => ({
  ...poseCrawl(0),
  armL: 135,
  armR: 135,
  head: 12 * Math.sin((P * f) / 15),
  bounce: 4 * Math.abs(Math.sin((P * f) / 15)),
  mouth: 0.6,
});

const poseJump = (f: number): Pose => ({
  ...base,
  armL: 160,
  armR: 160,
  legL: 20,
  legR: 20,
  mouth: 1,
  happy: f > 10 ? 1 : 0,
});

const poseChase = (f: number): Pose => {
  const p = f / 7.5;
  const s = Math.sin(P * p);
  return {
    ...base,
    bounce: 12 * Math.abs(s),
    tilt: 6 * s,
    armL: 110 + 30 * s,
    armR: 110 - 30 * s,
    legL: 26 * Math.max(0, s),
    legR: 26 * Math.max(0, -s),
    mouth: 0.9,
    happy: (f % 120) > 90 ? 1 : 0,
  };
};

const fruitSecs: Sec[] = [
  [0, poseA],
  [6 * BAR, poseC],
  [8 * BAR, poseB],
  [10 * BAR, poseD],
  [12 * BAR, poseA],
  [14 * BAR, poseC],
  [16 * BAR, poseB],
  [18 * BAR, poseE],
];

const cicakSecs: Sec[] = [
  [0, poseCrawl],
  [2 * BAR, poseWallIdle],
  [5 * BAR, poseCrawl],
  [6 * BAR, poseWallIdle],
  [JUMP_START, poseJump],
  [JUMP_END, poseB],
  [CHASE[0], poseChase],
  [CHASE[1], poseC],
  [16 * BAR, poseB],
  [18 * BAR, poseE],
];

const poseAt = (secs: Sec[], f: number, mirror = false): Pose => {
  let i = 0;
  for (let k = 0; k < secs.length; k++) if (f >= secs[k][0]) i = k;
  const [start, fn] = secs[i];
  let pose = fn(f - start);
  const w = clamp((f - start) / 8);
  if (i > 0 && w < 1) {
    const prev = secs[i - 1][1](f - secs[i - 1][0]);
    const t = smooth(w);
    const o = {} as Pose;
    (Object.keys(pose) as (keyof Pose)[]).forEach((k) => {
      o[k] = lerp(prev[k], pose[k], t);
    });
    pose = o;
  }
  if (mirror) {
    pose = {
      ...pose,
      tilt: -pose.tilt,
      sx: -pose.sx,
      head: -pose.head,
      armL: pose.armR,
      armR: pose.armL,
      legL: pose.legR,
      legR: pose.legL,
    };
  }
  return pose;
};

/* ----------------------------------------------------------- Cicak */

const CK = "#a9dc8c";
const CKD = "#4f8a3c";

const Foot: React.FC<{ x: number; lift: number; side: 1 | -1 }> = ({ x, lift, side }) => (
  <g transform={`translate(${x},${-56 - lift}) rotate(${-side * lift * 0.6})`}>
    <rect x={-17} y={0} width={34} height={50} rx={16} fill={CK} stroke={CKD} strokeWidth={3} />
    {[-1, 0, 1].map((k) => (
      <g key={k} transform={`translate(${side * 4 + k * 17},${54}) rotate(${k * 25})`}>
        <rect x={-5} y={-12} width={10} height={16} rx={5} fill={CK} stroke={CKD} strokeWidth={2.5} />
        <circle cx={0} cy={4} r={8} fill="#c8eeae" stroke={CKD} strokeWidth={2.5} />
      </g>
    ))}
  </g>
);

const Cicak: React.FC<{ pose: Pose; f: number }> = ({ pose, f }) => {
  const wag = 18 * Math.sin(f / 5) + pose.tilt;
  const spots = [
    [-30, -150, 7],
    [25, -110, 6],
    [-18, -90, 5],
    [34, -165, 5],
  ];
  return (
    <g transform={`translate(${pose.sx},${-pose.bounce})`}>
      {/* ekor melingkar, bergoyang */}
      <g transform={`translate(10,-80) rotate(${wag})`}>
        <path
          d="M -10 0 C 60 30, 140 20, 170 -40 C 195 -95, 150 -130, 120 -105 C 100 -88, 118 -62, 138 -72"
          stroke={CKD}
          strokeWidth={40}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M -10 0 C 60 30, 140 20, 170 -40 C 195 -95, 150 -130, 120 -105 C 100 -88, 118 -62, 138 -72"
          stroke={CK}
          strokeWidth={34}
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 40 18 L 50 6 M 90 18 L 98 4 M 140 -6 L 152 -14" stroke={CKD} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      </g>
      <Foot x={-28} lift={pose.legL} side={-1} />
      <Foot x={28} lift={pose.legR} side={1} />
      <g transform={`translate(0,-50) scale(${2 - pose.squash},${pose.squash}) rotate(${pose.tilt}) translate(0,50)`}>
        <Arm x={-50} y={-160} angle={pose.armL} side={1} len={86} fill={CK} stroke={CKD} />
        <Arm x={50} y={-160} angle={pose.armR} side={-1} len={86} fill={CK} stroke={CKD} wave={pose.wave} />
        <ellipse cx={0} cy={-125} rx={60} ry={80} fill="url(#ckBody)" stroke={CKD} strokeWidth={3} />
        <ellipse cx={0} cy={-112} rx={36} ry={52} fill="#f3f8d8" />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M -24 ${-140 + k * 18} Q 0 ${-134 + k * 18} 24 ${-140 + k * 18}`} stroke="#d8e4b0" strokeWidth={3} fill="none" />
        ))}
        {spots.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#7fb866" opacity={0.7} />
        ))}
        {/* kepala */}
        <g transform={`translate(0,-268) rotate(${pose.head})`}>
          {/* mata menonjol */}
          <circle cx={-52} cy={-52} r={34} fill="url(#ckHead)" stroke={CKD} strokeWidth={3} />
          <circle cx={52} cy={-52} r={34} fill="url(#ckHead)" stroke={CKD} strokeWidth={3} />
          <ellipse cx={0} cy={0} rx={104} ry={78} fill="url(#ckHead)" stroke={CKD} strokeWidth={3} />
          <circle cx={-60} cy={-28} r={6} fill="#7fb866" opacity={0.7} />
          <circle cx={70} cy={-14} r={5} fill="#7fb866" opacity={0.7} />
          <circle cx={-6} cy={-58} r={5} fill="#7fb866" opacity={0.7} />
          <ellipse cx={-40} cy={-48} rx={28} ry={12} fill="white" opacity={0.35} transform="rotate(-20 -40 -48)" />
          <circle cx={-10} cy={22} r={3} fill={CKD} />
          <circle cx={10} cy={22} r={3} fill={CKD} />
          <Face y={-14} s={1.15} blink={blinkAt(f, 17)} happy={pose.happy} mouth={pose.mouth} />
        </g>
      </g>
    </g>
  );
};

const Nyamuk: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={-6} cy={-14} rx={16} ry={7} fill="#e6f2ff" opacity={0.7} transform={`rotate(${-30 + 30 * Math.sin(f * 2.4)} -6 -14)`} />
    <ellipse cx={6} cy={-14} rx={16} ry={7} fill="#e6f2ff" opacity={0.7} transform={`rotate(${30 - 30 * Math.sin(f * 2.4)} 6 -14)`} />
    <ellipse cx={0} cy={0} rx={14} ry={8} fill="#4a4a5a" />
    <circle cx={-14} cy={-2} r={7} fill="#4a4a5a" />
    <circle cx={-16} cy={-4} r={2.5} fill="white" />
    <line x1={-20} y1={0} x2={-34} y2={6} stroke="#4a4a5a" strokeWidth={2} />
    {[-6, 0, 6].map((k) => (
      <line key={k} x1={k} y1={6} x2={k - 6} y2={20} stroke="#4a4a5a" strokeWidth={1.5} />
    ))}
  </g>
);

/* ------------------------------------------------------------ latar */

const WALL_BOTTOM = 1230;

const Rumah: React.FC<{ f: number; shift: number }> = ({ f, shift }) => {
  const flick = 0.92 + 0.08 * Math.sin(f / 4) * Math.sin(f / 7.3);
  return (
    <g transform={`translate(${shift},0)`}>
      <rect x={-400} y={-200} width={1880} height={WALL_BOTTOM + 200} fill="url(#wall)" />
      {Array.from({ length: 17 }, (_, i) => (
        <g key={i}>
          <rect x={-400 + i * 112} y={-200} width={6} height={WALL_BOTTOM + 200} fill="#6e4524" opacity={0.55} />
          <circle cx={-370 + i * 112} cy={180} r={4} fill="#5a361a" opacity={0.6} />
          <circle cx={-370 + i * 112} cy={980} r={4} fill="#5a361a" opacity={0.6} />
        </g>
      ))}
      {/* tingkap */}
      <g transform="translate(70,230)">
        <rect x={-14} y={-14} width={358} height={478} rx={8} fill="#5a361a" />
        <rect x={0} y={0} width={330} height={450} fill="url(#nightWin)" />
        <circle cx={230} cy={110} r={48} fill="#fff6d0" />
        <circle cx={250} cy={96} r={44} fill="#26306a" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={rand(i + 500) * 320} cy={rand(i + 600) * 300} r={2} fill="white" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 15 + i))} />
        ))}
        <path d="M 0 450 Q 60 360 100 400 Q 150 330 200 390 Q 260 340 330 420 L 330 450 Z" fill="#14231c" />
        <rect x={160} y={0} width={10} height={450} fill="#5a361a" />
        <rect x={0} y={220} width={330} height={10} fill="#5a361a" />
        <path d="M -30 -20 Q 40 200 10 470 L -30 470 Z" fill="#d8546a" />
        <path d="M 360 -20 Q 290 200 320 470 L 360 470 Z" fill="#d8546a" />
        <rect x={-40} y={-30} width={410} height={22} rx={10} fill="#8a5a2a" />
      </g>
      {/* lampu dinding */}
      <circle cx={790} cy={330} r={430 * flick} fill="url(#lampGlow)" />
      <g transform="translate(790,330)">
        <rect x={-10} y={-120} width={20} height={70} fill="#3a2a1a" />
        <path d="M -60 -50 L 60 -50 L 38 20 L -38 20 Z" fill="#2e3a40" />
        <circle cx={0} cy={36} r={30} fill="#fff4c0" />
        <circle cx={0} cy={36} r={18} fill="white" />
      </g>
      {/* kelkatu sekeliling lampu */}
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={790 + 90 * Math.cos(f / 9 + i * 1.3) + 20 * Math.sin(f / 3 + i)}
          cy={360 + 60 * Math.sin(f / 7 + i * 2)}
          r={3}
          fill="#fffbe0"
          opacity={0.8}
        />
      ))}
      {/* jam dinding */}
      <g transform="translate(560,170)">
        <circle r={58} fill="#8a5a2a" />
        <circle r={48} fill="#fff8e8" />
        <line x1={0} y1={0} x2={0} y2={-34} stroke="#3a2a1a" strokeWidth={5} strokeLinecap="round" transform={`rotate(${f * 6})`} />
        <line x1={0} y1={0} x2={22} y2={0} stroke="#3a2a1a" strokeWidth={6} strokeLinecap="round" />
        <circle r={5} fill="#c0392b" />
      </g>
      {/* kayu bawah dinding */}
      <rect x={-400} y={WALL_BOTTOM - 40} width={1880} height={40} fill="#5a361a" />
      {/* lantai papan */}
      <rect x={-400} y={WALL_BOTTOM} width={1880} height={900} fill="url(#floor)" />
      {Array.from({ length: 22 }, (_, i) => {
        const x0 = -600 + i * 110;
        const x1 = 540 + (x0 - 540) * 2.6;
        return <line key={i} x1={x0} y1={WALL_BOTTOM} x2={x1} y2={2100} stroke="#4a2c14" strokeWidth={3} opacity={0.5} />;
      })}
      {/* tikar mengkuang */}
      <g>
        <path d={`M 120 ${WALL_BOTTOM + 170} L 960 ${WALL_BOTTOM + 170} L 1180 1900 L -100 1900 Z`} fill="url(#tikar)" />
        {Array.from({ length: 14 }, (_, i) => (
          <line
            key={i}
            x1={120 + i * 64.6}
            y1={WALL_BOTTOM + 170}
            x2={-100 + i * 98.5}
            y2={1900}
            stroke="#b8862e"
            strokeWidth={4}
            opacity={0.5}
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = WALL_BOTTOM + 170 + Math.pow(i / 6, 1.3) * 500;
          return <line key={i} x1={-200} y1={y} x2={1300} y2={y} stroke="#c0392b" strokeWidth={6 + i * 2} opacity={0.35} />;
        })}
      </g>
    </g>
  );
};

/* --------------------------------------------------------- karaoke */

type Line = (typeof song.lines)[number];

const lineStart = (l: Line) => l.bar * BAR;

const Karaoke: React.FC<{ f: number }> = ({ f }) => {
  const lines = song.lines;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) if (f >= lineStart(lines[i]) - 6) idx = i;
  if (idx < 0) return null;
  const cur = lines[idx];
  const curEnd = lineStart(cur) + BAR;
  const next = lines[idx + 1] && lineStart(lines[idx + 1]) === curEnd ? lines[idx + 1] : null;
  if (f > curEnd + 20 && !next) return null;
  const op = next ? 1 : interpolate(f, [curEnd, curEnd + 20], [1, 0], ci);
  const isChorus = cur.part === "chorus";

  let pos = lineStart(cur);
  const spans = cur.syl.map(([text, , len], i) => {
    const st = pos;
    pos += (len as number) * EIGHTH;
    const sung = f >= st;
    const active = f >= st && f < pos;
    const pop = active ? 1 + 0.18 * Math.exp(-(f - st) / 3) : 1;
    return (
      <span
        key={i}
        style={{
          color: sung ? (isChorus ? "#ffe066" : "#ffb0c8") : "white",
          display: "inline-block",
          transform: `scale(${pop}) translateY(${active ? -6 : 0}px)`,
          whiteSpace: "pre",
          textShadow: sung ? "0 0 18px rgba(255,220,120,0.6)" : "none",
        }}
      >
        {text as string}
      </span>
    );
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: 70,
        padding: "26px 20px 22px",
        borderRadius: 40,
        background: "rgba(30,18,40,0.62)",
        textAlign: "center",
        fontFamily: "Inter",
        opacity: op,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: isChorus ? "#ffe066" : "#ffb0c8", marginBottom: 6 }}>
        {isChorus ? "KORUS" : "LAGU"}
      </div>
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap" }}>{spans}</div>
      <div style={{ fontSize: 38, fontWeight: 400, color: "rgba(255,255,255,0.55)", marginTop: 12, minHeight: 46 }}>
        {next ? next.syl.map((s) => s[0]).join("") : ""}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ babak */

const FRUITS = [
  { name: "Durian", C: Durian, ang: -56, delay: 0, mirror: false, seed: 0 },
  { name: "Pisang", C: Pisang, ang: 0, delay: 2, mirror: true, seed: 30 },
  { name: "Rambutan", C: Rambutan, ang: 56, delay: 4, mirror: false, seed: 55 },
];

const camera = (f: number) => {
  if (f < 6 * BAR) {
    // fokus pada cicak di dinding, kemudian zum keluar
    const t = smooth(clamp((f - 4 * BAR) / (2 * BAR)));
    return { s: lerp(1.35, 1.0, t), fx: lerp(560, 540, t), fy: lerp(700, 1250, t), orbit: 0 };
  }
  if (f < 14 * BAR) return { s: interpolate(f, [6 * BAR, 14 * BAR], [1.0, 1.1]), fx: 540, fy: 1250, orbit: 0 };
  if (f < 18 * BAR) return { s: 1.02, fx: 540, fy: 1300, orbit: 32 * Math.sin((2 * P * (f - 14 * BAR)) / (4 * BAR)) };
  return { s: interpolate(f, [18 * BAR, 20 * BAR], [1.12, 1.2]), fx: 540, fy: 1200, orbit: 0 };
};

const cicakPlace = (f: number) => {
  // di dinding: merayap ke arah lampu
  const wallX = interpolate(f, [0, 2 * BAR, 5 * BAR, 6 * BAR], [300, 470, 470, 600], ci);
  const wallY = 760 + 14 * Math.sin(f / 20);
  const floorY = 1720;
  if (f < JUMP_START) return { x: wallX, y: wallY, s: 0.62, rot: 0, onWall: true };
  if (f < JUMP_END) {
    const t = (f - JUMP_START) / (JUMP_END - JUMP_START);
    const e = smooth(t);
    return {
      x: lerp(600, 540, e),
      y: lerp(wallY, floorY, t * t) - 260 * Math.sin(P * t),
      s: lerp(0.62, 1.25, e),
      rot: 360 * e,
      onWall: t < 0.5,
    };
  }
  if (f >= CHASE[0] && f < CHASE[1]) {
    const t = (f - CHASE[0]) / (CHASE[1] - CHASE[0]);
    return { x: 540 + 230 * Math.sin(2 * P * t * 2), y: floorY, s: 1.25, rot: 0, onWall: false };
  }
  return { x: 540, y: floorY, s: 1.25, rot: 0, onWall: false };
};

export const CicakMenari: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  const groundY = 1520;
  const R = 410;

  const fruits = FRUITS.map((c) => {
    const ang = ((c.ang + cam.orbit) * P) / 180;
    const depth = Math.cos(ang);
    return {
      ...c,
      x: 540 + R * Math.sin(ang),
      y: groundY - 80 * (1 - depth),
      sc: 1.25 * (0.84 + 0.16 * depth),
      depth,
      lf: Math.max(0, frame - c.delay),
    };
  }).sort((a, b) => a.depth - b.depth);

  const ck = cicakPlace(frame);
  const ckPose = poseAt(cicakSecs, frame);

  // nyamuk: muncul di babak "Nyamuk datang", dikejar cicak
  let nyamuk: { x: number; y: number } | null = null;
  if (frame >= CHASE[0] + BAR && frame < CHASE[1] + 30) {
    const t = (frame - CHASE[0]) / (CHASE[1] - CHASE[0]);
    const lead = 2 * P * (t * 2) + 0.9;
    nyamuk = {
      x: 540 + 300 * Math.sin(lead) + 20 * Math.sin(frame / 2),
      y: 1250 + 60 * Math.sin(frame / 6) - interpolate(frame, [CHASE[1], CHASE[1] + 30], [0, 900], ci),
    };
  }

  const world = `translate(${cam.fx},${cam.fy}) scale(${cam.s}) translate(${-cam.fx},${-cam.fy})`;
  const shift = -cam.orbit * 7;

  const cicakNode = (
    <g key="cicak" transform={`translate(${ck.x},${ck.y}) rotate(${ck.rot},0,-150) scale(${ck.s})`}>
      {!ck.onWall && <ellipse cx={0} cy={4} rx={90} ry={18} fill="url(#shadow)" />}
      <Cicak pose={ckPose} f={frame} />
    </g>
  );

  const titleOp = interpolate(frame, [6, 18, 100, 118], [0, 1, 1, 0], ci);
  const endOp = interpolate(frame, [18 * BAR + 10, 18 * BAR + 20], [0, 1], ci);
  const flash =
    (frame >= JUMP_END ? interpolate(frame, [JUMP_END, JUMP_END + 7], [0.45, 0], ci) : 0) +
    (frame >= 14 * BAR ? interpolate(frame, [14 * BAR, 14 * BAR + 7], [0.35, 0], ci) : 0);

  return (
    <AbsoluteFill style={{ backgroundColor: "#2a1a10" }}>
      <Audio src={staticFile("lagu-cicak.wav")} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <CharDefs />
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a4a26" />
            <stop offset="0.5" stopColor="#b07a44" />
            <stop offset="1" stopColor="#8a5a30" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6a4022" />
            <stop offset="1" stopColor="#9a6a3c" />
          </linearGradient>
          <linearGradient id="tikar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9b35e" />
            <stop offset="1" stopColor="#f0d48a" />
          </linearGradient>
          <linearGradient id="nightWin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2258" />
            <stop offset="1" stopColor="#4a3a8a" />
          </linearGradient>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="#ffe9a8" stopOpacity={0.75} />
            <stop offset="0.4" stopColor="#ffc870" stopOpacity={0.25} />
            <stop offset="1" stopColor="#ffb050" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ckBody" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#d6f5bf" />
            <stop offset="1" stopColor="#86c56a" />
          </radialGradient>
          <radialGradient id="ckHead" cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#e2fbcf" />
            <stop offset="1" stopColor="#8fcc72" />
          </radialGradient>
        </defs>

        <g transform={world}>
          <Rumah f={frame} shift={shift} />
          {ck.onWall && cicakNode}
          {fruits.map((c) => {
            const pose = poseAt(fruitSecs, c.lf, c.mirror);
            return (
              <g key={c.name}>
                <ellipse cx={c.x + pose.sx * c.sc} cy={c.y + 4} rx={(95 - pose.bounce * 0.4) * c.sc} ry={20 * c.sc} fill="url(#shadow)" />
                <g transform={`translate(${c.x},${c.y}) scale(${c.sc})`}>
                  <c.C pose={pose} f={c.lf} seed={c.seed} />
                </g>
              </g>
            );
          })}
          {!ck.onWall && cicakNode}
          {nyamuk && <Nyamuk x={nyamuk.x} y={nyamuk.y} f={frame} s={1.6} />}
        </g>

        {/* hati di hujung */}
        {frame > 18 * BAR &&
          Array.from({ length: 12 }, (_, i) => {
            const t = (frame - 18 * BAR - i * 3) / 50;
            if (t < 0 || t > 1.2) return null;
            return (
              <path
                key={i}
                transform={`translate(${120 + rand(i + 70) * 840 + 20 * Math.sin(frame / 6 + i)},${1300 - t * 800 - rand(i) * 200}) scale(${1 + rand(i + 3)})`}
                d="M 0 12 C -30 -10 -22 -36 0 -22 C 22 -36 30 -10 0 12 Z"
                fill="#ff6f91"
                stroke="white"
                strokeWidth={3}
                opacity={clamp(1.2 - t)}
              />
            );
          })}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vignette)" />
        <rect x={0} y={0} width={1080} height={1920} fill="white" opacity={flash} />
      </svg>

      <Karaoke f={frame} />

      {/* tajuk awal & akhir */}
      {[
        { op: titleOp, y: 230 },
        { op: endOp, y: 230 },
      ].map(
        (t, i) =>
          t.op > 0 && (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 60,
                right: 60,
                top: t.y,
                textAlign: "center",
                fontFamily: "Inter",
                fontWeight: 800,
                opacity: t.op,
                transform: `scale(${0.85 + 0.15 * t.op})`,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "22px 46px",
                  borderRadius: 60,
                  background: "rgba(255,255,255,0.93)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ fontSize: 76, color: "#4f8a3c", lineHeight: 1.05 }}>Cicak Comel Menari</div>
                <div style={{ fontSize: 38, marginTop: 8 }}>
                  <span style={{ color: "#7f9230" }}>Durian</span>
                  <span style={{ color: "#9a8f80" }}> · </span>
                  <span style={{ color: "#d9a821" }}>Pisang</span>
                  <span style={{ color: "#9a8f80" }}> · </span>
                  <span style={{ color: "#d8302a" }}>Rambutan</span>
                </div>
              </div>
            </div>
          ),
      )}
    </AbsoluteFill>
  );
};
