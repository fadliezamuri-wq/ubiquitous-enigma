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

// Contoh video TikTok tanpa wajah, niche kewangan.
// Hook #13: "RM10 sehari = berapa dalam 5 tahun?" (25 saat, 1080x1920)

const font = "Inter";
const HIJAU = "#22c55e";
const EMAS = "#fbbf24";
const PUTIH = "#f8fafc";
const KELABU = "#94a3b8";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const keluar = Easing.bezier(0.16, 1, 0.3, 1);

const rm = (n: number) => "RM" + Math.round(n).toLocaleString("en-US");

// Nilai akhir tahun: RM304.17 sebulan, 5% setahun dikompaun bulanan.
const NILAI_TAHUNAN = [3735, 7661, 11787, 16124, 20686];

const Babak: React.FC<{ children: React.ReactNode; name: string; bg?: string }> = ({
  children,
  name,
  bg,
}) => (
  <AbsoluteFill
    name={name}
    style={{
      background: bg ?? "radial-gradient(circle at 50% 35%, #0f3b2a 0%, #071a12 70%)",
      fontFamily: font,
      color: PUTIH,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "260px 90px 520px",
      gap: 28,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Babak name="Hook">
      <Interactive.Div
        name="Label"
        style={{
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 6,
          color: "#071a12",
          backgroundColor: EMAS,
          padding: "12px 32px",
          borderRadius: 999,
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], clamp),
        }}
      >
        CUBA TEKA
      </Interactive.Div>
      <Interactive.Div
        name="RM10"
        style={{
          fontSize: 300,
          fontWeight: 800,
          lineHeight: 1,
          color: HIJAU,
          scale: interpolate(frame, [0, 0.5 * fps], [0.3, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        RM10
      </Interactive.Div>
      <Interactive.Div name="Sehari" style={{ fontSize: 110, fontWeight: 800, marginTop: -20 }}>
        sehari
      </Interactive.Div>
      <Interactive.Div
        name="Soalan"
        style={{
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 1.15,
          marginTop: 30,
          opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0.9 * fps, 1.3 * fps], ["0px 50px", "0px 0px"], {
            ...clamp,
            easing: keluar,
          }),
        }}
      >
        = berapa dalam <span style={{ color: EMAS, whiteSpace: "nowrap" }}>5 tahun?</span>
      </Interactive.Div>
    </Babak>
  );
};

const Kopi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Babak name="Kopi">
      <Interactive.Div
        name="Cawan"
        style={{
          fontSize: 260,
          lineHeight: 1,
          scale: interpolate(frame, [0, 0.4 * fps], [0.4, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
          rotate: interpolate(frame, [0.4 * fps, 1.2 * fps, 2 * fps], ["-6deg", "6deg", "0deg"], {
            ...clamp,
            easing: keluar,
          }),
        }}
      >
        🧋
      </Interactive.Div>
      <Interactive.Div name="Sama dengan" style={{ fontSize: 92, fontWeight: 800 }}>
        RM10 = <span style={{ color: HIJAU }}>1 kopi ais</span>
      </Interactive.Div>
      <Interactive.Div
        name="Kecil kan"
        style={{
          fontSize: 56,
          color: KELABU,
          opacity: interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], clamp),
        }}
      >
        Kecil je, kan?
      </Interactive.Div>
      <Interactive.Div
        name="Sebulan"
        style={{
          marginTop: 60,
          padding: "30px 60px",
          borderRadius: 32,
          backgroundColor: "rgba(34,197,94,0.14)",
          border: `4px solid ${HIJAU}`,
          opacity: interpolate(frame, [2.2 * fps, 2.6 * fps], [0, 1], clamp),
          scale: interpolate(frame, [2.2 * fps, 2.7 * fps], [0.7, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <div style={{ fontSize: 56, color: KELABU }}>Sebulan</div>
        <div style={{ fontSize: 150, fontWeight: 800, color: HIJAU, lineHeight: 1.05 }}>
          {rm(interpolate(frame, [2.4 * fps, 3.6 * fps], [0, 300], { ...clamp, easing: keluar }))}
        </div>
      </Interactive.Div>
    </Babak>
  );
};

const Kiraan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kotak: React.CSSProperties = {
    width: "100%",
    padding: "34px 40px",
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  return (
    <Babak name="Kiraan">
      <Interactive.Div
        name="Baris setahun"
        style={{
          ...kotak,
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0, 0.4 * fps], ["-80px 0px", "0px 0px"], {
            ...clamp,
            easing: keluar,
          }),
        }}
      >
        <span style={{ fontSize: 60, color: KELABU }}>Setahun</span>
        <span style={{ fontSize: 100, fontWeight: 800 }}>
          {rm(interpolate(frame, [0.2 * fps, 1.6 * fps], [0, 3650], { ...clamp, easing: keluar }))}
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="Baris 5 tahun"
        style={{
          ...kotak,
          border: `4px solid ${HIJAU}`,
          opacity: interpolate(frame, [2.4 * fps, 2.7 * fps], [0, 1], clamp),
          translate: interpolate(frame, [2.4 * fps, 2.8 * fps], ["80px 0px", "0px 0px"], {
            ...clamp,
            easing: keluar,
          }),
        }}
      >
        <span style={{ fontSize: 60, color: KELABU, textAlign: "left", lineHeight: 1.1 }}>
          5 tahun
          <br />
          simpan biasa
        </span>
        <span style={{ fontSize: 100, fontWeight: 800, color: HIJAU }}>
          {rm(interpolate(frame, [2.6 * fps, 4 * fps], [0, 18250], { ...clamp, easing: keluar }))}
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="Formula"
        style={{
          fontSize: 48,
          color: KELABU,
          marginTop: 10,
          opacity: interpolate(frame, [4.2 * fps, 4.6 * fps], [0, 1], clamp),
        }}
      >
        RM10 × 365 hari × 5 tahun
      </Interactive.Div>
    </Babak>
  );
};

const Pulangan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tinggiMaks = 620;
  return (
    <Babak name="Pulangan">
      <Interactive.Div
        name="Tajuk"
        style={{
          fontSize: 80,
          fontWeight: 800,
          lineHeight: 1.15,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
        }}
      >
        Tapi kalau dapat
        <br />
        <span style={{ color: EMAS }}>pulangan ~5% setahun…</span>
      </Interactive.Div>
      <Interactive.Div
        name="Carta"
        style={{
          marginTop: 50,
          height: tinggiMaks + 90,
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 26,
        }}
      >
        {NILAI_TAHUNAN.map((nilai, i) => {
          const mula = (0.8 + i * 0.7) * fps;
          const terakhir = i === NILAI_TAHUNAN.length - 1;
          return (
            <div
              key={i}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: terakhir ? EMAS : PUTIH,
                  opacity: interpolate(frame, [mula + 0.4 * fps, mula + 0.6 * fps], [0, 1], clamp),
                }}
              >
                {terakhir ? "???" : rm(nilai / 1000) + "K"}
              </div>
              <div
                style={{
                  width: "100%",
                  borderRadius: "18px 18px 6px 6px",
                  background: terakhir
                    ? `linear-gradient(180deg, ${EMAS}, #b45309)`
                    : `linear-gradient(180deg, ${HIJAU}, #15803d)`,
                  height: interpolate(frame, [mula, mula + 0.6 * fps], [0, (nilai / 20686) * tinggiMaks], {
                    ...clamp,
                    easing: keluar,
                  }),
                }}
              />
              <div style={{ fontSize: 36, color: KELABU }}>Thn {i + 1}</div>
            </div>
          );
        })}
      </Interactive.Div>
    </Babak>
  );
};

