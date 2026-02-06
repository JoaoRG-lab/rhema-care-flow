import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  gradient?: boolean;
}

export function StatCard({ title, value, icon, description, trend, className, gradient }: StatCardProps) {
  return (
    <div className={cn(
      'uhs-card p-5 transition-all duration-300 hover:shadow-medium',
      gradient && 'bg-gradient-to-br from-card to-muted/30',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className={cn(
              'mt-1 text-xs font-medium',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              !trend && 'text-muted-foreground'
            )}>
              {description}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Compact version for dense layouts
interface StatCardCompactProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
}

export function StatCardCompact({ title, value, icon, className }: StatCardCompactProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl bg-muted/50 transition-colors hover:bg-muted',
      className
    )}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{title}</p>
      </div>
    </div>
  );
}

// Large stat for hero sections
interface StatCardHeroProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function StatCardHero({ title, value, icon, className }: StatCardHeroProps) {
  return (
    <div className={cn(
      'text-center p-6 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border transition-all duration-300 hover:shadow-medium',
      className
    )}>
      {icon && (
        <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold gradient-text-organic mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}
