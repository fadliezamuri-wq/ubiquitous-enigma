import { Easing, interpolate } from "remotion";

// Clamped interpolate with a soft ease by default.
export const ip = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Little hop: 0 on the ground, peaks at 1 halfway through each period.
export const hop = (frame: number, period: number, phase = 0) => {
  const t = (((frame + phase) % period) + period) % period;
  return Math.sin((t / period) * Math.PI);
};

// Squash & stretch factor from a hop value (stretch in the air, squash at landing).
export const squashFromHop = (h: number) =>
  h < 0.15 ? 1 - (0.15 - h) * 1.2 : 1 + h * 0.08;

// Blink at fixed beats so characters feel alive.
export const autoBlink = (frame: number, offset = 0) => {
  const t = (frame + offset) % 95;
  return t < 3 ? 1 - Math.abs(t - 1.5) / 1.5 : 0;
};

export type Vec3 = [number, number, number];
