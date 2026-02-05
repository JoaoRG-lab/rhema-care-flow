 import { ReactNode } from 'react';
 import { cn } from '@/lib/utils';
 
 interface StatCardProps {
   title: string;
   value: string | number;
   icon: ReactNode;
   description?: string;
   trend?: 'up' | 'down' | 'neutral';
   className?: string;
 }
 
 export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
   return (
     <div className={cn('stat-card', className)}>
       <div className="flex items-start justify-between">
         <div>
           <p className="text-sm font-medium text-muted-foreground">{title}</p>
           <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
           {description && (
             <p className={cn(
               'mt-1 text-xs',
               trend === 'up' && 'text-success',
               trend === 'down' && 'text-destructive',
               !trend && 'text-muted-foreground'
             )}>
               {description}
             </p>
           )}
         </div>
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
           {icon}
         </div>
       </div>
     </div>
   );
 }