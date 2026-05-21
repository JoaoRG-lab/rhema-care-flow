import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

const PII_FIELDS = new Set([
  'email','full_name','phone_number','patient_phone','patient_email',
  'institutional_email','license_number','notes','provider_notes',
  'patient_notes','name','organization','message','body','subject',
  'sender_email','sender_name','error_message','ip_address',
]);

const TABLES_CONFIG = [
  { table: 'profiles',              sensitivity: 'high',   description: 'Perfis de usuarios' },
  { table: 'patient_cards',         sensitivity: 'high',   description: 'Fichas de pacientes' },
  { table: 'visits',                sensitivity: 'high',   description: 'Visitas clinicas' },
  { table: 'consultation_sessions', sensitivity: 'high',   description: 'Sessoes de consulta' },
  { table: 'verification_requests', sensitivity: 'high',   description: 'Solicitacoes de verificacao' },
  { table: 'outreach_contacts',     sensitivity: 'high',   description: 'Contatos outreach' },
  { table: 'scheduled_sms',         sensitivity: 'high',   description: 'SMS agendados' },
  { table: 'score_entries',         sensitivity: 'medium', description: 'Entradas de score clinico' },
  { table: 'monitoring_events',     sensitivity: 'medium', description: 'Eventos de monitoramento' },
  { table: 'audit_logs',            sensitivity: 'medium', description: 'Trilha de auditoria' },
  { table: 'payment_audit_log',     sensitivity: 'medium', description: 'Auditoria de pagamentos' },
  { table: 'knowledge_contributions',sensitivity:'medium', description: 'Contribuicoes de conhecimento' },
  { table: 'tasks',                 sensitivity: 'low',    description: 'Tarefas' },
  { table: 'shifts',                sensitivity: 'low',    description: 'Turnos' },
  { table: 'user_roles',            sensitivity: 'low',    description: 'Papeis de usuarios' },
  { table: 'sentinel_alerts',       sensitivity: 'low',    description: 'Alertas sentinel' },
  { table: 'ai_review_logs',        sensitivity: 'low',    description: 'Logs de revisao IA' },
];

function maskPII(row: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (PII_FIELDS.has(key) && typeof value === 'string' && value.length > 0) {
      // Mascara PII: mantem primeiros 2 chars + ***
      masked[key] = value.length > 4 ? `${value.slice(0, 2)}***` : '***';
    } else if (key.endsWith('_encrypted')) {
      masked[key] = value ? '[ENCRYPTED]' : null;
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(origin) });
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo nao permitido.' }, 405, origin);
  }

  const auth = await verifyJWT(req);
  if (!auth) return jsonResponse({ error: 'Nao autorizado.' }, 401, origin);

  // Rate limit rigoroso para export (admin)
  if (!checkRateLimit(`export:${auth.userId}:${ip}`, 3, 60_000)) {
    return jsonResponse({ error: 'Muitas exportacoes. Aguarde 1 minuto.' }, 429, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Verifica role admin
  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) {
    return jsonResponse({ error: 'Acesso negado: requer role admin.' }, 403, origin);
  }

  const exportTimestamp = new Date().toISOString();
  const tables: Record<string, unknown> = {};

  for (const config of TABLES_CONFIG) {
    try {
      const { data, error } = await adminClient
        .from(config.table)
        .select('*')
        .limit(5000);

      if (error) {
        tables[config.table] = { description: config.description, sensitivity: config.sensitivity, row_count: 0, error: error.message };
        continue;
      }

      const rows = (data ?? []) as Record<string, unknown>[];
      const maskedRows = config.sensitivity === 'high'
        ? rows.map((r) => maskPII(r))
        : rows;

      tables[config.table] = {
        description: config.description,
        sensitivity: config.sensitivity,
        row_count: rows.length,
        data: maskedRows,
      };
    } catch (e) {
      tables[config.table] = { description: config.description, sensitivity: config.sensitivity, row_count: 0, error: String(e) };
    }
  }

  const totalRows = Object.values(tables).reduce((s, t: unknown) => s + ((t as { row_count?: number }).row_count ?? 0), 0);

  // Audit log do export
  await adminClient.from('audit_logs').insert({
    user_id: auth.userId,
    action: 'data_export',
    resource_type: 'audit_data_export',
    metadata: { total_tables: TABLES_CONFIG.length, total_rows: totalRows, export_timestamp: exportTimestamp },
  }).then(({ error }) => { if (error) console.warn('audit insert error', error.message); });

  console.log('audit-data-export ok', { userId: auth.userId, totalRows });

  const manifest = {
    export_metadata: {
      version: FUNCTION_VERSION,
      generated_at: exportTimestamp,
      generated_by: auth.userId,
      platform: 'Rhema Care Flow',
      pii_handling: 'high_sensitivity_fields_masked',
      statistics: {
        total_tables: Object.keys(tables).length,
        total_rows: totalRows,
      },
    },
    tables,
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="rhema-export-${exportTimestamp.slice(0, 10)}.json"`,
    },
  });
});
