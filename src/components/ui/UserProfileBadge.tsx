 import { useAuth } from '@/contexts/AuthContext';
 import { useVerificationStatus } from '@/hooks/useVerificationStatus';
 import { VerifiedBadge, VerifiedIcon } from '@/components/ui/VerifiedBadge';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { cn } from '@/lib/utils';
 
 interface UserProfileBadgeProps {
   showEmail?: boolean;
   showBadge?: boolean;
   size?: 'sm' | 'md' | 'lg';
   className?: string;
 }
 
 export function UserProfileBadge({ 
   showEmail = true, 
   showBadge = true,
   size = 'md',
   className 
 }: UserProfileBadgeProps) {
   const { user } = useAuth();
   const { tier, loading } = useVerificationStatus();
 
   if (!user) return null;
 
   const initials = user.email?.slice(0, 2).toUpperCase() || 'U';
 
   const avatarSizes = {
     sm: 'h-6 w-6 text-[10px]',
     md: 'h-8 w-8 text-xs',
     lg: 'h-10 w-10 text-sm',
   };
 
   return (
     <div className={cn('flex items-center gap-2', className)}>
       <Avatar className={avatarSizes[size]}>
         <AvatarImage src={user.user_metadata?.avatar_url} />
         <AvatarFallback className="bg-primary/10 text-primary font-medium">
           {initials}
         </AvatarFallback>
       </Avatar>
       {showEmail && (
         <span className={cn(
           'truncate',
           size === 'sm' && 'text-xs',
           size === 'md' && 'text-sm',
           size === 'lg' && 'text-base'
         )}>
           {user.email}
         </span>
       )}
       {showBadge && tier && !loading && (
         <VerifiedIcon tier={tier} size={size} />
       )}
     </div>
   );
 }
 
 // Compact version for tight spaces
 export function UserVerificationIndicator({ className }: { className?: string }) {
   const { tier, loading } = useVerificationStatus();
 
   if (loading || !tier) return null;
 
   return <VerifiedBadge tier={tier} size="sm" className={className} />;
 }