import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const fontFamily = "Inter";

loadFont({
  family: fontFamily,
  url: staticFile("fonts/Inter-Regular.otf"),
  weight: "400",
});
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Inter-ExtraBold.otf"),
  weight: "800",
});

export const MyComposition = () => {
  return (
    <Composition
      id="TeksAnimasi"
      component={TeksAnimasi}
      durationInFrames={240}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};

export const TeksAnimasi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #312e81 100%)",
        fontFamily,
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "100px 80px",
        gap: 32,
      }}
    >
      <Interactive.Div
        name="Helo"
        style={{
          fontSize: 200,
          fontWeight: 800,
          lineHeight: 1,
          opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 0.8 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        Helo!
      </Interactive.Div>
      <Interactive.Div
        name="Subjudul"
        style={{
          fontSize: 56,
          fontWeight: 400,
          color: "#c7d2fe",
          opacity: interpolate(frame, [1.2 * fps, 2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [1.2 * fps, 2 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Selamat datang ke
      </Interactive.Div>
      <Interactive.Div
        name="Nama proyek"
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: "#fbbf24",
          opacity: interpolate(frame, [2.2 * fps, 3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [2.2 * fps, 3 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        ubiquitous
        <br />
        enigma
      </Interactive.Div>
      <Interactive.Div
        name="Garis aksen"
        style={{
          height: 12,
          borderRadius: 6,
          backgroundColor: "#fbbf24",
          width: interpolate(frame, [3 * fps, 4 * fps], [0, 360], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Fade out"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0f172a",
          opacity: interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
