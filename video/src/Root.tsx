import { BuahMenariComposition } from "./BuahMenari";
import { CicakMenariComposition } from "./CicakMenari";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <BuahMenariComposition />
      <CicakMenariComposition />
    </>
  );
};
