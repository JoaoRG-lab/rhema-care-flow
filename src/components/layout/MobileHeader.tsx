import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UHSLogoMark } from '@/components/brand/UHSLogo';
import { SpecialtyQuickSwitcher } from './SpecialtyQuickSwitcher';
import { usePersona } from '@/contexts/PersonaContext';
import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { persona } = usePersona();

  const modeLabel =
    persona === 'academic' ? 'Research' : persona === 'patient' ? 'Patient' : 'Clinical';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border md:hidden">
      {/* Top bar — logo + menu */}
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-sidebar-foreground hover:bg-sidebar-accent -ml-1"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <UHSLogoMark className="h-7 w-7" />
            <div className="leading-tight">
              <span className="font-semibold text-sm text-sidebar-foreground block">
                UHS Health OS
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 block -mt-0.5">
                {modeLabel}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:bg-sidebar-accent"
            asChild
          >
            <Link to="/monitoring">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Monitorização</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Specialty switcher bar — full width below top bar */}
      <div className="border-t border-sidebar-border/60 px-4 py-2 overflow-x-auto scrollbar-none">
        <SpecialtyQuickSwitcher compact />
      </div>
    </header>
  );
}
