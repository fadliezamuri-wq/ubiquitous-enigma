import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/*
 * Buah Menari: Durian, Rambutan & Pisang menari comel di dusun waktu senja.
 * 1080x1920 (menegak), 30fps, 16 saat, 120 BPM (1 ketukan = 15 frame).
 */

const FPS = 30;
const DURATION = 480;
const BEAT = 15;
const P = Math.PI;

export const BuahMenariComposition = () => (
  <Composition
    id="BuahMenari"
    component={BuahMenari}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);

/* ---------------------------------------------------------------- utils */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ci = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ----------------------------------------------------------------- pose */

type Pose = {
  bounce: number;
  tilt: number;
  sx: number;
  armL: number;
  armR: number;
  wave: number;
  legL: number;
  legR: number;
  head: number;
  mouth: number;
  happy: number;
  squash: number;
};

const base: Pose = {
  bounce: 0,
  tilt: 0,
  sx: 0,
  armL: 20,
  armR: 20,
  wave: 0,
  legL: 0,
  legR: 0,
  head: 0,
  mouth: 0.2,
  happy: 0,
  squash: 1,
};

// A: goyang kiri-kanan, tangan melambai bergilir
const poseA = (f: number): Pose => {
  const p = f / BEAT;
  const s = Math.sin(P * p);
  return {
    ...base,
    bounce: 16 * Math.abs(s),
    tilt: 8 * s,
    armL: 30 + 115 * Math.max(0, s),
    armR: 30 + 115 * Math.max(0, -s),
    legL: 14 * Math.max(0, -s),
    legR: 14 * Math.max(0, s),
    head: -6 * s,
    mouth: 0.35,
    happy: f < 40 ? 1 : 0,
  };
};

// B: tangan depang + goyang pinggul
const poseB = (f: number): Pose => {
  const p = f / BEAT;
  const s = Math.sin(P * p);
  return {
    ...base,
    bounce: 7 * Math.abs(Math.sin(2 * P * p)),
    tilt: -6 * s,
    sx: 20 * s,
    armL: 92 + 22 * Math.sin(2 * P * p),
    armR: 92 + 22 * Math.sin(2 * P * p + P),
    legL: 20 * Math.max(0, s),
    legR: 20 * Math.max(0, -s),
    head: 9 * s,
    mouth: 0.7,
  };
};

// C: lompat-lompat, tangan ke atas
const poseC = (f: number): Pose => {
  const p = f / BEAT;
  const q = (p % 2) / 2;
  const air = Math.sin(P * q);
  return {
    ...base,
    bounce: 75 * air,
    tilt: 5 * Math.sin(P * p),
    armL: 150 + 22 * Math.sin(2 * P * p),
    armR: 150 + 22 * Math.sin(2 * P * p),
    legL: 22 * air,
    legR: 22 * air,
    head: 4 * Math.sin(P * p),
    mouth: 1,
    happy: air > 0.45 ? 1 : 0,
    squash: 1 - 0.12 * Math.exp(-q * 18) - 0.12 * Math.exp(-(1 - q) * 18),
  };
};

// D: lambai ke kamera
const poseD = (f: number): Pose => {
  const p = f / BEAT;
  const s = Math.sin(P * p);
  return {
    ...base,
    bounce: 9 * Math.abs(s),
    tilt: 6 * Math.sin((P * p) / 2),
    armL: 25 + 8 * s,
    armR: 140 + 28 * Math.sin(2 * P * p),
    wave: 25 * Math.sin(2 * P * p),
    legL: 10 * Math.max(0, s),
    head: -8 * Math.sin((P * p) / 2),
    mouth: 0.55,
  };
};

// E: posing akhir, tangan V ke atas
const poseE = (f: number): Pose => {
  const t = clamp(f / 12);
  return {
    ...base,
    bounce: 10 * Math.exp(-f / 10) * Math.abs(Math.sin(f / 3)),
    armL: 135 + 10 * Math.sin(f / 4),
    armR: 135 - 10 * Math.sin(f / 4),
    head: 6 * t,
    mouth: 1,
    happy: 1,
  };
};

const sections: [number, (f: number) => Pose][] = [
  [0, poseA],
  [120, poseB],
  [240, poseC],
  [360, poseD],
  [444, poseE],
];

