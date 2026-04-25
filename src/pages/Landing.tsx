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
  Shield, Activity, Users, Calendar, ArrowRight, Lock, Link2, Fingerprint,
  FileCheck, Blocks, Heart, Brain, Sparkles, CheckCircle, Zap, Globe, BookOpen, Search,
  Layers, GitBranch, ShieldCheck, Database, Code2, MessageSquare,
} from 'lucide-react';

const features = [
  { icon: Shield, title: 'Privacy-First Architecture', description: 'Zero PHI on-chain. Only cryptographic proofs and consent records touch the blockchain.', badge: 'Core', href: '/about' },
  { icon: Link2, title: 'Blockchain Audit Trail', description: 'Immutable record of every access, consent, and clinical score update on Solana.', href: '/urv' },
  { icon: Activity, title: 'Clinical Value Scoring', description: 'URV methodology: Results, Process, Infrastructure, Evolution, Experience metrics.', href: '/scores' },
  { icon: Fingerprint, title: 'Consent Management', description: 'Patient-controlled data access with revocable consent and purpose-based permissions.', href: '/about' },
  { icon: Brain, title: 'AI Clinical Insights', description: 'Longitudinal analysis and decision support powered by privacy-preserving AI.', href: '/ai-assistant' },
  { icon: BookOpen, title: 'Knowledge Repository', description: 'Curated guidelines, protocols, and clinical pearls from rheumatology societies worldwide.', href: '/learn' },
  { icon: Sparkles, title: 'AI Research Engine', description: 'Exponentially grow knowledge with AI-powered research, generation, and multi-step verification.', badge: 'New', href: '/ai-research' },
];

const stats = [
  { value: '100%', label: 'Privacy Compliant', icon: Shield },
  { value: '0', label: 'PHI On-Chain', icon: Lock },
  { value: '∞', label: 'Audit History', icon: FileCheck },
  { value: '24/7', label: 'AI-Powered', icon: Zap },
];

