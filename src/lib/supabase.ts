import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

// Aviso em console — não trava a app
if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '[Rhema] Variáveis de ambiente do Supabase ausentes.\n' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no Vercel.\n' +
    'O login não funcionará até que sejam configuradas.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

// Mantido para compatibilidade com imports existentes — sempre null agora
export const supabaseEnvError: string | null = null;
