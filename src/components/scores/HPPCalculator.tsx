import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// Fatores de risco para HPP — sistema 4T (OMS / FOGSI)
const RISK_FACTORS = [
  { key: 'atony', label: 'Atonia uterina / útero amolecido após parto', weight: 3, category: 'Tônus' },
  { key: 'retained', label: 'Retenção de placenta / restos placentários', weight: 3, category: 'Tecido' },
  { key: 'laceration', label: 'Lacerações de canal de parto (grau ≥ III)', weight: 2, category: 'Trauma' },
  { key: 'episio', label: 'Episiotomia ou laceração grau I-II', weight: 1, category: 'Trauma' },
  { key: 'coagulopathy', label: 'Coagulopatia (CIVD, HELLP, uso de anticoagulante)', weight: 3, category: 'Trombina' },
  { key: 'prolonged_labor', label: 'Trabalho de parto prolongado (> 18h)', weight: 1, category: 'Tônus' },
  { key: 'macrosomia', label: 'Macrossomia fetal (> 4 kg)', weight: 1, category: 'Tônus' },
  { key: 'multiparity', label: 'Grande multiparidade (≥ 5 partos)', weight: 1, category: 'Tônus' },
  { key: 'placenta_previa', label: 'Placenta prévia / acretismo placentário', weight: 3, category: 'Tecido' },
  { key: 'uterine_rupture', label: 'Rotura uterina / inversão uterina', weight: 3, category: 'Trauma' },
];

export function HPPCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [bleeding, setBleeding] = useState('');
  const [delivery, setDelivery] = useState<'vaginal' | 'cesarean' | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ hpp: boolean; severe: boolean; risk: string; color: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: string) => setSelected(v => ({ ...v, [key]: !v[key] }));

  const evaluate = () => {
    if (!delivery) { toast.error('Informe a via de parto'); return; }
    const bleedingMl = parseInt(bleeding) || 0;
    const threshold = delivery === 'vaginal' ? 500 : 1000;
    const severeThreshold = 1500;
    const hpp = bleedingMl >= threshold;
    const severe = bleedingMl >= severeThreshold;
    const riskScore = Object.entries(selected).filter(([, v]) => v).reduce((acc, [k]) => {
      return acc + (RISK_FACTORS.find(f => f.key === k)?.weight || 0);
    }, 0);
    const risk = riskScore >= 5 ? 'Alto' : riskScore >= 2 ? 'Moderado' : 'Baixo';
    const color = severe ? 'text-destructive' : hpp ? 'text-warning' : 'text-success';
    setResult({ hpp, severe, risk, color });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'HPP',
        data_json: { bleeding, delivery, selected } as any,
        calculated_score: parseInt(bleeding) || 0,
      });
      toast.success('HPP salva');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hemorragia Pós-Parto (HPP)</CardTitle>
        <CardDescription>Avaliação de perda sanguínea e fatores de risco — protocolo OMS/FEBRASGO</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Perda sanguínea estimada (mL)</Label>
            <Input type="number" min={0} placeholder="Ex: 600" value={bleeding} onChange={e => setBleeding(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Via de parto</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant={delivery === 'vaginal' ? 'default' : 'outline'} onClick={() => setDelivery('vaginal')}>Vaginal</Button>
              <Button type="button" size="sm" variant={delivery === 'cesarean' ? 'default' : 'outline'} onClick={() => setDelivery('cesarean')}>Cesárea</Button>
            </div>
            <p className="text-xs text-muted-foreground">Limiar: vaginal ≥ 500 mL / cesárea ≥ 1000 mL</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Fatores de risco (sistema 4T)</p>
          <div className="grid md:grid-cols-2 gap-1.5">
            {RISK_FACTORS.map(f => (
              <button key={f.key} type="button"
                className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${selected[f.key] ? 'border-destructive/60 bg-destructive/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => toggle(f.key)}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 h-3.5 w-3.5 rounded border shrink-0 ${selected[f.key] ? 'bg-destructive border-destructive' : 'border-input'}`}>
                    {selected[f.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground mr-1">[{f.category}]</span>
                    {f.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={evaluate} className="w-full gap-2">Avaliar HPP</Button>

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.severe ? 'border-destructive/60 bg-destructive/5' : result.hpp ? 'border-warning/60 bg-warning/5' : 'border-success/60 bg-success/5'}`}>
            <p className={`font-bold text-lg ${result.color}`}>
              {result.severe ? 'HPP Grave (≥ 1500 mL)' : result.hpp ? 'HPP Confirmada' : 'Sem critério de HPP'}
            </p>
            <p className="text-sm text-muted-foreground">Risco de recorrência/progressão: <strong>{result.risk}</strong></p>
            {result.hpp && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Protocolo HPP:</strong> Massagem uterina → Ocitocina 10 UI IV → Misoprostol → Ácido tranexâmico 1g IV → Acesso venoso duplo → Tipagem sanguínea e reserva
                  {result.severe ? ' → Acionar equipe cirúrgica / transfusão maciça.' : '.'}
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2"
              onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
