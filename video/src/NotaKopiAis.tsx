import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Contoh video TikTok tanpa wajah, niche kewangan, gaya "rakaman skrin":
// app nota + kalkulator, ayat santai, kapsyen gaya TikTok. 25 saat, 1080x1920.

const font = "Inter";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Segmen = { teks: string; mula: number; tebal?: boolean; kelabu?: boolean; cps?: number };

// Berapa aksara dah ditaip pada masa `t` (saat). Ada jeda selepas tanda baca/baris baru
// supaya rentak taip tak nampak macam mesin.
const aksaraDitaip = (teks: string, t: number, cps = 16) => {
  let masa = 0;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    masa += 1 / cps + (i % 7 === 3 ? 0.03 : 0);
    if (c === "\n" || c === "." || c === "?" || c === ",") masa += 0.22;
    if (masa > t) return i;
  }
  return teks.length;
};

const BarStatus: React.FC<{ gelap?: boolean }> = ({ gelap }) => {
  const warna = gelap ? "#ffffff" : "#111111";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        padding: "0 70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: font,
        fontWeight: 800,
        fontSize: 40,
        color: warna,
      }}
    >
      <span>10:23</span>
      <span style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32 }}>
        <span style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 28 }}>
          {[10, 16, 22, 28].map((h) => (
            <span key={h} style={{ width: 7, height: h, borderRadius: 2, backgroundColor: warna }} />
          ))}
        </span>
        4G
        <span
          style={{
            width: 62,
            height: 30,
            borderRadius: 9,
            border: `3px solid ${warna}`,
            padding: 3,
            opacity: 0.9,
          }}
        >
          <span style={{ display: "block", width: "58%", height: "100%", borderRadius: 4, backgroundColor: warna }} />
        </span>
      </span>
    </div>
  );
};

// Kapsyen gaya TikTok: kotak putih, teks hitam tebal.
const Kapsyen: React.FC<{ children: React.ReactNode; top: number; mula: number; tamat: number; besar?: boolean }> = ({
  children,
  top,
  mula,
  tamat,
  besar,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < mula * fps || frame >= tamat * fps) return null;
  return (
    <div style={{ position: "absolute", top, left: 90, right: 90, display: "flex", justifyContent: "center" }}>
      <Interactive.Div
        name="Kapsyen"
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: besar ? 76 : 58,
          lineHeight: 1.25,
          color: "#000",
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: "14px 26px",
          textAlign: "center",
          boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
          scale: interpolate(frame, [mula * fps, mula * fps + 5], [0.85, 1], {
            ...clamp,
            easing: Easing.bezier(0.2, 0, 0, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        {children}
      </Interactive.Div>
    </div>
  );
};

const Nota: React.FC<{ segmen: Segmen[] }> = ({ segmen }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const kursor = Math.floor(frame / 16) % 2 === 0;
  const aktif = segmen.filter((s) => t >= s.mula);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfaf6", fontFamily: font, color: "#1c1c1e" }}>
      <BarStatus />
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 50,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 48,
          color: "#d69a00",
        }}
      >
        <span>‹ Nota</span>
        <span style={{ fontWeight: 800 }}>Siap</span>
      </div>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontSize: 30, color: "#8e8e93" }}>
        26 November 2026 pada 10:23 PG
      </div>
      <Interactive.Div
        name="Isi nota"
        style={{
          position: "absolute",
          top: 320,
          left: 70,
          right: 70,
          fontSize: 56,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 70, marginBottom: 10 }}>kopi ais aku ☕</div>
        {aktif.map((s, i) => {
          const n = aksaraDitaip(s.teks, t - s.mula, s.cps);
          const akhir = i === aktif.length - 1;
          return (
            <span
              key={i}
              style={{
                fontWeight: s.tebal ? 800 : 400,
                color: s.kelabu ? "#8e8e93" : undefined,
                fontSize: s.kelabu ? 34 : undefined,
              }}
            >
              {s.teks.slice(0, n)}
              {akhir ? (
                <span style={{ color: "#d69a00", opacity: kursor || n < s.teks.length ? 1 : 0 }}>|</span>
              ) : null}
            </span>
          );
        })}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const NOTA_AWAL: Segmen[] = [{ teks: "rm10 sehari je\nsebulan = rm300\n\n5 tahun berapa eh?", mula: 0.3 }];

