import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Video, VideoOff, PhoneOff, ChevronRight, ChevronLeft,
  FileText, ClipboardList, Maximize2, Minimize2
} from 'lucide-react';
import { MemedPrescriptionPanel } from './MemedPrescriptionPanel';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
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
  const [fullscreen, setFullscreen] = useState(false);
  const [elapsed] = useState<string>('00:00');

  const roomUrl = teleconsulta.daily_room_url;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-950 overflow-hidden rounded-xl">
      {/* Área de vídeo */}
      <div className={cn('flex flex-col flex-1 min-w-0 relative', !panelOpen && 'flex-1')}>
        {/* Header da sala */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Badge className="bg-red-500 text-white text-xs animate-pulse">● AO VIVO</Badge>
            <span className="text-white text-sm font-medium">
              {teleconsulta.patient_name ?? 'Paciente'}
            </span>
            {teleconsulta.specialty && (
              <Badge variant="outline" className="text-gray-300 border-gray-600 text-xs">
                {teleconsulta.specialty}
              </Badge>
            )}
            <span className="text-gray-400 text-xs font-mono">{elapsed}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white"
              onClick={toggleFullscreen}
              title={fullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white"
              onClick={() => setPanelOpen(p => !p)}
              title={panelOpen ? 'Fechar painel' : 'Abrir painel'}
            >
              {panelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Iframe Daily.co */}
        <div className="flex-1 relative">
          {roomUrl ? (
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Sala de Teleconsulta"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <VideoOff className="h-12 w-12" />
              <p className="text-sm">Link de sala não disponível</p>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                Configure <code className="bg-gray-800 px-1 rounded">VITE_DAILY_CO_API_KEY</code> no .env para gerar salas automáticas
              </p>
            </div>
          )}
        </div>

        {/* Barra de controles */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-gray-900 border-t border-gray-800">
          <Button size="sm" variant="outline" className="h-9 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            <Video className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-9 px-6 font-medium"
            onClick={onEnd}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Encerrar consulta
          </Button>
        </div>
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
                  patientName={teleconsulta.patient_name ?? undefined}
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
