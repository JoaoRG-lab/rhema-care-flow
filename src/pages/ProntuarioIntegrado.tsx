import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SharedRecordViewer } from '@/components/prontuario/SharedRecordViewer';

export default function ProntuarioIntegrado() {
  const [searchParams] = useSearchParams();
  const codigoParam = searchParams.get('codigo') ?? '';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SharedRecordViewer codigoInicial={codigoParam} />
      </div>
    </AppLayout>
  );
}
