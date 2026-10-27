import { MyComposition } from "./Composition";
import { SiriCompositions } from "./siri/Siri";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <SiriCompositions />
    </>
  );
};
