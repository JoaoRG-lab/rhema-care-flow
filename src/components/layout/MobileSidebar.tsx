 import { Link, useLocation } from 'react-router-dom';
 import {
   LayoutDashboard,
   Users,
   Activity,
   Shield,
   Calendar,
   CheckSquare,
   Timer,
   Settings,
   LogOut,
   Syringe,
   Palette,
   BadgeCheck,
   ShieldCheck,
   User,
 } from 'lucide-react';
 import { useAuth } from '@/contexts/AuthContext';
 import { useUserRole } from '@/hooks/useUserRole';
 import { useVerificationStatus } from '@/hooks/useVerificationStatus';
 import { cn } from '@/lib/utils';
 import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Separator } from '@/components/ui/separator';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 const navItems = [
   { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
   { path: '/patients', label: 'Patients', icon: Users },
   { path: '/scores', label: 'Scores & Tools', icon: Activity },
   { path: '/monitoring', label: 'Monitoring', icon: Shield },
   { path: '/infusions', label: 'Infusions', icon: Syringe },
   { path: '/calendar', label: 'Calendar', icon: Calendar },
   { path: '/tasks', label: 'Tasks', icon: CheckSquare },
   { path: '/focus', label: 'Focus', icon: Timer },
 ];
 
 interface MobileSidebarProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
   const location = useLocation();
   const { signOut, user } = useAuth();
   const { isAdmin } = useUserRole();
   const { tier, fullName, contributorType } = useVerificationStatus();
 
   const getInitials = () => {
     if (fullName) {
       return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
     }
     if (user?.email) {
       return user.email[0].toUpperCase();
     }
     return 'U';
   };
 
   const getDisplayName = () => {
     if (fullName) {
       if (contributorType === 'clinical' && !fullName.toLowerCase().startsWith('dr')) {
         return `Dr. ${fullName}`;
       }
       return fullName;
     }
     return user?.email?.split('@')[0] || 'User';
   };
 
   const handleNavClick = () => {
     onOpenChange(false);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
         <SheetHeader className="px-4 py-4 border-b border-sidebar-border">
           <SheetTitle className="text-sidebar-foreground text-left">Navigation</SheetTitle>
         </SheetHeader>
         
         <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
           <nav className="py-4 px-3">
             <ul className="space-y-1">
               {navItems.map((item) => {
                 const isActive = location.pathname === item.path;
                 return (
                   <li key={item.path}>
                     <Link
                       to={item.path}
                       onClick={handleNavClick}
                       className={cn(
                         'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                         isActive
                           ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                           : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                       )}
                     >
                       <item.icon className="h-5 w-5" />
                       {item.label}
                     </Link>
                   </li>
                 );
               })}
             </ul>
           </nav>
           
           <Separator className="bg-sidebar-border mx-3" />
           
           <div className="py-4 px-3 space-y-1">
             {isAdmin && (
               <Link
                 to="/admin"
                 onClick={handleNavClick}
                 className={cn(
                   'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                   location.pathname === '/admin'
                     ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                     : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                 )}
               >
                 <ShieldCheck className="h-5 w-5" />
                 Admin Panel
               </Link>
             )}
             <Link
               to="/verification-request"
               onClick={handleNavClick}
               className={cn(
                 'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                 location.pathname === '/verification-request'
                   ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                   : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
               )}
             >
               <BadgeCheck className="h-5 w-5" />
               Get Verified
             </Link>
             <Link
               to="/style-guide"
               onClick={handleNavClick}
               className={cn(
                 'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                 location.pathname === '/style-guide'
                   ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                   : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
               )}
             >
               <Palette className="h-5 w-5" />
               Style Guide
             </Link>
             <Link
               to="/settings"
               onClick={handleNavClick}
               className={cn(
                 'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                 location.pathname === '/settings'
                   ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                   : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
               )}
             >
               <Settings className="h-5 w-5" />
               Settings
             </Link>
           </div>
         </ScrollArea>
         
         {/* User Profile Footer */}
         {user && (
           <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3 bg-sidebar">
             <div className="flex items-center gap-3 px-2 py-2">
               <Avatar className="h-10 w-10">
                 <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                   {getInitials()}
                 </AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium truncate text-sidebar-foreground">
                   {getDisplayName()}
                 </p>
                 <div className="flex items-center gap-2">
                   {tier && <VerifiedBadge tier={tier} size="xs" />}
                   {!tier && <span className="text-xs text-sidebar-foreground/50">Not verified</span>}
                 </div>
               </div>
             </div>
             <button
               onClick={() => {
                 signOut();
                 onOpenChange(false);
               }}
               className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
             >
               <LogOut className="h-5 w-5" />
               Sign Out
             </button>
           </div>
         )}
       </SheetContent>
     </Sheet>
   );
 }