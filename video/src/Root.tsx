import { MyComposition } from "./Composition";
import { DuriDurianCompositions } from "./duri/Episod3";
import { SiriCompositions } from "./siri/Siri";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <SiriCompositions />
      <DuriDurianCompositions />
    </>
  );
};
