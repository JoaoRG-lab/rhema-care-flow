import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Save, Info, Link2, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// =====================================================
// ACR 2016 — WPI + SSS
// =====================================================
const WPI_REGIONS = [
  { key: 'left_upper', label: 'Sup. esq.', sites: [
    { id: 'l_jaw', label: 'Mandíbula esq.' },
    { id: 'l_shoulder', label: 'Ombro esq.' },
    { id: 'l_upper_arm', label: 'Braço esq.' },
    { id: 'l_lower_arm', label: 'Antebraço esq.' },
  ]},
  { key: 'right_upper', label: 'Sup. dir.', sites: [
    { id: 'r_jaw', label: 'Mandíbula dir.' },
    { id: 'r_shoulder', label: 'Ombro dir.' },
    { id: 'r_upper_arm', label: 'Braço dir.' },
    { id: 'r_lower_arm', label: 'Antebraço dir.' },
  ]},
  { key: 'left_lower', label: 'Inf. esq.', sites: [
    { id: 'l_hip', label: 'Quadril esq.' },
    { id: 'l_upper_leg', label: 'Coxa esq.' },
    { id: 'l_lower_leg', label: 'Perna esq.' },
  ]},
  { key: 'right_lower', label: 'Inf. dir.', sites: [
    { id: 'r_hip', label: 'Quadril dir.' },
    { id: 'r_upper_leg', label: 'Coxa dir.' },
    { id: 'r_lower_leg', label: 'Perna dir.' },
  ]},
  { key: 'axial', label: 'Axial', sites: [
    { id: 'neck', label: 'Pescoço' },
    { id: 'upper_back', label: 'Dorso sup.' },
    { id: 'lower_back', label: 'Lombar' },
    { id: 'chest', label: 'Tórax' },
    { id: 'abdomen', label: 'Abdome' },
  ]},
] as const;

const SSS_SYMPTOMS = [
  { key: 'fatigue', label: 'Fadiga' },
  { key: 'sleep', label: 'Sono não reparador' },
  { key: 'cognitive', label: 'Sintomas cognitivos' },
];
const SSS_OPTIONS = [
  { value: 0, label: 'Sem problema' },
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Grave' },
];
const SOMATIC_SYMPTOMS = [
  { key: 'headache', label: 'Cefaleia' },
  { key: 'abdominal_pain', label: 'Dor abdominal' },
  { key: 'depression', label: 'Depressão' },
];

// =====================================================
// FIQR
// =====================================================
type Domain = 'function' | 'overall' | 'symptoms';
const FIQR_ITEMS: { id: string; label: string; domain: Domain }[] = [
  { id: 'f_brush_hair', label: 'Pentear o cabelo', domain: 'function' },
  { id: 'f_walk_continuous', label: 'Caminhar 20 min', domain: 'function' },
  { id: 'f_groceries', label: 'Carregar sacolas', domain: 'function' },
  { id: 'f_climb_stairs', label: 'Subir escadas', domain: 'function' },
  { id: 'f_change_sheets', label: 'Trocar lençóis', domain: 'function' },
  { id: 'f_sit_chair', label: 'Sentar 45 min', domain: 'function' },
  { id: 'f_shop', label: 'Fazer compras', domain: 'function' },
  { id: 'f_drive', label: 'Dirigir', domain: 'function' },
  { id: 'f_visit', label: 'Visitar amigos/família', domain: 'function' },
  { id: 'o_overwhelmed', label: 'FM impediu de realizar metas', domain: 'overall' },
  { id: 'o_completely', label: 'Dominado pelos sintomas', domain: 'overall' },
  { id: 's_pain', label: 'Dor', domain: 'symptoms' },
  { id: 's_energy', label: 'Falta de energia', domain: 'symptoms' },
  { id: 's_stiffness', label: 'Rigidez', domain: 'symptoms' },
  { id: 's_sleep', label: 'Sono ruim', domain: 'symptoms' },
  { id: 's_depression', label: 'Depressão', domain: 'symptoms' },
  { id: 's_memory', label: 'Memória', domain: 'symptoms' },
  { id: 's_anxiety', label: 'Ansiedade', domain: 'symptoms' },
  { id: 's_tenderness', label: 'Sensibilidade ao toque', domain: 'symptoms' },
  { id: 's_balance', label: 'Equilíbrio', domain: 'symptoms' },
  { id: 's_sensitivity', label: 'Sensibilidade ruído/luz', domain: 'symptoms' },
];
const FIQR_DOMAIN_META: Record<Domain, { label: string; max: number; weight: number }> = {
  function: { label: 'Função', max: 30, weight: 1 / 3 },
  overall: { label: 'Impacto geral', max: 20, weight: 1 },
  symptoms: { label: 'Sintomas', max: 50, weight: 1 / 2 },
};

