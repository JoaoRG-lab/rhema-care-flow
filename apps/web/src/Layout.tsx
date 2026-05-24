import { clearToken, type User } from './api';

const items = [
  ['dashboard', 'Dashboard'],
  ['patients', 'Pacientes'],
  ['new-patient', 'Novo paciente'],
  ['schedule', 'Agenda'],
  ['scores', 'Scores'],
];

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="header">
      <div>
        <p className="eyebrow">UHS HealthOS</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export function Layout({
  user,
  page,
  setPage,
  onLogout,
  children,
}: {
  user: User | null;
  page: string;
  setPage: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="side-brand">
          <span>U</span>
          <div>
            <strong>UHS HealthOS</strong>
            <small>Rhema Care Flow Lite</small>
          </div>
        </div>
        <nav>
          {items.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="side-footer">
          <small>{user?.email}</small>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
