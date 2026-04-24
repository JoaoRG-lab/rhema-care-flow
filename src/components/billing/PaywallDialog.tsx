import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, QrCode, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PACKAGES = [
  { id: "starter", credits: 50, amount: 1.5, label: "Starter" },
  { id: "standard", credits: 200, amount: 6.0, label: "Standard", popular: true },
  { id: "pro", credits: 500, amount: 15.0, label: "Pro" },
];

interface PixData {
  transactionId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: string;
  amount: number;
  credits: number;
  label: string;
}

export function PaywallDialog({ open, onOpenChange, onSuccess }: PaywallDialogProps) {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!open) {
      setPix(null);
      setSelectedPkg(null);
      setCopied(false);
      setPolling(false);
    }
  }, [open]);

  // Poll for payment confirmation
  useEffect(() => {
    if (!pix || !open) return;
    setPolling(true);
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("payment_transactions")
        .select("status")
        .eq("id", pix.transactionId)
        .maybeSingle();
      if (data?.status === "paid") {
        clearInterval(interval);
        setPolling(false);
        toast.success(`${pix.credits} créditos adicionados!`);
        onSuccess?.();
        onOpenChange(false);
      }
    }, 3000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [pix, open, onSuccess, onOpenChange]);

  const handleCreate = async (packageId: string) => {
    setSelectedPkg(packageId);
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-mercadopago-pix", {
        body: { packageId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPix(data as PixData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar PIX");
      setSelectedPkg(null);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {pix ? "Pague via PIX" : "Adicionar créditos AI"}
          </DialogTitle>
          <DialogDescription>
            {pix
              ? `Escaneie o QR code ou copie o código abaixo. Expira em 30 minutos.`
              : "Custos repassados integralmente. Sem markup."}
          </DialogDescription>
        </DialogHeader>

        {!pix ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative p-4 cursor-pointer transition-all hover:border-primary ${
                  selectedPkg === pkg.id ? "border-primary ring-2 ring-primary/20" : ""
                }`}
                onClick={() => !creating && handleCreate(pkg.id)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Popular</Badge>
                )}
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{pkg.label}</div>
                  <div className="text-2xl font-bold">{pkg.credits}</div>
                  <div className="text-xs text-muted-foreground">créditos</div>
                  <div className="text-lg font-semibold text-primary">
                    R$ {pkg.amount.toFixed(2).replace(".", ",")}
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={creating}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreate(pkg.id);
                    }}
                  >
                    {creating && selectedPkg === pkg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Pagar PIX"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <div className="font-semibold">{pix.label}</div>
                <div className="text-sm text-muted-foreground">{pix.credits} créditos</div>
              </div>
              <div className="text-xl font-bold text-primary">
                R$ {pix.amount.toFixed(2).replace(".", ",")}
              </div>
            </div>

            {pix.qrCodeBase64 && (
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={`data:image/png;base64,${pix.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-56 h-56"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Código copia-e-cola
              </label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs break-all max-h-20 overflow-y-auto">
                  {pix.qrCode}
                </code>
                <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              {polling && <Loader2 className="h-4 w-4 animate-spin" />}
              Aguardando confirmação do pagamento...
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setPix(null)}>
              Escolher outro pacote
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
