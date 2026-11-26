import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { RM10Sehari } from "./RM10Sehari";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="RM10Sehari"
        component={RM10Sehari}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