const Debar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titik = Math.min(3, Math.floor(frame / (0.35 * fps)));
  return (
    <Babak name="Debar" bg="#030806">
      <Interactive.Div
        name="Jumlah akhir"
        style={{
          fontSize: 100,
          fontWeight: 800,
          scale: interpolate(frame, [0, 2 * fps], [1, 1.12], { ...clamp, output: "perceptual-scale" }),
        }}
      >
        Jumlah akhir dia{".".repeat(titik)}
        <span style={{ opacity: 0 }}>{".".repeat(3 - titik)}</span>
      </Interactive.Div>
    </Babak>
  );
};

const Kejutan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Babak name="Kejutan" bg="radial-gradient(circle at 50% 40%, #3b2a05 0%, #0b0903 70%)">
      <Interactive.Div
        name="Kilat"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "white",
          opacity: interpolate(frame, [0, 6], [0.85, 0], clamp),
        }}
      />
      <Interactive.Div
        name="Jumlah"
        style={{
          fontSize: 172,
          fontWeight: 800,
          lineHeight: 1,
          color: EMAS,
          textShadow: "0 0 60px rgba(251,191,36,0.55)",
          scale: interpolate(frame, [0, 0.25 * fps], [1.8, 1], {
            ...clamp,
            easing: Easing.bezier(0.2, 0, 0, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        RM20,700
      </Interactive.Div>
      <Interactive.Div
        name="Deposit"
        style={{
          fontSize: 66,
          fontWeight: 800,
          lineHeight: 1.2,
          opacity: interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0.5 * fps, 0.8 * fps], ["0px 40px", "0px 0px"], {
            ...clamp,
            easing: keluar,
          }),
        }}
      >
        🏠 = deposit 10% rumah RM200K
      </Interactive.Div>
      <Interactive.Div
        name="Penutup"
        style={{
          fontSize: 84,
          fontWeight: 800,
          color: HIJAU,
          marginTop: 30,
          opacity: interpolate(frame, [1.3 * fps, 1.6 * fps], [0, 1], clamp),
          scale: interpolate(frame, [1.3 * fps, 1.7 * fps], [0.8, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        Dari secawan kopi.
      </Interactive.Div>
      <Interactive.Div
        name="Penafian"
        style={{
          position: "absolute",
          bottom: 430,
          left: 90,
          right: 90,
          fontSize: 30,
          color: KELABU,
          opacity: interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], clamp),
        }}
      >
        Anggaran: RM304/bulan, 5% setahun dikompaun bulanan. Pulangan tidak dijamin. Bukan nasihat kewangan.
      </Interactive.Div>
    </Babak>
  );
};

export const RM10Sehari: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#071a12" }}>
      <Series>
        <Series.Sequence name="Hook" durationInFrames={3 * fps}>
          <Hook />
        </Series.Sequence>
        <Series.Sequence name="Kopi" durationInFrames={5 * fps}>
          <Kopi />
        </Series.Sequence>
        <Series.Sequence name="Kiraan" durationInFrames={6 * fps}>
          <Kiraan />
        </Series.Sequence>
        <Series.Sequence name="Pulangan" durationInFrames={6 * fps}>
          <Pulangan />
        </Series.Sequence>
        <Series.Sequence name="Debar" durationInFrames={2 * fps}>
          <Debar />
        </Series.Sequence>
        <Series.Sequence name="Kejutan" durationInFrames={3 * fps}>
          <Kejutan />
        </Series.Sequence>
      </Series>

      <Interactive.Div
        name="Handle"
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: font,
          fontSize: 40,
          fontWeight: 800,
          color: "rgba(248,250,252,0.55)",
        }}
      >
        @duitgajikecil
      </Interactive.Div>
      <Interactive.Div
        name="Bar kemajuan"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 12,
          backgroundColor: HIJAU,
          width: interpolate(frame, [0, durationInFrames], ["0%", "100%"], clamp),
        }}
      />

      <Audio src={staticFile("sfx/beat.mp3")} volume={0.35} durationInFrames={20 * fps} />
      <Audio src={staticFile("sfx/pop.wav")} volume={0.8} />
      <Audio src={staticFile("sfx/whoosh.wav")} from={3 * fps - 6} volume={0.6} />
      <Audio src={staticFile("sfx/pop.wav")} from={5.2 * fps} volume={0.7} />
      <Audio src={staticFile("sfx/whoosh.wav")} from={8 * fps - 6} volume={0.6} />
      <Audio src={staticFile("sfx/pop.wav")} from={10.4 * fps} volume={0.7} />
      <Audio src={staticFile("sfx/whoosh.wav")} from={14 * fps - 6} volume={0.6} />
      <Audio src={staticFile("sfx/riser.wav")} from={20 * fps} volume={0.8} />
      <Audio src={staticFile("sfx/boom.wav")} from={22 * fps} volume={1} />
    </AbsoluteFill>
  );
};
