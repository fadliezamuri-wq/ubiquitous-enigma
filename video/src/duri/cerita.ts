import { Easing, interpolate } from "remotion";
import { basePose, type Pose } from "./Durian";

export const FPS = 30;
export const DURATION = 1470; // 49 saat

export const BABAK = {
  pagi: 0,
  tolong: 180,
  kemas: 390,
  bangga: 630,
  peluk: 900,
  moral: 1020,
  lambai: 1320,
};

export type Penutur = "Narator" | "Duri" | "Mak" | "Bapa";

export type Dialog = {
  from: number;
  to: number;
  who: Penutur;
  text: string;
  // Letak fail suara di public/duri/suara/ dan isi nama fail di sini
  suara?: string;
  luarSkrin?: boolean;
};

export const DIALOG: Dialog[] = [
  { from: 70, to: 175, who: "Narator", text: "Keesokan paginya, Duri bangun awal. Mak sudah sibuk menyediakan sarapan walaupun masih keletihan." },
  { from: 235, to: 330, who: "Duri", text: "Mak, biar Duri tolong. Mak dah banyak buat untuk Duri." },
  { from: 345, to: 388, who: "Mak", text: "Eh, Duri! Terima kasih, sayang!" },
  { from: 405, to: 495, who: "Bapa", text: "Duri, rajin membantu dan bercakap dengan sopan, ya." },
  { from: 500, to: 538, who: "Duri", text: "Baik, bapa!" },
  { from: 545, to: 582, who: "Mak", text: "Duri! Mari sini sekejap!", luarSkrin: true },
  { from: 585, to: 628, who: "Duri", text: "Ya, mak! Duri datang!" },
  { from: 650, to: 765, who: "Bapa", text: "Bapa bangga apabila Duri belajar menghormati mak dan bapa. Teruskan jadi anak yang baik." },
  { from: 790, to: 897, who: "Duri", text: "Duri janji akan cuba menjadi anak yang lebih baik. Duri sayang mak dan bapa!" },
  { from: 1030, to: 1095, who: "Narator", text: "Ibu bapa menjaga kita sejak kecil." },
  { from: 1095, to: 1195, who: "Narator", text: "Hormatilah mereka, bercakap dengan lembut, dengar nasihat mereka dan bantulah mereka selagi mampu." },
  { from: 1195, to: 1262, who: "Narator", text: "Jangan tunggu kehilangan baru hendak menghargai." },
  { from: 1335, to: 1455, who: "Duri", text: "Kawan-kawan, jangan lupa cium tangan mak dan bapa hari ini!" },
];

export const TEKS_MORAL = { from: 1235, to: 1325 };

const smooth = Easing.bezier(0.45, 0, 0.25, 1);

// Keyframe ringkas: nilai dikunci di luar julat
export const k = (f: number, input: number[], output: number[], easing = smooth) =>
  interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

const v3 = (f: number, input: number[], out: [number, number, number][]) =>
  [0, 1, 2].map((i) => k(f, input, out.map((o) => o[i]))) as [number, number, number];

const speaking = (f: number, who: Penutur) => DIALOG.some((d) => d.who === who && f >= d.from && f < d.to);

const blink = (f: number, seed: number) => {
  const t = (f + seed) % 97;
  return t < 3 ? 0.1 : 1;
};

const hop = (f: number, f0: number, f1: number, height: number) =>
  f > f0 && f < f1 ? Math.abs(Math.sin(((f - f0) / (f1 - f0)) * Math.PI * 3)) * height : 0;

export type Keadaan = {
  cam: { pos: [number, number, number]; look: [number, number, number] };
  duri: Pose;
  mak: Pose;
  bapa: Pose;
  sun: number;
  hearts: number;
  dustSweep: number;
};

const withFace = (p: Pose, f: number, who: Penutur, seed: number): Pose => {
  const talk = speaking(f, who);
  return {
    ...p,
    eyeOpen: p.eyeOpen * blink(f, seed),
    mouthOpen: Math.max(p.mouthOpen, talk ? 0.25 + Math.abs(Math.sin(f * 0.55)) * 0.55 : 0),
  };
};

