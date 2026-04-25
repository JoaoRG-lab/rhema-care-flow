import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  Calendar,
  Heart,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersona } from '@/contexts/PersonaContext';
import { useAccountType } from '@/contexts/AccountTypeContext';

// ── Tab sets per persona ───────────────────────────────────────────────────────
const clinicalTabs = [
  { path: '/dashboard', label: 'Home',       icon: LayoutDashboard },
  { path: '/patients',  label: 'Patients',   icon: Users },
  { path: '/scores',    label: 'Scores',     icon: Activity },
  { path: '/knowledge', label: 'Conhecimento',  icon: GraduationCap },
  { path: '/calendar',  label: 'Agenda',   icon: Calendar },
];

const academicTabs = [
  { path: '/dashboard', label: 'Home',       icon: LayoutDashboard },
  { path: '/academic',  label: 'Pesquisa',   icon: GraduationCap },
  { path: '/patients',  label: 'Cohort',     icon: Users },
  { path: '/scores',    label: 'Calc',       icon: Activity },
  { path: '/calendar',  label: 'Agenda',   icon: Calendar },
];

const patientTabs = [
  { path: '/patient-portal', label: 'Minha Saúde', icon: Heart },
  { path: '/learn',           label: 'Educação', icon: GraduationCap },
  { path: '/calendar',        label: 'Consultas', icon: Calendar },
];

export function BottomNavBar() {
  const location = useLocation();
  const { persona } = usePersona();
  const { isPatient } = useAccountType();

  const tabs = isPatient ? patientTabs : persona === 'academic' ? academicTabs : clinicalTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-sidebar border-t border-sidebar-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/dashboard'
              ? location.pathname === path
              : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground/50 hover:text-sidebar-foreground',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-6 rounded-full transition-colors',
                  isActive && 'bg-sidebar-primary/15',
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.2px]')} />
              </div>
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
