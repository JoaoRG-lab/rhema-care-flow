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
   Stethoscope,
   Syringe,
  Palette,
  BadgeCheck,
 } from 'lucide-react';
 import { useAuth } from '@/contexts/AuthContext';
 import { cn } from '@/lib/utils';
 
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
 
 export function AppSidebar() {
   const location = useLocation();
   const { signOut, user } = useAuth();
 
   return (
     <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
       {/* Logo */}
       <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
           <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
         </div>
         <div>
           <h1 className="font-semibold text-lg text-sidebar-foreground">RheumaFlow</h1>
           <p className="text-xs text-sidebar-foreground/60">Rheumatology Workflow</p>
         </div>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 overflow-y-auto py-4 px-3">
         <ul className="space-y-1">
           {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <li key={item.path}>
                 <Link
                   to={item.path}
                   className={cn(
                     'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
 
       {/* Footer */}
       <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link
            to="/verification-request"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
           className={cn(
             'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
             location.pathname === '/settings'
               ? 'bg-sidebar-accent text-sidebar-accent-foreground'
               : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
           )}
         >
           <Settings className="h-5 w-5" />
           Settings
         </Link>
         <button
           onClick={signOut}
           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
         >
           <LogOut className="h-5 w-5" />
           Sign Out
         </button>
         {user && (
           <div className="px-3 py-2 text-xs text-sidebar-foreground/50 truncate">
             {user.email}
           </div>
         )}
       </div>
     </aside>
   );
 }