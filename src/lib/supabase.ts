import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://rfsaxstpfpigrjyiochi.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_J8dthJB66ld8lhRIg4e8SA_ro6sr_na';

function stripEnvNoise(value: string | undefined): string | undefined {
  if (!value) return undefined;

  return value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '')
    .replace(/\s+/g, '');
}

function keepAsciiOnly(value: string | undefined): string | undefined {
  const cleaned = stripEnvNoise(value);
  if (!cleaned) return undefined;

  let result = '';
  for (const char of cleaned) {
    if (char.charCodeAt(0) <= 127) result += char;
  }
  return result || undefined;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const envSupabaseUrl = stripEnvNoise(rawSupabaseUrl);
const envSupabasePublishableKey = keepAsciiOnly(rawSupabasePublishableKey);

const supabaseUrl = envSupabaseUrl || FALLBACK_SUPABASE_URL;
const supabasePublishableKey = envSupabasePublishableKey || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

const keyWasSanitized = Boolean(
  rawSupabasePublishableKey &&
  envSupabasePublishableKey &&
  rawSupabasePublishableKey !== envSupabasePublishableKey
);

const urlWasSanitized = Boolean(
  rawSupabaseUrl &&
  envSupabaseUrl &&
  rawSupabaseUrl !== envSupabaseUrl
);

const usingFallbackConfig = !envSupabaseUrl || !envSupabasePublishableKey;

export const supabaseEnvError: string | null = null;

export const supabaseEnvWarning = usingFallbackConfig
  ? 'Usando configuração pública fallback do Supabase. Revise as Environment Variables da Vercel para remover aspas, espaços invisíveis ou texto extra.'
  : keyWasSanitized || urlWasSanitized
    ? 'As variáveis do Supabase foram sanitizadas no navegador. Revise os Environment Variables da Vercel e cole VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY como texto puro.'
    : null;

if (supabaseEnvWarning) {
  console.warn(`[Rhema] ${supabaseEnvWarning}`);
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);