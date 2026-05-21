import { supabase } from '../lib/supabase';

type SignalMessage =
  | { type: 'offer';     sdp: string }
  | { type: 'answer';    sdp: string }
  | { type: 'ice';       candidate: RTCIceCandidateInit }
  | { type: 'hangup' };

type SignalHandler = (msg: SignalMessage, senderId: string) => void;

export class SignalingService {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private roomId: string;
  private userId: string;
  private onSignal: SignalHandler;

  constructor(roomId: string, userId: string, onSignal: SignalHandler) {
    this.roomId   = roomId;
    this.userId   = userId;
    this.onSignal = onSignal;
  }

  join() {
    this.channel = supabase
      .channel(`teleconsulta:${this.roomId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.senderId !== this.userId) {
          this.onSignal(payload.msg as SignalMessage, payload.senderId);
        }
      })
      .subscribe();
  }

  async send(msg: SignalMessage) {
    await this.channel?.send({
      type:    'broadcast',
      event:   'signal',
      payload: { msg, senderId: this.userId },
    });
  }

  leave() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Hook de conveniência para WebRTC P2P completo
import { useRef, useCallback } from 'react';

export function useWebRTC(roomId: string, userId: string) {
  const pcRef       = useRef<RTCPeerConnection | null>(null);
  const sigRef      = useRef<SignalingService | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const onRemoteRef = useRef<((s: MediaStream) => void) | null>(null);
  const onHangupRef = useRef<(() => void) | null>(null);

  function createPC() {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    pc.ontrack = (e) => { if (e.streams[0]) onRemoteRef.current?.(e.streams[0]); };
    pc.onicecandidate = (e) => {
      if (e.candidate) sigRef.current?.send({ type: 'ice', candidate: e.candidate.toJSON() });
    };
    pcRef.current = pc;
    return pc;
  }

  const handleSignal = useCallback(async (msg: SignalMessage) => {
    const pc = pcRef.current ?? createPC();
    if (msg.type === 'offer') {
      await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sigRef.current?.send({ type: 'answer', sdp: answer.sdp! });
    } else if (msg.type === 'answer') {
      await pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
    } else if (msg.type === 'ice') {
      await pc.addIceCandidate(msg.candidate);
    } else if (msg.type === 'hangup') {
      onHangupRef.current?.();
    }
  }, []);

  const start = useCallback(async (
    stream: MediaStream,
    onRemote: (s: MediaStream) => void,
    onHangup: () => void,
    initiator: boolean,
  ) => {
    streamRef.current   = stream;
    onRemoteRef.current = onRemote;
    onHangupRef.current = onHangup;

    const sig = new SignalingService(roomId, userId, handleSignal);
    sigRef.current = sig;
    sig.join();

    const pc = createPC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sig.send({ type: 'offer', sdp: offer.sdp! });
    }
  }, [roomId, userId, handleSignal]);

  const hangup = useCallback(async () => {
    await sigRef.current?.send({ type: 'hangup' });
    pcRef.current?.close(); pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    sigRef.current?.leave(); sigRef.current = null;
  }, []);

  return { start, hangup };
}
