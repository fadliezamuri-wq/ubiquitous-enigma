import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Pembukaan } from "./scenes/Pembukaan";
import { Kesepian } from "./scenes/Kesepian";
import { Ribut } from "./scenes/Ribut";
import { Pagi } from "./scenes/Pagi";
import { Penutup } from "./scenes/Penutup";

export const SCENES = [
  { id: "Pembukaan", component: Pembukaan, duration: 180 },
  { id: "Kesepian", component: Kesepian, duration: 240 },
  { id: "Ribut", component: Ribut, duration: 180 },
  { id: "Pagi", component: Pagi, duration: 240 },
  { id: "Penutup", component: Penutup, duration: 150 },
] as const;

export const FADE = 15;
export const SI_DURI_DURATION =
  SCENES.reduce((s, x) => s + x.duration, 0) - FADE * (SCENES.length - 1);

export const SiDuri: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("si-duri-music.wav")} />
    <TransitionSeries>
      <TransitionSeries.Sequence name="Pembukaan" durationInFrames={180}>
        <Pembukaan />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />
      <TransitionSeries.Sequence name="Kesepian" durationInFrames={240}>
        <Kesepian />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />
      <TransitionSeries.Sequence name="Ribut" durationInFrames={180}>
        <Ribut />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />
      <TransitionSeries.Sequence name="Pagi" durationInFrames={240}>
        <Pagi />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE })}
      />
      <TransitionSeries.Sequence name="Penutup" durationInFrames={150}>
        <Penutup />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
