// Verify a GitHub PAT has push access to a list of target repositories.
// The token is used in-memory only and never persisted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const repoPath = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);

const bodySchema = z.object({
  token: z.string().min(20).max(500),
  targets: z.array(repoPath).min(1).max(50),
});

interface TargetResult {
  repo: string;
  ok: boolean;
  status: number;
  reason: string;
  push?: boolean;
  archived?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated Supabase user
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    const { token, targets } = parsed.data;

    const results: TargetResult[] = await Promise.all(
      targets.map(async (repo) => {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${token}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "uhs-mirror-verify",
            },
          });

          if (res.status === 200) {
            const data = await res.json();
            const push = Boolean(data?.permissions?.push);
            const archived = Boolean(data?.archived);
            if (archived) {
              return { repo, ok: false, status: 200, reason: "Repository is archived", push, archived };
            }
            if (!push) {
              return { repo, ok: false, status: 200, reason: "Token lacks push permission", push, archived };
            }
            return { repo, ok: true, status: 200, reason: "Writable", push, archived };
          }

          const reason =
            res.status === 404
              ? "Not found or token has no access"
              : res.status === 401
              ? "Token unauthorized (401)"
              : res.status === 403
              ? "Forbidden — check token scopes / SSO (403)"
              : `HTTP ${res.status}`;
          return { repo, ok: false, status: res.status, reason };
        } catch (err) {
          return {
            repo,
            ok: false,
            status: 0,
            reason: err instanceof Error ? err.message : "Network error",
          };
        }
      })
    );

    return json({
      results,
      summary: {
        total: results.length,
        writable: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
      },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
