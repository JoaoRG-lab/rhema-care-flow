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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/** Resolve the portal URL for a given specialty id. */
function specialtyPath(id: string): string {
  if (id === 'rheumatology') return '/reumato';
  if (id === 'pediatrics') return '/pediatria';
  if (id === 'obstetrics') return '/obstetrics';
  return `/specialty/${id}`;
}

export function SpecialtyQuickSwitcher() {
  const navigate = useNavigate();

  const activeSpecialties = SPECIALTIES.filter((s) => s.isActive);
  const displayed = activeSpecialties.find((s) => s.id === specialtyId);

  };

  const handleReset = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage disabled — ignore */
    }
    setStoredId(null);
    if (user) {
      supabase
        .from('profiles')
        .update({ preferred_specialty: null })
        .eq('user_id', user.id)
        .then(() => {});
    }
    toast.success('Specialty preference cleared');
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleReset}
          disabled={!storedId}
          className="cursor-pointer text-muted-foreground focus:text-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          <span className="flex-1">Reset specialty preference</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
