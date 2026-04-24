import { useNavigate } from 'react-router-dom';
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
import { useSpecialty } from '@/contexts/SpecialtyContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/** Resolve the portal URL for a given specialty id. */
function specialtyPath(id: string): string {
  if (id === 'rheumatology') return '/reumato';
  if (id === 'pediatrics') return '/pediatria';
  return `/specialty/${id}`;
}

export function SpecialtyQuickSwitcher() {
  const navigate = useNavigate();
  const { specialtyId, setSpecialty } = useSpecialty();

  const activeSpecialties = SPECIALTIES.filter((s) => s.isActive);
  const displayed = activeSpecialties.find((s) => s.id === specialtyId);

  const handleSwitch = async (id: string) => {
    await setSpecialty(id);               // persist to profile + localStorage
    navigate(specialtyPath(id));
    const sp = activeSpecialties.find((s) => s.id === id);
    if (sp) toast.success(`Especialidade: ${sp.namePt}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors border border-sidebar-border/40"
          aria-label="Trocar especialidade"
        >
          <Stethoscope className="h-5 w-5" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">
              Especialidade
            </p>
            <p className="text-sm font-medium truncate">
              {displayed?.namePt ?? 'Escolha uma especialidade'}
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
        <DropdownMenuLabel>Trocar especialidade</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeSpecialties.map((sp) => {
          const Icon = sp.icon;
          const isCurrent = sp.id === specialtyId;
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
