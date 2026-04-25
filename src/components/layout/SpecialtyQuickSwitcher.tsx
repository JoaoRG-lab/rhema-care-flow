import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Stethoscope, Check, RotateCcw, ChevronDown, LayoutGrid } from 'lucide-react';

const STORAGE_KEY = 'uhs:lastSpecialtyId';

/** Resolve the portal URL for a given specialty id. */
function specialtyPath(id: string): string {
  if (id === 'rheumatology') return '/reumato';
  if (id === 'pediatrics')   return '/pediatria';
  if (id === 'obstetrics')   return '/ginecologia';
  return `/specialty/${id}`;
}

interface SpecialtyQuickSwitcherProps {
  /** When true, renders as a compact horizontal chip row (for the mobile header bar) */
  compact?: boolean;
}

export function SpecialtyQuickSwitcher({ compact = false }: SpecialtyQuickSwitcherProps) {
  const navigate = useNavigate();
  const { specialtyId, setSpecialty } = useSpecialty();
  const { user } = useAuth();

  // local mirror for reset-button disable state
  const [storedId, setStoredId] = useState<string | null>(() => {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const activeSpecialties = SPECIALTIES.filter((s) => s.isActive);
  const displayed = activeSpecialties.find((s) => s.id === specialtyId);

  const handleSwitch = (id: string) => {
    setSpecialty(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch { /* ignore */ }
    setStoredId(id);
    if (user) {
      supabase
        .from('profiles')
        .update({ specialty: id } as any)
        .eq('user_id', user.id)
        .then(() => {});
    }
    navigate(specialtyPath(id));
    toast.success(`Especialidade: ${SPECIALTIES.find((s) => s.id === id)?.namePt ?? id}`);
  };

  const handleReset = () => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setStoredId(null);
    setSpecialty('');
    if (user) {
      supabase
        .from('profiles')
        .update({ specialty: null } as any)
        .eq('user_id', user.id)
        .then(() => {});
    }
    toast.success('Preferência de especialidade removida');
  };

  // ── Compact mode: horizontal scrollable chip row ───────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {activeSpecialties.map((sp) => {
          const Icon = sp.icon;
          const isCurrent = sp.id === specialtyId;
          return (
            <button
              key={sp.id}
              onClick={() => handleSwitch(sp.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                isCurrent
                  ? 'text-sidebar-foreground border border-sidebar-primary/60 bg-sidebar-primary/20'
                  : 'text-sidebar-foreground/60 border border-sidebar-border/40 hover:border-sidebar-border hover:text-sidebar-foreground',
              )}
              style={isCurrent ? { borderColor: sp.color, color: sp.color } : undefined}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={isCurrent ? { color: sp.color } : undefined} />
              {sp.namePt}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Default mode: dropdown (used in sidebar) ───────────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors border border-sidebar-border/40"
          aria-label="Trocar especialidade"
        >
          {displayed ? (
            <displayed.icon className="h-5 w-5 shrink-0" style={{ color: displayed.color }} />
          ) : (
            <Stethoscope className="h-5 w-5 shrink-0 text-sidebar-foreground/50" />
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">
              Especialidade
            </p>
            <p className="text-sm font-medium truncate">
              {displayed?.namePt ?? 'Escolha uma especialidade'}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
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
          onClick={() => navigate('/especialidades')}
          className="cursor-pointer"
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span className="flex-1">Ver todas as especialidades</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleReset}
          disabled={!storedId}
          className="cursor-pointer text-muted-foreground focus:text-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          <span className="flex-1">Remover preferência</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
