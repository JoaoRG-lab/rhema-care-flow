import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuditLog } from '../hooks/useAuditLog';
import { useToast } from '../hooks/useToast';

type RoomState = 'idle' | 'joining' | 'connected' | 'error';

interface TeleconsultaPageProps {
  roomId?:     string;
  patientName?: string;
}

export function TeleconsultaPage({ roomId: initialRoomId, patientName }: TeleconsultaPageProps) {
  const [roomId,    setRoomId]    = useState(initialRoomId ?? '');
  const [state,     setState]     = useState<RoomState>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [muted,     setMuted]     = useState(false);
  const [videoOff,  setVideoOff]  = useState(false);
  const [elapsed,   setElapsed]   = useState(0);

  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const { log }     = useAuditLog();
  const { error: toastError, success, info } = useToast();

  // Limpa ao desmontar
  useEffect(() => () => hangup(true), []);

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  async function startLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (localRef.current) {
      localRef.current.srcObject = stream;
      localRef.current.muted = true; // evita eco local
    }
    return stream;
  }

  async function join() {
    if (!roomId.trim()) { toastError('ID da sala obrigatorio'); return; }
    setState('joining');
    setErrorMsg('');

    try {
      const stream = await startLocalStream();

      // RTCPeerConnection com STUN publico
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      // Adiciona tracks locais
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Recebe stream remoto
      pc.ontrack = (e) => {
        if (remoteRef.current && e.streams[0]) {
          remoteRef.current.srcObject = e.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setState('connected');
          info('Teleconsulta conectada', patientName ? `Paciente: ${patientName}` : undefined);
          timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
          log({ action: 'teleconsulta_started', resourceType: 'teleconsulta', resourceId: roomId });
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          toastError('Conexao perdida', 'Tente reconectar.');
          setState('error');
        }
      };

      // Neste demo a sinalizacao seria via Supabase Realtime (canal broadcast)
      // A implementacao completa usa supabase.channel(roomId) para trocar offer/answer/ICE
      // Aqui exibimos a UI funcional pronta para integrar o canal de sinalizacao
      setState('connected');
      success('Sala criada', `ID: ${roomId}`);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      await log({ action: 'teleconsulta_started', resourceType: 'teleconsulta', resourceId: roomId });

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao acessar camera/microfone.';
      setErrorMsg(msg);
      setState('error');
      toastError('Erro na teleconsulta', msg);
    }
  }

  const hangup = useCallback(async (silent = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localRef.current)  localRef.current.srcObject  = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
    if (!silent) {
      await log({ action: 'teleconsulta_ended', resourceType: 'teleconsulta', resourceId: roomId, metadata: { duration_seconds: elapsed } });
      success('Consulta encerrada', `Duracao: ${formatElapsed(elapsed)}`);
    }
    setState('idle');
    setElapsed(0);
  }, [elapsed, roomId, log, success]);

  function toggleMute() {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  }

  function toggleVideo() {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = videoOff; });
    setVideoOff((v) => !v);
  }

  const isConnected = state === 'connected';

  return (
    <AppShell>
      <div className="max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Teleconsulta</h1>
            {patientName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{patientName}</p>
            )}
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {formatElapsed(elapsed)}
            </div>
          )}
        </div>

        {/* Setup / Sala */}
        {!isConnected && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm max-w-md">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Entrar na sala</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="room-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ID da sala
                </label>
                <input
                  id="room-id"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ex: consulta-2026-05-20"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={state === 'joining'}
                />
              </div>
              {errorMsg && (
                <p className="text-sm text-red-500">{errorMsg}</p>
              )}
              <button
                onClick={join}
                disabled={state === 'joining'}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {state === 'joining' ? 'Conectando...' : 'Iniciar / Entrar na sala'}
              </button>
              <button
                onClick={() => setRoomId(crypto.randomUUID().slice(0, 12))}
                className="w-full py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Gerar ID aleatorio
              </button>
            </div>
          </div>
        )}

        {/* Video grid */}
        {isConnected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Remoto */}
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                aria-label="Video do paciente"
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">
                {patientName ?? 'Paciente'}
              </div>
            </div>

            {/* Local */}
            <div className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden">
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity ${videoOff ? 'opacity-0' : 'opacity-100'}`}
                aria-label="Seu video"
              />
              {videoOff && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-400" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">Voce</div>
            </div>
          </div>
        )}

        {/* Controles */}
        {isConnected && (
          <div className="flex items-center justify-center gap-3">
            {/* Mute */}
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Ligar microfone' : 'Silenciar'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                muted ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {muted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>

            {/* Encerrar */}
            <button
              onClick={() => hangup()}
              aria-label="Encerrar consulta"
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors shadow-md"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.76 19.79 19.79 0 0 1 1.2 1.13 2 2 0 0 1 3.18 1H6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.07 8.91"/>
                <line x1="23" y1="1" x2="1" y2="23"/>
              </svg>
            </button>

            {/* Video */}
            <button
              onClick={toggleVideo}
              aria-label={videoOff ? 'Ligar camera' : 'Desligar camera'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                videoOff ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {videoOff ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Info sobre sinalizacao */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Sinalizacao WebRTC:</strong> Para conectar dois usuarios, integre o canal Supabase Realtime
              (<code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">supabase.channel(roomId)</code>) para
              trocar <em>offer/answer/ICE candidates</em>. A UI, controles e auditoria ja estao completos.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default TeleconsultaPage;
