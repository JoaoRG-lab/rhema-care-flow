import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge, type VerificationTier } from '@/components/ui/VerifiedBadge';
import { TrustBadge } from '@/components/brand/TrustBadges';
import {
  Calculator,
  Users,
  FileText,
  Shield,
  Sparkles,
  ClipboardCheck,
  Calendar,
  Activity,
  BookOpen,
  Settings,
  BadgeCheck,
  ArrowRight,
  Blocks,
  Link2,
  Brain,
} from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'outline';
  isBlockchain?: boolean;
}

interface WelcomeCardProps {
  tier: VerificationTier;
  fullName: string | null;
}

// Define actions available to each tier (cumulative - higher tiers get all lower tier actions)
const TIER_ACTIONS: Record<string, QuickAction[]> = {
  unverified: [
    {
      label: 'Get Verified',
      description: 'Unlock full features',
      icon: BadgeCheck,
      href: '/verification-request',
      variant: 'default',
    },
    {
      label: 'Calculate Scores',
      description: 'Disease activity tools',
      icon: Calculator,
      href: '/scores',
    },
    {
      label: 'View Patients',
      description: 'Patient cards',
      icon: Users,
      href: '/patients',
    },
    {
      label: 'URV Chain',
      description: 'Blockchain registry',
      icon: Blocks,
      href: '/urv',
      isBlockchain: true,
    },
  ],
  bronze: [
    {
      label: 'Calculate Scores',
      description: 'All calculators unlocked',
      icon: Calculator,
      href: '/scores',
      variant: 'default',
    },
    {
      label: 'Patient Cards',
      description: 'Manage your roster',
      icon: Users,
      href: '/patients',
    },
    {
      label: 'Monitoring',
      description: 'Lab & safety tracking',
      icon: ClipboardCheck,
      href: '/monitoring',
    },
    {
      label: 'URV Chain',
      description: 'On-chain proofs',
      icon: Blocks,
      href: '/blockchain',
      isBlockchain: true,
    },
  ],
  silver: [
    {
      label: 'Advanced Scores',
      description: 'Full calculator suite',
      icon: Activity,
      href: '/scores',
      variant: 'default',
    },
    {
      label: 'Patient Cards',
      description: 'Extended patient data',
      icon: Users,
      href: '/patients',
    },
    {
      label: 'AI Assistant',
      description: 'Clinical insights',
      icon: Brain,
      href: '/ai-assistant',
    },
    {
      label: 'URV Chain',
      description: 'Audit trail',
      icon: Blocks,
      href: '/blockchain',
      isBlockchain: true,
    },
  ],
  gold: [
    {
      label: 'Expert Calculators',
      description: 'Classification criteria',
      icon: Calculator,
      href: '/scores',
      variant: 'default',
    },
    {
      label: 'Patient Registry',
      description: 'Full patient management',
      icon: Users,
      href: '/patients',
    },
    {
      label: 'Clinical Monitoring',
      description: 'Safety protocols',
      icon: Shield,
      href: '/monitoring',
    },
    {
      label: 'URV Chain',
      description: 'Full blockchain',
      icon: Blocks,
      href: '/blockchain',
      isBlockchain: true,
    },
  ],
  expert: [
    {
      label: 'Full Calculator Suite',
      description: 'All scores & criteria',
      icon: Activity,
      href: '/scores',
      variant: 'default',
    },
    {
      label: 'Patient Analytics',
      description: 'Advanced insights',
      icon: Users,
      href: '/patients',
    },
    {
      label: 'Admin Panel',
      description: 'Review submissions',
      icon: Shield,
      href: '/admin',
    },
    {
      label: 'URV Chain',
      description: 'Admin blockchain',
      icon: Blocks,
      href: '/blockchain',
      isBlockchain: true,
    },
  ],
  developer: [
    {
      label: 'Style Guide',
      description: 'Design system docs',
      icon: FileText,
      href: '/style-guide',
      variant: 'default',
    },
    {
      label: 'Calculators',
      description: 'Test implementations',
      icon: Calculator,
      href: '/scores',
    },
    {
      label: 'URV Demo',
      description: 'Blockchain demo',
      icon: Blocks,
      href: '/urv',
      isBlockchain: true,
    },
    {
      label: 'Settings',
      description: 'Dev configuration',
      icon: Settings,
      href: '/settings',
    },
  ],
  partner: [
    {
      label: 'Dashboard Overview',
      description: 'Platform metrics',
      icon: Activity,
      href: '/dashboard',
      variant: 'default',
    },
    {
      label: 'Clinical Tools',
      description: 'All calculators',
      icon: Calculator,
      href: '/scores',
    },
    {
      label: 'URV Chain',
      description: 'Blockchain integration',
      icon: Blocks,
      href: '/blockchain',
      isBlockchain: true,
    },
    {
      label: 'Settings',
      description: 'Partner preferences',
      icon: Settings,
      href: '/settings',
    },
  ],
};

const TIER_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  unverified: {
    title: 'Welcome to UHS Health OS',
    subtitle: 'Verify your credentials to unlock all features and join our clinical community.',
  },
  bronze: {
    title: 'Bronze Member',
    subtitle: 'Core clinical tools unlocked. Keep contributing to level up!',
  },
  silver: {
    title: 'Silver Member',
    subtitle: 'Enhanced access unlocked. Your contributions are making a difference.',
  },
  gold: {
    title: 'Gold Member',
    subtitle: 'Full clinical access granted. Thank you for your verified expertise.',
  },
  expert: {
    title: 'Expert Contributor',
    subtitle: 'Your expertise shapes our community. All features are at your fingertips.',
  },
  developer: {
    title: 'Developer Access',
    subtitle: 'Full platform access for development and testing purposes.',
  },
  partner: {
    title: 'Partner Account',
    subtitle: 'Welcome to our partnership program. Explore our clinical solutions.',
  },
};

export function WelcomeCard({ tier, fullName }: WelcomeCardProps) {
  const tierKey = tier || 'unverified';
  const actions = TIER_ACTIONS[tierKey] || TIER_ACTIONS.unverified;
  const message = TIER_MESSAGES[tierKey] || TIER_MESSAGES.unverified;

  return (
    <Card className="uhs-card-elevated overflow-hidden">
      {/* Decorative gradient bar */}
      <div className="h-1 bg-gradient-to-r from-primary via-[hsl(165_60%_48%)] to-[hsl(42_85%_55%)]" />
      
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Welcome Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-foreground">{message.title}</h2>
              {tier && <VerifiedBadge tier={tier} size="sm" showLabel />}
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              {message.subtitle}
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-2 pt-1">
              <TrustBadge variant="privacy" size="sm" />
              <TrustBadge variant="blockchain" size="sm" />
            </div>
            
            {!tier && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs bg-accent/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Complete verification to unlock all features
                </Badge>
              </div>
            )}
          </div>

          {/* Right: Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.href}>
                  <Button
                    variant={action.variant || 'outline'}
                    className={cn(
                      "w-full h-auto flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all",
                      action.isBlockchain && "border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {action.isBlockchain && (
                        <Link2 className="h-2.5 w-2.5 absolute -top-1 -right-1 text-primary" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom: Tier-specific CTA */}
        {!tier && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <Link to="/verification-request">
              <Button className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                <BadgeCheck className="h-4 w-4" />
                Start Verification
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
