import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid } from '@/components/brand/FeatureCard';
import {
  Calculator,
  Activity,
  Users,
  Shield,
  Syringe,
  Calendar,
  ClipboardCheck,
  BookOpen,
  ArrowRight,
  Stethoscope,
  Brain,
  FileText,
  TrendingUp,
} from 'lucide-react';

const rheumaTools = [
  {
    icon: Calculator,
    title: 'Disease Activity Scores',
    description: 'DAS28, CDAI, SDAI, BASDAI, ASDAS, SLEDAI, RAPID3 and more validated calculators.',
    badge: 'Core',
  },
  {
    icon: ClipboardCheck,
    title: 'Classification Criteria',
    description: 'ACR/EULAR criteria for RA, SpA, PsA, SLE, Vasculitis and other conditions.',
  },
  {
    icon: Syringe,
    title: 'Biologic & Infusion Management',
    description: 'Track infusion schedules, pre-medications, and biologic therapy timelines.',
  },
  {
    icon: Shield,
    title: 'Safety Monitoring',
    description: 'Lab monitoring protocols for DMARDs, biologics, and JAK inhibitors.',
  },
  {
    icon: Users,
    title: 'Patient Cards',
    description: 'Organize patient data with disease-specific fields and follow-up tracking.',
  },
  {
    icon: Brain,
    title: 'AI Clinical Insights',
    description: 'Longitudinal analysis and decision support for complex cases.',
  },
];

const diseaseCategories = [
  { name: 'Rheumatoid Arthritis', color: 'bg-[hsl(210_75%_50%)]' },
  { name: 'Spondyloarthritis', color: 'bg-[hsl(168_55%_42%)]' },
  { name: 'Psoriatic Arthritis', color: 'bg-[hsl(35_85%_52%)]' },
  { name: 'Lupus (SLE)', color: 'bg-[hsl(280_55%_55%)]' },
  { name: 'Vasculitis', color: 'bg-[hsl(0_60%_52%)]' },
  { name: 'Fibromyalgia', color: 'bg-[hsl(320_50%_55%)]' },
];

export default function ReumatoPortal() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg gradient-text">Reumato</span>
              <span className="text-xs text-muted-foreground block">by UHS Health OS</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login?redirect=%2Freumato">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup?redirect=%2Freumato">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(210_75%_50%)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[hsl(280_55%_55%)]/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Stethoscope className="h-4 w-4" />
              Rheumatology Clinical Platform
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Evidence-Based{' '}
              <span className="gradient-text">Rheumatology</span>
              <br />
              Clinical Tools
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Disease activity calculators, classification criteria, monitoring protocols, 
              and patient management tools for rheumatologists and clinical teams.
            </p>

            {/* Disease category pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {diseaseCategories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm"
                >
                  <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                  {cat.name}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/scores">
                <Button size="lg" className="gap-2 px-8 h-12 text-base bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90 shadow-lg">
                  <Calculator className="h-5 w-5" />
                  Open Calculators
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <Users className="h-5 w-5" />
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Complete <span className="gradient-text">Clinical Toolkit</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built by rheumatologists, for rheumatologists. Validated scores and 
              evidence-based protocols at your fingertips.
            </p>
          </div>

          <FeatureGrid columns={3}>
            {rheumaTools.map((tool) => (
              <FeatureCard key={tool.title} {...tool} gradient />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold text-center mb-8">Quick Access</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/scores">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/50">
                <Calculator className="h-6 w-6 text-primary" />
                <span>Calculators</span>
              </Button>
            </Link>
            <Link to="/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/50">
                <Users className="h-6 w-6 text-primary" />
                <span>Patients</span>
              </Button>
            </Link>
            <Link to="/monitoring">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/50">
                <Shield className="h-6 w-6 text-primary" />
                <span>Monitoring</span>
              </Button>
            </Link>
            <Link to="/infusions">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/50">
                <Syringe className="h-6 w-6 text-primary" />
                <span>Infusions</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Reumato by UHS Health OS</p>
                <p className="text-xs">Rheumatology Clinical Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TrustBadge variant="privacy" size="sm" />
              <TrustBadge variant="verified" size="sm" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              This is an organizational tool for healthcare professionals. Not a medical record system.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
