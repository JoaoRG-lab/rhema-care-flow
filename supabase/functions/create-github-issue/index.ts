/**
 * Supabase Edge Function: create-github-issue
 * Cria um GitHub Issue no repo rhema-care-flow.
 *
 * Secrets necessários (configurar via Supabase Dashboard → Edge Functions → Secrets):
 *   GITHUB_TOKEN  — Personal Access Token com permissão issues:write
 *   GITHUB_REPO   — formato: JoaoRG-lab/rhema-care-flow
 *
 * Deploy:
 *   npx supabase functions deploy create-github-issue
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { title, body, labels = [] } = await req.json() as {
      title: string;
      body: string;
      labels?: string[];
    };

    const token = Deno.env.get('GITHUB_TOKEN');
    const repo  = Deno.env.get('GITHUB_REPO') ?? 'JoaoRG-lab/rhema-care-flow';

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'GITHUB_TOKEN não configurado nos secrets da Edge Function.' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    });

    const issue = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: issue.message ?? 'Erro ao criar issue' }),
        { status: response.status, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ html_url: issue.html_url, number: issue.number }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
