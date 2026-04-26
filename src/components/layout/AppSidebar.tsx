import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard,
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
  ChevronUp,
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
  Video,
  ClipboardList,
  NotebookPen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { usePersona } from '@/contexts/PersonaContext';
import { useAccountType } from '@/contexts/AccountTypeContext';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PersonaSwitcher } from './PersonaSwitcher';
import { SpecialtyQuickSwitcher } from './SpecialtyQuickSwitcher';
import { UHSLogoMark } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Pacientes', icon: Users },
  { path: '/scores', label: 'Scores e Calculadoras', icon: Activity },
  { path: '/monitoring', label: 'Monitorização', icon: Shield },
  { path: '/infusions', label: 'Infusões', icon: Syringe },
  { path: '/especialidades', label: 'Especialidades', icon: Stethoscope },
  { path: '/learn', label: 'Biblioteca', icon: BookOpen },
  { path: '/education', label: 'Educação CMS', icon: FileText },
  { path: '/knowledge', label: 'Conhecimento', icon: GraduationCap },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
  { path: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { path: '/focus', label: 'Foco', icon: Timer },
  { path: '/ai-assistant', label: 'Assistente IA', icon: Bot },
  { path: '/blockchain', label: 'URV Chain', icon: Blocks },
  { path: '/tell-us', label: 'Fale Conosco', icon: MessageSquare },
  { path: '/article-builder', label: 'Editor de Artigos', icon: PenLine },
  { path: '/epi-matrix', label: 'Matriz Epi', icon: Brain },
  { path: '/site-analytics', label: 'Analytics do Site', icon: BarChart3 },
  { path: '/case-studies', label: 'Casos Clínicos', icon: Stethoscope },
  { path: '/teleconsulta', label: 'Teleconsulta', icon: Video },
  { path: '/prontuario', label: 'Prontuário Integrado', icon: ClipboardList },
  { path: '/research-hub', label: 'Research Hub', icon: NotebookPen },
];

const academicNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/academic', label: 'Pesquisa', icon: GraduationCap },
  { path: '/patients', label: 'Dados de Coorte', icon: Users },
  { path: '/scores', label: 'Calculadoras', icon: Activity },
  { path: '/calendar', label: 'Agenda', icon: Calendar },
];

const patientNavItems = [
  { path: '/patient-portal', label: 'Minha Saúde', icon: Heart },
  { path: '/learn', label: 'Educação', icon: BookOpen },
  { path: '/calendar', label: 'Consultas', icon: Calendar },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const { tier, fullName, contributorType } = useVerificationStatus();
  const { persona } = usePersona();
  const { isClinician, isPatient } = useAccountType();

  // Select nav items based on persona
  const currentNavItems = isPatient ? patientNavItems : persona === 'academic' ? academicNavItems : navItems;

  // Get initials from name or email
  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (fullName) {
      if (contributorType === 'clinical' && !fullName.toLowerCase().startsWith('dr')) {
        return `Dr. ${fullName}`;
      }
      return fullName;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <UHSLogoMark className="h-10 w-10" />
        <div>
          <h1 className="font-semibold text-lg text-sidebar-foreground">UHS Health OS</h1>
          <p className="text-xs text-sidebar-foreground/60">
            {isPatient ? 'Portal do Paciente' : persona === 'academic' ? 'Research Mode' : 'Clinical'}
          </p>
        </div>
      </div>

      {/* Persona Switcher */}
      <div className="border-b border-sidebar-border">
        <PersonaSwitcher variant="sidebar" />
      </div>

      {/* Specialty Quick Switcher */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <SpecialtyQuickSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {currentNavItems.map((item) => {
            // Highlight "Specialties" entry on any specialty portal route
            const specialtyRoutes = ['/especialidades', '/reumato', '/pediatria', '/ginecologia', '/obstetrics'];
            const isActive =
              item.path === '/especialidades'
                ? specialtyRoutes.includes(location.pathname) ||
                  location.pathname.startsWith('/specialty/')
                : location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {item.path === '/blockchain' && (
                    <Link2 className="h-3 w-3 ml-auto text-sidebar-primary opacity-60" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* Blockchain status badge */}
        <div className="px-3 py-2 mb-2">
          <TrustBadge variant="blockchain" size="sm" />
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/admin'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <ShieldCheck className="h-5 w-5" />
            Admin Panel
          </Link>
        )}
        <Link
          to="/verification-request"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            location.pathname === '/verification-request'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <BadgeCheck className="h-5 w-5" />
          Get Verified
        </Link>
        <Link
          to="/style-guide"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            location.pathname === '/style-guide'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <Palette className="h-5 w-5" />
          Style Guide
        </Link>
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            location.pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        {/* Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-[hsl(165_60%_48%)] text-sidebar-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {user.email}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-sidebar-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="start" 
              className="w-56 bg-popover border shadow-lg"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-[hsl(165_60%_48%)] text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  {tier && (
                    <div className="pt-1">
                      <VerifiedBadge tier={tier} size="sm" />
                    </div>
                  )}
                  {!tier && (
                    <p className="text-xs text-muted-foreground">Not yet verified</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              {!tier && (
                <DropdownMenuItem asChild>
                  <Link to="/verification-request" className="cursor-pointer">
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Get Verified
                  </Link>
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
