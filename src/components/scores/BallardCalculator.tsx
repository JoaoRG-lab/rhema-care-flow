import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const NEUROMUSCULAR: { key: string; label: string; options: { value: number; label: string }[] }[] = [
  {
    key: 'posture',
    label: 'Postura',
    options: [
      { value: -1, label: 'Braços/pernas estendidos' },
      { value: 0, label: 'Flexão leve de pernas' },
      { value: 1, label: 'Flexão moderada de pernas' },
      { value: 2, label: 'Flexão moderada de braços/pernas' },
      { value: 3, label: 'Flexão total de braços/pernas' },
      { value: 4, label: 'Flexão total, resistência máxima' },
    ],
  },
  {
    key: 'squareWindow',
    label: 'Janela quadrada (punho)',
    options: [
      { value: -1, label: '>90°' },
      { value: 0, label: '90°' },
      { value: 1, label: '60°' },
      { value: 2, label: '45°' },
      { value: 3, label: '30°' },
      { value: 4, label: '0°' },
    ],
  },
  {
    key: 'armRecoil',
    label: 'Retração do braço',
    options: [
      { value: 0, label: '180° (sem retração)' },
      { value: 1, label: '140–180°' },
      { value: 2, label: '110–140°' },
      { value: 3, label: '90–110°' },
      { value: 4, label: '<90°' },
    ],
  },
  {
    key: 'poplitealAngle',
    label: 'Ângulo poplíteo',
    options: [
      { value: -1, label: '180°' },
      { value: 0, label: '160°' },
      { value: 1, label: '140°' },
      { value: 2, label: '120°' },
      { value: 3, label: '100°' },
      { value: 4, label: '90°' },
      { value: 5, label: '<90°' },
    ],
  },
  {
    key: 'scarfSign',
    label: 'Sinal do xale',
    options: [
      { value: -1, label: 'Cotovelo ultrapassa linha axilar anterior' },
      { value: 0, label: 'Cotovelo atinge linha axilar anterior' },
      { value: 1, label: 'Cotovelo entre linhas axilar e mediana' },
      { value: 2, label: 'Cotovelo na linha mediana' },
      { value: 3, label: 'Cotovelo não ultrapassa linha mediana' },
      { value: 4, label: 'Cotovelo não alcança linha mediana' },
    ],
  },
  {
    key: 'heelToEar',
    label: 'Calcanhar-orelha',
    options: [
      { value: -1, label: 'Sem resistência, calcanhar alcança orelha' },
      { value: 0, label: 'Calcanhar quase alcança orelha' },
      { value: 1, label: 'Resistência leve' },
      { value: 2, label: 'Resistência moderada' },
      { value: 3, label: 'Resistência acentuada' },
      { value: 4, label: 'Não consegue' },
    ],
  },
];

const PHYSICAL: { key: string; label: string; options: { value: number; label: string }[] }[] = [
  {
    key: 'skin',
    label: 'Pele',
    options: [
      { value: -1, label: 'Gelatinosa/brilhante/transparente' },
      { value: 0, label: 'Lisa/rosada, veias visíveis' },
      { value: 1, label: 'Descamação superficial/erupção, poucas veias' },
      { value: 2, label: 'Áreas palidez/sulcos, veias raras' },
      { value: 3, label: 'Sulcos superficiais, veias raramente vistas' },
      { value: 4, label: 'Sulcos profundos, sem vasos' },
      { value: 5, label: 'Couro/sulcos profundos/enrugado' },
    ],
  },
  {
    key: 'lanugo',
    label: 'Lanugo',
    options: [
      { value: -1, label: 'Nenhum' },
      { value: 0, label: 'Escasso' },
      { value: 1, label: 'Abundante' },
      { value: 2, label: 'Afinando' },
      { value: 3, label: 'Áreas sem lanugo' },
      { value: 4, label: 'Sem lanugo' },
    ],
  },
  {
    key: 'plantarSurface',
    label: 'Superfície plantar',
    options: [
      { value: -2, label: '40–50 mm: -1; <40 mm: -2' },
      { value: -1, label: '40–50 mm' },
      { value: 0, label: '>50 mm, sem sulcos' },
      { value: 1, label: 'Marca tênue vermelha' },
      { value: 2, label: 'Só sulcos anteriores' },
      { value: 3, label: 'Sulcos nos 2/3 anteriores' },
      { value: 4, label: 'Sulcos cobrindo toda planta' },
    ],
  },
  {
    key: 'breast',
    label: 'Mama',
    options: [
      { value: -1, label: 'Imperceptível' },
      { value: 0, label: 'Mal percebida' },
      { value: 1, label: 'Aréola plana, sem botão' },
      { value: 2, label: 'Aréola pontilhada, botão 1–2 mm' },
      { value: 3, label: 'Aréola elevada, botão 3–4 mm' },
      { value: 4, label: 'Aréola completa, botão 5–10 mm' },
    ],
  },
  {
    key: 'eyeEar',
    label: 'Olho / Orelha',
    options: [
      { value: -2, label: 'Pálpebras fundidas firmemente: -2' },
      { value: -1, label: 'Pálpebras fundidas frouxamente: -1' },
      { value: 0, label: 'Pálpebra aberta; pavilhão plano, permanece dobrado' },
      { value: 1, label: 'Pavilhão levemente curvado, recuo lento' },
      { value: 2, label: 'Curvatura bem definida, recuo pronto' },
      { value: 3, label: 'Bem curvada, recuo imediato' },
      { value: 4, label: 'Cartilagem espessa, rígida' },
    ],
  },
  {
    key: 'genitalia',
    label: 'Genitália',
    options: [
      { value: -1, label: 'Escroto plano / Clitóris proeminente, lábios ausentes' },
      { value: 0, label: 'Escroto vazio / Clitóris proeminente, lábios menores pequenos' },
      { value: 1, label: 'Testículo no canal / Lábios maiores e menores iguais' },
      { value: 2, label: 'Testículo descendo / Lábios maiores maiores' },
      { value: 3, label: 'Testículo abaixo / Lábios maiores cobrem menor' },
      { value: 4, label: 'Testículo pendente / Lábios maiores cobrem clitóris e menor' },
    ],
  },
];

