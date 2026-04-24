import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet, Receipt, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string | null;
  displayName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaymentRow {
  id: string;
  amount_brl: number;
  credits_amount: number;
  package_label: string | null;
  status: string;
  payment_method: string;
  provider: string;
  external_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface CreditsRow {
  credits_balance: number;
  free_quota_used: number;
  free_quota_limit: number;
  quota_reset_at: string;
}

interface IdemRow {
  id: string;
  idempotency_key: string;
  debited: boolean;
  debit_source: string | null;
  created_at: string;
}

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "paid") return "default";
  if (s === "pending") return "secondary";
  if (s === "expired") return "outline";
  return "destructive";
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const short = (s: string, head = 8, tail = 6) =>
  s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

export function UserBillingDrilldownDialog({ userId, displayName, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [credits, setCredits] = useState<CreditsRow | null>(null);
  const [idem, setIdem] = useState<IdemRow[]>([]);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [{ data: tx }, { data: cr }, { data: id }] = await Promise.all([
          supabase
            .from("payment_transactions")
            .select(
              "id,amount_brl,credits_amount,package_label,status,payment_method,provider,external_id,created_at,paid_at"
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("user_ai_credits")
            .select("credits_balance,free_quota_used,free_quota_limit,quota_reset_at")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("ai_assistant_idempotency")
            .select("id,idempotency_key,debited,debit_source,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200),
        ]);
        if (cancelled) return;
        setPayments((tx as PaymentRow[]) ?? []);
        setCredits((cr as CreditsRow) ?? null);
        setIdem((id as IdemRow[]) ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao carregar histórico");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    return {
      paidCount: paid.length,
      revenue: paid.reduce((s, p) => s + Number(p.amount_brl || 0), 0),
      creditsPurchased: paid.reduce((s, p) => s + Number(p.credits_amount || 0), 0),
      requests: idem.length,
      debited: idem.filter((i) => i.debited).length,
    };
  }, [payments, idem]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico do usuário</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {displayName ? `${displayName} · ` : ""}
            {userId ?? "—"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" /> Saldo atual
                </div>
                <div className="text-xl font-bold text-primary">
                  {credits?.credits_balance ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cota grátis: {credits?.free_quota_used ?? 0}/{credits?.free_quota_limit ?? 0}
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" /> Receita confirmada
                </div>
                <div className="text-xl font-bold">{brl(summary.revenue)}</div>
                <div className="text-xs text-muted-foreground">{summary.paidCount} pagamentos</div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" /> Créditos comprados
                </div>
                <div className="text-xl font-bold">{summary.creditsPurchased}</div>
                <div className="text-xs text-muted-foreground">total acumulado</div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5" /> AI requests
                </div>
                <div className="text-xl font-bold">{summary.requests}</div>
                <div className="text-xs text-muted-foreground">
                  {summary.debited} debitados · {summary.requests - summary.debited} sem débito
                </div>
              </Card>
            </div>

            <Tabs defaultValue="payments" className="mt-2">
              <TabsList>
                <TabsTrigger value="payments">Pagamentos ({payments.length})</TabsTrigger>
                <TabsTrigger value="idempotency">AI Requests ({idem.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="payments">
                <Card className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criado</TableHead>
                        <TableHead>Pacote</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead>External ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhum pagamento.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {fmtDate(p.created_at)}
                            </TableCell>
                            <TableCell className="text-sm">{p.package_label ?? "—"}</TableCell>
                            <TableCell className="text-right font-medium">
                              {brl(Number(p.amount_brl))}
                            </TableCell>
                            <TableCell className="text-right">{p.credits_amount}</TableCell>
                            <TableCell className="text-xs uppercase">
                              {p.payment_method}/{p.provider}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(p.status)} className="capitalize">
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {fmtDate(p.paid_at)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {p.external_id ? short(p.external_id, 6, 4) : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="idempotency">
                <Card className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criado</TableHead>
                        <TableHead>Idempotency key</TableHead>
                        <TableHead>Debitado?</TableHead>
                        <TableHead>Origem do débito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {idem.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum request registrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        idem.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {fmtDate(i.created_at)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {short(i.idempotency_key, 10, 6)}
                            </TableCell>
                            <TableCell>
                              {i.debited ? <Badge>Sim</Badge> : <Badge variant="outline">Não</Badge>}
                            </TableCell>
                            <TableCell className="text-xs">{i.debit_source ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
