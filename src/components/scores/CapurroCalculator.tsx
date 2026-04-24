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

const CRITERIA = [
  {
    key: 'breast',
    label: 'Glândula mamária',
    options: [
      { value: 0, label: 'Não palpável' },
      { value: 5, label: '0,5 cm' },
      { value: 10, label: '1 cm' },
      { value: 15, label: '> 1 cm' },
    ],
  },
  {
    key: 'nipple',
    label: 'Formação do mamilo',
    options: [
      { value: 0, label: 'Apenas esboçado, sem aréola' },
      { value: 5, label: 'Aréola lisa/plana, diâm < 7,5 mm' },
      { value: 10, label: 'Aréola pontilhada, diâm < 7,5 mm' },
      { value: 15, label: 'Aréola pontilhada, diâm ≥ 7,5 mm' },
    ],
  },
  {
    key: 'skin',
    label: 'Textura da pele',
    options: [
      { value: 0, label: 'Muito fina, gelatinosa' },
      { value: 5, label: 'Fina e suave' },
      { value: 10, label: 'Levemente espessa, descamação superficial' },
      { value: 15, label: 'Espessa, com sulcos superficiais' },
      { value: 20, label: 'Espessa, sulcos profundos' },
    ],
  },
  {
    key: 'ear',
    label: 'Pavilhão auricular',
    options: [
      { value: 0, label: 'Pavilhão plano, sem incurvamento' },
      { value: 8, label: 'Incurvamento parcial da hélice' },
      { value: 16, label: 'Incurvamento superior completo' },
    ],
  },
  {
    key: 'plantar',
    label: 'Sulcos plantares',
    options: [
      { value: 0, label: 'Sem sulcos' },
      { value: 5, label: 'Sulcos apenas no 1/3 anterior' },
      { value: 10, label: 'Sulcos no 2/3 anteriores' },
      { value: 15, label: 'Sulcos em toda a planta' },
    ],
  },
];

export function CapurroCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; ga: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) { toast.error('Avalie todos os 5 critérios'); return; }
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    // Fórmula de Capurro somático: IG (semanas) = (total + 204) / 7
    const ga = Math.round((total + 204) / 7);
    setResult({ score: total, ga });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'CAPURRO', data_json: values as any, calculated_score: result.ga });
      toast.success('Capurro salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de Capurro</CardTitle>
        <CardDescription>Estimativa da idade gestacional por critérios somáticos neonatais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <Label>{c.label}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {c.options.map((o) => (
                <Button key={o.value} type="button" variant={values[c.key] === o.value ? 'default' : 'outline'} size="sm"
                  className="h-auto py-1.5 text-xs text-left"
                  onClick={() => setValues(v => ({ ...v, [c.key]: o.value }))}>
                  <span className="font-mono mr-1">{o.value}</span>{o.label}
                </Button>
              ))}
            </div>
          </div>
        ))}

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular Capurro</Button>

        {result && (
          <div className="flex flex-col items-center bg-muted/50 rounded-lg p-6 gap-2">
            <p className="text-sm text-muted-foreground">Pontuação: {result.score}</p>
            <p className="text-5xl font-bold text-primary">{result.ga} sem.</p>
            <p className="text-sm text-muted-foreground">Idade gestacional estimada</p>
            <p className="text-xs text-muted-foreground">(IG = pontuação + 204) ÷ 7</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
