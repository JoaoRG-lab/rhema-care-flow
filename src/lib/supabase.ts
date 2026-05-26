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
  return result || undefined;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const envSupabaseUrl = stripEnvNoise(rawSupabaseUrl);
const envSupabasePublishableKey = keepAsciiOnly(rawSupabasePublishableKey);

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

export const supabaseEnvError = !envSupabaseUrl || !envSupabasePublishableKey
  ? 'Configuração Supabase ausente. Configure as variáveis públicas do frontend no ambiente de produção.'
  : null;

export const supabaseEnvWarning = !supabaseEnvError && (keyWasSanitized || urlWasSanitized)
  ? 'As variáveis públicas do Supabase foram sanitizadas no navegador. Revise o ambiente de produção e use texto puro.'
  : null;

if (supabaseEnvWarning) {
  console.warn(`[Rhema] ${supabaseEnvWarning}`);
}

if (supabaseEnvError) {
  console.warn(`[Rhema] ${supabaseEnvError}`);
}

export const supabase = createClient(
  envSupabaseUrl ?? 'https://placeholder.supabase.co',
  envSupabasePublishableKey ?? 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);