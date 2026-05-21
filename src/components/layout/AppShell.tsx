import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const NAV: NavItem[] = [
  { to: '/',              label: 'Dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 0-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1m-6 0h16' },
  { to: '/patients',      label: 'Pacientes',     icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4v6m3-3h-6' },
  { to: '/schedule',      label: 'Agenda',        icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { to: '/teleconsulta',  label: 'Teleconsulta',  icon: 'M15 10l4.553-2.069A1 1 0 0 1 21 8.88v6.24a1 1 0 0 1-1.447.89L15 14M3 8h12v8H3z' },
  { to: '/reports',       label: 'Relatórios',    icon: 'M9 17v-2m3 2v-4m3 4v-6M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5z', roles: ['admin','medico'] },
  { to: '/notifications', label: 'Notificações',  icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0' },
  { to: '/settings',      label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { to: '/admin',         label: 'Admin',         icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', roles: ['admin'] },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppShell() {
  const { profile, signOut } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Fecha sidebar no mobile ao navegar
  const close = () => setSidebarOpen(false);

  const visibleNav = NAV.filter(item =>
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  );

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const initials = profile?.full_name
    ?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';

  return (
    <div className="flex h-dvh bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-64 flex flex-col',
          'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800',
          'transition-transform duration-300 ease-out',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Rhema Care" role="img">
            <rect width="32" height="32" rx="8" fill="#0d9488" />
            <path d="M10 22V10h6a4 4 0 0 1 0 8h-6M16 18l5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight">Rhema Care</span>
          {/* Fechar no mobile */}
          <button
            onClick={close}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Fechar menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-teal-50 dark:bg-teal-900/25 text-teal-700 dark:text-teal-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
              ].join(' ')}
            >
              <span className="shrink-0"><NavIcon d={item.icon} /></span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-bold shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Perfil + logout */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-1">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={dark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span>{dark ? 'Modo claro' : 'Modo escuro'}</span>
          </button>

          {/* Avatar + nome */}
          <Link
            to="/settings"
            onClick={close}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile?.full_name ?? 'Usuário'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 truncate capitalize">{profile?.role ?? ''}</p>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex-1">Rhema Care</span>
          {/* Badge notificações mobile */}
          <Link to="/notifications" className="relative" aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="text-gray-500 dark:text-gray-400" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </header>

        {/* Skip link acessibilidade */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-1 focus:rounded focus:text-teal-700 focus:shadow">
          Pular para o conteúdo
        </a>

        {/* Página atual */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
