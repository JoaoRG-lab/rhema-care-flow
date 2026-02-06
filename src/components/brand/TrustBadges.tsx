import { Shield, Lock, Link2, Eye, FileCheck, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  variant?: 'privacy' | 'blockchain' | 'consent' | 'verified' | 'encrypted' | 'audit';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeConfig = {
  privacy: {
    icon: Lock,
    label: 'No PHI On-Chain',
    description: 'Patient data never stored on blockchain',
    className: 'uhs-trust-badge',
  },
  blockchain: {
    icon: Link2,
    label: 'Blockchain Verified',
    description: 'Immutable audit trail on Solana',
    className: 'uhs-blockchain-badge',
  },
  consent: {
    icon: Fingerprint,
    label: 'Consent Controlled',
    description: 'Patient-authorized data access',
    className: 'uhs-trust-badge-gold',
  },
  verified: {
    icon: FileCheck,
    label: 'Clinically Verified',
    description: 'Validated by healthcare professionals',
    className: 'uhs-trust-badge',
  },
  encrypted: {
    icon: Shield,
    label: 'End-to-End Encrypted',
    description: 'Military-grade encryption',
    className: 'uhs-trust-badge',
  },
  audit: {
    icon: Eye,
    label: 'Full Audit Trail',
    description: 'Complete access logging',
    className: 'uhs-trust-badge',
  },
};

const sizeMap = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', padding: 'px-2 py-1' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-3 py-1.5' },
  lg: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-4 py-2' },
};

export function TrustBadge({ variant = 'privacy', size = 'md', className }: TrustBadgeProps) {
  const config = badgeConfig[variant];
  const sizes = sizeMap[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizes.padding,
        sizes.text,
        config.className,
        className
      )}
      title={config.description}
    >
      <Icon className={sizes.icon} />
      <span>{config.label}</span>
    </div>
  );
}

interface TrustBadgeGroupProps {
  badges?: Array<TrustBadgeProps['variant']>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrustBadgeGroup({ 
  badges = ['privacy', 'blockchain', 'consent'], 
  size = 'sm',
  className 
}: TrustBadgeGroupProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {badges.map((badge) => (
        <TrustBadge key={badge} variant={badge} size={size} />
      ))}
    </div>
  );
}

// Privacy Promise Component
export function PrivacyPromise({ className }: { className?: string }) {
  const promises = [
    { icon: Lock, text: 'No PHI storage' },
    { icon: Link2, text: 'Hash-only blockchain' },
    { icon: Shield, text: 'Encrypted at rest' },
    { icon: Eye, text: 'Full audit trail' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-foreground">Our Privacy Promise</h3>
      <div className="grid grid-cols-2 gap-3">
        {promises.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Icon className="h-4 w-4 text-accent-foreground" />
            </div>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
