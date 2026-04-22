import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, Link2, CheckCircle2, AlertTriangle, ExternalLink, Lock, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildPatientTimelineAnchor, PATIENT_TIMELINE_VARIABLES, hashPatientCode } from "@/lib/patientChainAnchor";
import { getExplorerUrl, formatSignature } from "@/lib/solana";

interface AnchorRow {
  id: string;
  timeline_hash: string;
  record_counts: { visits?: number; scores?: number; infusions?: number; monitoring?: number };
  tx_signature: string | null;
  cluster: string;
  created_at: string;
  variable_codes: string[];
}

interface Props {
  patientCardId: string;
  patientCode: string;
}

export function PatientChainAnchorPanel({ patientCardId, patientCode }: Props) {
  const { user } = useAuth();
  const [anchors, setAnchors] = useState<AnchorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | {
    match: boolean;
    current: string;
    latest: string;
    anchorId: string;
    anchoredAt: string;
    currentCounts: { visits: number; scores: number; infusions: number; monitoring: number };
    storedCounts: { visits?: number; scores?: number; infusions?: number; monitoring?: number };
    verifiedAt: string;
  }>(null);
  const [codeHash, setCodeHash] = useState<string>("");

  useEffect(() => {
    hashPatientCode(patientCode).then(setCodeHash).catch(() => setCodeHash(""));
  }, [patientCode]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patient_chain_anchors")
      .select("*")
      .eq("patient_card_id", patientCardId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load chain anchors");
    } else {
      setAnchors((data ?? []) as AnchorRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user, patientCardId]);

  const createAnchor = async () => {
    if (!user) return;
    setBuilding(true);
    setVerifyResult(null);
    try {
      const built = await buildPatientTimelineAnchor(patientCardId);
      const { error } = await supabase.from("patient_chain_anchors").insert({
        user_id: user.id,
        patient_card_id: patientCardId,
        timeline_hash: built.hashHex,
        variable_codes: built.snapshot.variable_codes,
        record_counts: built.counts,
        anchor_type: "patient_timeline",
        cluster: "devnet",
      });
      if (error) throw error;
      toast.success(`Patient ${patientCode} anchored — SHA-256 ${built.hashHex.slice(0, 12)}…`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to anchor patient");
    } finally {
      setBuilding(false);
    }
  };

  const verifyAgainstLatest = async () => {
    if (anchors.length === 0) {
      toast.info("No anchor to verify against. Create one first.");
      return;
    }
    setVerifying(true);
    try {
      const built = await buildPatientTimelineAnchor(patientCardId);
      const latestAnchor = anchors[0];
      const match = built.hashHex === latestAnchor.timeline_hash;
      setVerifyResult({
        match,
        current: built.hashHex,
        latest: latestAnchor.timeline_hash,
        anchorId: latestAnchor.id,
        anchoredAt: latestAnchor.created_at,
        currentCounts: built.counts,
        storedCounts: latestAnchor.record_counts ?? {},
        verifiedAt: new Date().toISOString(),
      });
      if (match) toast.success("Hash matches — timeline is intact");
      else toast.warning("Hash mismatch — timeline has changed since last anchor");
    } catch (e: any) {
      toast.error(e?.message ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const copyHash = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const countDiffs = verifyResult
    ? (["visits", "scores", "infusions", "monitoring"] as const).map((k) => ({
        key: k,
        current: verifyResult.currentCounts[k] ?? 0,
        stored: (verifyResult.storedCounts as any)?.[k] ?? 0,
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Blockchain Anchor — Patient {patientCode}
        </CardTitle>
        <CardDescription>
          PHI never leaves your device. The patient code is replaced by its SHA-256 digest before hashing, so the on-chain value is non-identifying — it cannot be reversed to your local patient label without your private database. Only you, the owning physician, can produce or verify these anchors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle className="text-sm">Non-identifying on-chain value</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <div>
              Your local code <code className="font-mono">{patientCode}</code> is never anchored.
              We anchor <code className="font-mono">SHA-256("patient_code:v1|{patientCode}")</code>:
            </div>
            <code className="block font-mono break-all text-[11px] text-muted-foreground">
              {codeHash || "computing…"}
            </code>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button onClick={createAnchor} disabled={building}>
            {building ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            Anchor current timeline
          </Button>
          <Button variant="outline" onClick={verifyAgainstLatest} disabled={verifying || anchors.length === 0}>
            {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Verify latest vs stored hash
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Variables hashed:</span>{" "}
          {PATIENT_TIMELINE_VARIABLES.length} fields across 5 domains
        </div>

        {verifyResult && (
          <Alert variant={verifyResult.match ? "default" : "destructive"}>
            {verifyResult.match ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {verifyResult.match
                ? "✅ Hash match — timeline integrity verified"
                : "⚠️ Hash mismatch — timeline drift detected"}
            </AlertTitle>
            <AlertDescription className="space-y-3 text-xs">
              <div className="text-xs opacity-80">
                Verified {format(new Date(verifyResult.verifiedAt), "PPpp")} against anchor created{" "}
                {format(new Date(verifyResult.anchoredAt), "PPpp")}.
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Recomputed (now)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => copyHash("Recomputed hash", verifyResult.current)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="block font-mono break-all bg-muted/40 rounded px-2 py-1">
                  {verifyResult.current}
                </code>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Stored anchor (latest)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => copyHash("Stored hash", verifyResult.latest)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="block font-mono break-all bg-muted/40 rounded px-2 py-1">
                  {verifyResult.latest}
                </code>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Record counts</div>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  <div className="font-medium opacity-70">domain</div>
                  <div className="font-medium opacity-70">stored</div>
                  <div className="font-medium opacity-70">now</div>
                  <div className="font-medium opacity-70 col-span-2">Δ</div>
                  {countDiffs.map((d) => {
                    const delta = d.current - d.stored;
                    return (
                      <div key={d.key} className="contents">
                        <div className="capitalize">{d.key}</div>
                        <div>{d.stored}</div>
                        <div>{d.current}</div>
                        <div className={`col-span-2 ${delta === 0 ? "" : "font-semibold"}`}>
                          {delta === 0 ? "—" : delta > 0 ? `+${delta}` : delta}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!verifyResult.match && (
                <div className="pt-1 border-t border-border/40">
                  Hashes diverge. This is expected if you added/edited visits, scores, infusions or
                  monitoring since the last anchor — create a new anchor to lock the new state.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Anchor history</h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : anchors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No anchors yet. Create the first one to lock this patient's timeline state.</p>
          ) : (
            <div className="space-y-2">
              {anchors.map((a) => (
                <div key={a.id} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <code className="text-xs font-mono break-all">{a.timeline_hash}</code>
                    <Badge variant="outline" className="text-xs">{a.cluster}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>{format(new Date(a.created_at), "PPpp")}</span>
                    <span>visits: {a.record_counts?.visits ?? 0}</span>
                    <span>scores: {a.record_counts?.scores ?? 0}</span>
                    <span>infusions: {a.record_counts?.infusions ?? 0}</span>
                    <span>monitoring: {a.record_counts?.monitoring ?? 0}</span>
                  </div>
                  {a.tx_signature && (
                    <a
                      href={getExplorerUrl(a.tx_signature)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {formatSignature(a.tx_signature)}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
