import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseEnvError = !supabaseUrl || !supabasePublishableKey
  ? 'Configuração Supabase ausente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente de produção.'
  : null;

const safeSupabaseUrl = supabaseUrl ?? 'https://placeholder.supabase.co';
const safeSupabaseKey = supabasePublishableKey ?? 'placeholder-publishable-key';

export const supabase = createClient(
  safeSupabaseUrl,
  safeSupabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);