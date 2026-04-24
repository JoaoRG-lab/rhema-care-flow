import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';
import { BottomNavBar } from './BottomNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAccountType } from '@/contexts/AccountTypeContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isClinician } = useAccountType();
  const mobilePt = isClinician ? 'pt-[6.5rem]' : 'pt-16';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: fixed top header (14 logo bar + ~40 specialty bar = ~54px total ~= pt-[6.5rem]) */}
      {isMobile && (
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
      )}

      {/* Mobile: slide-out full sidebar (Sheet) */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Desktop: fixed left sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Main content */}
      <main
        className={
          isMobile
            ? `${mobilePt} pb-20 min-h-screen`   /* top: header + specialty bar; bottom: BottomNavBar */
            : 'ml-64 min-h-screen'
        }
      >
        {children}
      </main>

      {/* Mobile: bottom tab bar */}
      {isMobile && <BottomNavBar />}
    </div>
  );
}
