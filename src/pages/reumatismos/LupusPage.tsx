import { RheumatologyGuidePage } from '@/components/reumatismos/RheumatologyGuidePage';
import { lupusGuide } from '@/data/reumatismosGuides';

export default function LupusPage() {
  return <RheumatologyGuidePage guide={lupusGuide} />;
}
