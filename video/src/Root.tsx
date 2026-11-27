import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { NotaKopiAis } from "./NotaKopiAis";
import { KadKredit3D } from "./KadKredit3D";

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
      <Composition
        id="KadKredit3D"
        component={KadKredit3D}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
