import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { errorResponse } from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANONICAL_REPO = "JoaoRG-lab/rhema-care-flow";
const CANONICAL_BRANCH = "main";
const MAX_FILE_BYTES = 180_000;

interface CodeEditorRequest {
  repo?: string;
  baseBranch?: string;
  targetFile: string;
  instruction: string;
  dryRun?: boolean;
  createPullRequest?: boolean;
}

interface GitHubContentResponse {
  content: string;
  encoding: string;
  sha: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function assertSafePath(path: string) {
  if (!path || path.length > 240) throw new Error("Invalid targetFile");
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) throw new Error("Unsafe targetFile path");
  if (/^\.env($|\.)/.test(path) || path.includes("/.env")) throw new Error("Refusing to edit env files");
}

function parseRepo(repo: string) {
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("repo must use owner/name format");
  return { owner: parts[0], name: parts[1] };
}

function decodeBase64Utf8(base64: string) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function githubFetch<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${response.status}: ${errorText.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

async function readFileFromGitHub(token: string, repo: string, path: string, ref: string) {
  const { owner, name } = parseRepo(repo);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await githubFetch<GitHubContentResponse>(token, `https://api.github.com/repos/${owner}/${name}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`);
  if (data.encoding !== "base64") throw new Error("Unsupported file encoding");
  const existingCode = decodeBase64Utf8(data.content);
  if (new TextEncoder().encode(existingCode).length > MAX_FILE_BYTES) throw new Error(`File too large for safe AI edit: ${path}`);
  return { existingCode, sha: data.sha };
}

async function getBranchSha(token: string, repo: string, branch: string) {
  const { owner, name } = parseRepo(repo);
  const data = await githubFetch<{ object: { sha: string } }>(token, `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(branch)}`);
  return data.object.sha;
}

async function createBranch(token: string, repo: string, branch: string, sha: string) {
  const { owner, name } = parseRepo(repo);
  try {
    await githubFetch(token, `https://api.github.com/repos/${owner}/${name}/git/refs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    });
  } catch (error) {
    if (!String(error).includes("Reference already exists")) throw error;
  }
}

async function updateFileOnGitHub(params: { token: string; repo: string; branch: string; path: string; sha: string; content: string; message: string }) {
  const { owner, name } = parseRepo(params.repo);
  const encodedPath = params.path.split("/").map(encodeURIComponent).join("/");
  return githubFetch<{ commit: { sha: string; html_url: string }; content: { html_url: string } }>(params.token, `https://api.github.com/repos/${owner}/${name}/contents/${encodedPath}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: params.message, content: encodeBase64Utf8(params.content), sha: params.sha, branch: params.branch }),
  });
}

async function openPullRequest(params: { token: string; repo: string; head: string; base: string; title: string; body: string }) {
  const { owner, name } = parseRepo(params.repo);
  return githubFetch<{ number: number; html_url: string }>(params.token, `https://api.github.com/repos/${owner}/${name}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: params.title, body: params.body, head: params.head, base: params.base, draft: true, maintainer_can_modify: true }),
  });
}

async function callLovableAI(apiKey: string, targetFile: string, instruction: string, existingCode: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a senior TypeScript/React code editor. Return only the complete new file content. No markdown. No explanations. Preserve public APIs unless necessary." },
        { role: "user", content: `Target file: ${targetFile}\n\nInstruction:\n${instruction}\n\nCurrent file content:\n${existingCode}` },
      ],
      temperature: 0.1,
    }),
  });
  if (!response.ok) throw new Error(`AI gateway ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("AI returned empty content");
  return content.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trimEnd() + "\n";
}

function validateGeneratedContent(existingCode: string, nextCode: string) {
  if (!nextCode.trim()) throw new Error("Generated content is empty");
  const nextBytes = new TextEncoder().encode(nextCode).length;
  if (nextBytes > MAX_FILE_BYTES * 1.2) throw new Error("Generated file is unexpectedly large");
  return { changed: existingCode !== nextCode, previousBytes: new TextEncoder().encode(existingCode).length, nextBytes };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const repoToken = Deno.env.get("REPO_WRITE_TOKEN");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!repoToken) throw new Error("REPO_WRITE_TOKEN is not configured");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body = (await req.json()) as CodeEditorRequest;
    const repo = body.repo ?? CANONICAL_REPO;
    const baseBranch = body.baseBranch ?? CANONICAL_BRANCH;
    const dryRun = body.dryRun ?? true;
    const createPullRequest = body.createPullRequest ?? true;

    if (repo !== CANONICAL_REPO) throw new Error(`Refusing to edit non-canonical repo: ${repo}`);
    if (!body.targetFile || !body.instruction) throw new Error("targetFile and instruction are required");
    assertSafePath(body.targetFile);

    const { existingCode, sha } = await readFileFromGitHub(repoToken, repo, body.targetFile, baseBranch);
    const nextCode = await callLovableAI(lovableKey, body.targetFile, body.instruction, existingCode);
    const validation = validateGeneratedContent(existingCode, nextCode);

    if (!validation.changed) return jsonResponse({ success: true, dryRun, changed: false, validation });

    if (dryRun) {
      return jsonResponse({ success: true, dryRun: true, changed: true, repo, baseBranch, targetFile: body.targetFile, validation, preview: nextCode.slice(0, 4000) });
    }

    const baseSha = await getBranchSha(repoToken, repo, baseBranch);
    const safeName = body.targetFile.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48);
    const branch = `ai/code-edit-${Date.now()}-${safeName}`;
    await createBranch(repoToken, repo, branch, baseSha);

    const commitResult = await updateFileOnGitHub({ token: repoToken, repo, branch, path: body.targetFile, sha, content: nextCode, message: `feat(ai): update ${body.targetFile}` });

    let pullRequest = null;
    if (createPullRequest) {
      pullRequest = await openPullRequest({
        token: repoToken,
        repo,
        head: branch,
        base: baseBranch,
        title: `AI code edit: ${body.targetFile}`,
        body: `Draft PR generated by code-editor-agent.\n\nTarget file: ${body.targetFile}\n\nInstruction:\n${body.instruction}\n\nReview carefully before merging.`,
      });
    }

    return jsonResponse({ success: true, dryRun: false, changed: true, repo, baseBranch, branch, targetFile: body.targetFile, commit: commitResult.commit, fileUrl: commitResult.content.html_url, pullRequest, validation });
  } catch (error) {
    console.error("code-editor-agent error:", error);
    return errorResponse(error, { status: 500, code: "CODE_EDITOR_AGENT_ERROR", headers: corsHeaders });
  }
});
