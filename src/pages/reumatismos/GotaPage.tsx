import { RheumatologyGuidePage } from '@/components/reumatismos/RheumatologyGuidePage';
import { goutGuide } from '@/data/reumatismosGuides';

export default function GotaPage() {
  return <RheumatologyGuidePage guide={goutGuide} />;
}