const NotaAwal: React.FC = () => (
  <AbsoluteFill>
    <Nota segmen={NOTA_AWAL} />
    <Kapsyen top={1180} mula={0} tamat={3.8}>
      rm10 sehari = berapa dalam 5 tahun? 🤔
    </Kapsyen>
  </AbsoluteFill>
);

const KEKUNCI = [
  ["AC", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];
const TEKAN: [string, number][] = [
  ["1", 0.4],
  ["0", 0.62],
  ["×", 0.95],
  ["3", 1.35],
  ["6", 1.55],
  ["5", 1.75],
  ["×", 2.05],
  ["5", 2.45],
  ["=", 2.95],
];

const Kalkulator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ditekan = TEKAN.filter(([, s]) => t >= s);
  const selesai = ditekan.some(([k]) => k === "=");
  const paparan = selesai ? "18,250" : ditekan.map(([k]) => k).join("") || "0";
  const sedangTekan = TEKAN.find(([, s]) => t >= s && t < s + 0.15)?.[0];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: font }}>
      <BarStatus gelap />
      <Interactive.Div
        name="Paparan"
        style={{
          position: "absolute",
          right: 80,
          left: 80,
          bottom: 1350,
          textAlign: "right",
          color: "#fff",
          fontSize: paparan.length > 7 ? 150 : 200,
          fontWeight: 400,
        }}
      >
        {paparan}
      </Interactive.Div>
      <div style={{ position: "absolute", left: 66, right: 66, bottom: 120, display: "flex", flexDirection: "column", gap: 36 }}>
        {KEKUNCI.map((baris, r) => (
          <div key={r} style={{ display: "flex", gap: 36 }}>
            {baris.map((k) => {
              const atas = r === 0 && k !== "÷";
              const op = ["÷", "×", "−", "+", "="].includes(k);
              const ditekanKini = sedangTekan === k;
              return (
                <div
                  key={k}
                  style={{
                    width: k === "0" ? 456 : 210,
                    height: 210,
                    borderRadius: 105,
                    backgroundColor: op ? "#ff9f0a" : atas ? "#a5a5a5" : "#333333",
                    color: atas ? "#000" : "#fff",
                    fontSize: 84,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: k === "0" ? "flex-start" : "center",
                    paddingLeft: k === "0" ? 78 : 0,
                    filter: ditekanKini ? "brightness(1.35)" : undefined,
                  }}
                >
                  {k}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Kapsyen top={300} mula={3.4} tamat={6}>
        ok rm18k... biasa je kan 😅
      </Kapsyen>
      {TEKAN.map(([k, s], i) => (
        <Audio key={i} src={staticFile("sfx/tap.wav")} from={Math.round(s * fps)} volume={0.5} name={`Tap ${k}`} />
      ))}
    </AbsoluteFill>
  );
};

const NOTA_AKHIR: Segmen[] = [
  { teks: "rm10 sehari je\nsebulan = rm300\n\n5 tahun = rm18,250", mula: -100 },
  { teks: "\n\ntapi kalau letak kat tempat dapat ~5% setahun...", mula: 0.4 },
  { teks: "\n= rm20,686", mula: 5.6, tebal: true },
  { teks: "\n\nni dah cukup deposit rumah rm200k 😭", mula: 6.6, cps: 26 },
  { teks: "\n\n*anggaran, tak dijamin. bukan nasihat kewangan", mula: 8.4, kelabu: true, cps: 60 },
];

const NotaAkhir: React.FC = () => (
  <AbsoluteFill>
    <Nota segmen={NOTA_AKHIR} />
    <Kapsyen top={1450} mula={3.6} tamat={5.6}>
      jap aku kira...
    </Kapsyen>
    <Kapsyen top={1540} mula={8} tamat={11} besar>
      DARI KOPI AIS JE?? 💀
    </Kapsyen>
  </AbsoluteFill>
);

export const NotaKopiAis: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfaf6" }}>
      <Series>
        <Series.Sequence name="Nota awal" durationInFrames={8 * fps}>
          <NotaAwal />
        </Series.Sequence>
        <Series.Sequence name="Kalkulator" durationInFrames={6 * fps}>
          <Kalkulator />
        </Series.Sequence>
        <Series.Sequence name="Nota akhir" durationInFrames={11 * fps}>
          <NotaAkhir />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
