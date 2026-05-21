import { RheumatologyGuidePage } from '@/components/reumatismos/RheumatologyGuidePage';
import { rheumatoidArthritisGuide } from '@/data/reumatismosGuides';

export default function ArtriteReumatoidePage() {
  return <RheumatologyGuidePage guide={rheumatoidArthritisGuide} />;
}