const getPose = (f: number, mirror: boolean): Pose => {
  let i = 0;
  for (let k = 0; k < sections.length; k++) if (f >= sections[k][0]) i = k;
  const [start, fn] = sections[i];
  let pose = fn(f - start);
  const w = clamp((f - start) / 8);
  if (i > 0 && w < 1) {
    const prev = sections[i - 1][1](f - sections[i - 1][0]);
    const t = smooth(w);
    const out = {} as Pose;
    (Object.keys(pose) as (keyof Pose)[]).forEach((k) => {
      out[k] = lerp(prev[k], pose[k], t);
    });
    pose = out;
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

const blinkAt = (f: number, seed: number) => {
  const ph = (f + seed) % 78;
  return ph < 7 ? Math.sin((ph / 7) * P) : 0;
};

/* ----------------------------------------------------------------- face */

const Face: React.FC<{
  y: number;
  s?: number;
  blink: number;
  happy: number;
  mouth: number;
  blushOp?: number;
}> = ({ y, s = 1, blink, happy, mouth, blushOp = 0.5 }) => {
  const closed = happy > 0.5 || blink > 0.75;
  const ex = 34;
  return (
    <g transform={`translate(0,${y}) scale(${s})`}>
      {/* pipi merah */}
      <ellipse cx={-56} cy={24} rx={17} ry={10} fill="#ff6f86" opacity={blushOp} />
      <ellipse cx={56} cy={24} rx={17} ry={10} fill="#ff6f86" opacity={blushOp} />
      {/* kening kecil */}
      <path d={`M ${-ex - 12} -34 Q ${-ex} -42 ${-ex + 12} -36`} stroke="#4a2a18" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={`M ${ex - 12} -36 Q ${ex} -42 ${ex + 12} -34`} stroke="#4a2a18" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      {[-ex, ex].map((x) =>
        closed ? (
          <path
            key={x}
            d={`M ${x - 15} 5 Q ${x} -13 ${x + 15} 5`}
            stroke="#2a160c"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <g key={x} transform={`translate(${x},0) scale(1,${Math.max(0.08, 1 - blink)})`}>
            <ellipse cx={0} cy={0} rx={18} ry={22} fill="url(#eyeGrad)" />
            <ellipse cx={0} cy={0} rx={18} ry={22} fill="none" stroke="#1a0c06" strokeWidth={2} />
            <circle cx={-6} cy={-9} r={7} fill="white" />
            <circle cx={6} cy={7} r={3.5} fill="white" opacity={0.9} />
          </g>
        ),
      )}
      {/* mulut */}
      {mouth > 0.5 ? (
        <g>
          <path
            d={`M -15 26 Q 0 ${30 + 22 * mouth} 15 26 Z`}
            fill="#7a2222"
            stroke="#4a1410"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <ellipse cx={0} cy={26 + 13 * mouth} rx={7} ry={4 * mouth} fill="#ff8a9a" />
        </g>
      ) : (
        <path d="M -12 27 Q 0 40 12 27" stroke="#5a2414" strokeWidth={5} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

/* -------------------------------------------------------------- anggota */

const Arm: React.FC<{
  x: number;
  y: number;
  angle: number;
  side: 1 | -1;
  len: number;
  fill: string;
  stroke: string;
  wave?: number;
}> = ({ x, y, angle, side, len, fill, stroke, wave = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${side * angle})`}>
    <rect x={-17} y={-8} width={34} height={len * 0.6} rx={17} fill={fill} stroke={stroke} strokeWidth={3} />
    <g transform={`translate(0,${len * 0.5}) rotate(${side * wave})`}>
      <rect x={-15} y={-6} width={30} height={len * 0.5} rx={15} fill={fill} stroke={stroke} strokeWidth={3} />
      <circle cx={0} cy={len * 0.5} r={19} fill={fill} stroke={stroke} strokeWidth={3} />
      <ellipse cx={-5} cy={len * 0.5 - 6} rx={7} ry={5} fill="white" opacity={0.25} />
    </g>
  </g>
);

const Leg: React.FC<{ x: number; lift: number; side: 1 | -1; fill: string; stroke: string }> = ({
  x,
  lift,
  side,
  fill,
  stroke,
}) => (
  <g transform={`translate(${x},${-62 - lift}) rotate(${-side * lift * 0.6})`}>
    <rect x={-21} y={0} width={42} height={58} rx={20} fill={fill} stroke={stroke} strokeWidth={3} />
    <ellipse cx={side * 7} cy={56} rx={28} ry={15} fill={fill} stroke={stroke} strokeWidth={3} />
  </g>
);

type CharProps = { pose: Pose; f: number; seed: number };

/* Rig umum: kaki tak ikut senget, badan & kepala ikut senget dan lompat */
const Rig: React.FC<{
  pose: Pose;
  legFill: string;
  legStroke: string;
  legGap: number;
  children: React.ReactNode;
}> = ({ pose, legFill, legStroke, legGap, children }) => (
  <g transform={`translate(${pose.sx},${-pose.bounce})`}>
    <Leg x={-legGap} lift={pose.legL} side={-1} fill={legFill} stroke={legStroke} />
    <Leg x={legGap} lift={pose.legR} side={1} fill={legFill} stroke={legStroke} />
    <g transform={`translate(0,-50) scale(${2 - pose.squash},${pose.squash}) rotate(${pose.tilt}) translate(0,50)`}>
      {children}
    </g>
  </g>
);

/* ---------------------------------------------------------------- Durian */

const Durian: React.FC<CharProps> = ({ pose, f, seed }) => {
  const fill = "#a7b84a";
  const stroke = "#5f6d1f";
  const headY = -300;
  const R = 108;
  const spikes = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * 2 * P;
    const w = 0.13;
    const r2 = R + 30;
    return `M ${Math.cos(a - w) * (R - 4)} ${Math.sin(a - w) * (R - 4)} L ${Math.cos(a) * r2} ${
      Math.sin(a) * r2
    } L ${Math.cos(a + w) * (R - 4)} ${Math.sin(a + w) * (R - 4)} Z`;
  }).join(" ");
  const inner: React.ReactNode[] = [];
  for (let gx = -90; gx <= 90; gx += 30) {
    for (let gy = -90; gy <= 90; gy += 28) {
      const x = gx + ((gy / 28) % 2 ? 15 : 0);
      const y = gy;
      if (x * x + y * y > 92 * 92) continue;
      const fx = x / 78;
      const fy = (y - 26) / 66;
      if (fx * fx + fy * fy < 1.15) continue;
      inner.push(
        <path key={`${gx}_${gy}`} d={`M ${x - 9} ${y + 7} L ${x} ${y - 10} L ${x + 9} ${y + 7} Z`} fill="#7f9230" stroke="#5f6d1f" strokeWidth={1.5} />,
      );
    }
  }
  return (
    <Rig pose={pose} legFill={fill} legStroke={stroke} legGap={30}>
      <Arm x={-66} y={-150} angle={pose.armL} side={1} len={100} fill={fill} stroke={stroke} />
      <Arm x={66} y={-150} angle={pose.armR} side={-1} len={100} fill={fill} stroke={stroke} wave={pose.wave} />
      {/* badan */}
      <ellipse cx={0} cy={-128} rx={74} ry={82} fill="url(#durBody)" stroke={stroke} strokeWidth={3} />
      <ellipse cx={0} cy={-115} rx={42} ry={48} fill="#f5e39a" opacity={0.85} />
      {[-50, 50, -58, 58].map((x, i) => (
        <path key={i} d={`M ${x - 8} ${-150 + (i > 1 ? 50 : 0)} L ${x} ${-168 + (i > 1 ? 50 : 0)} L ${x + 8} ${-150 + (i > 1 ? 50 : 0)} Z`} fill="#7f9230" />
      ))}
      {/* kepala */}
      <g transform={`translate(0,${headY}) rotate(${pose.head})`}>
        <path d={spikes} fill="#86992f" stroke={stroke} strokeWidth={3} strokeLinejoin="round" />
        <circle r={R} fill="url(#durHead)" stroke={stroke} strokeWidth={3} />
        {inner}
        <ellipse cx={0} cy={26} rx={78} ry={66} fill="url(#durFlesh)" stroke="#d9b54a" strokeWidth={3} />
        <ellipse cx={-30} cy={-50} rx={34} ry={18} fill="white" opacity={0.28} transform="rotate(-25 -30 -50)" />
        {/* tangkai */}
        <path d="M -6 -128 Q -2 -160 10 -170" stroke="#6b4a1f" strokeWidth={12} strokeLinecap="round" fill="none" />
        <Face y={22} s={0.95} blink={blinkAt(f, seed)} happy={pose.happy} mouth={pose.mouth} />
      </g>
    </Rig>
  );
};

/* -------------------------------------------------------------- Rambutan */

const Rambutan: React.FC<CharProps> = ({ pose, f, seed }) => {
  const fill = "#d8302a";
  const stroke = "#8e1410";
  const headY = -295;
  const R = 100;
  const hairs = Array.from({ length: 46 }, (_, i) => {
    const a = (i / 46) * 2 * P + 0.05;
    const wig = 0.1 * Math.sin(f / 3 + i) + pose.bounce * 0.002;
    const a1 = a + 0.14 + wig;
    const a2 = a + 0.28 + wig;
    const x0 = Math.cos(a) * (R - 6);
    const y0 = Math.sin(a) * (R - 6);
    const xc = Math.cos(a1) * (R + 22);
    const yc = Math.sin(a1) * (R + 22);
    const x1 = Math.cos(a2) * (R + 34);
    const y1 = Math.sin(a2) * (R + 34);
    const xm = Math.cos(a1 + 0.05) * (R + 26);
    const ym = Math.sin(a1 + 0.05) * (R + 26);
    return (
      <g key={i}>
        <path d={`M ${x0} ${y0} Q ${xc} ${yc} ${x1} ${y1}`} stroke="#c8261f" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d={`M ${xm} ${ym} L ${x1} ${y1}`} stroke="#b9cc4a" strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  });
  const bodyHairs = [-1, 1].flatMap((side) =>
    [0, 1, 2, 3].map((k) => {
      const y = -170 + k * 32;
      const x = side * (66 - Math.abs(k - 1.5) * 4);
      return (
        <path
          key={`${side}_${k}`}
          d={`M ${x} ${y} q ${side * 16} -4 ${side * 22} -16`}
          stroke="#c8261f"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      );
    }),
  );
  return (
    <Rig pose={pose} legFill={fill} legStroke={stroke} legGap={28}>
      <Arm x={-62} y={-150} angle={pose.armL} side={1} len={96} fill={fill} stroke={stroke} />
      <Arm x={62} y={-150} angle={pose.armR} side={-1} len={96} fill={fill} stroke={stroke} wave={pose.wave} />
      {bodyHairs}
      <ellipse cx={0} cy={-125} rx={70} ry={80} fill="url(#ramBody)" stroke={stroke} strokeWidth={3} />
      <ellipse cx={0} cy={-112} rx={40} ry={46} fill="#ffe9e0" opacity={0.55} />
      <g transform={`translate(0,${headY}) rotate(${pose.head})`}>
        {hairs}
        <circle r={R} fill="url(#ramHead)" stroke={stroke} strokeWidth={3} />
        {Array.from({ length: 16 }, (_, i) => {
          const x = (rand(i + 3) - 0.5) * 150;
          const y = (rand(i + 40) - 0.5) * 150;
          if (x * x + y * y > 85 * 85 || (Math.abs(x) < 70 && y > -30 && y < 75)) return null;
          return <path key={i} d={`M ${x} ${y} q 6 -8 12 -2`} stroke="#9e1812" strokeWidth={3} fill="none" strokeLinecap="round" />;
        })}
        <ellipse cx={-34} cy={-52} rx={32} ry={16} fill="white" opacity={0.35} transform="rotate(-25 -34 -52)" />
        {/* daun kecil */}
        <path d="M 4 -100 q 30 -36 62 -20 q -26 26 -62 20 Z" fill="#6fa23a" stroke="#3e6a1a" strokeWidth={3} />
        <Face y={20} s={0.95} blink={blinkAt(f, seed)} happy={pose.happy} mouth={pose.mouth} blushOp={0.6} />
      </g>
    </Rig>
  );
};

/* ---------------------------------------------------------------- Pisang */

const Pisang: React.FC<CharProps> = ({ pose, f, seed }) => {
  const fill = "#f6d145";
  const stroke = "#a77d10";
  const bend = 10 * Math.sin(f / 7);
  const body = `M -58 -66
    C -82 -200, -76 -360, ${-34 + bend} -452
    L ${-14 + bend} -478
    L ${12 + bend} -478
    L ${18 + bend} -452
    C ${66 + bend * 0.5} -360, 80 -200, 58 -66
    C 40 -28, -40 -28, -58 -66 Z`;
  return (
    <Rig pose={pose} legFill={fill} legStroke={stroke} legGap={26}>
      <Arm x={-60} y={-260} angle={pose.armL} side={1} len={112} fill={fill} stroke={stroke} />
      <Arm x={60} y={-260} angle={pose.armR} side={-1} len={112} fill={fill} stroke={stroke} wave={pose.wave} />
      <path d={body} fill="url(#pisBody)" stroke={stroke} strokeWidth={3.5} strokeLinejoin="round" />
      {/* garis kulit pisang */}
      <path d={`M -20 -80 C -34 -200, -30 -340, ${-10 + bend} -460`} stroke="#d9a821" strokeWidth={3} fill="none" opacity={0.6} />
      <path d={`M 26 -80 C 36 -200, 30 -340, ${8 + bend} -460`} stroke="#d9a821" strokeWidth={3} fill="none" opacity={0.5} />
      <path d={`M -42 -120 C -56 -220, -50 -330, ${-26 + bend} -430`} stroke="white" strokeWidth={14} fill="none" opacity={0.3} strokeLinecap="round" />
      {/* hujung tangkai */}
      <path d={`M ${-14 + bend} -476 L ${-10 + bend} -505 L ${10 + bend} -505 L ${12 + bend} -476 Z`} fill="#8a6a22" stroke="#5a4210" strokeWidth={3} />
      <rect x={-12 + bend} y={-512} width={24} height={10} rx={4} fill="#3e2a10" />
      {/* bintik coklat */}
      <circle cx={34} cy={-150} r={4} fill="#9a6a18" opacity={0.6} />
      <circle cx={-30} cy={-205} r={3} fill="#9a6a18" opacity={0.5} />
      <g transform={`translate(${bend * 0.4},-355) rotate(${pose.head * 0.6})`}>
        <Face y={0} s={0.88} blink={blinkAt(f, seed)} happy={pose.happy} mouth={pose.mouth} />
      </g>
    </Rig>
  );
};

/* ------------------------------------------------------------ latar */

const Bush: React.FC<{ x: number; y: number; s: number; seed: number; fruit: string }> = ({ x, y, s, seed, fruit }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle
        key={i}
        cx={(i - 2.5) * 34 + (rand(seed + i) - 0.5) * 20}
        cy={-40 - rand(seed + i * 7) * 50 - (i > 1 && i < 4 ? 30 : 0)}
        r={44 + rand(seed + i * 3) * 18}
        fill={i % 2 ? "#1f3d2a" : "#24482f"}
      />
    ))}
    {[0, 1, 2].map((i) => (
      <ellipse key={`l${i}`} cx={(i - 1) * 50} cy={-90 - i * 8} rx={26} ry={12} fill="#3d6b45" opacity={0.7} transform={`rotate(${-20 + i * 20} ${(i - 1) * 50} ${-90 - i * 8})`} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <circle key={`f${i}`} cx={(rand(seed + i * 11) - 0.5) * 160} cy={-30 - rand(seed + i * 13) * 70} r={9} fill={fruit} stroke="#00000044" strokeWidth={2} />
    ))}
    {[0, 1].map((i) => (
      <circle key={`b${i}`} cx={(rand(seed + i * 17) - 0.5) * 140} cy={-60 - rand(seed + i * 19) * 60} r={5} fill="#fff6e0" />
    ))}
  </g>
);

const Tree: React.FC<{ x: number; y: number; s: number; seed: number }> = ({ x, y, s, seed }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-14} y={-160} width={28} height={160} fill="#2a2320" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle key={i} cx={(rand(seed + i) - 0.5) * 220} cy={-200 - rand(seed + i * 5) * 140} r={70 + rand(seed + i * 9) * 30} fill="#1c2f2a" />
    ))}
  </g>
);

const Background: React.FC<{ f: number; shift: number }> = ({ f, shift }) => (
  <g>
    <rect x={-400} y={-200} width={1880} height={1200} fill="url(#sky)" />
    {Array.from({ length: 30 }, (_, i) => (
      <circle
        key={i}
        cx={rand(i) * 1600 - 260 + shift * 0.2}
        cy={rand(i + 99) * 420}
        r={1.5 + rand(i + 7) * 2}
        fill="white"
        opacity={0.3 + 0.5 * Math.abs(Math.sin(f / 20 + i))}
      />
    ))}
    <circle cx={700 + shift * 0.3} cy={840} r={220} fill="url(#sunGlow)" />
    <g transform={`translate(${shift * 0.4},0)`} filter="url(#blurFar)">
      <path d="M -400 900 Q -100 760 200 850 Q 480 780 760 860 Q 1100 770 1480 880 L 1480 1000 L -400 1000 Z" fill="#2f3a4f" />
      {[-250, -60, 140, 380, 620, 880, 1120, 1330].map((x, i) => (
        <Tree key={x} x={x} y={920} s={0.8 + rand(i) * 0.4} seed={i * 10} />
      ))}
    </g>
    <g transform={`translate(${shift * 0.7},0)`} filter="url(#blurMid)">
      <rect x={-500} y={900} width={2080} height={1100} fill="url(#soil)" />
      {/* barisan pokok kiri & kanan */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Bush key={`L${i}`} x={-120 + i * 70} y={1000 - i * 22} s={1.5 - i * 0.18} seed={i * 31} fruit={i % 2 ? "#e0352b" : "#e8c13a"} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Bush key={`R${i}`} x={1200 - i * 70} y={1000 - i * 22} s={1.5 - i * 0.18} seed={i * 53 + 5} fruit={i % 2 ? "#e8c13a" : "#e0352b"} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Bush key={`C${i}`} x={330 + i * 105} y={905} s={0.55} seed={i * 71 + 9} fruit="#e0352b" />
      ))}
    </g>
  </g>
);

const Ground: React.FC<{ shift: number }> = ({ shift }) => (
  <g transform={`translate(${shift},0)`}>
    {/* plastik hitam di batas */}
    <path d="M -500 1250 L 300 1010 L 360 1012 L -200 1500 L -500 1600 Z" fill="url(#mulch)" />
    <path d="M 1580 1250 L 780 1010 L 720 1012 L 1280 1500 L 1580 1600 Z" fill="url(#mulch)" />
    <path d="M -300 1260 L 300 1020" stroke="#9aa3b5" strokeWidth={3} opacity={0.35} />
    <path d="M 1380 1260 L 780 1020" stroke="#9aa3b5" strokeWidth={3} opacity={0.35} />
    {Array.from({ length: 70 }, (_, i) => {
      const y = 1040 + rand(i * 3) * 880;
      const k = (y - 1000) / 900;
      return (
        <ellipse
          key={i}
          cx={rand(i * 5) * 1500 - 200}
          cy={y}
          rx={3 + k * 9 * rand(i)}
          ry={2 + k * 5 * rand(i)}
          fill={i % 3 ? "#b39270" : "#e8dccb"}
          opacity={0.75}
        />
      );
    })}
    {/* plastik depan (dekat kamera) */}
    <path d="M -500 1820 Q 300 1700 900 1840 L 1600 1780 L 1600 2100 L -500 2100 Z" fill="url(#mulch)" opacity={0.95} />
    <path d="M -300 1800 Q 300 1720 800 1835" stroke="#c9d0dc" strokeWidth={4} opacity={0.4} fill="none" />
  </g>
);

const Fireflies: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 22 }, (_, i) => {
      const x = rand(i + 200) * 1080 + 30 * Math.sin(f / 25 + i);
      const y = 700 + rand(i + 300) * 700 + 20 * Math.cos(f / 30 + i * 2);
      return <circle key={i} cx={x} cy={y} r={4 + rand(i) * 4} fill="#fff3a6" opacity={0.25 + 0.6 * Math.abs(Math.sin(f / 12 + i))} filter="url(#glow)" />;
    })}
  </g>
);

const Note: React.FC<{ x: number; y: number; s: number; color: string; op: number }> = ({ x, y, s, color, op }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={14} ry={10} fill={color} transform="rotate(-20)" />
    <rect x={10} y={-50} width={5} height={50} fill={color} />
    <path d="M 15 -50 q 20 6 18 24" stroke={color} strokeWidth={5} fill="none" />
  </g>
);

const Heart: React.FC<{ x: number; y: number; s: number; op: number }> = ({ x, y, s, op }) => (
  <path
    transform={`translate(${x},${y}) scale(${s})`}
    d="M 0 12 C -30 -10 -22 -36 0 -22 C 22 -36 30 -10 0 12 Z"
    fill="#ff6f91"
    stroke="white"
    strokeWidth={3}
    opacity={op}
  />
);

/* ---------------------------------------------------------------- babak */

const CHARS = [
  { name: "Durian", C: Durian, baseAng: -52, delay: 0, mirror: false, seed: 0, color: "#7f9230" },
  { name: "Pisang", C: Pisang, baseAng: 0, delay: 2, mirror: true, seed: 30, color: "#d9a821" },
  { name: "Rambutan", C: Rambutan, baseAng: 52, delay: 4, mirror: false, seed: 55, color: "#d8302a" },
];

const camera = (f: number) => {
  // [skala, panX, putar, sudut orbit, fokusY]
  if (f < 120) return { s: interpolate(f, [0, 120], [1, 1.08]), pan: 0, rot: 0, orbit: 0, fy: 1500 };
  if (f < 240)
    return {
      s: interpolate(f, [120, 240], [1.12, 1.2]),
      pan: interpolate(f, [120, 240], [-60, 60]),
      rot: interpolate(f, [120, 240], [-2, 2]),
      orbit: 0,
      fy: 1400,
    };
  if (f < 360)
    return {
      s: 1.0,
      pan: 0,
      rot: 0,
      orbit: 38 * Math.sin((2 * P * (f - 240)) / 120),
      fy: 1500,
    };
  return { s: interpolate(f, [360, 480], [1.2, 1.28]), pan: 0, rot: 0, orbit: 0, fy: 1250 };
};

export const BuahMenari: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  const groundY = 1600;
  const R = 400;

  const placed = CHARS.map((c, idx) => {
    const ang = ((c.baseAng + cam.orbit) * P) / 180;
    const depth = Math.cos(ang);
    const x = 540 + R * Math.sin(ang);
    const y = groundY - 90 * (1 - depth);
    const sc = 1.42 * (0.82 + 0.18 * depth);
    const lf = frame - c.delay;
    return { ...c, idx, x, y, sc, depth, pose: getPose(Math.max(0, lf), c.mirror), lf };
  }).sort((a, b) => a.depth - b.depth);

  const bgShift = -cam.orbit * 9 - cam.pan * 0.5;
  const world = `translate(540,${cam.fy}) scale(${cam.s}) rotate(${cam.rot}) translate(${-540 - cam.pan},${-cam.fy})`;
  const flash =
    interpolate(frame, [240, 247], [0.5, 0], ci) * (frame >= 240 ? 1 : 0) +
    interpolate(frame, [360, 367], [0.5, 0], ci) * (frame >= 360 ? 1 : 0);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1b1d3a" }}>
      <Audio src={staticFile("muzik-tarian.wav")} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b3a8c" />
            <stop offset="0.45" stopColor="#6c5cb8" />
            <stop offset="0.72" stopColor="#e47f9a" />
            <stop offset="0.9" stopColor="#ffb07a" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity={0.9} />
            <stop offset="1" stopColor="#ff9a7a" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5e4632" />
            <stop offset="0.3" stopColor="#8a6a4c" />
            <stop offset="1" stopColor="#a5825e" />
          </linearGradient>
          <linearGradient id="mulch" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#14161c" />
            <stop offset="0.5" stopColor="#3a3f4c" />
            <stop offset="1" stopColor="#14161c" />
          </linearGradient>
          <radialGradient id="eyeGrad" cx="0.5" cy="0.65" r="0.6">
            <stop offset="0" stopColor="#6a3a1e" />
            <stop offset="0.6" stopColor="#2a140a" />
            <stop offset="1" stopColor="#120804" />
          </radialGradient>
          <radialGradient id="durHead" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#d4df82" />
            <stop offset="1" stopColor="#7f9230" />
          </radialGradient>
          <radialGradient id="durBody" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#cbd77a" />
            <stop offset="1" stopColor="#869a33" />
          </radialGradient>
          <radialGradient id="durFlesh" cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#fff8d6" />
            <stop offset="1" stopColor="#f2d272" />
          </radialGradient>
          <radialGradient id="ramHead" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ff8a70" />
            <stop offset="0.6" stopColor="#e2382c" />
            <stop offset="1" stopColor="#a8160f" />
          </radialGradient>
          <radialGradient id="ramBody" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ff7a64" />
            <stop offset="1" stopColor="#b81c14" />
          </radialGradient>
          <linearGradient id="pisBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e2ad1c" />
            <stop offset="0.4" stopColor="#ffe873" />
            <stop offset="1" stopColor="#e9b52a" />
          </linearGradient>
          <radialGradient id="shadow">
            <stop offset="0" stopColor="#000" stopOpacity={0.45} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
          <filter id="blurFar">
            <feGaussianBlur stdDeviation={4} />
          </filter>
          <filter id="blurMid">
            <feGaussianBlur stdDeviation={1.6} />
          </filter>
          <filter id="glow" x="-2" y="-2" width="5" height="5">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        <g transform={world}>
          <Background f={frame} shift={bgShift} />
          <Ground shift={bgShift} />
          {placed.map((c) => (
            <ellipse key={`sh${c.name}`} cx={c.x + c.pose.sx * c.sc} cy={c.y + 4} rx={(95 - c.pose.bounce * 0.4) * c.sc} ry={20 * c.sc} fill="url(#shadow)" />
          ))}
          {placed.map((c) => {
            const Comp = c.C;
            return (
              <g key={c.name} transform={`translate(${c.x},${c.y}) scale(${c.sc})`}>
                <Comp pose={c.pose} f={c.lf} seed={c.seed} />
              </g>
            );
          })}
          <Fireflies f={frame} />
        </g>

        {/* not muzik terapung */}
        {frame > 30 &&
          frame < 440 &&
          Array.from({ length: 6 }, (_, i) => {
            const life = ((frame + i * 23) % 90) / 90;
            return (
              <Note
                key={i}
                x={120 + rand(i + 5) * 840 + 30 * Math.sin(frame / 10 + i)}
                y={900 - life * 380}
                s={0.9 + rand(i) * 0.5}
                color={["#ffffff", "#ffe36b", "#ff9ab0"][i % 3]}
                op={Math.sin(life * P) * 0.85}
              />
            );
          })}

        {/* label nama di awal */}
        {CHARS.map((c, i) => {
          const pl = placed.find((p) => p.name === c.name)!;
          const t0 = 12 + i * 10;
          const op = interpolate(frame, [t0, t0 + 8, 95, 110], [0, 1, 1, 0], ci);
          const pop = interpolate(frame, [t0, t0 + 6, t0 + 10], [0.4, 1.15, 1], ci);
          if (op <= 0) return null;
          const top = c.name === "Pisang" ? 560 : 470;
          // posisi selepas transform kamera (babak A sahaja)
          const sx = 540 + (pl.x - 540) * cam.s;
          const sy = cam.fy + (pl.y - top * pl.sc - cam.fy) * cam.s;
          const w = c.name.length * 30 + 50;
          return (
            <g key={c.name} transform={`translate(${sx},${sy}) scale(${pop})`} opacity={op}>
              <rect x={-w / 2} y={-38} width={w} height={60} rx={30} fill="white" stroke={c.color} strokeWidth={5} />
              <text x={0} y={4} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={36} fill={c.color}>
                {c.name}
              </text>
            </g>
          );
        })}

        {/* hati di hujung */}
        {frame > 444 &&
          Array.from({ length: 10 }, (_, i) => {
            const t = (frame - 444 - i * 2) / 36;
            if (t < 0) return null;
            return (
              <Heart
                key={i}
                x={140 + rand(i + 70) * 800 + 20 * Math.sin(frame / 6 + i)}
                y={1300 - t * 700 - rand(i) * 200}
                s={1 + rand(i + 3) * 0.8}
                op={clamp(1.2 - t)}
              />
            );
          })}

        {/* tajuk akhir */}
        {frame > 448 && (
          <g
            transform={`translate(540,330) scale(${interpolate(frame, [448, 456, 462], [0.3, 1.1, 1], ci)})`}
            opacity={interpolate(frame, [448, 454], [0, 1], ci)}
          >
            <rect x={-410} y={-80} width={820} height={130} rx={65} fill="white" opacity={0.92} />
            <text x={0} y={5} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={58}>
              <tspan fill="#7f9230">Durian</tspan>
              <tspan fill="#9a8f80"> · </tspan>
              <tspan fill="#d9a821">Pisang</tspan>
              <tspan fill="#9a8f80"> · </tspan>
              <tspan fill="#d8302a">Rambutan</tspan>
            </text>
          </g>
        )}

        <rect x={0} y={0} width={1080} height={1920} fill="url(#vignette)" />
        <rect x={0} y={0} width={1080} height={1920} fill="white" opacity={flash} />
      </svg>
    </AbsoluteFill>
  );
};