export const keadaan = (f: number): Keadaan => {
  let duri = basePose(1.2, 0.6);
  let mak = basePose(-1.5, -1.4);
  let bapa = { ...basePose(1.9, -0.3), visible: false };
  let cam: Keadaan["cam"] = { pos: [0, 2.4, 9], look: [0, 1.4, 0] };
  let sun = 1;
  let hearts = 0;
  let dustSweep = 0;

  if (f < BABAK.tolong) {
    // Babak 1: Duri bangun, mak penat memasak
    const stretch = k(f, [10, 35, 70, 85], [0, 1, 1, 0]);
    duri = {
      ...duri,
      rotY: k(f, [0, 95, 115], [-0.2, -0.2, -0.8]),
      armL: 0.35 + stretch * 2.3,
      armR: 0.35 + stretch * 2.3,
      eyeOpen: k(f, [0, 20, 70, 85], [0.15, 0.1, 0.1, 1]),
      mouthOpen: k(f, [20, 35, 60, 72], [0, 0.95, 0.95, 0]),
      squash: 1 + stretch * 0.08,
      lookX: k(f, [95, 115], [0, -1]),
      smile: k(f, [70, 90], [0.2, 0.7]),
    };
    mak = {
      ...mak,
      rotY: 0.5,
      spatula: true,
      armR: 0.9 + Math.sin(f * 0.25) * 0.25,
      fwdR: 0.9,
      armL: k(f, [110, 125, 145, 160], [0.35, 2.6, 2.6, 0.35]),
      fwdL: k(f, [110, 125, 145, 160], [0, 0.9, 0.9, 0]),
      eyeOpen: 0.45,
      brow: -0.8,
      smile: 0.15,
      blush: 0.2,
      squash: 0.95 + Math.sin(f * 0.05) * 0.02,
      tilt: Math.sin(f * 0.05) * 0.04,
      mouthOpen: k(f, [125, 135, 150, 160], [0, 0.35, 0.35, 0]),
    };
    cam = {
      pos: v3(f, [0, 80, 125, 180], [[1.6, 1.9, 5.2], [1.4, 1.9, 5.4], [-0.8, 2.2, 4.6], [-0.9, 2.1, 4.3]]),
      look: v3(f, [0, 80, 125, 180], [[1.1, 1.35, 0.6], [1.0, 1.35, 0.6], [-1.4, 1.45, -1.4], [-1.45, 1.45, -1.4]]),
    };
  } else if (f < BABAK.kemas) {
    // Babak 2: Duri menawarkan bantuan
    const walk = f < 232;
    const surprised = k(f, [332, 338, 352, 362], [0, 1, 1, 0]);
    const happy = k(f, [340, 360], [0, 1]);
    duri = {
      ...duri,
      x: k(f, [180, 232], [1.2, -0.35]),
      z: k(f, [180, 232], [0.6, -0.55]),
      rotY: k(f, [180, 190, 232, 240], [-0.8, -1.4, -1.4, -1.0]),
      bob: walk ? Math.abs(Math.sin(f * 0.45)) * 0.12 : 0,
      armL: walk ? 0.35 + Math.sin(f * 0.45) * 0.3 : 0.25,
      armR: walk ? 0.35 - Math.sin(f * 0.45) * 0.3 : 0.25,
      fwdL: walk ? 0 : 0.7,
      fwdR: walk ? 0 : 0.7,
      lookX: -1,
      smile: 0.8,
      blush: 0.9,
      brow: 0.3,
    };
    mak = {
      ...mak,
      rotY: k(f, [236, 256], [0.5, 1.05]),
      spatula: f < 340,
      armR: f < 236 ? 0.9 + Math.sin(f * 0.25) * 0.25 : k(f, [236, 250, 360, 375], [0.9, 0.4, 0.4, 1.2]),
      fwdR: k(f, [236, 250, 360, 375], [0.9, 0.2, 0.2, 1.1]),
      armL: k(f, [360, 375], [0.35, 1.2]),
      fwdL: k(f, [360, 375], [0, 1.1]),
      eyeOpen: 0.45 + surprised * 0.85 + happy * 0.4,
      lookX: k(f, [236, 256], [0, 1]),
      brow: -0.8 + surprised * 1.8 + happy * 0.4,
      smile: 0.15 + happy * 0.85,
      mouthOpen: surprised * 0.7,
      blush: 0.2 + happy * 0.8,
      bob: hop(f, 334, 352, 0.25) * (f < 352 ? 1 : 0),
      squash: 1,
    };
    cam = {
      pos: v3(f, [180, 230, 330, 345, 390], [[0.2, 2.3, 6], [-0.5, 2.2, 5.3], [-0.6, 2.1, 5.1], [-0.9, 2, 4.4], [-0.95, 2, 4.3]]),
      look: v3(f, [180, 230, 330, 345, 390], [[-0.3, 1.3, -0.4], [-0.9, 1.3, -0.9], [-0.9, 1.3, -1], [-1.3, 1.45, -1.3], [-1.3, 1.45, -1.3]]),
    };
  } else if (f < BABAK.bangga) {
    // Babak 3: mengemas, dengar nasihat bapa, sahut panggilan mak
    const sweeping = f < 497;
    const turnToMak = k(f, [550, 570], [0, 1]);
    const runStart = 600;
    duri = {
      ...duri,
      x: k(f, [runStart, 630], [0.2, -0.9]),
      z: 0.8,
      broom: f < 590,
      rotY: sweeping ? -0.3 + Math.sin(f * 0.18) * 0.35 : k(f, [497, 507], [-0.3, 0.6]) * (1 - turnToMak) + turnToMak * -0.75,
      armR: 0.9,
      fwdR: 1.1,
      armL: sweeping ? 0.8 : 0.35,
      fwdL: sweeping ? 1.1 : 0,
      bob: hop(f, 588, 628, 0.3),
      squash: f >= 505 && f < 525 ? 1 - Math.abs(Math.sin((f - 505) * 0.32)) * 0.07 : 1,
      lookX: sweeping ? -0.3 : k(f, [497, 507, 550, 570], [0, 1, 1, -1]),
      lookY: sweeping ? -0.8 : 0,
      smile: 0.85,
      blush: 0.7,
      brow: f > 580 ? 0.7 : 0.2,
    };
    if (f > 588) duri.armR = 2.4 + Math.sin(f * 0.6) * 0.3;
    dustSweep = sweeping ? 1 : k(f, [497, 515], [1, 0]);
    mak = { ...mak, visible: false };
    bapa = {
      ...basePose(2.0, -0.4),
      rotY: -0.7,
      armR: 0.4 + (speaking(f, "Bapa") ? 0.7 + Math.sin(f * 0.15) * 0.3 : 0),
      fwdR: speaking(f, "Bapa") ? 0.8 : 0,
      lookX: -1,
      smile: 0.7,
      brow: 0.1,
      blush: 0.3,
      tilt: f > 545 && f < 590 ? -0.06 : 0,
    };
    cam = {
      pos: v3(f, [390, 500, 545, 590, 630], [[1.5, 2.4, 6.6], [1.3, 2.3, 6.3], [0.5, 2.1, 5.2], [0.2, 2.1, 5.2], [-0.4, 2.1, 5.6]]),
      look: v3(f, [390, 500, 545, 590, 630], [[1.1, 1.4, 0.1], [1.1, 1.4, 0.1], [0.2, 1.2, 0.6], [0.0, 1.2, 0.6], [-0.6, 1.2, 0.6]]),
    };
  } else if (f < BABAK.peluk) {
    // Babak 4: bapa mengusap kepala, Duri memeluk mak dan bapa
    const hug = k(f, [770, 795], [0, 1]);
    const pat = f > 655 && f < 760 ? Math.sin((f - 655) * 0.3) : 0;
    duri = {
      ...basePose(k(f, [770, 795], [0.05, 0.05]), k(f, [770, 795], [0.55, 0.75])),
      rotY: k(f, [630, 770, 795], [0.5, 0.5, 0]),
      eyeOpen: f > 655 && f < 770 ? 0.12 : 1,
      smile: 1,
      blush: 1,
      brow: 0.6,
      squash: 1 - Math.max(0, pat) * 0.05,
      lookX: k(f, [770, 790], [1, 0]),
      armL: 0.35 + hug * 1.25,
      armR: 0.35 + hug * 1.25,
      fwdL: hug * 0.5,
      fwdR: hug * 0.5,
      bob: hop(f, 770, 790, 0.18),
    };
    bapa = {
      ...basePose(k(f, [770, 795], [1.9, 1.35]), k(f, [770, 795], [0.05, -0.4])),
      rotY: k(f, [630, 770, 795], [-0.35, -0.35, -0.5]),
      // Tangan kiri bapa mengusap kepala Duri
      armL: f < 770 ? k(f, [640, 655], [0.35, 2.0]) + Math.max(0, pat) * 0.12 : k(f, [770, 795], [2.0, 0.85]),
      fwdL: f < 770 ? k(f, [640, 655], [0, 0.35]) : k(f, [770, 795], [0.35, 0]),
      armR: 0.35 + hug * 1.05,
      fwdR: hug * 1.2,
      lookX: -1,
      lookY: -0.6,
      smile: 0.9,
      blush: 0.5,
      brow: 0.3,
    };
    mak = {
      ...basePose(k(f, [770, 795], [-1.7, -1.05]), k(f, [770, 795], [-0.3, -0.3])),
      rotY: k(f, [630, 770, 795], [0.6, 0.6, 0.45]),
      smile: 1,
      blush: 0.9,
      brow: 0.4,
      lookX: 1,
      armL: 0.35 + hug * 0.4,
      armR: 0.35 + hug * 1.1,
      fwdR: hug * 1.2,
    };
    cam = {
      pos: v3(f, [630, 760, 790, 900], [[0.7, 2.7, 7.0], [0.6, 2.6, 6.6], [0.2, 2.9, 10.5], [0.2, 2.8, 10]]),
      look: v3(f, [630, 760, 790, 900], [[0.7, 1.75, 0.2], [0.7, 1.75, 0.2], [0.2, 1.55, 0], [0.2, 1.55, 0]]),
    };
  } else {
    // Babak 5, moral dan penutup: tiga beranak berpelukan
    const sway = Math.sin(f * 0.08) * 0.05;
    const tear = k(f, [930, 1000], [0, 1]);
    const ending = f >= BABAK.lambai;
    duri = {
      ...basePose(0.05, 0.75),
      eyeOpen: ending ? 1 : 0.12,
      smile: 1,
      blush: 1,
      brow: 0.6,
      armL: ending ? 0.35 : 1.6,
      armR: ending ? 2.5 + Math.sin(f * 0.35) * 0.35 : 1.6,
      fwdL: ending ? 0 : 0.5,
      fwdR: ending ? 0.2 : 0.5,
      tilt: ending ? Math.sin(f * 0.17) * 0.05 : sway,
      bob: ending ? Math.abs(Math.sin(f * 0.17)) * 0.05 : 0,
    };
    mak = {
      ...basePose(-1.05, -0.3),
      rotY: 0.45,
      eyeOpen: f > 1000 && !ending ? 0.15 : 0.35,
      smile: 1,
      blush: 1,
      brow: 0.7,
      tear: ending ? 0 : tear,
      armL: 0.75,
      armR: ending ? 0.35 : 1.45,
      fwdR: ending ? 0 : 1.2,
      tilt: -sway,
    };
    bapa = {
      ...basePose(1.35, -0.4),
      rotY: -0.5,
      eyeOpen: ending ? 1 : 0.15,
      smile: 0.95,
      blush: 0.6,
      brow: 0.4,
      armR: ending ? 0.35 : 1.4,
      fwdR: ending ? 0 : 1.2,
      armL: 0.85,
      tilt: sway,
    };
    hearts = f < BABAK.lambai ? k(f, [910, 940], [0, 1]) : 0;
    sun = k(f, [BABAK.moral, 1150, BABAK.lambai, BABAK.lambai + 1], [1, 1.45, 1.45, 1.1]);
    if (!ending) {
      cam = {
        pos: v3(f, [900, 1020, 1320], [[0.2, 2.8, 10], [0.1, 2.4, 8.2], [0.4, 3.4, 9.5]]),
        look: v3(f, [900, 1020, 1320], [[0.2, 1.55, 0], [0.1, 1.5, 0], [0.4, 2.1, -1.5]]),
      };
    } else {
      cam = {
        pos: v3(f, [1320, 1470], [[0.2, 2.1, 6.2], [0.15, 2.0, 5.6]]),
        look: v3(f, [1320, 1470], [[0.2, 1.6, 0.4], [0.15, 1.6, 0.4]]),
      };
    }
  }

  return {
    cam,
    duri: withFace(duri, f, "Duri", 0),
    mak: withFace(mak, f, "Mak", 31),
    bapa: withFace(bapa, f, "Bapa", 63),
    sun,
    hearts,
    dustSweep,
  };
};
