import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Video 3D (Three.js) niche kewangan:
// "Kad kredit RM5,000, bayar minimum je. Berapa lama nak habis?"
// Anggaran: faedah 18% setahun (1.5% sebulan), bayaran minimum 5% atau RM50.

const font = "Inter";
const EMAS = "#fbbf24";
const MERAH = "#f43f5e";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const keluar = Easing.bezier(0.16, 1, 0.3, 1);

const HUTANG = 5000;
const NILAI_SYILING = 250; // 1 syiling = RM250

// Simulasi bulan demi bulan: [baki, faedah terkumpul] selepas setiap bulan.
const simulasi = (bayar: (baki: number) => number) => {
  const hasil: { baki: number; faedah: number }[] = [{ baki: HUTANG, faedah: 0 }];
  let baki = HUTANG;
  let faedah = 0;
  while (baki > 0.005) {
    const f = baki * 0.015;
    faedah += f;
    baki += f;
    baki -= Math.min(baki, bayar(baki));
    hasil.push({ baki, faedah });
  }
  return hasil;
};
const MINIMUM = simulasi((b) => Math.max(0.05 * b, 50)); // 69 bulan
const TETAP = simulasi(() => 300); // 20 bulan
const FAEDAH_MIN = MINIMUM[MINIMUM.length - 1].faedah;
const FAEDAH_TETAP = TETAP[TETAP.length - 1].faedah;
const BULAN_MIN = MINIMUM.length - 1;
const BULAN_TETAP = TETAP.length - 1;

const rm = (n: number) => "RM" + Math.round(n).toLocaleString("en-US");

const Syiling: React.FC<{ y: number; warna: string; skala?: number }> = ({ y, warna, skala = 1 }) => (
  <mesh position={[0, y, 0]} scale={[skala, 1, skala]}>
    <cylinderGeometry args={[0.6, 0.6, 0.1, 48]} />
    <meshStandardMaterial color={warna} metalness={0.75} roughness={0.28} />
  </mesh>
);

const Timbunan: React.FC<{ x: number; bilangan: number; warna: string; jatuhMula?: number }> = ({
  x,
  bilangan,
  warna,
  jatuhMula,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const penuh = Math.floor(bilangan);
  const baki = bilangan - penuh;
  return (
    <group position={[x, -1.6, 0]}>
      {Array.from({ length: penuh }).map((_, i) => {
        // Kalau ada jatuhMula, syiling jatuh satu-satu dari atas.
        const t = jatuhMula === undefined ? 1 : interpolate(frame, [jatuhMula + i * 2, jatuhMula + i * 2 + 0.35 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) });
        if (t <= 0) return null;
        return <Syiling key={i} y={i * 0.11 + (1 - t) * 4} warna={warna} />;
      })}
      {baki > 0.05 ? <Syiling y={penuh * 0.11} warna={warna} skala={0.5 + baki * 0.5} /> : null}
    </group>
  );
};

const Kad: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <group
      position={[
        0,
        interpolate(frame, [3.6 * fps, 4.4 * fps], [0.2, 5], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) }),
        0,
      ]}
      rotation={[
        0.25 + Math.sin(frame / 22) * 0.08,
        interpolate(frame, [0, 1.2 * fps], [-Math.PI * 1.5, -0.35], { ...clamp, easing: keluar }) + Math.sin(frame / 30) * 0.25,
        -0.12,
      ]}
      scale={interpolate(frame, [0, 0.8 * fps], [0.35, 0.85], { ...clamp, easing: keluar })}
    >
      <mesh>
        <boxGeometry args={[3.4, 2.15, 0.07]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* jalur warna */}
      <mesh position={[0, 0.55, 0.04]}>
        <boxGeometry args={[3.4, 0.32, 0.01]} />
        <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* cip */}
      <mesh position={[-1.05, -0.05, 0.045]}>
        <boxGeometry args={[0.55, 0.42, 0.02]} />
        <meshStandardMaterial color={EMAS} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* nombor kad (titik-titik) */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-1.35 + i * 0.165 + Math.floor(i / 4) * 0.12, -0.6, 0.045]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}
    </group>
  );
};

