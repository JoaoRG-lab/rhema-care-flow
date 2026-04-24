import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Check, RotateCcw } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'uhs:lastSpecialtyId';

/** Read the persisted specialty id (safe in SSR / private mode). */
function readStoredSpecialty(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/** Persist the selected specialty id; ignored if storage is unavailable. */
function writeStoredSpecialty(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage disabled — fine, we just won't remember */
  }
}

export function SpecialtyQuickSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const activeSpecialties = SPECIALTIES.filter((s) => s.isActive);

  // Detect current specialty from URL
  const currentId = location.pathname.startsWith('/specialty/')
    ? location.pathname.split('/')[2]
    : location.pathname === '/reumato'
      ? 'rheumatology'
      : location.pathname === '/pediatria'
        ? 'pediatrics'
        : null;

  // Last persisted choice — used as a fallback label so the sidebar "remembers"
  // the previous specialty after refresh / login. Hydrated from the user's
  // profile when authenticated; falls back to localStorage otherwise.
  const [storedId, setStoredId] = useState<string | null>(() => readStoredSpecialty());

  // Hydrate from the authenticated user's profile (cross-device persistence).
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_specialty')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const remoteId = (data as { preferred_specialty?: string | null } | null)?.preferred_specialty;
      if (remoteId) {
        setStoredId(remoteId);
        writeStoredSpecialty(remoteId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Whenever the URL reflects a specialty, treat that as the new last choice.
  useEffect(() => {
    if (currentId && currentId !== storedId) {
      writeStoredSpecialty(currentId);
      setStoredId(currentId);
      // Sync to profile (fire-and-forget) so other devices see the same choice.
      if (user) {
        supabase
          .from('profiles')
          .update({ preferred_specialty: currentId })
          .eq('user_id', user.id)
          .then(() => {});
      }
    }
  }, [currentId, storedId, user]);

  const displayedId = currentId;
  const displayed = activeSpecialties.find((s) => s.id === displayedId);

  const handleSwitch = (specialtyId: string) => {
    writeStoredSpecialty(specialtyId);
    setStoredId(specialtyId);
    if (user) {
      supabase
        .from('profiles')
        .update({ preferred_specialty: specialtyId })
        .eq('user_id', user.id)
        .then(() => {});
    }
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
          aria-label="Switch specialty"
        >
          <Stethoscope className="h-5 w-5" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">
              Specialty
            </p>
            <p className="text-sm font-medium truncate">
              {displayed?.namePt ?? 'Choose specialty'}
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
          const isCurrent = sp.id === displayedId;
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
