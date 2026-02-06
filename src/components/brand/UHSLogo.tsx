import { cn } from '@/lib/utils';

interface UHSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-lg' },
  md: { icon: 'h-10 w-10', text: 'text-xl' },
  lg: { icon: 'h-14 w-14', text: 'text-2xl' },
  xl: { icon: 'h-20 w-20', text: 'text-4xl' },
};

export function UHSLogo({ size = 'md', showText = true, className }: UHSLogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon - Organic shapes representing health + connectivity */}
      <div className={cn('relative', sizes.icon)}>
        {/* Outer ring - represents ecosystem */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(168_55%_38%)] to-[hsl(165_60%_48%)] opacity-20" />
        
        {/* Inner organic shape */}
        <svg
          viewBox="0 0 48 48"
          className="relative w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="uhs-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(168 55% 38%)" />
              <stop offset="50%" stopColor="hsl(165 60% 48%)" />
              <stop offset="100%" stopColor="hsl(42 85% 55%)" />
            </linearGradient>
            <linearGradient id="uhs-inner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Main circle */}
          <circle cx="24" cy="24" r="22" fill="url(#uhs-gradient)" />
          
          {/* Health cross - organic curves */}
          <path
            d="M24 12 L24 36 M12 24 L36 24"
            stroke="url(#uhs-inner)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Chain links - representing blockchain */}
          <circle cx="24" cy="12" r="3" fill="url(#uhs-inner)" />
          <circle cx="24" cy="36" r="3" fill="url(#uhs-inner)" />
          <circle cx="12" cy="24" r="3" fill="url(#uhs-inner)" />
          <circle cx="36" cy="24" r="3" fill="url(#uhs-inner)" />
          
          {/* Center pulse */}
          <circle cx="24" cy="24" r="5" fill="url(#uhs-inner)" />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold tracking-tight uhs-logo-gradient', sizes.text)}>
            UHS Health OS
          </span>
          <span className="text-xs text-muted-foreground tracking-wide uppercase">
            Universal Health System
          </span>
        </div>
      )}
    </div>
  );
}

export function UHSLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('w-10 h-10', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="uhs-mark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(168 55% 38%)" />
          <stop offset="50%" stopColor="hsl(165 60% 48%)" />
          <stop offset="100%" stopColor="hsl(42 85% 55%)" />
        </linearGradient>
      </defs>
      
      <circle cx="24" cy="24" r="22" fill="url(#uhs-mark-gradient)" />
      
      <path
        d="M24 12 L24 36 M12 24 L36 24"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      
      <circle cx="24" cy="12" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="36" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="12" cy="24" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="36" cy="24" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="24" r="5" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
