import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect } from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const fontFamily = "Inter";

export const SIRI_FPS = 30;
export const SIRI_DURATION = 180;

// Kamera digerakkan oleh frame semasa (bukan useFrame) supaya render tidak berkelip.
export const CameraRig: React.FC<{
  position: [number, number, number];
  lookAt?: [number, number, number];
}> = ({ position, lookAt = [0, 0, 0] }) => {
  const camera = useThree((s) => s.camera);
  const [x, y, z] = position;
  const [lx, ly, lz] = lookAt;

  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z, lx, ly, lz]);

  return null;
};

export const Scene3D: React.FC<{
  name: string;
  background: string;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}> = ({ name, background, title, subtitle, accent, children }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill name={name} style={{ background, fontFamily, color: "white" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 9], fov: 45 }}
      >
        {children}
      </ThreeCanvas>
      <AbsoluteFill
        name="Teks"
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          textAlign: "center",
          paddingBottom: 110,
          gap: 16,
        }}
      >
        <Interactive.Div
          name="Tajuk"
          style={{
            fontSize: 110,
            fontWeight: 800,
            lineHeight: 1,
            textShadow: `0 0 40px ${accent}`,
            opacity: interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [0.6 * fps, 1.4 * fps], ["0px 60px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 12 }),
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Subjudul"
          style={{
            fontSize: 48,
            fontWeight: 400,
            color: accent,
            opacity: interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [1.2 * fps, 1.8 * fps], ["0px 30px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
      <Interactive.Div
        name="Fade"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#05060f",
          opacity: interpolate(
            frame,
            [0, 10, durationInFrames - 12, durationInFrames],
            [1, 0, 0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      />
    </AbsoluteFill>
  );
};
