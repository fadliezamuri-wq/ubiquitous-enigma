import { Composition, Folder } from "remotion";
import { MyComposition } from "./Composition";
import { SCENES, SiDuri, SI_DURI_DURATION } from "./durian/SiDuri";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Folder name="SiDuri-Scenes">
        {SCENES.map((s) => (
          <Composition key={s.id} id={s.id} component={s.component} width={1920} height={1080} fps={30} durationInFrames={s.duration} />
        ))}
      </Folder>
      <Composition id="SiDuri" component={SiDuri} width={1920} height={1080} fps={30} durationInFrames={SI_DURI_DURATION} />
    </>
  );
};
