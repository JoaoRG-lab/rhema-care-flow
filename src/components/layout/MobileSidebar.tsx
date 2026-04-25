import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  Shield,
  Calendar,
  CheckSquare,
  Timer,
  Settings,
  LogOut,
  Syringe,
  Palette,
  BadgeCheck,
  ShieldCheck,
  User,
  BookOpen,
  Heart,
  GraduationCap,
  FileText,
  TrendingUp,
  Bot,
  Blocks,
  Link2,
  MessageSquare,
  PenLine,
  Brain,
  BarChart3,
  Stethoscope,
  ChevronRight,
  Video,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { usePersona } from '@/contexts/PersonaContext';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PersonaSwitcher } from './PersonaSwitcher';
import { useAccountType } from '@/contexts/AccountTypeContext';
import { SpecialtyQuickSwitcher } from './SpecialtyQuickSwitcher';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { UHSLogoMark } from '@/components/brand/UHSLogo';

// ── Nav items — mirrors AppSidebar exactly ─────────────────────────────────────
const navItems = [
  { path: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/patients',      label: 'Patients',         icon: Users },
  { path: '/scores',        label: 'Scores e Calculadoras',   icon: Activity },
  { path: '/monitoring',    label: 'Monitorização',       icon: Shield },
  { path: '/infusions',     label: 'Infusões',        icon: Syringe },
  { path: '/especialidades', label: 'Especialidades',     icon: Stethoscope },
  { path: '/learn',         label: 'Biblioteca',          icon: BookOpen },
  { path: '/education',     label: 'Educação CMS',    icon: FileText },
  { path: '/knowledge',     label: 'Conhecimento',        icon: GraduationCap },
  { path: '/analytics',     label: 'Analytics',        icon: TrendingUp },
  { path: '/calendar',      label: 'Agenda',         icon: Calendar },
  { path: '/tasks',         label: 'Tarefas',            icon: CheckSquare },
  { path: '/focus',         label: 'Foco',            icon: Timer },
  { path: '/ai-assistant',  label: 'Assistente IA',     icon: Bot },
  { path: '/blockchain',    label: 'URV Chain',        icon: Blocks },
  { path: '/tell-us',       label: 'Fale Conosco',          icon: MessageSquare },
  { path: '/article-builder', label: 'Editor de Artigos', icon: PenLine },
  { path: '/epi-matrix',    label: 'Matriz Epi',       icon: Brain },
  { path: '/site-analytics', label: 'Analytics do Site',  icon: BarChart3 },
  { path: '/case-studies',  label: 'Casos Clínicos',     icon: Stethoscope },
  { path: '/teleconsulta', label: 'Teleconsulta', icon: Video },
  { path: '/prontuario', label: 'Prontuário Integrado', icon: ClipboardList },
];

const academicNavItems = [
  { path: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/academic',  label: 'Pesquisa',    icon: GraduationCap },
  { path: '/patients',  label: 'Dados de Coorte', icon: Users },
  { path: '/scores',    label: 'Calculadoras', icon: Activity },
  { path: '/calendar',  label: 'Agenda',    icon: Calendar },
];

const patientNavItems = [
  { path: '/patient-portal', label: 'Minha Saúde',    icon: Heart },
  { path: '/learn',           label: 'Educação',    icon: BookOpen },
  { path: '/calendar',        label: 'Consultas', icon: Calendar },
];

// ── Footer links — mirrors AppSidebar ─────────────────────────────────────────
const footerLinks = [
  { path: '/verification-request', label: 'Get Verified', icon: BadgeCheck },
  { path: '/style-guide',          label: 'Style Guide',  icon: Palette },
  { path: '/settings',             label: 'Settings',     icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const { tier, fullName, contributorType } = useVerificationStatus();
  const { persona } = usePersona();
  const { isClinician, isPatient } = useAccountType();

  const currentNavItems = isPatient ? patientNavItems : persona === 'academic' ? academicNavItems : navItems;

  const getInitials = () => {
    if (fullName) return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (fullName) {
      if (contributorType === 'clinical' && !fullName.toLowerCase().startsWith('dr')) {
        return `Dr. ${fullName}`;
      }
      return fullName;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const close = () => onOpenChange(false);

  const NavLink = ({ path, label, icon: Icon }: typeof navItems[0]) => {
    const isActive = location.pathname === path;
    return (
      <li>
        <Link
          to={path}
          onClick={close}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{label}</span>
          {path === '/blockchain' && (
            <Link2 className="h-3 w-3 text-sidebar-primary opacity-60" />
          )}
          {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
        </Link>
      </li>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <UHSLogoMark className="h-9 w-9" />
            <div>
              <SheetTitle className="text-sidebar-foreground text-left text-base leading-tight">
                UHS Health OS
              </SheetTitle>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                {persona === 'academic'
                  ? 'Research Mode'
                  : persona === 'patient'
                    ? 'Patient Portal'
                    : 'Clinical Workflow'}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* ── Persona Switcher ────────────────────────────────── */}
        <div className="border-b border-sidebar-border shrink-0">
          <PersonaSwitcher variant="sidebar" />
        </div>

        {/* ── Specialty Quick Switcher ────────────────────────── */}
        <div className="px-3 py-3 border-b border-sidebar-border shrink-0">
          <SpecialtyQuickSwitcher />
        </div>

        {/* ── Nav ────────────────────────────────────────────── */}
        <ScrollArea className="flex-1">
          <nav className="py-3 px-3">
            <ul className="space-y-0.5">
              {currentNavItems.map((item) => (
                <NavLink key={item.path} {...item} />
              ))}
            </ul>
          </nav>

          <Separator className="bg-sidebar-border mx-3 my-1" />

          {/* Footer nav links */}
          <div className="py-3 px-3 space-y-0.5">
            {isAdmin && (
              <NavLink path="/admin" label="Admin Panel" icon={ShieldCheck} />
            )}
            {footerLinks.map((item) => (
              <NavLink key={item.path} {...item} />
            ))}
          </div>

          {/* Blockchain trust badge */}
          <div className="px-4 py-3">
            <TrustBadge variant="blockchain" size="sm" />
          </div>

          {/* bottom padding so content clears the user footer */}
          <div className="h-24" />
        </ScrollArea>

        {/* ── User Footer ─────────────────────────────────────── */}
        {user && (
          <div className="shrink-0 border-t border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-[hsl(165_60%_48%)] text-sidebar-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
                {tier && (
                  <div className="mt-1">
                    <VerifiedBadge tier={tier} size="xs" />
                  </div>
                )}
                {!tier && (
                  <span className="text-xs text-sidebar-foreground/40">Not verified</span>
                )}
              </div>
              <Link to="/settings" onClick={close}>
                <User className="h-4 w-4 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" />
              </Link>
            </div>
            <div className="px-3 pb-3">
              <button
                onClick={() => { signOut(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
