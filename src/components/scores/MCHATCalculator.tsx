import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// M-CHAT-R — 20 perguntas, resposta Sim/Não
// "Falha" = resposta que aumenta risco (varia por item)
const QUESTIONS: { id: number; text: string; failOnYes: boolean }[] = [
  { id: 1, text: 'Se você apontar para algo no outro lado da sala, seu filho olha para lá? (ex: animal, brinquedo)', failOnYes: false },
  { id: 2, text: 'Já se perguntou se seu filho é surdo?', failOnYes: true },
  { id: 3, text: 'Seu filho brinca de faz-de-conta? (ex: falar ao telefone, cuidar de boneca)', failOnYes: false },
  { id: 4, text: 'Seu filho gosta de subir em coisas? (móveis, brinquedos, escadas)', failOnYes: false },
  { id: 5, text: 'Seu filho faz movimentos incomuns com os dedos perto dos olhos?', failOnYes: true },
  { id: 6, text: 'Seu filho aponta com o dedo indicador para pedir algo?', failOnYes: false },
  { id: 7, text: 'Seu filho aponta com o dedo indicador para mostrar interesse por algo?', failOnYes: false },
  { id: 8, text: 'Seu filho se interessa por outras crianças?', failOnYes: false },
  { id: 9, text: 'Seu filho mostra coisas trazendo ou levantando objetos para você?', failOnYes: false },
  { id: 10, text: 'Seu filho responde quando você o chama pelo nome?', failOnYes: false },
  { id: 11, text: 'Quando você sorri para ele, ele sorri de volta?', failOnYes: false },
  { id: 12, text: 'Seu filho fica perturbado com ruídos do dia a dia?', failOnYes: true },
  { id: 13, text: 'Seu filho anda bem?', failOnYes: false },
  { id: 14, text: 'Seu filho faz contato visual com você quando você fala com ele ou brinca com ele?', failOnYes: false },
  { id: 15, text: 'Seu filho imita você? (ex: faz uma careta quando você faz)', failOnYes: false },
  { id: 16, text: 'Seu filho vira quando você chama o nome dele?', failOnYes: false },
  { id: 17, text: 'Quando você olha para algo, seu filho segue o seu olhar?', failOnYes: false },
  { id: 18, text: 'Seu filho faz movimentos estranhos com os dedos ou as mãos?', failOnYes: true },
  { id: 19, text: 'Seu filho tenta atrair sua atenção para as próprias atividades?', failOnYes: false },
  { id: 20, text: 'Você já se perguntou se seu filho tem TEA?', failOnYes: true },
];

export function MCHATCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<{ fails: number; risk: 'low' | 'medium' | 'high' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const answer = (id: number, val: boolean) => setAnswers(a => ({ ...a, [id]: val }));

  const calculate = () => {
    if (Object.keys(answers).length < 20) { toast.error('Responda todas as 20 perguntas'); return; }
    let fails = 0;
    QUESTIONS.forEach(q => {
      const ans = answers[q.id];
      const failed = q.failOnYes ? ans === true : ans === false;
      if (failed) fails++;
    });
    const risk = fails <= 2 ? 'low' : fails <= 7 ? 'medium' : 'high';
    setResult({ fails, risk });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'MCHAT-R', data_json: answers as any, calculated_score: result.fails });
      toast.success('M-CHAT-R salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  const riskConfig = {
    low: { label: 'Baixo risco', color: 'text-success', bg: 'bg-success/10 border-success/30', text: 'Triagem negativa. Reavaliar em próxima consulta de rotina se dúvida persistir.' },
    medium: { label: 'Risco médio', color: 'text-warning', bg: 'bg-warning/10 border-warning/30', text: 'Aplicar Follow-Up (M-CHAT-R/F). Se ≥ 2 falhas no F: encaminhar para avaliação diagnóstica.' },
    high: { label: 'Alto risco', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', text: 'Encaminhar imediatamente para avaliação diagnóstica especializada de TEA.' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>M-CHAT-R/F</CardTitle>
        <CardDescription>Triagem de Transtorno do Espectro Autista — 16 a 30 meses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Perguntas respondidas pelo cuidador. Faixa etária: 16–30 meses.</AlertDescription>
        </Alert>
        <div className="space-y-3">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border bg-card">
              <p className="text-sm mb-2"><span className="font-semibold text-muted-foreground mr-1">{q.id}.</span>{q.text}</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={answers[q.id] === true ? 'default' : 'outline'} onClick={() => answer(q.id, true)}>Sim</Button>
                <Button type="button" size="sm" variant={answers[q.id] === false ? 'default' : 'outline'} onClick={() => answer(q.id, false)}>Não</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Object.keys(answers).length}/20 respondidas</span>
          <Badge variant="outline">{Object.keys(answers).length < 20 ? 'Incompleto' : 'Completo'}</Badge>
        </div>

        <Button onClick={calculate} className="w-full gap-2" disabled={Object.keys(answers).length < 20}>
          <Calculator className="h-4 w-4" />Calcular M-CHAT-R
        </Button>

        {result && (
          <div className={`rounded-lg p-4 border ${riskConfig[result.risk].bg}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.risk === 'low' ? <CheckCircle className={`h-5 w-5 ${riskConfig[result.risk].color}`} /> : <AlertTriangle className={`h-5 w-5 ${riskConfig[result.risk].color}`} />}
              <span className={`font-semibold ${riskConfig[result.risk].color}`}>{riskConfig[result.risk].label} — {result.fails} falha{result.fails !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-sm text-muted-foreground">{riskConfig[result.risk].text}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full gap-2" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