function scoreToGA(score: number): string {
  const table: [number, string][] = [
    [-10, '20'], [-5, '22'], [0, '24'], [5, '26'], [10, '28'],
    [15, '30'], [20, '32'], [25, '34'], [30, '36'], [35, '38'],
    [40, '40'], [45, '42'], [50, '44'],
  ];
  const closest = table.reduce((prev, curr) =>
    Math.abs(curr[0] - score) < Math.abs(prev[0] - score) ? curr : prev
  );
  return closest[1];
}

export function BallardCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [neuro, setNeuro] = useState<Record<string, number>>({});
  const [physical, setPhysical] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ total: number; ga: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(neuro).length < 6 || Object.keys(physical).length < 6) {
      toast.error('Preencha todos os critérios neuromusculares e físicos');
      return;
    }
    const neuroSum = Object.values(neuro).reduce((a, b) => a + b, 0);
    const physSum = Object.values(physical).reduce((a, b) => a + b, 0);
    const total = neuroSum + physSum;
    setResult({ total, ga: scoreToGA(total) });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'BALLARD',
        data_json: { neuro, physical } as any,
        calculated_score: result.total,
      });
      if (error) throw error;
      toast.success('Ballard salvo');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const saveScore = () => {
    if (!result) return;
    if (!requireAuth(performSave)) return;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escala de Ballard</CardTitle>
        <CardDescription>Estimativa da idade gestacional pelo exame somático e neuromuscular do recém-nascido</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Maturidade Neuromuscular</h3>
          <div className="space-y-4">
            {NEUROMUSCULAR.map((item) => (
              <div key={item.key}>
                <Label>{item.label}</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.options.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant={neuro[item.key] === o.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-1.5 text-xs text-left"
                      onClick={() => setNeuro((v) => ({ ...v, [item.key]: o.value }))}
                    >
                      <span className="font-mono mr-1">{o.value >= 0 ? '+' : ''}{o.value}</span>
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Maturidade Física</h3>
          <div className="space-y-4">
            {PHYSICAL.map((item) => (
              <div key={item.key}>
                <Label>{item.label}</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.options.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant={physical[item.key] === o.value ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-1.5 text-xs text-left"
                      onClick={() => setPhysical((v) => ({ ...v, [item.key]: o.value }))}
                    >
                      <span className="font-mono mr-1">{o.value >= 0 ? '+' : ''}{o.value}</span>
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full gap-2">
          <Calculator className="h-4 w-4" />
          Calcular Ballard
        </Button>

        {result && (
          <div className="flex flex-col items-center bg-muted/50 rounded-lg p-6 gap-2">
            <p className="text-sm text-muted-foreground">Pontuação Total</p>
            <p className="text-5xl font-bold">{result.total}</p>
            <p className="text-2xl font-semibold text-primary">≈ {result.ga} semanas</p>
            <p className="text-xs text-muted-foreground">Idade gestacional estimada</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={saveScore} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
