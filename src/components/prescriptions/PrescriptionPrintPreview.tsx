import type { PrescriptionDraftItem } from '../../lib/prescriptionEngine';
import { formatPrescription } from '../../lib/prescriptionEngine';

interface PrescriptionPrintPreviewProps {
  patientName?: string;
  prescriberName?: string;
  prescriberCouncil?: string;
  items: PrescriptionDraftItem[];
}

export function PrescriptionPrintPreview({
  patientName,
  prescriberName = 'Prescritor responsável',
  prescriberCouncil = 'CRM/UF não informado',
  items,
}: PrescriptionPrintPreviewProps) {
  const formatted = formatPrescription(items);
  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm print:border-0 print:shadow-none">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .rhema-prescription-print, .rhema-prescription-print * { visibility: visible; }
          .rhema-prescription-print { position: absolute; inset: 0; width: 100%; padding: 32px; }
          .rhema-no-print { display: none !important; }
        }
      `}</style>

      <div className="rhema-prescription-print space-y-5">
        <header className="border-b border-teal-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">RhemaFlow Prescription</p>
          <h2 className="mt-1 text-xl font-bold text-gray-950">Prescrição</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="block text-xs uppercase tracking-wide text-gray-500">Paciente</span>
              <strong>{patientName || 'Paciente não informado'}</strong>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-gray-500">Data</span>
              <strong>{today}</strong>
            </div>
          </div>
        </header>

        <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-900 print:bg-white print:p-0">
          {formatted.text}
        </pre>

        <footer className="mt-10 grid gap-6 border-t border-gray-200 pt-5 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold">{prescriberName}</p>
            <p className="text-gray-600">{prescriberCouncil}</p>
          </div>
          <div className="text-right">
            <div className="ml-auto mt-6 h-px w-64 bg-gray-400" />
            <p className="mt-2 text-xs text-gray-500">Assinatura/carimbo</p>
          </div>
        </footer>
      </div>

      <div className="rhema-no-print mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
        >
          Imprimir / salvar PDF
        </button>
      </div>
    </section>
  );
}
