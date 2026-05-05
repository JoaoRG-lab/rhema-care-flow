import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Save, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// FIQR — Revised Fibromyalgia Impact Questionnaire (Bennett 2009)
// 21 itens, escala 0–10. Total 0–100:
//   Função (9 itens) → soma / 3      (max 30)
//   Impacto geral (2 itens) → soma   (max 20)
//   Sintomas (10 itens) → soma / 2   (max 50)

type Domain = 'function' | 'overall' | 'symptoms';
interface Item { id: string; label: string; domain: Domain }

const ITEMS: Item[] = [
  // Função (0 = sem dificuldade, 10 = muita dificuldade)
  { id: 'f_brush_hair', label: 'Pentear o cabelo', domain: 'function' },
  { id: 'f_walk_continuous', label: 'Caminhar continuamente por 20 minutos', domain: 'function' },
  { id: 'f_groceries', label: 'Carregar sacolas de compras', domain: 'function' },
  { id: 'f_climb_stairs', label: 'Subir um lance de escadas', domain: 'function' },
  { id: 'f_change_sheets', label: 'Trocar lençóis da cama', domain: 'function' },
  { id: 'f_sit_chair', label: 'Sentar-se em uma cadeira por 45 min', domain: 'function' },
  { id: 'f_shop', label: 'Fazer compras no mercado', domain: 'function' },
  { id: 'f_drive', label: 'Dirigir um carro', domain: 'function' },
  { id: 'f_visit', label: 'Visitar amigos ou parentes', domain: 'function' },
  // Impacto geral
  { id: 'o_overwhelmed', label: 'A fibromialgia me impediu de realizar minhas metas na última semana', domain: 'overall' },
  { id: 'o_completely', label: 'Fui totalmente dominado(a) pelos sintomas de fibromialgia', domain: 'overall' },
  // Sintomas (0 = ausente / sem problema, 10 = grave)
  { id: 's_pain', label: 'Intensidade da dor', domain: 'symptoms' },
  { id: 's_energy', label: 'Nível de energia (10 = sem energia)', domain: 'symptoms' },
  { id: 's_stiffness', label: 'Rigidez', domain: 'symptoms' },
  { id: 's_sleep', label: 'Qualidade do sono (10 = péssima)', domain: 'symptoms' },
  { id: 's_depression', label: 'Depressão', domain: 'symptoms' },
  { id: 's_memory', label: 'Problemas de memória', domain: 'symptoms' },
  { id: 's_anxiety', label: 'Ansiedade', domain: 'symptoms' },
  { id: 's_tenderness', label: 'Sensibilidade ao toque', domain: 'symptoms' },
  { id: 's_balance', label: 'Problemas de equilíbrio', domain: 'symptoms' },
  { id: 's_sensitivity', label: 'Sensibilidade a ruído/luz/odores/frio', domain: 'symptoms' },
];

const DOMAIN_META: Record<Domain, { label: string; max: number; weight: number }> = {
  function: { label: 'Função física', max: 30, weight: 1 / 3 },
  overall: { label: 'Impacto geral', max: 20, weight: 1 },
  symptoms: { label: 'Sintomas', max: 50, weight: 1 / 2 },
};

function interpret(total: number) {
  if (total < 39) return { label: 'Impacto leve', color: 'text-success' };
  if (total < 59) return { label: 'Impacto moderado', color: 'text-warning' };
  if (total < 75) return { label: 'Impacto grave', color: 'text-orange-500' };
  return { label: 'Impacto muito grave', color: 'text-destructive' };
}

export function FIQRCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const setValue = (id: string, v: number) =>
    setValues((s) => ({ ...s, [id]: Math.max(0, Math.min(10, v)) }));

  const domainTotals = useMemo(() => {
    const out: Record<Domain, number> = { function: 0, overall: 0, symptoms: 0 };
    ITEMS.forEach((it) => {
      out[it.domain] += values[it.id] ?? 0;
    });
    return {
      function: out.function * DOMAIN_META.function.weight,
      overall: out.overall * DOMAIN_META.overall.weight,
      symptoms: out.symptoms * DOMAIN_META.symptoms.weight,
    };
  }, [values]);

  const total = useMemo(
    () => Math.round((domainTotals.function + domainTotals.overall + domainTotals.symptoms) * 10) / 10,
    [domainTotals]
  );

  const answeredCount = Object.keys(values).length;
  const complete = answeredCount === ITEMS.length;
  const interp = interpret(total);

  const performSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'FIQR',
        data_json: { values, domainTotals } as any,
        calculated_score: total,
      });
      if (error) throw error;
      toast.success('FIQR salvo');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDomain = (domain: Domain, intro?: string) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{DOMAIN_META[domain].label}</Label>
        <Badge variant="outline">
          {(domainTotals[domain]).toFixed(1)} / {DOMAIN_META[domain].max}
        </Badge>
      </div>
      {intro && <p className="text-xs text-muted-foreground">{intro}</p>}
      <div className="space-y-3">
        {ITEMS.filter((i) => i.domain === domain).map((it) => {
          const v = values[it.id] ?? 0;
          return (
            <div key={it.id} className="rounded-lg border p-3 bg-card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm flex-1">{it.label}</p>
                <span className="font-mono text-sm tabular-nums w-8 text-right">
                  {values[it.id] !== undefined ? v : '—'}
                </span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[v]}
                onValueChange={(arr) => setValue(it.id, arr[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>FIQR — Revised Fibromyalgia Impact Questionnaire</CardTitle>
        <CardDescription>
          Avaliação do impacto da fibromialgia na última semana (21 itens, 0–100)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pontuação total = (Função/3) + (Impacto geral) + (Sintomas/2). Faixas:{' '}
            <strong>&lt;39</strong> leve, <strong>39–58</strong> moderado, <strong>59–74</strong>{' '}
            grave, <strong>≥75</strong> muito grave.
          </AlertDescription>
        </Alert>

        {renderDomain('function', 'Nos últimos 7 dias, qual o grau de dificuldade para: (0 = sem dificuldade, 10 = muita)')}
        {renderDomain('overall')}
        {renderDomain('symptoms', 'Nos últimos 7 dias, intensidade dos sintomas (0 = ausente, 10 = grave)')}

        <div className="rounded-lg p-4 border bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">FIQR Total</p>
              <p className="text-3xl font-bold">
                {total}
                <span className="text-base text-muted-foreground">/100</span>
              </p>
              <p className={`text-sm font-semibold mt-1 ${interp.color}`}>{interp.label}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{answeredCount}/{ITEMS.length} itens respondidos</p>
              {!complete && <p className="text-warning">Itens não respondidos contam 0</p>}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2"
            onClick={() => requireAuth(performSave)}
            disabled={isSaving || answeredCount === 0}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
      <LoginPromptDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLogin={goToLogin}
        onSignup={goToSignup}
      />
    </Card>
  );
}
