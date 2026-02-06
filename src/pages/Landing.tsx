import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { UHSLogo, UHSLogoMark } from '@/components/brand/UHSLogo';
import { TrustBadge, TrustBadgeGroup, PrivacyPromise } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid, StatHighlight } from '@/components/brand/FeatureCard';
import { KnowledgeSearch, KnowledgeStats } from '@/components/landing/KnowledgeSearch';
import { AlphaCTASection, AlphaInvite } from '@/components/landing/AlphaInvite';
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
  BookOpen,
  Search,
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
    icon: BookOpen,
    title: 'Knowledge Repository',
    description: 'Curated guidelines, protocols, and clinical pearls from rheumatology societies worldwide.',
  },
  {
    icon: Sparkles,
    title: 'AI Research Engine',
    description: 'Exponentially grow knowledge with AI-powered research, generation, and multi-step verification.',
    badge: 'New',
  },
];

const stats = [
  { value: '100%', label: 'Privacy Compliant', icon: Shield },
  { value: '0', label: 'PHI On-Chain', icon: Lock },
  { value: '∞', label: 'Audit History', icon: FileCheck },
  { value: '24/7', label: 'Data Sovereignty', icon: Fingerprint },
];

export default function Landing() {
  const { t } = useTranslation();
  const [showAlphaInvite, setShowAlphaInvite] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <UHSLogo size="sm" />
          <div className="flex items-center gap-4">
            <LanguageSelector variant="minimal" />
            <Link to="/reumato">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                <Activity className="h-4 w-4" />
                Reumato
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">{t('common.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                {t('common.getStarted')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
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
              {t('landing.hero.title').includes('Universal') ? (
                <>
                  The{' '}
                  <span className="gradient-text-organic">Universal Health</span>
                  <br />
                  Operating System
                </>
              ) : (
                <span className="gradient-text-organic">{t('landing.hero.title')}</span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('landing.hero.description')}
            </p>

            {/* Big Knowledge Search */}
            <div className="max-w-2xl mx-auto mb-10">
              <KnowledgeSearch size="large" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 h-12 text-base bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                  Start Building
                </Button>
              </Link>
              <Link to="/ai-research">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-primary/50 hover:bg-primary/5">
                  <Brain className="h-5 w-5" />
                  AI Research Engine
                </Button>
              </Link>
              <Link to="/knowledge">
                <Button size="lg" variant="ghost" className="gap-2 px-8 h-12 text-base">
                  <BookOpen className="h-5 w-5" />
                  Explore Knowledge
                </Button>
              </Link>
            </div>

            {/* Rheumatology Tools Link */}
            <div className="mb-12 flex flex-wrap justify-center gap-4">
              <Link to="/reumato">
                <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Activity className="h-5 w-5" />
                  Rheumatology Portal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/urv">
                <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Blocks className="h-5 w-5" />
                  URV Blockchain
                  <ArrowRight className="h-4 w-4" />
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

      {/* Revolutionary Knowledge Section */}
      <section className="py-24 px-6 bg-muted/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[hsl(42_85%_55%)]/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              A New Era in Medical Knowledge
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              The World's First{' '}
              <span className="gradient-text-organic">Living Knowledge</span>
              <br />
              <span className="text-2xl md:text-4xl">Ecosystem for Rheumatology</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              For decades, clinical knowledge has been fragmented across PDFs, journals, society websites, 
              and institutional silos. <strong className="text-foreground">We're changing that forever.</strong>
            </p>
          </div>

          {/* The Problem */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="uhs-card-elevated p-8">
              <div className="text-destructive/80 font-semibold text-sm uppercase tracking-wide mb-4">The Problem Today</div>
              <h3 className="text-xl font-bold mb-4">Knowledge is Scattered & Static</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Guidelines buried in 200-page PDFs across dozens of society websites</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Updates take years; clinicians work with outdated recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  <span>No way to compare ACR vs EULAR vs APLAR approaches side-by-side</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✗</span>
                  <span>Clinical pearls lost in individual practice, never shared globally</span>
                </li>
              </ul>
            </div>

            <div className="uhs-card-elevated p-8 border-primary/30">
              <div className="text-primary font-semibold text-sm uppercase tracking-wide mb-4">Our Revolution</div>
              <h3 className="text-xl font-bold mb-4">Living, Unified, Evolving</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">One Platform:</strong> All societies, all guidelines, all protocols—searchable instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">Always Current:</strong> Real-time updates as new evidence emerges</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">Expert Curated:</strong> Society-endorsed with transparent provenance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span><strong className="text-foreground">AI-Enhanced:</strong> Instant answers, comparisons, and clinical decision support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Vision Statement */}
          <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-[hsl(42_85%_55%)]/5 border border-border">
            <blockquote className="text-xl md:text-2xl font-medium text-foreground italic mb-4">
              "Imagine asking any clinical question and getting the synthesized wisdom of 
              ACR, EULAR, APLAR, and 50+ rheumatology societies—in seconds, with citations."
            </blockquote>
            <p className="text-muted-foreground">
              This is not a database. It's a <strong className="text-foreground">living knowledge organism</strong> that grows smarter every day.
            </p>
          </div>

          {/* Stats */}
          <div className="uhs-card-elevated p-8">
            <KnowledgeStats />
            <div className="mt-8 text-center">
              <Link to="/knowledge">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                  <Search className="h-5 w-5" />
                  Explore the Knowledge Revolution
                </Button>
              </Link>
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

      {/* Alpha CTA Section for Leaders */}
      <AlphaCTASection onOpenInvite={() => setShowAlphaInvite(true)} />

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
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowAlphaInvite(true)}
              className="gap-2 px-10 h-14 text-lg"
            >
              <Users className="h-5 w-5" />
              Join Alpha (Leaders)
            </Button>
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
              <Link to="/reumato" className="hover:text-foreground transition-colors">
                Reumato Portal
              </Link>
              <Link to="/knowledge" className="hover:text-foreground transition-colors">
                Knowledge
              </Link>
              <Link to="/learn" className="hover:text-foreground transition-colors">
                Patient Education
              </Link>
              <Link to="/urv" className="hover:text-foreground transition-colors">
                URV Chain
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

      {/* Alpha Invite Dialog */}
      <AlphaInvite open={showAlphaInvite} onOpenChange={setShowAlphaInvite} />
    </div>
  );
}
