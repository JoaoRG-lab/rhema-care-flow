import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, Link2, CheckCircle2, AlertTriangle, ExternalLink, Lock, Copy, RefreshCw, FileDown, ChevronDown, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildPatientTimelineAnchor, PATIENT_TIMELINE_VARIABLES, hashPatientCode } from "@/lib/patientChainAnchor";
import { getExplorerUrl, formatSignature } from "@/lib/solana";
import { buildDrilldownReport, buildFieldHints } from "@/lib/chainDrilldown";

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const ackKey = `pca-ack:${patientCardId}`;
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    try { return localStorage.getItem(ackKey) === "1"; } catch { return false; }
  });
  const setAck = (v: boolean) => {
    setAcknowledged(v);
    try { v ? localStorage.setItem(ackKey, "1") : localStorage.removeItem(ackKey); } catch {}
    if (!v) setDetailsOpen(false);
  };

  type AuditEntry = {
    verifiedAt: string;
    anchorId: string;
    anchoredAt: string;
    match: boolean;
    currentHash: string;
    storedHash: string;
  };
  const auditKey = `pca-audit:${patientCardId}`;
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);

  useEffect(() => {
    hashPatientCode(patientCode).then(setCodeHash).catch(() => setCodeHash(""));
  }, [patientCode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(auditKey);
      setAuditTrail(raw ? (JSON.parse(raw) as AuditEntry[]) : []);
    } catch {
      setAuditTrail([]);
    }
  }, [auditKey]);

  const appendAudit = (entry: AuditEntry) => {
    setAuditTrail((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(auditKey, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  };

  const clearAudit = () => {
    setAuditTrail([]);
    try {
      localStorage.removeItem(auditKey);
    } catch {
      /* ignore */
    }
    toast.success("Verification trail cleared");
  };

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
      const verifiedAt = new Date().toISOString();
      setVerifyResult({
        match,
        current: built.hashHex,
        latest: latestAnchor.timeline_hash,
        anchorId: latestAnchor.id,
        anchoredAt: latestAnchor.created_at,
        currentCounts: built.counts,
        storedCounts: latestAnchor.record_counts ?? {},
        verifiedAt,
      });
      appendAudit({
        verifiedAt,
        anchorId: latestAnchor.id,
        anchoredAt: latestAnchor.created_at,
        match,
        currentHash: built.hashHex,
        storedHash: latestAnchor.timeline_hash,
      });
      if (match) toast.success("Hash matches — timeline is intact");
      else toast.warning("Hash mismatch — timeline has changed since last anchor");
      setDetailsOpen(!match);
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

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportDrilldown = (fmt: "json" | "csv") => {
    if (!verifyResult) return;
    const changed = countDiffs.filter((d) => d.current !== d.stored);
    const totalDelta = changed.reduce((s, d) => s + Math.abs(d.current - d.stored), 0);
    const ts = format(new Date(), "yyyyMMdd-HHmm");
    const base = `chain-mismatch-${patientCode}-${ts}`;

    if (fmt === "json") {
      const payload = {
        patient_code: patientCode,
        patient_card_id: patientCardId,
        verified_at: verifyResult.verifiedAt,
        anchor_id: verifyResult.anchorId,
        anchored_at: verifyResult.anchoredAt,
        match: verifyResult.match,
        recomputed_hash: verifyResult.current,
        stored_hash: verifyResult.latest,
        domains: countDiffs.map((d) => ({
          domain: d.key,
          stored: d.stored,
          now: d.current,
          delta: d.current - d.stored,
          direction: d.current === d.stored ? "unchanged" : d.current > d.stored ? "added" : "removed",
        })),
        changed_domains: changed.length,
        total_delta: totalDelta,
        disclaimer: "Non-identifying integrity report. No clinical values included.",
      };
      downloadFile(`${base}.json`, JSON.stringify(payload, null, 2), "application/json");
    } else {
      const escape = (v: string | number) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows: string[] = [];
      rows.push(["domain", "stored", "now", "delta", "direction"].join(","));
      countDiffs.forEach((d) => {
        const delta = d.current - d.stored;
        const direction = delta === 0 ? "unchanged" : delta > 0 ? "added" : "removed";
        rows.push([d.key, d.stored, d.current, delta, direction].map(escape).join(","));
      });
      rows.push("");
      rows.push(["# meta"].join(","));
      rows.push(["patient_code", escape(patientCode)].join(","));
      rows.push(["verified_at", escape(verifyResult.verifiedAt)].join(","));
      rows.push(["anchor_id", escape(verifyResult.anchorId)].join(","));
      rows.push(["anchored_at", escape(verifyResult.anchoredAt)].join(","));
      rows.push(["recomputed_hash", escape(verifyResult.current)].join(","));
      rows.push(["stored_hash", escape(verifyResult.latest)].join(","));
      rows.push(["changed_domains", changed.length].join(","));
      rows.push(["total_delta", totalDelta].join(","));
      downloadFile(`${base}.csv`, rows.join("\n"), "text/csv");
    }
    toast.success(`Mismatch report (${fmt.toUpperCase()}) downloaded`);
  };

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Blockchain Anchor — Verification Report", margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient code (local): ${patientCode}`, margin, y);
      y += 5;
      doc.text(`Generated: ${format(new Date(), "PPpp")}`, margin, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(100);
      const disclaimer = doc.splitTextToSize(
        "Non-identifying integrity report. The recomputed hash is a SHA-256 digest of de-identified timeline metadata (record counts and variable codes only). It is NOT a medical record and contains no clinical values. Raw clinical data stays encrypted on the owning physician's device.",
        pageWidth - margin * 2,
      );
      doc.text(disclaimer, margin, y);
      y += disclaimer.length * 4 + 4;
      doc.setTextColor(0);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient code digest (anchored value)", margin, y);
      y += 5;
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      const codeLines = doc.splitTextToSize(codeHash || "(not computed)", pageWidth - margin * 2);
      doc.text(codeLines, margin, y);
      y += codeLines.length * 4 + 4;

      if (verifyResult) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(
          verifyResult.match
            ? "Verification result: MATCH — timeline integrity verified"
            : "Verification result: MISMATCH — timeline drift detected",
          margin,
          y,
        );
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Verified at: ${format(new Date(verifyResult.verifiedAt), "PPpp")}`, margin, y);
        y += 4;
        doc.text(`Anchor created: ${format(new Date(verifyResult.anchoredAt), "PPpp")}`, margin, y);
        y += 4;
        doc.text(`Anchor ID: ${verifyResult.anchorId}`, margin, y);
        y += 6;

        doc.setFont("helvetica", "bold");
        doc.text("Recomputed hash (now)", margin, y);
        y += 4;
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        const recLines = doc.splitTextToSize(verifyResult.current, pageWidth - margin * 2);
        doc.text(recLines, margin, y);
        y += recLines.length * 4 + 3;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Stored hash (latest anchor)", margin, y);
        y += 4;
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        const storLines = doc.splitTextToSize(verifyResult.latest, pageWidth - margin * 2);
        doc.text(storLines, margin, y);
        y += storLines.length * 4 + 4;

        autoTable(doc, {
          startY: y,
          head: [["Domain", "Stored", "Now", "Δ", "Note"]],
          body: countDiffs.map((d) => {
            const delta = d.current - d.stored;
            return [
              d.key,
              String(d.stored),
              String(d.current),
              delta === 0 ? "—" : delta > 0 ? `+${delta}` : String(delta),
              delta === 0 ? "" : delta > 0 ? "added" : "removed",
            ];
          }),
          theme: "grid",
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        if (!verifyResult.match) {
          const changedCount = countDiffs.filter((d) => d.current !== d.stored).length;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(120);
          const note =
            changedCount === 0
              ? "Record counts identical but hash differs — content of one or more records was edited without adding or removing rows."
              : `${changedCount} domain(s) contributed to the mismatch since the stored anchor.`;
          const noteLines = doc.splitTextToSize(note, pageWidth - margin * 2);
          doc.text(noteLines, margin, y);
          y += noteLines.length * 4 + 4;
          doc.setTextColor(0);
        }
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("No verification has been run in this session. Run 'Verify latest vs stored hash' to populate this report.", margin, y);
        y += 6;
        doc.setTextColor(0);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Anchor history", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Created", "Cluster", "Hash (truncated)", "Visits", "Scores", "Infusions", "Monitoring", "Tx"]],
        body: anchors.map((a) => [
          format(new Date(a.created_at), "yyyy-MM-dd HH:mm"),
          a.cluster,
          `${a.timeline_hash.slice(0, 16)}…${a.timeline_hash.slice(-6)}`,
          String(a.record_counts?.visits ?? 0),
          String(a.record_counts?.scores ?? 0),
          String(a.record_counts?.infusions ?? 0),
          String(a.record_counts?.monitoring ?? 0),
          a.tx_signature ? formatSignature(a.tx_signature) : "—",
        ]),
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });

      const filename = `chain-anchor-${patientCode}-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`;
      doc.save(filename);
      toast.success("PDF report downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate PDF");
    }
  };

  const status: "verified" | "mismatch" | "unverified" = !verifyResult
    ? "unverified"
    : verifyResult.match
    ? "verified"
    : "mismatch";

  const statusConfig = {
    verified: {
      label: "Verified",
      icon: CheckCircle2,
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    mismatch: {
      label: "Mismatch",
      icon: AlertTriangle,
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      dot: "bg-destructive",
    },
    unverified: {
      label: "Not verified",
      icon: HelpCircle,
      className: "border-border bg-muted text-muted-foreground",
      dot: "bg-muted-foreground/60",
    },
  } as const;
  const StatusIcon = statusConfig[status].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Blockchain Anchor — Patient {patientCode}
          </CardTitle>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig[status].className}`}
            aria-live="polite"
            role="status"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[status].dot} ${status === "unverified" ? "" : "animate-pulse"}`} />
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig[status].label}
            {verifyResult && (
              <span className="opacity-70 font-normal hidden sm:inline">
                · {format(new Date(verifyResult.verifiedAt), "HH:mm")}
              </span>
            )}
          </div>
        </div>
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

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
            <span>Integrity check, not a medical record</span>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  What this hash means
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    What this hash means
                  </DialogTitle>
                  <DialogDescription>
                    A precise breakdown of what is — and is not — included in the SHA-256 timeline digest anchored on chain.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold mb-1">Inputs (what is hashed)</div>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>SHA-256 digest of your local patient code (not the code itself)</li>
                      <li>Per-domain record counts: visits, scores, infusions, monitoring</li>
                      <li>Ordered list of timestamps (creation/visit dates) per domain</li>
                      <li>Canonical list of variable codes that exist on the timeline</li>
                      <li>Schema version tag (so future hash formats remain comparable)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Scope</div>
                    <p className="text-muted-foreground">
                      The digest proves <strong>integrity</strong> of de-identified timeline metadata: any addition,
                      removal, or content edit of a record changes the hash. It does <strong>not</strong> prove the
                      clinical truth, accuracy, or appropriateness of care.
                    </p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Excluded (never hashed, never sent on chain)</div>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Patient name, MRN, CPF, phone, address or any direct identifier</li>
                      <li>Free-text clinical notes and next-step instructions</li>
                      <li>Lab values, imaging findings, score numerical values, drug doses</li>
                      <li>Attachments, photos, PDFs, signatures</li>
                      <li>Any data from other physicians' patients</li>
                    </ul>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    Raw clinical data stays AES-encrypted on your device. Only you, the owning physician,
                    can recompute and verify this hash. The on-chain value is mathematically non-identifying.
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </AlertTitle>
          <AlertDescription className="text-xs">
            The recomputed hash is a <strong>non-identifying SHA-256 digest</strong> of de-identified
            timeline metadata (record counts and variable codes only). It verifies that your local
            timeline has not been altered since the last anchor — it is <strong>not</strong> a
            medical record, does not contain clinical values, and cannot be used for diagnosis,
            treatment, or as legal proof of care. Raw clinical data stays encrypted on your device
            and is never sent on-chain.
          </AlertDescription>
        </Alert>

        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Explicitly excluded from the digest
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {[
              "Patient names & nicknames",
              "MRN, CPF, phone, address, email",
              "Diagnosis values (only counts/codes)",
              "Medication names & doses",
              "Lab values & imaging findings",
              "Score numerical values",
              "Free-text clinical notes",
              "Attachments, photos, signatures",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-destructive font-bold">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-3 py-2">
          <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">No raw clinical values are posted anywhere publicly.</strong>{" "}
            Only encrypted, de-identified aggregates (hashes and counts) are eligible to be included on chain —
            individual notes, lab values, doses, and identifiers stay AES-encrypted on your device.
          </span>
        </p>

        <label
          htmlFor={`pca-ack-${patientCardId}`}
          className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
            acknowledged
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-amber-500/50 bg-amber-500/10"
          }`}
        >
          <Checkbox
            id={`pca-ack-${patientCardId}`}
            checked={acknowledged}
            onCheckedChange={(v) => setAck(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs leading-relaxed">
            <strong>I understand this is not a medical record.</strong> The hash and counts shown here
            verify timeline integrity only — they are not a clinical record, do not constitute medical
            advice, and cannot be used as legal proof of care. I am the owning physician and accept
            responsibility for the underlying encrypted data on my device.
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={createAnchor} disabled={building}>
            {building ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            Anchor current timeline
          </Button>
          <Button
            variant="outline"
            onClick={verifyAgainstLatest}
            disabled={verifying || anchors.length === 0 || !acknowledged}
            title={!acknowledged ? "Accept the acknowledgement to enable advanced integrity details" : undefined}
          >
            {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Verify latest vs stored hash
          </Button>
          <Button variant="secondary" onClick={exportPdf} disabled={anchors.length === 0 && !verifyResult}>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF report
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Variables hashed:</span>{" "}
          {PATIENT_TIMELINE_VARIABLES.length} fields across 5 domains
        </div>

        {verifyResult && acknowledged && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {verifyResult.match ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium">
                    {verifyResult.match ? "Verified" : "Mismatch"} ·{" "}
                    <span className="font-normal opacity-80">
                      {format(new Date(verifyResult.verifiedAt), "PP HH:mm")}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {detailsOpen ? "Hide details" : "View details"}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
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

              {!verifyResult.match && (() => {
                const changed = countDiffs.filter((d) => d.current !== d.stored);
                const totalDelta = changed.reduce(
                  (sum, d) => sum + Math.abs(d.current - d.stored),
                  0,
                );
                return (
                  <div className="pt-2 border-t border-border/40 space-y-3">
                    <div className="space-y-2">
                      <div className="font-medium">
                        Drill-down — {changed.length === 0 ? "no record-count changes detected" : `${changed.length} domain${changed.length === 1 ? "" : "s"} contributed to the mismatch`}
                      </div>
                      {changed.length === 0 ? (
                        <div className="text-[11px] opacity-80">
                          Counts are identical but the hash differs. This means the <em>content</em> of
                          one or more records was edited (values changed) without adding or removing
                          rows. Re-anchor to lock the new content state.
                        </div>
                      ) : (
                        <>
                          <div className="text-[11px] opacity-80">
                            {totalDelta} record{totalDelta === 1 ? "" : "s"} changed across{" "}
                            {changed.length} domain{changed.length === 1 ? "" : "s"} since the stored
                            anchor.
                          </div>
                          <div className="space-y-1">
                            {changed.map((d) => {
                              const delta = d.current - d.stored;
                              const direction = delta > 0 ? "added" : "removed";
                              return (
                                <div
                                  key={d.key}
                                  className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/30 px-2 py-1 text-[11px]"
                                >
                                  <span className="capitalize font-medium">{d.key}</span>
                                  <span className="opacity-80">
                                    {d.stored} → {d.current}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {Math.abs(delta)} {direction}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {(() => {
                        const report = buildDrilldownReport(
                          {
                            visits: verifyResult.currentCounts.visits,
                            scores: verifyResult.currentCounts.scores,
                            infusions: verifyResult.currentCounts.infusions,
                            monitoring: verifyResult.currentCounts.monitoring,
                          },
                          verifyResult.storedCounts,
                          verifyResult.match,
                        );
                        const hints = buildFieldHints(report);
                        if (hints.length === 0) return null;
                        const labels: Record<string, string> = {
                          added: "Likely new fields",
                          removed: "Likely fields on deleted records",
                          edited: "Likely edited fields",
                          unchanged: "Fields",
                        };
                        return (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-medium opacity-80">
                              Field-level hints — review these attributes before re-anchoring
                            </div>
                            {hints.map((h) => (
                              <div
                                key={h.key}
                                className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-[11px] space-y-1"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="capitalize font-medium">{h.key}</span>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {labels[h.direction] ?? h.direction}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {h.fields.map((f) => (
                                    <code
                                      key={f}
                                      className="font-mono text-[10px] bg-background/60 border border-border/40 rounded px-1.5 py-0.5"
                                    >
                                      {f}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="text-[10px] opacity-70 italic">
                              Hints are heuristics from the canonical hash schema — only the listed
                              attributes can affect the digest. No clinical values are shown.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <Alert className="border-amber-500/40 bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-xs">Best practice — batch your edits</AlertTitle>
                      <AlertDescription className="text-[11px] space-y-1">
                        <div>
                          Re-anchor <strong>once at the end of a clinic session</strong>, not after every edit.
                          Each anchor is a permanent on-chain record; batching multiple visit/score updates into a
                          single anchor reduces noise, repeated mismatches, and on-chain cost.
                        </div>
                        <div className="opacity-80">
                          Suggested workflow: finish all patient updates → verify once → create new anchor now.
                        </div>
                      </AlertDescription>
                    </Alert>
                    <div className="text-xs">
                      One click locks the newly recomputed hash as a fresh on-chain anchor.
                    </div>
                    <Button
                      type="button"
                      size="default"
                      onClick={createAnchor}
                      disabled={building}
                      className="w-full sm:w-auto"
                    >
                      {building ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Create new anchor now
                    </Button>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => exportDrilldown("json")}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1.5" />
                        Export JSON
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => exportDrilldown("csv")}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1.5" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </AlertDescription>
          </Alert>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">Verification trail (this device)</h4>
            {auditTrail.length > 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAudit}>
                Clear
              </Button>
            )}
          </div>
          {auditTrail.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No verification attempts recorded yet for this patient card. Each "Verify latest vs stored hash" run will be logged here.
            </p>
          ) : (
            <div className="rounded-md border divide-y text-xs max-h-64 overflow-auto">
              {auditTrail.map((e, i) => (
                <div key={`${e.verifiedAt}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {e.match ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">
                        {format(new Date(e.verifiedAt), "PPpp")}
                      </div>
                      <div className="text-muted-foreground font-mono truncate">
                        anchor {e.anchorId.slice(0, 8)}… · stored {e.storedHash.slice(0, 10)}… · now {e.currentHash.slice(0, 10)}…
                      </div>
                    </div>
                  </div>
                  <Badge variant={e.match ? "outline" : "destructive"} className="text-[10px] shrink-0">
                    {e.match ? "match" : "mismatch"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

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
