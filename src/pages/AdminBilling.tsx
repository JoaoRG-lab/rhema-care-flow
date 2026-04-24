import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, RefreshCw, Wallet, Receipt, Repeat, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface PaymentRow {
  id: string;
  user_id: string;
  amount_brl: number;
  credits_amount: number;
  package_label: string | null;
  status: string;
  payment_method: string;
  provider: string;
  external_id: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

interface CreditsRow {
  user_id: string;
  credits_balance: number;
  free_quota_used: number;
  free_quota_limit: number;
  quota_reset_at: string;
}

interface IdemRow {
  id: string;
  user_id: string;
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

export default function AdminBilling() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tab, setTab] = useState("transactions");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentRow[]>([]);
  const [credits, setCredits] = useState<CreditsRow[]>([]);
  const [idem, setIdem] = useState<IdemRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: tx }, { data: cr }, { data: id }] = await Promise.all([
        supabase
          .from("payment_transactions")
          .select(
            "id,user_id,amount_brl,credits_amount,package_label,status,payment_method,provider,external_id,created_at,paid_at,expires_at"
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("user_ai_credits")
          .select("user_id,credits_balance,free_quota_used,free_quota_limit,quota_reset_at")
          .order("credits_balance", { ascending: false })
          .limit(500),
        supabase
          .from("ai_assistant_idempotency")
          .select("id,user_id,idempotency_key,debited,debit_source,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setTransactions((tx as PaymentRow[]) ?? []);
      setCredits((cr as CreditsRow[]) ?? []);
      setIdem((id as IdemRow[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const f = filter.trim().toLowerCase();
  const filteredTx = useMemo(
    () =>
      !f
        ? transactions
        : transactions.filter(
            (t) =>
              t.user_id.toLowerCase().includes(f) ||
              t.id.toLowerCase().includes(f) ||
              (t.external_id ?? "").toLowerCase().includes(f) ||
              t.status.toLowerCase().includes(f)
          ),
    [transactions, f]
  );
  const filteredCredits = useMemo(
    () => (!f ? credits : credits.filter((c) => c.user_id.toLowerCase().includes(f))),
    [credits, f]
  );
  const filteredIdem = useMemo(
    () =>
      !f
        ? idem
        : idem.filter(
            (i) =>
              i.user_id.toLowerCase().includes(f) ||
              i.idempotency_key.toLowerCase().includes(f)
          ),
    [idem, f]
  );

  const totals = useMemo(() => {
    const paid = transactions.filter((t) => t.status === "paid");
    const sumBrl = paid.reduce((s, t) => s + Number(t.amount_brl || 0), 0);
    const sumCredits = paid.reduce((s, t) => s + Number(t.credits_amount || 0), 0);
    return {
      txCount: transactions.length,
      paidCount: paid.length,
      pendingCount: transactions.filter((t) => t.status === "pending").length,
      revenueBrl: sumBrl,
      creditsSold: sumCredits,
      duplicatesPrevented: idem.filter((i) => !i.debited).length,
    };
  }, [transactions, idem]);

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const short = (s: string, head = 8, tail = 6) =>
    s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
  const brl = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin · Billing & AI Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Per-user credit transactions and AI request idempotency for debugging.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar (user_id, key, status…)"
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              Transações
            </div>
            <div className="text-2xl font-bold">{totals.txCount}</div>
            <div className="text-xs text-muted-foreground">
              {totals.paidCount} pagas · {totals.pendingCount} pendentes
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Receita confirmada
            </div>
            <div className="text-2xl font-bold text-primary">{brl(totals.revenueBrl)}</div>
            <div className="text-xs text-muted-foreground">{totals.creditsSold} créditos</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Repeat className="h-3.5 w-3.5" />
              Idempotency keys
            </div>
            <div className="text-2xl font-bold">{idem.length}</div>
            <div className="text-xs text-muted-foreground">
              {totals.duplicatesPrevented} sem débito
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Usuários com créditos
            </div>
            <div className="text-2xl font-bold">{credits.length}</div>
            <div className="text-xs text-muted-foreground">total carteiras</div>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="transactions">Transações ({filteredTx.length})</TabsTrigger>
            <TabsTrigger value="credits">Créditos ({filteredCredits.length})</TabsTrigger>
            <TabsTrigger value="idempotency">AI Requests ({filteredIdem.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criado</TableHead>
                    <TableHead>Usuário</TableHead>
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
                  {filteredTx.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTx.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(t.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{short(t.user_id)}</TableCell>
                        <TableCell className="text-sm">{t.package_label ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {brl(Number(t.amount_brl))}
                        </TableCell>
                        <TableCell className="text-right">{t.credits_amount}</TableCell>
                        <TableCell className="text-xs uppercase">
                          {t.payment_method}/{t.provider}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(t.status)} className="capitalize">
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(t.paid_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {t.external_id ? short(t.external_id, 6, 4) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="credits">
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Saldo pago</TableHead>
                    <TableHead className="text-right">Cota grátis</TableHead>
                    <TableHead>Reset em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCredits.map((c) => (
                      <TableRow key={c.user_id}>
                        <TableCell className="font-mono text-xs">{short(c.user_id)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {c.credits_balance}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.free_quota_used}/{c.free_quota_limit}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(c.quota_reset_at)}
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
                    <TableHead>Usuário</TableHead>
                    <TableHead>Idempotency key</TableHead>
                    <TableHead>Debitado?</TableHead>
                    <TableHead>Origem do débito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIdem.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum request registrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIdem.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {fmtDate(i.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{short(i.user_id)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {short(i.idempotency_key, 10, 6)}
                        </TableCell>
                        <TableCell>
                          {i.debited ? (
                            <Badge>Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
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
      </div>
    </AppLayout>
  );
}
