import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UHSLogo, UHSLogoMark } from '@/components/brand/UHSLogo';
import { TrustBadge, TrustBadgeGroup, PrivacyPromise } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid, StatHighlight } from '@/components/brand/FeatureCard';
import { 
  Shield, 
  Activity, 
  Users, 
  Calendar,
  ArrowRight,
  Lock,
  Link2,
  Fingerprint,
  FileCheck,
  Blocks,
  Heart,
  Brain,
  Sparkles,
  CheckCircle,
  Zap,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Privacy-First Architecture',
    description: 'Zero PHI on-chain. Only cryptographic proofs and consent records touch the blockchain.',
    badge: 'Core',
  },
  {
    icon: Link2,
    title: 'Blockchain Audit Trail',
    description: 'Immutable record of every access, consent, and clinical score update on Solana.',
  },
  {
    icon: Activity,
    title: 'Clinical Value Scoring',
    description: 'URV methodology: Results, Process, Infrastructure, Evolution, Experience metrics.',
  },
  {
    icon: Fingerprint,
    title: 'Consent Management',
    description: 'Patient-controlled data access with revocable consent and purpose-based permissions.',
  },
  {
    icon: Brain,
    title: 'AI Clinical Insights',
    description: 'Longitudinal analysis and decision support powered by privacy-preserving AI.',
  },
  {
    icon: Calendar,
    title: 'Workflow Coordination',
    description: 'Infusions, follow-ups, safety monitoring, and team coordination in one place.',
  },
];

const stats = [
  { value: '100%', label: 'Privacy Compliant', icon: Shield },
  { value: '0', label: 'PHI On-Chain', icon: Lock },
  { value: '∞', label: 'Audit History', icon: FileCheck },
  { value: '24/7', label: 'Data Sovereignty', icon: Fingerprint },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <UHSLogo size="sm" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 hero-pattern overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[hsl(42_85%_55%)]/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-12">
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <TrustBadge variant="privacy" size="md" />
              <TrustBadge variant="blockchain" size="md" />
              <TrustBadge variant="consent" size="md" />
            </div>

            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              The{' '}
              <span className="gradient-text-organic">Universal Health</span>
              <br />
              Operating System
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Privacy-preserving clinical workflows with blockchain-verified audit trails. 
              Your patients' data sovereignty, protected by cryptographic proofs on Solana.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 h-12 text-base bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                  Start Building
                </Button>
              </Link>
              <Link to="/urv">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <Blocks className="h-5 w-5" />
                  Explore URV Chain
                </Button>
              </Link>
            </div>

            {/* Social proof / Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <StatHighlight key={stat.label} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[hsl(170_25%_12%)] to-[hsl(170_28%_8%)] text-[hsl(160_15%_92%)]">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-8">
            <Heart className="h-4 w-4" />
            Our Manifesto
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Healthcare Data Belongs to{' '}
            <span className="text-[hsl(168_55%_50%)]">Patients</span>
          </h2>
          
          <div className="space-y-6 text-lg text-white/70 leading-relaxed max-w-3xl mx-auto">
            <p>
              We believe in a future where clinical excellence meets absolute data sovereignty. 
              Where every access is auditable, every consent is cryptographically enforced, 
              and no personally identifiable information ever touches an immutable ledger.
            </p>
            <p>
              UHS Health OS stores only <strong className="text-white">hashes and commitments</strong> on-chain. 
              Patient records stay encrypted off-chain, controlled by patient consent. 
              The blockchain serves as an <strong className="text-white">incorruptible audit log</strong>—nothing more.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-sm">
              <CheckCircle className="h-4 w-4 text-[hsl(158_55%_50%)]" />
              <span>HIPAA Aligned</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-sm">
              <CheckCircle className="h-4 w-4 text-[hsl(158_55%_50%)]" />
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-sm">
              <CheckCircle className="h-4 w-4 text-[hsl(158_55%_50%)]" />
              <span>Zero-Knowledge Proofs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="gradient-text">Clinical Excellence</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Purpose-built tools for managing chronic conditions, biologic therapies, 
              and complex follow-ups—all with blockchain-verified integrity.
            </p>
          </div>

          <FeatureGrid columns={3}>
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} gradient />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Privacy Promise Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="uhs-card-elevated p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <UHSLogoMark className="w-16 h-16 mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Privacy by <span className="gradient-text">Design</span>
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  UHS Health OS is an organizational tool, not a medical record system. 
                  We never store patient names, government IDs, phone numbers, or addresses. 
                  Use your own patient codes for reference—we never see the real identifiers.
                </p>
                <TrustBadgeGroup badges={['privacy', 'encrypted', 'audit']} size="sm" />
              </div>
              <div>
                <PrivacyPromise />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 hero-pattern">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="mb-8">
            <Globe className="h-12 w-12 mx-auto text-primary mb-4" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join the Future of{' '}
            <span className="gradient-text-organic">Health Data</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Whether you're a clinician seeking better workflows, a researcher needing auditable data, 
            or a patient wanting control—UHS Health OS is built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-10 h-14 text-lg bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-xl">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} UHS Health OS</p>
                <p className="text-xs">Universal Health System</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/learn" className="hover:text-foreground transition-colors">
                Patient Education
              </Link>
              <Link to="/urv" className="hover:text-foreground transition-colors">
                URV Chain
              </Link>
              <Link to="/blockchain" className="hover:text-foreground transition-colors">
                Blockchain Registry
              </Link>
            </div>
            <TrustBadgeGroup badges={['privacy', 'blockchain']} size="sm" />
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              This is an organizational tool for healthcare professionals. 
              It does not constitute an official medical record system. 
              No PHI/PII is stored on the blockchain.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
