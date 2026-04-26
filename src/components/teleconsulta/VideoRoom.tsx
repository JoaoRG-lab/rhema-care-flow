/** @version 2026-04-26T15:09:12Z
 * VideoRoom — Sala de vídeo nativa para teleconsulta
 *
 * Estratégia de fallback (sem custo):
 * 1. Se VITE_DAILY_CO_API_KEY estiver configurada → usa daily_room_url (Daily.co)
 * 2. Se não → usa Jitsi Meet (gratuito, sem conta, sem limite)
 *
 * O Jitsi funciona diretamente no browser via iframe com permissões de câmera e microfone.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Maximize2, Minimize2, AlertCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoRoomProps {
  roomName: string;         // nome único da sala (ex: rhema-abc123-1234567890)
  roomUrl?: string | null;  // URL Daily.co, se disponível
  displayName?: string;     // nome do participante
  onEnd: () => void;
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export function VideoRoom({ roomName, roomUrl, displayName = 'Médico', onEnd }: VideoRoomProps) {
  const hasDailyKey = !!import.meta.env.VITE_DAILY_CO_API_KEY;
  // Só usa Daily se tiver key E a URL existir E não for uma URL de sala inexistente
  // (salas criadas sem key real sempre falham com "does not exist")
  const useDaily = hasDailyKey && !!roomUrl && !roomUrl.includes('rhema.daily.co');

  // Jitsi config
  const jitsiRef = useRef<HTMLIFrameElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Slug para Jitsi: alfanumérico sem espaços
  const jitsiRoom = roomName.replace(/[^a-zA-Z0-9-]/g, '-');
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

  // Solicita câmera/microfone para preview local (apenas no modo Jitsi)
  useEffect(() => {
    if (useDaily) return;
    setPermission('requesting');

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        setStream(s);
        setPermission('granted');
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied');
        } else {
          setPermission('error');
        }
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDaily]);

  const toggleMic = () => {
    stream?.getAudioTracks().forEach((t) => { t.enabled = !micOn; });
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach((t) => { t.enabled = !camOn; });
    setCamOn((v) => !v);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  const handleEnd = () => {
    stream?.getTracks().forEach((t) => t.stop());
    onEnd();
  };

  // ─── Daily.co (quando API key configurada) ───────────────────────────────
  if (useDaily) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-950 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-white text-sm font-medium">Daily.co · {displayName}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <iframe
          src={roomUrl!}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 border-0 w-full"
          title="Sala Daily.co"
        />
        <div className="flex justify-center gap-4 py-3 bg-gray-900 border-t border-gray-800">
          <Button size="sm" variant="destructive" className="px-6" onClick={handleEnd}>
            <PhoneOff className="h-4 w-4 mr-2" /> Encerrar
          </Button>
        </div>
      </div>
    );
  }

  // ─── Estado: solicitando permissão ───────────────────────────────────────
  if (permission === 'requesting') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 rounded-xl gap-4">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
        <p className="text-gray-300 text-sm">Solicitando acesso à câmera e microfone…</p>
        <p className="text-gray-500 text-xs">Clique em "Permitir" no popup do navegador</p>
      </div>
    );
  }

  // ─── Estado: permissão negada ────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 rounded-xl gap-4 px-8 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400" />
        <p className="text-white font-medium">Acesso à câmera negado</p>
        <p className="text-gray-400 text-sm max-w-sm">
          Para realizar a teleconsulta, permita o acesso à câmera e microfone nas configurações do
          seu navegador e recarregue a página.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-gray-700 text-gray-300" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
          <Button size="sm" variant="destructive" onClick={onEnd}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // ─── Estado: erro inesperado ─────────────────────────────────────────────
  if (permission === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 rounded-xl gap-4 px-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-white font-medium">Não foi possível acessar a câmera</p>
        <p className="text-gray-400 text-sm max-w-sm">
          Verifique se outra aplicação está usando a câmera ou se o dispositivo está conectado.
        </p>
        <Button size="sm" variant="destructive" onClick={onEnd}>Voltar</Button>
      </div>
    );
  }

  // ─── Jitsi Meet (fallback gratuito com câmera/microfone reais) ──────────
  return (
    <div className="flex flex-col h-full w-full bg-gray-950 rounded-xl overflow-hidden relative">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
            ● AO VIVO
          </span>
          <span className="text-white text-sm font-medium">{displayName}</span>
          <span className="text-gray-500 text-xs">Jitsi Meet</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Jitsi iframe — câmera e microfone reais */}
      <div className="flex-1 relative">
        <iframe
          ref={jitsiRef}
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="w-full h-full border-0"
          title="Sala de Teleconsulta"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        />

        {/* Preview local no canto (opcional — Jitsi já mostra o vídeo local) */}
        {permission === 'granted' && stream && (
          <div className={cn(
            'absolute bottom-4 right-4 rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl',
            'w-32 h-24 bg-gray-900',
          )}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={cn('w-full h-full object-cover', !camOn && 'invisible')}
            />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800">
        <Button
          size="sm"
          variant={micOn ? 'outline' : 'secondary'}
          className={cn(
            'h-9 w-9 p-0 border-gray-700',
            micOn ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'bg-red-900/50 text-red-400 border-red-800',
          )}
          onClick={toggleMic}
          title={micOn ? 'Silenciar' : 'Ativar microfone'}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        <Button
          size="sm"
          variant={camOn ? 'outline' : 'secondary'}
          className={cn(
            'h-9 w-9 p-0 border-gray-700',
            camOn ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'bg-red-900/50 text-red-400 border-red-800',
          )}
          onClick={toggleCam}
          title={camOn ? 'Desligar câmera' : 'Ligar câmera'}
        >
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="h-9 px-6 font-medium"
          onClick={handleEnd}
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          Encerrar consulta
        </Button>
      </div>
    </div>
  );
}