const Teks: React.FC<{
  children: React.ReactNode;
  mula: number;
  tamat?: number;
  top: number;
  saiz: number;
  warna?: string;
  name: string;
}> = ({ children, mula, tamat = 99, top, saiz, warna = "#fff", name }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < mula * fps || frame >= tamat * fps) return null;
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: font,
        fontWeight: 800,
        fontSize: saiz,
        lineHeight: 1.12,
        color: warna,
        textShadow: "0 6px 30px rgba(0,0,0,0.6)",
        opacity: interpolate(frame, [mula * fps, mula * fps + 6], [0, 1], clamp),
        translate: interpolate(frame, [mula * fps, mula * fps + 10], ["0px 30px", "0px 0px"], { ...clamp, easing: keluar }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const KadKredit3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = (x: number) => x * fps;

  // Babak kiraan (4s–12s): bulan berjalan 1 → 69
  const bulan = Math.round(interpolate(frame, [s(5.5), s(12)], [0, BULAN_MIN], clamp));
  const faedahKini = MINIMUM[bulan].faedah;
  // Babak 19s–22s: timbunan faedah mengecut ke senario RM300 sebulan
  const faedahPapar = interpolate(frame, [s(19.5), s(21.5)], [faedahKini, FAEDAH_TETAP], { ...clamp, easing: keluar });
  const tunjukTimbunan = frame >= s(4);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, #1e293b 0%, #020617 75%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 40 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 6]} intensity={1.6} />
        <pointLight position={[-4, -2, 4]} intensity={18} color="#60a5fa" />
        <pointLight position={[3, 1, 3]} intensity={interpolate(frame, [s(12), s(12.3), s(14)], [0, 30, 10], clamp)} color={MERAH} />
        <Kad />
        {tunjukTimbunan ? (
          <group rotation={[0.32, Math.sin(frame / 45) * 0.45, 0]}>
            <Timbunan x={-0.85} bilangan={HUTANG / NILAI_SYILING} warna={EMAS} jatuhMula={s(4)} />
            <Timbunan x={0.85} bilangan={faedahPapar / NILAI_SYILING} warna={MERAH} />
          </group>
        ) : null}
      </ThreeCanvas>

      {/* 0–4s: hook */}
      <Teks name="Hook 1" mula={0} tamat={4} top={300} saiz={96}>
        kad kredit <span style={{ color: EMAS }}>RM5,000</span>
      </Teks>
      <Teks name="Hook 2" mula={0.9} tamat={4} top={1290} saiz={68}>
        bayar minimum je...
      </Teks>
      <Teks name="Hook 3" mula={1.9} tamat={4} top={1390} saiz={68} warna={EMAS}>
        berapa lama nak habis?
      </Teks>

      {/* 4–5.5s: penerangan syiling */}
      <Teks name="Skala" mula={4.2} tamat={5.5} top={320} saiz={64}>
        1 syiling = <span style={{ color: EMAS }}>RM250</span>
      </Teks>

      {/* 4–12s: kiraan bulan */}
      <Teks name="Bulan" mula={5.5} tamat={12} top={300} saiz={120}>
        bulan {bulan}
      </Teks>
      <Teks name="Baki" mula={5.5} tamat={12} top={450} saiz={52} warna="#cbd5e1">
        baki hutang: {rm(MINIMUM[bulan].baki)}
      </Teks>
      <Teks name="Label hutang" mula={4.5} tamat={19} top={1460} saiz={40} warna={EMAS}>
        <span style={{ display: "inline-block", width: 380, marginRight: 40 }}>hutang asal</span>
        <span style={{ display: "inline-block", width: 380, color: MERAH }}>faedah {rm(faedahPapar)}</span>
      </Teks>

      {/* 12–19s: jawapan pertama */}
      <Teks name="Jawapan" mula={12} tamat={19} top={290} saiz={110}>
        5 tahun 9 bulan
      </Teks>
      <Teks name="Faedah" mula={13.2} tamat={19} top={430} saiz={64} warna={MERAH}>
        faedah je dah {rm(FAEDAH_MIN)}
      </Teks>
      <Teks name="Peratus" mula={15} tamat={19} top={520} saiz={46} warna="#cbd5e1">
        hampir 38% dari hutang asal
      </Teks>

      {/* 19–22s: soalan */}
      <Teks name="Soalan" mula={19} tamat={22} top={300} saiz={88}>
        tapi kalau bayar <span style={{ color: EMAS }}>RM300</span> sebulan?
      </Teks>
      <Teks name="Label 300" mula={19.5} tamat={25} top={1460} saiz={40} warna={EMAS}>
        <span style={{ display: "inline-block", width: 380, marginRight: 40 }}>hutang asal</span>
        <span style={{ display: "inline-block", width: 380, color: MERAH }}>faedah {rm(faedahPapar)}</span>
      </Teks>

      {/* 22–25s: kejutan */}
      <Teks name="Kejutan" mula={22} top={280} saiz={124} warna={EMAS}>
        {BULAN_TETAP} bulan je.
      </Teks>
      <Teks name="Jimat" mula={22.6} top={430} saiz={72}>
        jimat {rm(FAEDAH_MIN - FAEDAH_TETAP)} 🤯
      </Teks>
      <Teks name="Penafian" mula={22.6} top={530} saiz={28} warna="#94a3b8">
        anggaran: faedah 18% setahun, minimum 5% atau RM50. bukan nasihat kewangan
      </Teks>

      <Audio src={staticFile("sfx/clink.wav")} from={s(4.3)} volume={0.6} />
      <Audio src={staticFile("sfx/clink.wav")} from={s(4.9)} volume={0.6} />
      <Audio src={staticFile("sfx/clink.wav")} from={s(12)} volume={0.9} />
      <Audio src={staticFile("sfx/clink.wav")} from={s(22)} volume={1} />
    </AbsoluteFill>
  );
};
