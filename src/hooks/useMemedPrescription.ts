import { useEffect, useRef, useState, useCallback } from 'react';

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
  setDoctorToken: (token: string) => void;
  setPatient: (patient: MemedPatient) => void;
  showPrescription: () => void;
  hidePrescription: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MdHub?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MemedSDK?: any;
  }
}

const MEMED_SCRIPT_ID = 'memed-sdk-script';
const MEMED_SCRIPT_SRC =
  'https://memed.com.br/modulos/plataforma.sinapse-api/build/sinapse-prescricao.min.js';

function loadMemedScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(MEMED_SCRIPT_ID)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = MEMED_SCRIPT_ID;
    script.src = MEMED_SCRIPT_SRC;
    script.setAttribute('data-color', '#0ea5e9');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Memed SDK'));
    document.head.appendChild(script);
  });
}

export function useMemedPrescription(): MemedHookReturn {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setLoading(true);

    loadMemedScript()
      .then(() => {
        setReady(true);
      })
      .catch(err => {
        console.error('Memed SDK load error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const setDoctorToken = useCallback((token: string) => {
    if (!window.MdHub) { console.warn('MdHub não inicializado'); return; }
    window.MdHub.command.send('plataforma.autenticacao', 'setToken', token);
  }, []);

  const setPatient = useCallback((patient: MemedPatient) => {
    if (!window.MdHub) { console.warn('MdHub não inicializado'); return; }
    window.MdHub.command.send('plataforma.prescricao', 'setPatient', {
      name: patient.nome,
      address: patient.endereco,
      city: patient.cidade,
      phone: patient.telefone,
      height: patient.altura,
      externalId: patient.idExterno,
    });
  }, []);

  const showPrescription = useCallback(() => {
    if (!window.MdHub) { console.warn('MdHub não inicializado'); return; }
    window.MdHub.module.show('plataforma.prescricao');
  }, []);

  const hidePrescription = useCallback(() => {
    if (!window.MdHub) return;
    window.MdHub.module.hide('plataforma.prescricao');
  }, []);

  return { ready, loading, setDoctorToken, setPatient, showPrescription, hidePrescription };
}
