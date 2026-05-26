import { createClient } from '@supabase/supabase-js';

// Public Supabase frontend configuration. This is a publishable/anon key, not a service-role secret.
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

function isSupabaseUrl(value: string | undefined): value is string {
  return Boolean(value && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value));
}

function isSupabasePublicKey(value: string | undefined): value is string {
  return Boolean(value && (value.startsWith('sb_publishable_') || value.startsWith('eyJ')));
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const envSupabaseUrl = stripEnvNoise(rawSupabaseUrl);
const envSupabasePublishableKey = keepAsciiOnly(rawSupabasePublishableKey);

const usingFallbackUrl = !isSupabaseUrl(envSupabaseUrl);
const usingFallbackKey = !isSupabasePublicKey(envSupabasePublishableKey);

const supabaseUrl = usingFallbackUrl ? FALLBACK_SUPABASE_URL : envSupabaseUrl;
const supabasePublishableKey = usingFallbackKey ? FALLBACK_SUPABASE_PUBLISHABLE_KEY : envSupabasePublishableKey;

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

export const supabaseEnvError: string | null = null;

export const supabaseEnvWarning = usingFallbackUrl || usingFallbackKey
  ? 'Usando configuração pública fallback do Supabase porque as variáveis da Vercel estão ausentes ou inválidas.'
  : keyWasSanitized || urlWasSanitized
    ? 'As variáveis públicas do Supabase foram sanitizadas no navegador. Revise o ambiente de produção e use texto puro.'
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