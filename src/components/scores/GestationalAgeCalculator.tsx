import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmt(d: Date) {
  return d.toLocaleDateString('pt-BR');
}
function weeksAndDays(totalDays: number) {
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export function GestationalAgeCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();

  // DUM tab
  const [dum, setDum] = useState('');
  // USG tab
  const [usgDate, setUsgDate] = useState('');
  const [usgWeeks, setUsgWeeks] = useState('');
  const [usgDays, setUsgDays] = useState('');

  const [result, setResult] = useState<{
    igWeeks: number; igDays: number; dpp: string; trimester: string; mode: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calcByDUM = () => {
    if (!dum) { toast.error('Informe a DUM'); return; }
    const dumDate = new Date(dum + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.floor((today.getTime() - dumDate.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > 320) { toast.error('DUM fora do intervalo esperado'); return; }
    const { weeks, days } = weeksAndDays(diffDays);
    const dpp = fmt(addDays(dumDate, 280));
    const trimester = weeks < 13 ? '1º Trimestre' : weeks < 28 ? '2º Trimestre' : '3º Trimestre';
    setResult({ igWeeks: weeks, igDays: days, dpp, trimester, mode: 'DUM' });
  };

  const calcByUSG = () => {
    const ref = new Date(usgDate + 'T00:00:00');
    const w = parseInt(usgWeeks), d = parseInt(usgDays || '0');
    if (!usgDate || isNaN(w)) { toast.error('Informe data do USG e semanas'); return; }
    const igAtUsg = w * 7 + d;
    const today = new Date(); today.setHours(0,0,0,0);
    const elapsed = Math.floor((today.getTime() - ref.getTime()) / 86400000);
    const totalDays = igAtUsg + elapsed;
    const { weeks, days } = weeksAndDays(totalDays);
    // DPP = data do USG + (280 - igAtUsg)
    const dpp = fmt(addDays(ref, 280 - igAtUsg));
    const trimester = weeks < 13 ? '1º Trimestre' : weeks < 28 ? '2º Trimestre' : '3º Trimestre';
    setResult({ igWeeks: weeks, igDays: days, dpp, trimester, mode: 'USG' });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'GESTATIONAL-AGE',
        data_json: { dum, usgDate, usgWeeks, usgDays, mode: result.mode } as any,
        calculated_score: result.igWeeks * 7 + result.igDays,
      });
      toast.success('IG salva');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Idade Gestacional</CardTitle>
        <CardDescription>Cálculo por DUM ou por ultrassonografia obstétrica</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="dum">
          <TabsList className="w-full">
            <TabsTrigger value="dum" className="flex-1">Por DUM</TabsTrigger>
            <TabsTrigger value="usg" className="flex-1">Por USG</TabsTrigger>
          </TabsList>

          <TabsContent value="dum" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label>Data da Última Menstruação (DUM)</Label>
              <Input type="date" value={dum} onChange={e => setDum(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <Button onClick={calcByDUM} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular pela DUM</Button>
          </TabsContent>

          <TabsContent value="usg" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label>Data do Exame de USG</Label>
              <Input type="date" value={usgDate} onChange={e => setUsgDate(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Semanas (na data do USG)</Label>
                <Input type="number" min={0} max={42} placeholder="Ex: 12" value={usgWeeks} onChange={e => setUsgWeeks(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Dias adicionais</Label>
                <Input type="number" min={0} max={6} placeholder="0–6" value={usgDays} onChange={e => setUsgDays(e.target.value)} />
              </div>
            </div>
            <Button onClick={calcByUSG} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular pela USG</Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="bg-muted/50 rounded-lg p-5 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Idade Gestacional Atual</p>
              <p className="text-5xl font-bold text-primary">{result.igWeeks}<span className="text-2xl">s</span> {result.igDays}<span className="text-2xl">d</span></p>
              <p className="text-sm text-muted-foreground mt-1">{result.trimester}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">DPP (Naegele)</p>
                <p className="font-semibold text-sm mt-1">{result.dpp}</p>
              </div>
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">Método</p>
                <p className="font-semibold text-sm mt-1">{result.mode}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2"
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
