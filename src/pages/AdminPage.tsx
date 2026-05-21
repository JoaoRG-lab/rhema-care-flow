import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

type Role = 'admin' | 'medico' | 'enfermeiro' | 'recepcao' | 'paciente';

interface Profile {
  id:         string;
  full_name:  string | null;
  email:      string | null;
  role:       Role;
  created_at: string;
  active:     boolean;
}

interface AuditEntry {
  id:            string;
  user_id:       string;
  action:        string;
  resource_type: string;
  resource_id:   string | null;
  created_at:    string;
  metadata:      Record<string, unknown> | null;
}

const ROLE_LABELS: Record<Role, string> = {
  admin:      'Admin',
  medico:     'Médico',
  enfermeiro: 'Enfermeiro',
  recepcao:   'Recepção',
  paciente:   'Paciente',
};

const ROLE_COLOR: Record<Role, string> = {
  admin:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  medico:     'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-300',
  enfermeiro: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  recepcao:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  paciente:   'bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-300',
};

export function AdminPage() {
  const [section, setSection] = useState<'users' | 'audit'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [audit,    setAudit]    = useState<AuditEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const PAGE_SIZE = 20;
  const { success, error: toastError } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, active')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { toastError('Erro ao carregar usuários', error.message); return; }
    setProfiles(data as Profile[]);
  }, [toastError]);

  const loadAudit = useCallback(async (page = 0) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, resource_type, resource_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setLoading(false);
    if (error) { toastError('Erro ao carregar logs', error.message); return; }
    setAudit(data as AuditEntry[]);
  }, [toastError]);

  useEffect(() => {
    if (section === 'users') loadUsers();
    else loadAudit(auditPage);
  }, [section, auditPage, loadUsers, loadAudit]);

  async function changeRole(id: string, role: Role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) { toastError('Erro ao alterar role', error.message); return; }
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, role } : p));
    success(`Role atualizado para ${ROLE_LABELS[role]}`);
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from('profiles').update({ active: !current }).eq('id', id);
    if (error) { toastError('Erro', error.message); return; }
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, active: !current } : p));
    success(current ? 'Usuário desativado' : 'Usuário reativado');
  }

  const filtered = profiles.filter((p) =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Administração</h1>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['users', 'audit'] as const).map((s) => (
              <button key={s} onClick={() => setSection(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  section === s
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                {s === 'users' ? 'Usuários' : 'Auditoria'}
              </button>
            ))}
          </div>
        </div>

        {/* --- USERS --- */}
        {section === 'users' && (
          <div className="space-y-3">
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin text-gray-300" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Usuário', 'Role', 'Status', 'Criado em', 'Ações'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{p.full_name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={p.role}
                            onChange={(e) => changeRole(p.id, e.target.value as Role)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-teal-500 cursor-pointer ${ROLE_COLOR[p.role]}`}
                          >
                            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                            p.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ p.active ? 'bg-green-500' : 'bg-red-500'}`} />
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(p.id, p.active)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            {p.active ? 'Desativar' : 'Reativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- AUDIT --- */}
        {section === 'audit' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin text-gray-300" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Ação', 'Recurso', 'Usuário', 'Data/Hora'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((e) => (
                      <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-block text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{e.action}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {e.resource_type}{e.resource_id ? ` · ${e.resource_id.slice(0,8)}` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{e.user_id.slice(0,8)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(e.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Paginação */}
            <div className="flex items-center justify-between">
              <button onClick={() => setAuditPage((p) => Math.max(0, p - 1))} disabled={auditPage === 0}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                ← Anterior
              </button>
              <span className="text-xs text-gray-400">Página {auditPage + 1}</span>
              <button onClick={() => setAuditPage((p) => p + 1)} disabled={audit.length < PAGE_SIZE}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default AdminPage;
