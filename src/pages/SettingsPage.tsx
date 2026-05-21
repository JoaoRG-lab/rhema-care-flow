import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useAuditLog } from '../hooks/useAuditLog';

type Tab = 'perfil' | 'senha' | 'notificacoes';

export function SettingsPage() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const { log } = useAuditLog();
  const [tab, setTab] = useState<Tab>('perfil');

  // Perfil
  const [fullName,  setFullName]  = useState(profile?.full_name ?? '');
  const [phone,     setPhone]     = useState(profile?.phone ?? '');
  const [savingP,   setSavingP]   = useState(false);

  // Senha
  const [newPwd,    setNewPwd]    = useState('');
  const [confirmPwd,setConfirmPwd]= useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  // Notificações
  const [notifSMS,   setNotifSMS]   = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush,  setNotifPush]  = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingP(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user!.id);
    setSavingP(false);
    if (error) { toastError('Erro ao salvar perfil', error.message); return; }
    await log({ action: 'patient_updated', resourceType: 'profile', resourceId: user!.id });
    success('Perfil atualizado!');
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) { toastError('Senha muito curta', 'Mínimo 8 caracteres'); return; }
    if (newPwd !== confirmPwd) { toastError('As senhas não coincidem'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) { toastError('Erro ao atualizar senha', error.message); return; }
    setNewPwd(''); setConfirmPwd('');
    success('Senha atualizada com sucesso!');
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'perfil',        label: 'Perfil' },
    { key: 'senha',         label: 'Senha' },
    { key: 'notificacoes',  label: 'Notificações' },
  ];

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          {/* --- PERFIL --- */}
          {tab === 'perfil' && (
            <form onSubmit={saveProfile} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Dados pessoais</h2>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 text-xl font-bold select-none">
                  {(fullName || user?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{profile?.role ?? 'Usuário'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button disabled={savingP}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {savingP ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </form>
          )}

          {/* --- SENHA --- */}
          {tab === 'senha' && (
            <form onSubmit={savePassword} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Alterar senha</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                  minLength={8} placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar senha</label>
                <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              <button disabled={savingPwd || newPwd !== confirmPwd || newPwd.length < 8}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {savingPwd ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </form>
          )}

          {/* --- NOTIFICAÇÕES --- */}
          {tab === 'notificacoes' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Preferências de notificação</h2>
              {([
                { label: 'SMS',          description: 'Alertas por mensagem de texto',   value: notifSMS,   set: setNotifSMS },
                { label: 'E-mail',       description: 'Resumos e alertas por e-mail',     value: notifEmail, set: setNotifEmail },
                { label: 'Push (PWA)',   description: 'Notificações no dispositivo',       value: notifPush,  set: setNotifPush },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={item.value}
                    onClick={() => item.set((v: boolean) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      item.value ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      item.value ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => success('Preferências salvas!')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
              >
                Salvar preferências
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default SettingsPage;
