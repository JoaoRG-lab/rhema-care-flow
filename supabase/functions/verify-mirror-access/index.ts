import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { errorResponse } from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  targets?: string[];
}

interface VerifyResult {
  repo: string;
  ok: boolean;
  status: number;
  reason: string;
  push?: boolean;
  archived?: boolean;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRepoPath(value: string) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

async function verifyRepo(repoCredential: string, repo: string): Promise<VerifyResult> {
  if (!isRepoPath(repo)) return { repo, ok: false, status: 400, reason: "Invalid owner/repo format" };

  const [owner, name] = repo.split("/");
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${repoCredential}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) return { repo, ok: false, status: response.status, reason: `GitHub returned ${response.status}` };

  const data = await response.json();
  const push = Boolean(data.permissions?.push || data.permissions?.admin || data.permissions?.maintain);
  const archived = Boolean(data.archived);
  return {
    repo,
    ok: push && !archived,
    status: response.status,
    reason: archived ? "Repository is archived" : push ? "Writable" : "Credential cannot push to this repository",
    push,
    archived,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const repoCredential = Deno.env.get("REPO_WRITE_TOKEN");
    if (!repoCredential) throw new Error("REPO_WRITE_TOKEN is not configured");

    const body = (await req.json()) as VerifyRequest;
    const targets = body.targets ?? [];
    if (!Array.isArray(targets) || targets.length === 0) return jsonResponse({ error: "targets must be a non-empty array" }, 400);
    if (targets.length > 20) return jsonResponse({ error: "maximum 20 targets per verification" }, 400);

    const uniqueTargets = [...new Set(targets.map((t) => String(t).trim()).filter(Boolean))];
    const results = await Promise.all(uniqueTargets.map((repo) => verifyRepo(repoCredential, repo)));

    return jsonResponse({
      success: true,
      results,
      summary: {
        total: results.length,
        writable: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
      },
    });
  } catch (error) {
    console.error("verify-mirror-access error:", error);
    return errorResponse(error, { status: 500, code: "VERIFY_MIRROR_ACCESS_ERROR", headers: corsHeaders });
  }
});
