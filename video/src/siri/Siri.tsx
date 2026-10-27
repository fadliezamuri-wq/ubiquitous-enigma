import { Composition, Folder, Series } from "remotion";
import { SIRI_DURATION, SIRI_FPS } from "./shared";
import { Siri1Kristal } from "./Siri1Kristal";
import { Siri2Durian } from "./Siri2Durian";
import { Siri3Gelombang } from "./Siri3Gelombang";
import { Siri4Kiub } from "./Siri4Kiub";
import { Siri5Galaksi } from "./Siri5Galaksi";
import { Siri6Penutup } from "./Siri6Penutup";

const siri = [
  { id: "Siri1-Kristal", component: Siri1Kristal },
  { id: "Siri2-Durian", component: Siri2Durian },
  { id: "Siri3-Gelombang", component: Siri3Gelombang },
  { id: "Siri4-Kiub", component: Siri4Kiub },
  { id: "Siri5-Galaksi", component: Siri5Galaksi },
  { id: "Siri6-Penutup", component: Siri6Penutup },
];

export const SiriPenuh: React.FC = () => {
  return (
    <Series>
      {siri.map(({ id, component: Scene }) => (
        <Series.Sequence key={id} name={id} durationInFrames={SIRI_DURATION}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  );
};

export const SiriCompositions: React.FC = () => {
  return (
    <Folder name="Siri3D">
      <Composition
        id="SiriPenuh"
        component={SiriPenuh}
        durationInFrames={SIRI_DURATION * siri.length}
        fps={SIRI_FPS}
        width={1080}
        height={1080}
      />
      {siri.map(({ id, component }) => (
        <Composition
          key={id}
          id={id}
          component={component}
          durationInFrames={SIRI_DURATION}
          fps={SIRI_FPS}
          width={1080}
          height={1080}
        />
      ))}
    </Folder>
  );
};
