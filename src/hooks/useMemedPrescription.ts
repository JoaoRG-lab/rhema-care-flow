import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemedPatient {
  nome: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  altura?: number;
  idExterno?: string;
}

export interface MemedHookReturn {
  ready: boolean;
  loading: boolean;
  error: string | null;
  tokenAuto: boolean;           // true = token obtido automaticamente via API
  setPatient: (patient: MemedPatient) => void;
  showPrescription: () => void;
  hidePrescription: () => void;
  /** Fallback manual: define token diretamente (para médicos sem CRM no perfil) */
  setDoctorTokenManual: (token: string) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MdHub?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MdSinapsePrescricao?: any;
  }
}

const MEMED_SCRIPT_ID = 'memed-sdk-script';

// Script padrão — será substituído pelo retornado pela edge function quando disponível
const MEMED_SCRIPT_DEFAULT =
  'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js';

function loadMemedScript(src: string, token?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MEMED_SCRIPT_ID) as HTMLScriptElement | null;

    // Se já carregou com o mesmo src, não recarrega
    if (existing && existing.src === src) {
      resolve();
      return;
    }

    // Remove script anterior se existir (troca de src)
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = MEMED_SCRIPT_ID;
    script.src = src;
    script.setAttribute('data-color', '#0ea5e9');
    if (token) script.setAttribute('data-token', token);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK Memed'));
    document.head.appendChild(script);
  });
}

export function useMemedPrescription(): MemedHookReturn {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAuto, setTokenAuto] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setLoading(true);
    setError(null);

    async function init() {
      try {
        // 1. Tentar obter token automaticamente via Edge Function
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (accessToken) {
          const res = await supabase.functions.invoke('memed-token', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!res.error && res.data?.token) {
            const { token, scriptUrl } = res.data as { token: string; scriptUrl: string };
            await loadMemedScript(scriptUrl ?? MEMED_SCRIPT_DEFAULT, token);

            // Aguarda MdHub ficar disponível
            await waitForMdHub();

            // Envia token via comando MdHub (duplo: via script data-token + comando)
            if (window.MdHub) {
              window.MdHub.command.send('plataforma.autenticacao', 'setToken', token);
            }

            setTokenAuto(true);
            setReady(true);
            return;
          }
          // Se a edge function falhou (ex: médico sem CRM), cai no fallback
          console.warn('[Memed] Edge function não retornou token, aguardando input manual');
        }

        // 2. Fallback: carrega script sem token (médico vai inserir manualmente)
        await loadMemedScript(MEMED_SCRIPT_DEFAULT);
        await waitForMdHub();
        setReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Memed] init error:', msg);
        setError(msg);
        setReady(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /** Aguarda window.MdHub estar disponível (polling, max 10s) */
  function waitForMdHub(): Promise<void> {
    return new Promise((resolve) => {
      if (window.MdHub) { resolve(); return; }
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        if (window.MdHub || tries > 100) {
          clearInterval(iv);
          resolve();
        }
      }, 100);
    });
  }

  const setDoctorTokenManual = useCallback((token: string) => {
    if (!window.MdHub) { console.warn('[Memed] MdHub não inicializado'); return; }
    window.MdHub.command.send('plataforma.autenticacao', 'setToken', token);
    setTokenAuto(true); // marca como configurado
  }, []);

  const setPatient = useCallback((patient: MemedPatient) => {
    if (!window.MdHub) { console.warn('[Memed] MdHub não inicializado'); return; }
    window.MdHub.command.send('plataforma.prescricao', 'setPatient', {
      name: patient.nome,
      address: patient.endereco ?? '',
      city: patient.cidade ?? '',
      phone: patient.telefone ?? '',
      height: patient.altura,
      externalId: patient.idExterno,
    });
  }, []);

  const showPrescription = useCallback(() => {
    if (!window.MdHub) { console.warn('[Memed] MdHub não inicializado'); return; }
    window.MdHub.module.show('plataforma.prescricao');
  }, []);

  const hidePrescription = useCallback(() => {
    if (!window.MdHub) return;
    window.MdHub.module.hide('plataforma.prescricao');
  }, []);

  return {
    ready,
    loading,
    error,
    tokenAuto,
    setPatient,
    showPrescription,
    hidePrescription,
    setDoctorTokenManual,
  };
}
