import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { NotaKopiAis } from "./NotaKopiAis";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="NotaKopiAis"
        component={NotaKopiAis}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
