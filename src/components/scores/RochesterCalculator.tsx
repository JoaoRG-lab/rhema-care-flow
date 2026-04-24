import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const CRITERIA: { key: string; label: string; description: string; lowRiskValue: boolean }[] = [
  { key: 'termBirth', label: 'Nascido a termo (≥ 37 semanas)', description: 'Sem prematuridade', lowRiskValue: true },
  { key: 'noAntibiotics', label: 'Sem antibióticos prévios', description: 'Não recebeu ATB antes desta consulta', lowRiskValue: true },
  { key: 'noHospitalization', label: 'Sem hospitalização prévia', description: 'Nunca internado', lowRiskValue: true },
  { key: 'noChronicDisease', label: 'Sem doença crônica de base', description: 'Sem cardiopatia, nefropatia, imunodepressão, etc.', lowRiskValue: true },
  { key: 'wellAppearing', label: 'Bom aspecto geral', description: 'Não tóxico, alerta, confortável', lowRiskValue: true },
  { key: 'wbc', label: 'Leucócitos 5.000–15.000/mm³', description: 'Dentro da faixa normal para a idade', lowRiskValue: true },
  { key: 'bands', label: 'Bastões < 1.500/mm³', description: 'Desvio à esquerda ausente', lowRiskValue: true },
  { key: 'ua', label: 'Urina com ≤ 10 leucócitos/campo', description: 'Sem piúria significativa', lowRiskValue: true },
  { key: 'stool', label: 'Fezes com ≤ 5 leucócitos/campo (se diarreia)', description: 'Ausência de colite bacteriana', lowRiskValue: true },
];

export function RochesterCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<'low' | 'high' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: string) => setValues(v => ({ ...v, [key]: !v[key] }));

  const calculate = () => {
    if (Object.keys(values).length < 9) { toast.error('Avalie todos os critérios'); return; }
    const allLowRisk = CRITERIA.every(c => values[c.key] === c.lowRiskValue);
    setResult(allLowRisk ? 'low' : 'high');
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'ROCHESTER', data_json: values as any, calculated_score: result === 'low' ? 0 : 1 });
      toast.success('Rochester salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critérios de Rochester</CardTitle>
        <CardDescription>Risco de infecção bacteriana grave em lactentes febris ≤ 60 dias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Marque os critérios <strong>presentes</strong> no paciente. Todos precisam estar presentes para baixo risco.</p>
        <div className="space-y-2">
          {CRITERIA.map((c) => (
            <button key={c.key} type="button"
              className={`w-full text-left p-3 rounded-lg border transition-colors ${values[c.key] ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
              onClick={() => toggle(c.key)}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center ${values[c.key] ? 'bg-primary border-primary' : 'border-input'}`}>
                  {values[c.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular Risco</Button>

        {result && (
          <div className={`rounded-lg p-4 ${result === 'low' ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}>
            {result === 'low' ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-success">Baixo risco de IBG</p>
                  <p className="text-sm text-muted-foreground mt-1">Manejo ambulatorial com retorno em 24 h, sem antibiótico empírico (avaliação clínica individualizada).</p>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alto risco de infecção bacteriana grave.</strong> Considerar hemograma, hemocultura, urinocultura, punção lombar e internação com antibiótico empírico.
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" size="sm" className="mt-3 gap-2 w-full" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
