 import { RefreshCw } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface PullToRefreshIndicatorProps {
   pullDistance: number;
   isRefreshing: boolean;
   progress: number;
   shouldTrigger: boolean;
 }
 
 export function PullToRefreshIndicator({
   pullDistance,
   isRefreshing,
   progress,
   shouldTrigger,
 }: PullToRefreshIndicatorProps) {
   if (pullDistance === 0 && !isRefreshing) return null;
 
   return (
     <div
       className="absolute left-0 right-0 flex justify-center overflow-hidden pointer-events-none z-10"
       style={{
         top: 0,
         height: `${pullDistance}px`,
         transition: isRefreshing ? 'none' : 'height 0.2s ease-out',
       }}
     >
       <div
         className={cn(
           'flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-sm transition-all',
           shouldTrigger && !isRefreshing && 'border-primary bg-primary/5',
           isRefreshing && 'border-primary'
         )}
         style={{
           transform: `translateY(${Math.max(0, pullDistance - 48)}px) rotate(${progress * 180}deg)`,
           opacity: Math.min(progress * 2, 1),
         }}
       >
         <RefreshCw
           className={cn(
             'h-5 w-5 text-muted-foreground transition-colors',
             shouldTrigger && 'text-primary',
             isRefreshing && 'text-primary animate-spin'
           )}
         />
       </div>
     </div>
   );
 }