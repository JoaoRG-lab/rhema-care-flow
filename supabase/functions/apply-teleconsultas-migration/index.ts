import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Executa cada statement separadamente via rpc exec_sql se existir,
  // caso contrário usa insert/select para testar e retorna o SQL para execução manual.
  const statements = [
    `CREATE TABLE IF NOT EXISTS public.teleconsultas (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE SET NULL,
      patient_name    TEXT,
      specialty       TEXT,
      scheduled_date  DATE NOT NULL,
      start_time      TIME NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      status          TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
      daily_room_name TEXT,
      daily_room_url  TEXT,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE public.teleconsultas ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'teleconsultas'
        AND policyname = 'Clinicians see own teleconsultas'
      ) THEN
        CREATE POLICY "Clinicians see own teleconsultas"
          ON public.teleconsultas FOR ALL
          USING (provider_id = auth.uid());
      END IF;
    END $$`,
    `CREATE INDEX IF NOT EXISTS idx_teleconsultas_provider
      ON public.teleconsultas(provider_id, scheduled_date)`,
    `CREATE OR REPLACE FUNCTION public.handle_teleconsultas_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$`,
    `DROP TRIGGER IF EXISTS teleconsultas_updated_at ON public.teleconsultas`,
    `CREATE TRIGGER teleconsultas_updated_at
      BEFORE UPDATE ON public.teleconsultas
      FOR EACH ROW EXECUTE FUNCTION public.handle_teleconsultas_updated_at()`,
  ];

  const results: { stmt: string; ok: boolean; error?: string }[] = [];

  for (const stmt of statements) {
    // Supabase JS não tem .query() nativo — usar fetch direto ao pg via REST
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql_query: stmt }),
    });

    if (res.ok) {
      results.push({ stmt: stmt.slice(0, 60), ok: true });
    } else {
      const err = await res.text();
      // Se exec_sql não existe, tenta via pg connection string
      results.push({ stmt: stmt.slice(0, 60), ok: false, error: err.slice(0, 200) });
    }
  }

  // Verifica se a tabela foi criada
  const { data: check, error: checkErr } = await admin
    .from('teleconsultas')
    .select('id')
    .limit(1);

  const tableExists = !checkErr;

  return new Response(
    JSON.stringify({ tableExists, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