export default function Landing() {
  const { t } = useTranslation();
  const [showAlphaInvite, setShowAlphaInvite] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/30">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <UHSLogo size="sm" />
          <div className="flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            <Link to="/learn">
              <Button variant="ghost" size="sm" className="gap-1 text-primary flex">
                <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Library</span>
              </Button>
            </Link>
            <Link to="/scores">
              <Button variant="ghost" size="sm" className="gap-1 text-primary flex">
                <Activity className="h-4 w-4" /> <span className="hidden sm:inline">Calculators</span>
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm" className="gap-1 text-primary flex">
                <Shield className="h-4 w-4" /> <span className="hidden sm:inline">About</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">{t('common.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-md">
                {t('common.getStarted')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-16 left-[10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] hero-blob" />
        <div className="absolute bottom-0 right-[5%] w-[600px] h-[600px] bg-[hsl(42_85%_55%)]/6 rounded-full blur-[120px] hero-blob-2" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-[hsl(280_55%_55%)]/4 rounded-full blur-[80px] hero-blob" />
        
        {/* Floating particles */}
        <div className="absolute top-32 left-[20%] w-2 h-2 rounded-full bg-primary/40 particle" />
        <div className="absolute top-48 right-[25%] w-3 h-3 rounded-full bg-[hsl(42_85%_55%)]/30 particle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-[35%] w-2 h-2 rounded-full bg-primary/30 particle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-64 left-[75%] w-1.5 h-1.5 rounded-full bg-[hsl(165_60%_48%)]/50 particle" style={{ animationDelay: '0.5s' }} />

        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center">
            {/* Trust badges - animated */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 fade-up-stagger">
              <TrustBadge variant="privacy" size="md" />
              <TrustBadge variant="blockchain" size="md" />
              <TrustBadge variant="consent" size="md" />
            </div>

            {/* Main headline with shimmer */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 leading-[1.05] scale-in">
              {t('landing.hero.title').includes('Universal') ? (
                <>
                  The{' '}
                  <span className="text-shine">Universal Health</span>
                  <br />
                  Operating System
                </>
              ) : (
                <span className="text-shine">{t('landing.hero.title')}</span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-in" style={{ animationDelay: '0.2s' }}>
              {t('landing.hero.description')}
            </p>

            {/* Search bar with glow */}
            <div className="max-w-2xl mx-auto mb-10 animate-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-[hsl(42_85%_55%)]/20 to-primary/20 rounded-2xl blur-lg opacity-60" />
                <div className="relative">
                  <KnowledgeSearch size="large" />
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-in" style={{ animationDelay: '0.4s' }}>
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 h-13 text-base bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-lg pulse-glow">
                  <Sparkles className="h-5 w-5" /> Start Building
                </Button>
              </Link>
              <Link to="/ai-research">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-13 text-base border-primary/40 hover:bg-primary/5 hover:border-primary/60 transition-all">
                  <Brain className="h-5 w-5" /> AI Research Engine
                </Button>
              </Link>
              <Link to="/knowledge">
                <Button size="lg" variant="ghost" className="gap-2 px-8 h-13 text-base hover:bg-accent">
                  <BookOpen className="h-5 w-5" /> Explore Knowledge
                </Button>
              </Link>
            </div>

            {/* Quick links */}
            <div className="mb-14 flex flex-wrap justify-center gap-3 animate-in" style={{ animationDelay: '0.5s' }}>
              <Link to="/learn">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                  <BookOpen className="h-4 w-4" /> Knowledge Library <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link to="/scores">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                  <Activity className="h-4 w-4" /> Clinical Calculators <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link to="/reumato">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                  <Heart className="h-4 w-4" /> Rheumatology Portal <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <Link to="/urv">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                  <Blocks className="h-4 w-4" /> URV Blockchain <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Stats with stagger animation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto fade-up-stagger">
              {stats.map((stat) => (
                <StatHighlight key={stat.label} {...stat} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Knowledge Revolution Section ── */}
      <section className="py-28 px-6 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] hero-blob-2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(42_85%_55%)]/5 rounded-full blur-[100px] hero-blob" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-6 glow-ring">
              <Sparkles className="h-4 w-4" />
              A New Era in Medical Knowledge
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The World's First{' '}
              <span className="text-shine">Living Knowledge</span>
              <br />
              <span className="text-2xl md:text-4xl text-muted-foreground font-medium">Ecosystem for Rheumatology</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              For decades, clinical knowledge has been fragmented across PDFs, journals, society websites, 
              and institutional silos. <strong className="text-foreground">We're changing that forever.</strong>
            </p>
          </div>

          {/* Problem vs Solution */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="uhs-card-elevated p-8 hover:scale-[1.01] transition-transform duration-300">
              <div className="text-destructive/80 font-semibold text-sm uppercase tracking-widest mb-4">The Problem Today</div>
              <h3 className="text-xl font-bold mb-4">Knowledge is Scattered & Static</h3>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  'Guidelines buried in 200-page PDFs across dozens of society websites',
                  'Updates take years; clinicians work with outdated recommendations',
                  'No way to compare ACR vs EULAR vs APLAR approaches side-by-side',
                  'Clinical pearls lost in individual practice, never shared globally',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="text-destructive mt-1 text-lg">✗</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="uhs-card-elevated p-8 border-primary/30 relative overflow-hidden hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
              <div className="relative">
                <div className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Our Revolution</div>
                <h3 className="text-xl font-bold mb-4">Living, Unified, Evolving</h3>
                <ul className="space-y-3 text-muted-foreground">
                  {[
                    { strong: 'One Platform:', text: 'All societies, all guidelines, all protocols—searchable instantly' },
                    { strong: 'Always Current:', text: 'Real-time updates as new evidence emerges' },
                    { strong: 'Expert Curated:', text: 'Society-endorsed with transparent provenance' },
                    { strong: 'AI-Enhanced:', text: 'Instant answers, comparisons, and clinical decision support' },
                  ].map(({ strong, text }) => (
                    <li key={strong} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">{strong}</strong> {text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Vision quote */}
          <div className="text-center mb-12 p-10 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-[hsl(42_85%_55%)]/5 border border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/2 to-[hsl(42_85%_55%)]/2" />
            <blockquote className="relative text-xl md:text-2xl font-medium text-foreground italic mb-4 leading-relaxed">
              "Imagine asking any clinical question and getting the synthesized wisdom of 
              ACR, EULAR, APLAR, and 50+ rheumatology societies—in seconds, with citations."
            </blockquote>
            <p className="relative text-muted-foreground">
              This is not a database. It's a <strong className="text-foreground">living knowledge organism</strong> that grows smarter every day.
            </p>
          </div>

          {/* Stats */}
          <div className="uhs-card-elevated p-8">
            <KnowledgeStats />
            <div className="mt-8 text-center">
              <Link to="/knowledge">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-lg">
                  <Search className="h-5 w-5" /> Explore the Knowledge Revolution
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Manifesto ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-[hsl(170_25%_12%)] to-[hsl(170_28%_6%)] text-[hsl(160_15%_92%)] relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 rotate-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/3 rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
        
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-8 backdrop-blur-sm">
            <Heart className="h-4 w-4 text-[hsl(0_70%_65%)]" />
            Our Manifesto
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Healthcare Data Belongs to{' '}
            <span className="text-[hsl(168_55%_55%)]">Patients</span>
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

          <div className="mt-12 flex flex-wrap justify-center gap-4 fade-up-stagger">
            {['HIPAA Aligned', 'GDPR Ready', 'Zero-Knowledge Proofs'].map((label) => (
              <div key={label} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-[hsl(158_55%_55%)]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-28 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" /> Platform Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-shine">Clinical Excellence</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Purpose-built tools for managing chronic conditions, biologic therapies, 
              and complex follow-ups—all with blockchain-verified integrity.
            </p>
          </div>

          <div className="fade-up-stagger">
            <FeatureGrid columns={3}>
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} gradient />
              ))}
            </FeatureGrid>
          </div>
        </div>
      </section>

      {/* ── Roadmap & Architecture ── */}
      <section className="py-28 px-6 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[120px] hero-blob" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[hsl(42_85%_55%)]/4 rounded-full blur-[100px] hero-blob-2" />

        <div className="container mx-auto max-w-6xl relative">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-6 glow-ring">
              <GitBranch className="h-4 w-4" />
              Open Source Roadmap
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Construído para <span className="text-shine">Evoluir</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Sugestões da comunidade que guiam o desenvolvimento. Cada bloco é independente — 
              contribua onde sua expertise é maior.
            </p>
          </div>

          {/* Cards de sugestão */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {/* MVP */}
            <div className="uhs-card-elevated p-8 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-widest">Fase 1</div>
                    <h3 className="text-lg font-bold">Comece com um MVP focado</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Para criar momentum, começar com um núcleo pequeno mas funcional demonstra valor
                  e atrai contribuidores desde o início.
                </p>
                <ul className="space-y-2">
                  {[
                    'Timeline centrada no paciente — registro longitudinal de eventos',
                    'Entidades básicas: encontros, observações e medicamentos',
                    'Interface simples para visualizar continuidade ao longo do tempo',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FHIR */}
            <div className="uhs-card-elevated p-8 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(42_85%_55%)]/3 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(42_85%_55%)]/10 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-[hsl(42_85%_55%)]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[hsl(42_85%_55%)] uppercase tracking-widest">Interoperabilidade</div>
                    <h3 className="text-lg font-bold">Alinhamento com HL7 FHIR</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Alinhamento progressivo com recursos <code className="text-xs bg-muted px-1 py-0.5 rounded">Patient</code>,{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">Observation</code> e{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">Encounter</code> — sem necessidade de conformidade total no início.
                </p>
                <ul className="space-y-2">
                  {[
                    'Melhor compatibilidade de longo prazo',
                    'Onboarding mais fácil para contribuidores com experiência em saúde',
                    'Maior credibilidade para pilotos e integrações',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-[hsl(42_85%_55%)] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Consentimento */}
            <div className="uhs-card-elevated p-8 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280_55%_55%)]/3 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(280_55%_55%)]/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-[hsl(280_55%_55%)]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[hsl(280_55%_55%)] uppercase tracking-widest">Segurança</div>
                    <h3 className="text-lg font-bold">Consentimento e Auditabilidade</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Dado que dados de saúde são sensíveis, consentimento e auditoria precisam ser
                  features centrais — não adições posteriores.
                </p>
                <ul className="space-y-2">
                  {[
                    'Consentimento granular e revogável por tipo de dado e provedor',
                    'Permissões com validade temporal (time-bound)',
                    'Logs de auditoria imutáveis para todos os acessos e alterações',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-[hsl(280_55%_55%)] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Arquitetura */}
            <div className="uhs-card-elevated p-8 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(165_60%_48%)]/3 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(165_60%_48%)]/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-[hsl(165_60%_48%)]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[hsl(165_60%_48%)] uppercase tracking-widest">Arquitetura</div>
                    <h3 className="text-lg font-bold">Arquitetura Modular</h3>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                  Uma abordagem em camadas permite escalabilidade e que contribuidores
                  trabalhem de forma independente em diferentes domínios.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: Code2, label: 'API Layer', desc: 'REST / GraphQL', color: 'text-primary' },
                    { icon: Brain, label: 'Core Services', desc: 'Timeline, Identidade, Consentimento', color: 'text-[hsl(42_85%_55%)]' },
                    { icon: Link2, label: 'Interoperability Layer', desc: 'Adaptadores FHIR', color: 'text-[hsl(165_60%_48%)]' },
                    { icon: Database, label: 'Data Layer', desc: 'Estruturado + Event Store', color: 'text-[hsl(280_55%_55%)]' },
                    { icon: ShieldCheck, label: 'Security Layer', desc: 'Auth, Criptografia, Auditoria', color: 'text-destructive' },
                  ].map(({ icon: Icon, label, desc, color }) => (
                    <div key={label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA discussão */}
          <div className="text-center p-10 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-[hsl(42_85%_55%)]/5 border border-border/50">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Contribua com o Roadmap</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xl mx-auto">
              Essas sugestões vêm da comunidade. Quer propor uma implementação, criticar uma decisão
              ou sugerir novos rumos? Abra uma Discussion no GitHub.
            </p>
            <a
              href="https://github.com/JoaoRG-lab/rhema-care-flow/discussions/15"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 border-primary/40 hover:border-primary/70">
                <GitBranch className="h-4 w-4" />
                Ver Discussion no GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Alpha CTA ── */}
      <AlphaCTASection onOpenInvite={() => setShowAlphaInvite(true)} />

      {/* ── Privacy Promise ── */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="uhs-card-elevated p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-[60px]" />
            <div className="grid md:grid-cols-2 gap-12 items-center relative">
              <div>
                <UHSLogoMark className="w-16 h-16 mb-6 float-slow" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
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

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 hero-pattern relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
        <div className="container mx-auto max-w-3xl text-center relative">
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center pulse-glow">
              <Globe className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join the Future of{' '}
            <span className="text-shine">Health Data</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Whether you're a clinician seeking better workflows, a researcher needing auditable data, 
            or a patient wanting control—UHS Health OS is built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-10 h-14 text-lg bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-xl pulse-glow">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => setShowAlphaInvite(true)} className="gap-2 px-10 h-14 text-lg border-primary/30 hover:border-primary/60">
              <Users className="h-5 w-5" /> Join Alpha (Leaders)
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">© {new Date().getFullYear()} UHS Health OS</p>
                <p className="text-xs">Universal Health System</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {[
                { to: '/reumato', label: 'Reumato Portal' },
                { to: '/knowledge', label: 'Knowledge' },
                { to: '/learn', label: 'Patient Education' },
                { to: '/urv', label: 'URV Chain' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="hover:text-primary transition-colors">
                  {label}
                </Link>
              ))}
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

      <AlphaInvite open={showAlphaInvite} onOpenChange={setShowAlphaInvite} />
    </div>
  );
}
