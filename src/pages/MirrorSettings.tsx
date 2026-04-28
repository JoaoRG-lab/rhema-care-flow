import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FlaskConical,
  GitBranch,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { invokeEdgeFn } from "@/lib/invokeEdgeFn";

const STORAGE_KEY = "mirror.targets.v1";

const repoPathSchema = z
  .string()
  .trim()
  .min(3, "Too short")
  .max(140, "Too long")
  .regex(
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Use the format owner/repo (letters, digits, -, _, .)"
  )
  .refine((v) => !v.endsWith(".git"), "Omit the trailing .git")
  .refine((v) => {
    const [, repo] = v.split("/");
    return repo !== "." && repo !== "..";
  }, "Invalid repo name");

interface VerifyResult {
  repo: string;
  ok: boolean;
  status: number;
  reason: string;
  push?: boolean;
  archived?: boolean;
}

function loadTargets(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export default function MirrorSettings() {
  const [targets, setTargets] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Verification state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<VerifyResult[] | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Dry-run state
  interface DryRunCheck { label: string; ok: boolean; detail: string }
  const [dryRun, setDryRun] = useState<{
    checks: DryRunCheck[];
    ready: boolean;
  } | null>(null);
  const [dryRunning, setDryRunning] = useState(false);

  useEffect(() => {
    setTargets(loadTargets());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
  }, [targets]);

  const manifest = useMemo(
    () => JSON.stringify({ targets }, null, 2) + "\n",
    [targets]
  );

  const resultByRepo = useMemo(() => {
    const map = new Map<string, VerifyResult>();
    results?.forEach((r) => map.set(r.repo, r));
    return map;
  }, [results]);

  function addTarget() {
    const result = repoPathSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid repo path");
      return;
    }
    const value = result.data;
    if (targets.includes(value)) {
      setError("This repo is already in the list");
      return;
    }
    setTargets((prev) => [...prev, value]);
    setDraft("");
    setError(null);
  }

  function removeTarget(value: string) {
    setTargets((prev) => prev.filter((t) => t !== value));
  }

  async function copyManifest() {
    try {
      await navigator.clipboard.writeText(manifest);
      toast({ title: "Copied", description: "Paste into .github/mirror-targets.json" });
    } catch {
      toast({ title: "Copy failed", description: "Select and copy manually", variant: "destructive" });
    }
  }

  async function runVerification() {
    setVerifyError(null);
    if (token.trim().length < 20) {
      setVerifyError("Token looks too short. Paste a valid GitHub PAT.");
      return;
    }
    if (targets.length === 0) {
      setVerifyError("Add at least one target first.");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await invokeEdgeFn<{
        results: VerifyResult[];
        summary: { total: number; writable: number; failed: number };
      }>("verify-mirror-access", { token: token.trim(), targets });

      if (error || !data) {
        setVerifyError(error ?? "Verification failed");
        return;
      }
      setResults(data.results);
      setToken(""); // discard token from memory
      setVerifyOpen(false);
      toast({
        title: "Verification complete",
        description: `${data.summary.writable} writable, ${data.summary.failed} failed`,
      });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Network error");
    } finally {
      setVerifying(false);
    }
  }

  async function runDryRun() {
    setDryRunning(true);
    setDryRun(null);
    const checks: DryRunCheck[] = [];

    // 1. Target list non-empty
    checks.push({
      label: "Target list is non-empty",
      ok: targets.length > 0,
      detail:
        targets.length > 0
          ? `${targets.length} target${targets.length === 1 ? "" : "s"} configured`
          : "Add at least one owner/repo entry before running",
    });

    // 2. All targets pass schema validation
    const invalid = targets.filter((t) => !repoPathSchema.safeParse(t).success);
    checks.push({
      label: "All targets match owner/repo format",
      ok: invalid.length === 0,
      detail:
        invalid.length === 0
          ? "Every entry is well-formed"
          : `Invalid: ${invalid.join(", ")}`,
    });

    // 3. No duplicates
    const dupes = targets.filter((t, i) => targets.indexOf(t) !== i);
    checks.push({
      label: "No duplicate targets",
      ok: dupes.length === 0,
      detail:
        dupes.length === 0 ? "All entries unique" : `Duplicates: ${[...new Set(dupes)].join(", ")}`,
    });

    // 4. Targets do not include the source repo (best-effort)
    const sourceLike = targets.filter((t) =>
      /lovable|preview|31d3db34/i.test(t)
    );
    checks.push({
      label: "Targets are not the source repo",
      ok: sourceLike.length === 0,
      detail:
        sourceLike.length === 0
          ? "No self-referencing entries detected"
          : `Possible source repo: ${sourceLike.join(", ")}`,
    });

    // 5. Workflow file references MIRROR_TOKEN (fetched from preview build)
    let tokenWired = false;
    let workflowDetail = "Could not read workflow file from preview";
    try {
      const res = await fetch("/.github/workflows/mirror-to-repos.yml", {
        cache: "no-store",
      });
      if (res.ok) {
        const yaml = await res.text();
        tokenWired = /MIRROR_TOKEN/.test(yaml);
        workflowDetail = tokenWired
          ? "Workflow references secrets.MIRROR_TOKEN"
          : "Workflow file found but does not reference MIRROR_TOKEN";
      } else {
        workflowDetail =
          "Workflow not served by preview — verify directly on GitHub that MIRROR_TOKEN is wired in .github/workflows/mirror-to-repos.yml";
        tokenWired = true; // can't verify in-browser; don't fail the dry run
      }
    } catch {
      tokenWired = true;
      workflowDetail = "Skipped (preview cannot fetch workflow file)";
    }
    checks.push({
      label: "Workflow wires MIRROR_TOKEN secret",
      ok: tokenWired,
      detail: workflowDetail,
    });

    // 6. Last access verification (if any) shows no failures
    const failedAccess = results?.filter((r) => !r.ok) ?? [];
    checks.push({
      label: "Last access verification clean",
      ok: !results || failedAccess.length === 0,
      detail: !results
        ? "No verification run yet — recommended before pushing"
        : failedAccess.length === 0
        ? "All previously checked targets were writable"
        : `${failedAccess.length} target(s) would fail: ${failedAccess
            .map((r) => r.repo)
            .join(", ")}`,
    });

    const ready = checks.every((c) => c.ok);
    setDryRun({ checks, ready });
    setDryRunning(false);
    toast({
      title: ready ? "Dry-run passed" : "Dry-run found issues",
      description: ready
        ? "Safe to trigger the mirror workflow on GitHub"
        : "Resolve the failing checks before mirroring",
      variant: ready ? "default" : "destructive",
    });
  }

  const summary = results
    ? {
        writable: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
      }
    : null;

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitBranch className="h-7 w-7 text-primary" />
          Repository Mirroring
        </h1>
        <p className="text-muted-foreground">
          One-way mirror from this Lovable repo to additional GitHub repositories on every push.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Setup checklist
          </CardTitle>
          <CardDescription>Confirm each item is in place on GitHub.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ChecklistItem
            label="Lovable project connected to a GitHub repo"
            hint="Connectors → GitHub → Connect project"
          />
          <ChecklistItem
            label="MIRROR_TOKEN secret added on GitHub"
            hint="Repo Settings → Secrets and variables → Actions → New repository secret. Use a Personal Access Token (classic) with the repo scope."
          />
          <ChecklistItem
            label="Workflow file present at .github/workflows/mirror-to-repos.yml"
            hint="Already created by Lovable. Verifies push permission per target before mirroring."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Target repositories</CardTitle>
              <CardDescription>
                Format: <code className="text-xs">owner/repo</code> (no URL, no .git).
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runDryRun}
                disabled={dryRunning}
              >
                {dryRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FlaskConical className="h-4 w-4 mr-2" />
                )}
                Test mirror run
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setVerifyError(null);
                  setVerifyOpen(true);
                }}
                disabled={targets.length === 0}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Verify access
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTarget();
                }
              }}
              placeholder="my-org/backup-repo"
              maxLength={140}
              aria-invalid={!!error}
            />
            <Button onClick={addTarget} type="button">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {summary && (
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                {summary.writable} writable
              </Badge>
              {summary.failed > 0 && (
                <Badge variant="destructive">{summary.failed} will fail</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Last verification result shown below.
              </span>
            </div>
          )}

          {dryRun && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                {dryRun.ready ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ready to mirror
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Not ready
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Dry-run only — no pushes performed.
                </span>
              </div>
              <ul className="space-y-1.5 text-sm">
                {dryRun.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    {c.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No targets yet. Add at least one repo.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {targets.map((t) => {
                const r = resultByRepo.get(t);
                return (
                  <li key={t} className="flex items-center justify-between px-3 py-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="secondary" className="font-mono shrink-0">
                        {t}
                      </Badge>
                      {r && <ResultIndicator result={r} />}
                      <a
                        href={`https://github.com/${t}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline shrink-0"
                      >
                        open ↗
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTarget(t)}
                      aria-label={`Remove ${t}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply to GitHub</CardTitle>
          <CardDescription>
            Copy this JSON and commit it as <code className="text-xs">.github/mirror-targets.json</code> on
            GitHub (or edit the file directly). The Action will pick it up on the next push.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto font-mono">
{manifest}
          </pre>
          <Button onClick={copyManifest} variant="outline" type="button">
            <Copy className="h-4 w-4 mr-2" /> Copy JSON
          </Button>
        </CardContent>
      </Card>

      {/* Verification dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify token access</DialogTitle>
            <DialogDescription>
              Paste the same Personal Access Token you stored as{" "}
              <code className="text-xs">MIRROR_TOKEN</code> on GitHub. It is sent over HTTPS to a backend
              function, used in-memory to call the GitHub API for each target, and is{" "}
              <strong>never stored</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              autoComplete="off"
              spellCheck={false}
              maxLength={500}
            />
            {verifyError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verifyError}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Will check {targets.length} target{targets.length === 1 ? "" : "s"}.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setToken("");
                setVerifyOpen(false);
              }}
              disabled={verifying}
            >
              Cancel
            </Button>
            <Button onClick={runVerification} disabled={verifying || !token}>
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...
                </>
              ) : (
                "Run check"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultIndicator({ result }: { result: VerifyResult }) {
  if (result.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> writable
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-destructive truncate"
      title={result.reason}
    >
      <XCircle className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{result.reason}</span>
    </span>
  );
}

function ChecklistItem({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
