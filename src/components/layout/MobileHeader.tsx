 import { Menu, Stethoscope } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface MobileHeaderProps {
   onMenuClick: () => void;
 }
 
 export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
   return (
     <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between px-4 md:hidden">
       <div className="flex items-center gap-3">
         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
           <Stethoscope className="h-4 w-4 text-sidebar-primary-foreground" />
         </div>
         <span className="font-semibold text-sidebar-foreground">RheumaFlow</span>
       </div>
       <Button
         variant="ghost"
         size="icon"
         onClick={onMenuClick}
         className="text-sidebar-foreground hover:bg-sidebar-accent"
       >
         <Menu className="h-5 w-5" />
         <span className="sr-only">Open menu</span>
       </Button>
     </header>
   );
 }