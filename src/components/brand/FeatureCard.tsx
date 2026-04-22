import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  className?: string;
  gradient?: boolean;
  href?: string;
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  className,
  gradient = false,
  href,
}: FeatureCardProps) {
  const content = (
    <div 
      className={cn(
        'group relative p-6 rounded-2xl transition-all duration-300 h-full',
        'uhs-card-elevated',
        gradient && 'overflow-hidden',
        href && 'cursor-pointer hover:-translate-y-1 hover:shadow-xl',
        className
      )}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {badge && (
          <span className="absolute top-0 right-0 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {badge}
          </span>
        )}

        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className="block h-full">{content}</Link>;
  }
  return content;
}

interface FeatureGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({ children, columns = 3, className }: FeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Stat highlight card for metrics
interface StatHighlightProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatHighlight({ value, label, icon: Icon, trend, className }: StatHighlightProps) {
  return (
    <div className={cn('text-center p-6 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border', className)}>
      {Icon && (
        <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="text-3xl font-bold gradient-text-organic mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
