import { RheumatologyGuidePage } from '@/components/reumatismos/RheumatologyGuidePage';
import { inflammatoryBackPainGuide } from '@/data/reumatismosGuides';

export default function DorLombarInflamatoriaPage() {
  return <RheumatologyGuidePage guide={inflammatoryBackPainGuide} />;
}
