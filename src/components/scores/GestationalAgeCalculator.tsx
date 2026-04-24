import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator } from 'lucide-react';

/**
 * Calcula idade gestacional a partir da DUM (data da última menstruação) usando
 * a regra de Naegele (DPP = DUM + 7 dias − 3 meses + 1 ano) e diferença em dias.
 * Sem PHI: trabalha apenas com datas locais informadas pelo profissional.
 */
function diffDays(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('pt-BR');
}

export function GestationalAgeCalculator() {
  const today = new Date().toISOString().slice(0, 10);
  const [lmp, setLmp] = useState<string>('');
  const [reference, setReference] = useState<string>(today);

  const result = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp + 'T00:00:00');
    const refDate = new Date(reference + 'T00:00:00');
    if (Number.isNaN(lmpDate.getTime()) || Number.isNaN(refDate.getTime())) return null;
    const days = diffDays(refDate, lmpDate);
    if (days < 0 || days > 320) return { invalid: true } as const;
    const weeks = Math.floor(days / 7);
    const restDays = days % 7;
    const dpp = addDays(lmpDate, 280); // 40 semanas
    return {
      invalid: false,
      weeks,
      restDays,
      totalDays: days,
      dpp,
      trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    } as const;
  }, [lmp, reference]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Idade Gestacional (DUM)</CardTitle>
        <CardDescription>
          Cálculo pela regra de Naegele a partir da Data da Última Menstruação.
          Para datação por USG do 1º trimestre, ajustar a DUM operacional conforme protocolo do serviço.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="lmp">Data da última menstruação (DUM)</Label>
              <Input id="lmp" type="date" value={lmp} max={today} onChange={(e) => setLmp(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ref">Data de referência</Label>
              <Input id="ref" type="date" value={reference} onChange={(e) => setReference(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Padrão: hoje.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              Resultado calculado automaticamente.
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6 text-center">
            {!result && <p className="text-muted-foreground text-sm">Informe a DUM para calcular.</p>}
            {result?.invalid && (
              <p className="text-destructive text-sm">DUM inválida ou fora da faixa fisiológica (0–45 sem).</p>
            )}
            {result && !result.invalid && (
              <>
                <p className="text-sm text-muted-foreground mb-2">Idade gestacional</p>
                <p className="text-5xl font-bold">
                  {result.weeks}<span className="text-2xl">s</span> {result.restDays}<span className="text-2xl">d</span>
                </p>
                <p className="mt-2 text-sm">
                  Trimestre: <span className="font-semibold">{result.trimester}º</span> · Total: {result.totalDays} dias
                </p>
                <p className="mt-3 text-sm">
                  DPP estimada: <span className="font-semibold">{fmtDate(result.dpp)}</span>
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