function fiqrInterpret(total: number) {
  if (total < 39) return { label: 'Leve', color: 'text-success' };
  if (total < 59) return { label: 'Moderado', color: 'text-warning' };
  if (total < 75) return { label: 'Grave', color: 'text-orange-500' };
  return { label: 'Muito grave', color: 'text-destructive' };
}

// =====================================================
// Combined component
// =====================================================
export function FibromyalgiaCombinedAssessment() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();

  // Linking
  const [patients, setPatients] = useState<Array<{ id: string; patient_code: string; mrn_last4: string | null }>>([]);
  const [visits, setVisits] = useState<Array<{ id: string; visit_date: string }>>([]);
  const [patientId, setPatientId] = useState<string>('');
  const [visitId, setVisitId] = useState<string>('');

  // ACR state
  const [sites, setSites] = useState<Record<string, boolean>>({});
  const [sss, setSss] = useState<Record<string, number>>({});
  const [somatic, setSomatic] = useState<Record<string, boolean>>({});
  const [duration3m, setDuration3m] = useState(false);
  const [excluded, setExcluded] = useState(false);

  // FIQR state
  const [fiqr, setFiqr] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('patient_cards_secure')
      .select('id, patient_code, mrn_last4').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPatients((data as any) || []));
  }, [user]);

  useEffect(() => {
    setVisitId('');
    setVisits([]);
    if (!user || !patientId) return;
    supabase.from('visits_secure')
      .select('id, visit_date').eq('user_id', user.id).eq('patient_card_id', patientId)
      .order('visit_date', { ascending: false })
      .then(({ data }) => setVisits((data as any) || []));
  }, [user, patientId]);

  // ACR derived
  const wpi = useMemo(
    () => WPI_REGIONS.reduce((a, r) => a + r.sites.filter((s) => sites[s.id]).length, 0),
    [sites]
  );
  const regionsWithPain = useMemo(
    () => WPI_REGIONS.filter((r) => r.sites.some((s) => sites[s.id])).length,
    [sites]
  );
  const sssCore = useMemo(() => SSS_SYMPTOMS.reduce((a, s) => a + (sss[s.key] ?? 0), 0), [sss]);
  const somaticCount = useMemo(() => SOMATIC_SYMPTOMS.filter((s) => somatic[s.key]).length, [somatic]);
  const sssTotal = sssCore + somaticCount;
  const generalizedPain = regionsWithPain >= 4;
  const acrCore = (wpi >= 7 && sssTotal >= 5) || (wpi >= 4 && wpi <= 6 && sssTotal >= 9);
  const meetsAcr = acrCore && generalizedPain && duration3m && excluded;
  const fsScore = wpi + sssTotal;

  // FIQR derived
  const fiqrDomainTotals = useMemo(() => {
    const out: Record<Domain, number> = { function: 0, overall: 0, symptoms: 0 };
    FIQR_ITEMS.forEach((it) => { out[it.domain] += fiqr[it.id] ?? 0; });
    return {
      function: out.function * FIQR_DOMAIN_META.function.weight,
      overall: out.overall * FIQR_DOMAIN_META.overall.weight,
      symptoms: out.symptoms * FIQR_DOMAIN_META.symptoms.weight,
    };
  }, [fiqr]);
  const fiqrTotal = useMemo(
    () => Math.round((fiqrDomainTotals.function + fiqrDomainTotals.overall + fiqrDomainTotals.symptoms) * 10) / 10,
    [fiqrDomainTotals]
  );
  const fiqrAnswered = Object.keys(fiqr).length;
  const fiqrInterp = fiqrInterpret(fiqrTotal);

  // Combined interpretation
  const combinedSummary = useMemo(() => {
    const concordant = meetsAcr && fiqrTotal >= 39;
    const acrPosOnly = meetsAcr && fiqrTotal < 39;
    const fiqrPosOnly = !meetsAcr && fiqrTotal >= 59;
    let label = 'Sem fibromialgia clinicamente significativa';
    let tone: 'success' | 'warning' | 'destructive' | 'muted' = 'success';
    if (concordant) {
      label = `FM confirmada (ACR+) com impacto ${fiqrInterp.label.toLowerCase()} (FIQR ${fiqrTotal})`;
      tone = fiqrTotal >= 59 ? 'destructive' : 'warning';
    } else if (acrPosOnly) {
      label = 'FM por critérios ACR, porém impacto funcional baixo (FIQR < 39)';
      tone = 'warning';
    } else if (fiqrPosOnly) {
      label = 'Alto impacto funcional (FIQR ≥ 59) sem preencher ACR — reavaliar critérios';
      tone = 'warning';
    } else if (!meetsAcr && fiqrAnswered > 0) {
      label = 'Critérios ACR não atendidos; impacto FIQR não significativo';
      tone = 'muted';
    }
    return { label, tone, concordant, acrPosOnly, fiqrPosOnly };
  }, [meetsAcr, fiqrTotal, fiqrAnswered, fiqrInterp.label]);

  const performSave = async () => {
    if (!user) return;
    if (!visitId) {
      toast.error('Selecione paciente e consulta para salvar a avaliação combinada.');
      return;
    }
    setIsSaving(true);
    try {
      const base = { user_id: user.id, patient_card_id: patientId, visit_id: visitId };
      const acrPayload = {
        sites, sss, somatic, duration3m, excluded,
        wpi, sssTotal, regionsWithPain, meetsDiagnosis: meetsAcr,
      };
      const fiqrPayload = { values: fiqr, domainTotals: fiqrDomainTotals, total: fiqrTotal };
      const combinedPayload = {
        acr: { wpi, sss_total: sssTotal, meets: meetsAcr, fs_score: fsScore },
        fiqr: { total: fiqrTotal, severity: fiqrInterp.label, domain_totals: fiqrDomainTotals },
        interpretation: combinedSummary.label,
        agreement: combinedSummary.concordant ? 'concordant' : 'discordant',
      };

      const { error } = await supabase.from('score_entries').insert([
        { ...base, score_type: 'ACR-FM-2016', data_json: acrPayload as any, calculated_score: fsScore },
        { ...base, score_type: 'FIQR', data_json: fiqrPayload as any, calculated_score: fiqrTotal },
        { ...base, score_type: 'FM-COMBINED', data_json: combinedPayload as any, calculated_score: fiqrTotal },
      ]);
      if (error) throw error;
      toast.success('Avaliação combinada (ACR + FIQR) salva na consulta');
    } catch (e: any) {
      toast.error('Erro ao salvar' + (e?.message ? `: ${e.message}` : ''));
    } finally {
      setIsSaving(false);
    }
  };

  const toneClass: Record<string, string> = {
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
    muted: 'bg-muted/50 border-border text-muted-foreground',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Avaliação combinada — ACR 2016 + FIQR
        </CardTitle>
        <CardDescription>
          Diagnóstico (ACR) e impacto funcional (FIQR) em uma única consulta. Resultados são
          gravados juntos no histórico da visita selecionada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Selecione paciente e consulta — as três pontuações (ACR, FIQR, combinada) serão
            armazenadas em <code>score_entries</code> com a mesma <code>visit_id</code>.
          </AlertDescription>
        </Alert>

        {/* Linking */}
        {user && (
          <section className="rounded-lg border p-3 bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Vínculo paciente / consulta</Label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Paciente (código)</Label>
                <Select value={patientId || 'none'} onValueChange={(v) => setPatientId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar paciente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecionar...</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.patient_code}{p.mrn_last4 ? ` · ****${p.mrn_last4}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Consulta</Label>
                <Select value={visitId || 'none'} onValueChange={(v) => setVisitId(v === 'none' ? '' : v)} disabled={!patientId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={patientId ? 'Selecionar consulta' : 'Selecione um paciente'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecionar...</SelectItem>
                    {visits.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {new Date(v.visit_date).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {patientId && visits.length === 0 && (
              <p className="text-[11px] text-warning">
                Este paciente ainda não possui consultas. Crie uma consulta antes de salvar.
              </p>
            )}
          </section>
        )}

        <Tabs defaultValue="acr">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="acr">ACR 2016 ({wpi}+{sssTotal})</TabsTrigger>
            <TabsTrigger value="fiqr">FIQR ({fiqrTotal})</TabsTrigger>
          </TabsList>

          {/* ACR */}
          <TabsContent value="acr" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">WPI — locais de dor (7 dias)</Label>
              <Badge variant="outline">WPI {wpi}/19 · {regionsWithPain}/5 regiões</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {WPI_REGIONS.map((region) => (
                <div key={region.key} className="rounded-lg border p-3 bg-card">
                  <p className="text-xs font-medium mb-2">{region.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {region.sites.map((site) => (
                      <label key={site.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={!!sites[site.id]}
                          onCheckedChange={() => setSites((s) => ({ ...s, [site.id]: !s[site.id] }))}
                        />
                        <span>{site.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm font-semibold">SSS — gravidade dos sintomas</Label>
              <Badge variant="outline">SSS {sssTotal}/12</Badge>
            </div>
            {SSS_SYMPTOMS.map((s) => (
              <div key={s.key}>
                <Label className="text-xs">{s.label}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-1">
                  {SSS_OPTIONS.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      size="sm"
                      variant={sss[s.key] === o.value ? 'default' : 'outline'}
                      className="justify-start h-auto py-1.5 text-xs"
                      onClick={() => setSss((v) => ({ ...v, [s.key]: o.value }))}
                    >
                      <span className="font-mono mr-2">{o.value}</span>{o.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <Label className="text-xs">Sintomas somáticos (últimos 6 meses)</Label>
              <div className="grid sm:grid-cols-3 gap-2 mt-1">
                {SOMATIC_SYMPTOMS.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 text-xs cursor-pointer rounded border p-2">
                    <Checkbox
                      checked={!!somatic[s.key]}
                      onCheckedChange={() => setSomatic((v) => ({ ...v, [s.key]: !v[s.key] }))}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer rounded border p-2">
                <Checkbox checked={duration3m} onCheckedChange={(v) => setDuration3m(!!v)} />
                Sintomas há ≥ 3 meses
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer rounded border p-2">
                <Checkbox checked={excluded} onCheckedChange={(v) => setExcluded(!!v)} />
                Diagnóstico válido apesar de outras condições
              </label>
            </div>
          </TabsContent>

          {/* FIQR */}
          <TabsContent value="fiqr" className="space-y-4 pt-4">
            {(['function', 'overall', 'symptoms'] as Domain[]).map((d) => (
              <section key={d} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{FIQR_DOMAIN_META[d].label}</Label>
                  <Badge variant="outline">
                    {fiqrDomainTotals[d].toFixed(1)} / {FIQR_DOMAIN_META[d].max}
                  </Badge>
                </div>
                {FIQR_ITEMS.filter((i) => i.domain === d).map((it) => {
                  const v = fiqr[it.id] ?? 0;
                  return (
                    <div key={it.id} className="rounded border p-2">
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="text-xs">{it.label}</span>
                        <span className="font-mono text-xs tabular-nums">
                          {fiqr[it.id] !== undefined ? v : '—'}
                        </span>
                      </div>
                      <Slider
                        min={0} max={10} step={1} value={[v]}
                        onValueChange={(arr) => setFiqr((s) => ({ ...s, [it.id]: arr[0] }))}
                      />
                    </div>
                  );
                })}
              </section>
            ))}
            <p className="text-[11px] text-muted-foreground">
              {fiqrAnswered}/{FIQR_ITEMS.length} itens respondidos. Itens não respondidos contam 0.
            </p>
          </TabsContent>
        </Tabs>

        {/* Combined result */}
        <div className={`rounded-lg p-4 border ${toneClass[combinedSummary.tone]}`}>
          <div className="flex items-center gap-2 mb-3">
            {combinedSummary.tone === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="font-semibold">{combinedSummary.label}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-foreground">
            <div>
              <p className="text-[11px] text-muted-foreground">ACR 2016</p>
              <p className="text-lg font-bold">{meetsAcr ? 'Atende' : 'Não atende'}</p>
              <p className="text-[11px] text-muted-foreground">WPI {wpi} · SSS {sssTotal}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">FIQR</p>
              <p className="text-lg font-bold">{fiqrTotal}<span className="text-xs text-muted-foreground">/100</span></p>
              <p className={`text-[11px] ${fiqrInterp.color}`}>{fiqrInterp.label}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">FS Score</p>
              <p className="text-lg font-bold">{fsScore}<span className="text-xs text-muted-foreground">/31</span></p>
              <p className="text-[11px] text-muted-foreground">WPI + SSS</p>
            </div>
          </div>

          <Button
            variant="outline" size="sm" className="mt-4 w-full gap-2"
            onClick={() => requireAuth(performSave)}
            disabled={isSaving || !visitId}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar avaliação combinada na consulta'}
          </Button>
          {!visitId && (
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Selecione paciente e consulta para habilitar a gravação combinada.
            </p>
          )}
        </div>
      </CardContent>
      <LoginPromptDialog
        open={showLoginDialog} onOpenChange={setShowLoginDialog}
        onLogin={goToLogin} onSignup={goToSignup}
      />
    </Card>
  );
}
