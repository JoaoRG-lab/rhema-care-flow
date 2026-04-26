import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronLeft, FileText, ClipboardList } from 'lucide-react';
import { MemedPrescriptionPanel } from './MemedPrescriptionPanel';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { VideoRoom } from './VideoRoom';
import type { Teleconsulta } from '@/hooks/useTeleconsulta';
import { cn } from '@/lib/utils';

interface TeleconsultaRoomProps {
  teleconsulta: Teleconsulta;
  onEnd: () => void;
}

type PanelTab = 'prescricao' | 'historico';

export function TeleconsultaRoom({ teleconsulta, onEnd }: TeleconsultaRoomProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<PanelTab>('prescricao');

  // Nome único da sala: usa daily_room_name se disponível, senão deriva do id
  const roomName = teleconsulta.daily_room_name ?? `rhema-${teleconsulta.id.slice(0, 8)}`;

  return (
    <div className="flex h-full w-full bg-gray-950 overflow-hidden rounded-xl">
      {/* Área de vídeo — VideoRoom cuida de Daily.co vs Jitsi automaticamente */}
      <div className={cn('flex flex-col flex-1 min-w-0 relative')}>
        {/* Botão de toggle do painel */}
        <div className="absolute top-2 right-2 z-20">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white bg-gray-900/80"
            onClick={() => setPanelOpen(p => !p)}
            title={panelOpen ? 'Fechar painel' : 'Abrir painel'}
          >
            {panelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <VideoRoom
          roomName={roomName}
          roomUrl={teleconsulta.daily_room_url}
          displayName="Médico"
          onEnd={onEnd}
        />
      </div>

      {/* Painel lateral */}
      {panelOpen && (
        <div className="w-80 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Tabs do painel */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setPanelTab('prescricao')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors',
                panelTab === 'prescricao'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Prescrição Memed
            </button>
            <button
              onClick={() => setPanelTab('historico')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors',
                panelTab === 'historico'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Histórico
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {panelTab === 'prescricao' && (
              <>
                <MemedPrescriptionPanel
                  patientCode={teleconsulta.patient_name ?? undefined}
                  patientCardId={teleconsulta.patient_card_id ?? undefined}
                />
                <Separator />
                <p className="text-xs text-muted-foreground text-center">
                  Histórico de prescrições do paciente aparece na aba ao lado
                </p>
              </>
            )}
            {panelTab === 'historico' && teleconsulta.patient_card_id && (
              <PrescriptionList patientId={teleconsulta.patient_card_id} patientCode="—" />
            )}
            {panelTab === 'historico' && !teleconsulta.patient_card_id && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhum paciente vinculado a esta consulta
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
