 import { ReactNode, useState } from 'react';
 import { AppSidebar } from './AppSidebar';
 import { MobileHeader } from './MobileHeader';
 import { MobileSidebar } from './MobileSidebar';
 import { useIsMobile } from '@/hooks/use-mobile';
 
 interface AppLayoutProps {
   children: ReactNode;
 }
 
 export function AppLayout({ children }: AppLayoutProps) {
   const isMobile = useIsMobile();
   const [sidebarOpen, setSidebarOpen] = useState(false);
 
   return (
     <div className="min-h-screen bg-background">
       {/* Mobile Header */}
       {isMobile && (
         <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
       )}
       
       {/* Mobile Sidebar (Sheet) */}
       <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
       
       {/* Desktop Sidebar */}
       {!isMobile && <AppSidebar />}
       
       {/* Main Content */}
       <main className={isMobile ? 'pt-14 min-h-screen' : 'ml-64 min-h-screen'}>
         {children}
       </main>
     </div>
   );
 }