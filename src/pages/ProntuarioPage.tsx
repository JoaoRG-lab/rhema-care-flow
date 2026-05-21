import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useProntuario } from '../hooks/useProntuario';
import { useAuth } from '../contexts/AuthContext';
import type { ProntuarioEntry } from '../types';

const ENTRY_TYPES: { value: ProntuarioEntry['entry_type']; label: string }[] = [
  { value: 'anamnese',   label: 'Anamnese' },
  { value: 'evolucao',   label: 'Evolucao' },
  { value: 'prescricao', label: 'Prescricao' },
  { value: 'exame',      label: 'Exame' },
  { value: 'laudo',      label: 'Laudo' },
  { value: 'outro',      label: 'Outro' },
];

const TYPE_COLORS: Record<string, string> = {
  anamnese:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  evolucao:   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  prescricao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  exame:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  laudo:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  outro:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface ProntuarioPageProps {
  patientId: string;
  patientName?: string;
}

export function ProntuarioPage({ patientId, patientName }: ProntuarioPageProps) {
  const { user } = useAuth();
  const { entries, loading, error, addEntry, refetch } = useProntuario(patientId);
  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<ProntuarioEntry['entry_type']>('evolucao');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSaving(true);
    setSaveError(null);
    const { error: addErr } = await addEntry({
      patient_id: patientId,
      author_id: user.id,
      entry_type: entryType,
      content: content.trim(),
      visit_id: null,
    });
    if (addErr) { setSaveError(addErr); setSaving(false); return; }
    setContent('');
    setShowForm(false);
    setSaving(false);
  }

  return (
    <AppShell>
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Prontuario</h1>
            {patientName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{patientName}</p>
            )}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors w-fit"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            Nova Entrada
          </button>
        </div>

        {/* Formulario de nova entrada */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-white dark:bg-gray-900 rounded-xl border border-teal-200 dark:border-teal-800 p-4 space-y-3 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nova Entrada no Prontuario</h2>

            {/* Tipo */}
            <div className="flex flex-wrap gap-1.5">
              {ENTRY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEntryType(t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    entryType === t.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Conteudo */}
            <div>
              <label htmlFor="entry-content" className="sr-only">Conteudo da entrada</label>
              <textarea
                id="entry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder={`Registre a ${ENTRY_TYPES.find(t => t.value === entryType)?.label.toLowerCase()}...`}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
              />
            </div>

            {saveError && <p className="text-xs text-red-500">{saveError}</p>}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setContent(''); setSaveError(null); }}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!content.trim() || saving}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* Timeline de entradas */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={refetch} className="mt-1 text-xs text-red-500 hover:underline">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma entrada no prontuario ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-teal-600 hover:underline"
            >
              Adicionar primeira entrada
            </button>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[entry.entry_type] ?? TYPE_COLORS.outro}`}>
                      {ENTRY_TYPES.find(t => t.value === entry.entry_type)?.label ?? entry.entry_type}
                    </span>
                    {entry.author && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.author.full_name}
                      </span>
                    )}
                  </div>
                  <time
                    dateTime={entry.created_at}
                    className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
                  >
                    {new Date(entry.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ProntuarioPage;
