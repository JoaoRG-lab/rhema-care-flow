import { RheumatologyGuidePage } from '@/components/reumatismos/RheumatologyGuidePage';
import { osteoporosisGuide } from '@/data/reumatismosGuides';

export default function OsteoporosePage() {
  return <RheumatologyGuidePage guide={osteoporosisGuide} />;
}
