import { createClient } from '@supabase/supabase-js';

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
  return result;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const supabaseUrl = stripEnvNoise(rawSupabaseUrl);
const supabasePublishableKey = keepAsciiOnly(rawSupabasePublishableKey);

const keyWasSanitized = Boolean(
  rawSupabasePublishableKey &&
  supabasePublishableKey &&
  rawSupabasePublishableKey !== supabasePublishableKey
);

const urlWasSanitized = Boolean(
  rawSupabaseUrl &&
  supabaseUrl &&
  rawSupabaseUrl !== supabaseUrl
);

export const supabaseEnvError = !supabaseUrl || !supabasePublishableKey
  ? 'Variáveis de ambiente do Supabase ausentes ou inválidas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no Vercel usando valores puros, sem aspas, emojis, quebras de linha ou texto extra.'
  : null;

export const supabaseEnvWarning = keyWasSanitized || urlWasSanitized
  ? 'As variáveis do Supabase foram sanitizadas no navegador. Revise os Environment Variables da Vercel e cole VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY como texto puro.'
  : null;

if (supabaseEnvError) {
  console.warn(`[Rhema] ${supabaseEnvError}`);
}

if (supabaseEnvWarning) {
  console.warn(`[Rhema] ${supabaseEnvWarning}`);
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