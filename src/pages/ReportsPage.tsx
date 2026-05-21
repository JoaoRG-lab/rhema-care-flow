import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useToast } from '../hooks/useToast';
import { useAuditLog } from '../hooks/useAuditLog';
import { supabase } from '../lib/supabase';

type ReportType = 'evolucao' | 'visitas' | 'scores' | 'prontuario';

const REPORT_LABELS: Record<ReportType, string> = {
  evolucao:  'Evolução Clínica',
  visitas:   'Resumo de Visitas',
  scores:    'Histórico de Escores',
  prontuario:'Prontuário Completo',
};

export function ReportsPage() {
  const [patientId, setPatientId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('evolucao');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const { success, error: toastError, info } = useToast();
  const { log } = useAuditLog();

  async function generate() {
    if (!patientId.trim()) { toastError('Informe o ID do paciente'); return; }
    setLoading(true);
    info('Gerando relatório...', 'Aguarde');

    try {
      // Carrega dados do paciente
      const { data: patient, error: pErr } = await supabase
        .from('patient_cards')
        .select('full_name, birth_date, diagnosis')
        .eq('id', patientId)
        .single();
      if (pErr) throw pErr;

      // Carrega entradas do prontuário no período
      const query = supabase
        .from('prontuario_entries')
        .select('created_at, entry_type, content, author_id')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (dateFrom) query.gte('created_at', dateFrom);
      if (dateTo)   query.lte('created_at', dateTo + 'T23:59:59');
      const { data: entries, error: eErr } = await query;
      if (eErr) throw eErr;

      // Geração PDF com jsPDF via CDN (lazy import)
      const { jsPDF } = await import('https://cdn.skypack.dev/jspdf@2.5.1') as any;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW  = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = margin;

      // Cabeçalho
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Rhema Care Flow — Sistema de Gestão em Saúde', margin, y);
      doc.text(new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' }), pageW - margin, y, { align: 'right' });
      y += 6;
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Título
      doc.setFontSize(16);
      doc.setTextColor(15, 118, 110); // teal
      doc.text(REPORT_LABELS[reportType], margin, y);
      y += 8;

      // Dados do paciente
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Paciente: ${patient.full_name}`, margin, y); y += 5;
      if (patient.birth_date) {
        const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear();
        doc.text(`Nascimento: ${new Date(patient.birth_date).toLocaleDateString('pt-BR')}  (${age} anos)`, margin, y); y += 5;
      }
      if (patient.diagnosis) {
        doc.text(`Diagnóstico: ${patient.diagnosis}`, margin, y); y += 5;
      }
      y += 4;
      doc.setDrawColor(230);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Entradas
      if (!entries?.length) {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('Nenhum registro encontrado no período informado.', margin, y);
      } else {
        for (const entry of entries) {
          if (y > 270) { doc.addPage(); y = margin; }
          doc.setFontSize(8);
          doc.setTextColor(120);
          const date = new Date(entry.created_at).toLocaleDateString('pt-BR', { dateStyle: 'short' });
          doc.text(`${date}  ·  ${entry.entry_type ?? '—'}`, margin, y); y += 5;
          doc.setFontSize(10);
          doc.setTextColor(40);
          const lines: string[] = doc.splitTextToSize(entry.content ?? '', pageW - margin * 2);
          for (const line of lines) {
            if (y > 270) { doc.addPage(); y = margin; }
            doc.text(line, margin, y); y += 5;
          }
          y += 3;
        }
      }

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(160);
        doc.text(`Página ${i} de ${pageCount}`, pageW / 2, 287, { align: 'center' });
      }

      const filename = `rhema-${reportType}-${patientId.slice(0, 8)}-${Date.now()}.pdf`;
      doc.save(filename);

      await log({
        action:       'file_uploaded',
        resourceType: 'report',
        resourceId:   patientId,
        metadata:     { reportType, filename, entries: entries?.length ?? 0 },
      });
      success('Relatório gerado!', filename);
    } catch (e) {
      toastError('Erro ao gerar relatório', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gere PDFs clínicos por paciente e período</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de relatório</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(REPORT_LABELS) as [ReportType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setReportType(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    reportType === key
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Patient ID */}
          <div>
            <label htmlFor="patient-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID do paciente</label>
            <input
              id="patient-id"
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="UUID do paciente"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">De</label>
              <input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Até</label>
              <input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg> Gerando...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Gerar PDF</>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default ReportsPage;
