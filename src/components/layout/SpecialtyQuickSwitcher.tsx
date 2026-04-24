import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SPECIALTIES } from '@/config/specialties';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SpecialtyQuickSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSpecialties = SPECIALTIES.filter((s) => s.isActive);

  // Detect current specialty from URL
  const currentId = location.pathname.startsWith('/specialty/')
    ? location.pathname.split('/')[2]
    : location.pathname === '/reumato'
      ? 'rheumatology'
      : location.pathname === '/pediatria'
        ? 'pediatrics'
        : null;

  const current = activeSpecialties.find((s) => s.id === currentId);

  const handleSwitch = (specialtyId: string) => {
    const target =
      specialtyId === 'rheumatology'
        ? '/reumato'
        : specialtyId === 'pediatrics'
          ? '/pediatria'
          : `/specialty/${specialtyId}`;
    navigate(target);
    const sp = activeSpecialties.find((s) => s.id === specialtyId);
    if (sp) toast.success(`Switched to ${sp.namePt}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors border border-sidebar-border/40"
          aria-label="Switch specialty"
        >
          <Stethoscope className="h-5 w-5" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">
              Specialty
            </p>
            <p className="text-sm font-medium truncate">
              {current?.namePt ?? 'Choose specialty'}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        className="w-64 bg-popover border shadow-lg max-h-[70vh] overflow-y-auto"
        sideOffset={8}
      >
        <DropdownMenuLabel>Switch specialty</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeSpecialties.map((sp) => {
          const Icon = sp.icon;
          const isCurrent = sp.id === currentId;
          return (
            <DropdownMenuItem
              key={sp.id}
              onClick={() => handleSwitch(sp.id)}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" style={{ color: sp.color }} />
              <span className="flex-1 truncate">{sp.namePt}</span>
              {isCurrent && <Check className={cn('h-4 w-4 text-primary')} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
