import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// ACR 2016 Fibromyalgia Diagnostic Criteria (revisão de 2010/2011)
// Diagnóstico se: WPI ≥ 7 e SSS ≥ 5  OU  WPI 4–6 e SSS ≥ 9
// + sintomas presentes por ≥ 3 meses
// + dor em ≥ 4 das 5 regiões (dor generalizada)
// + diagnóstico não exclui outras doenças clinicamente relevantes

const WPI_REGIONS: { key: string; label: string; sites: { id: string; label: string }[] }[] = [
  {
    key: 'left_upper',
    label: 'Região superior esquerda',
    sites: [
      { id: 'l_jaw', label: 'Mandíbula esquerda' },
      { id: 'l_shoulder', label: 'Cintura escapular esquerda' },
      { id: 'l_upper_arm', label: 'Braço esquerdo' },
      { id: 'l_lower_arm', label: 'Antebraço esquerdo' },
    ],
  },
  {
    key: 'right_upper',
    label: 'Região superior direita',
    sites: [
      { id: 'r_jaw', label: 'Mandíbula direita' },
      { id: 'r_shoulder', label: 'Cintura escapular direita' },
      { id: 'r_upper_arm', label: 'Braço direito' },
      { id: 'r_lower_arm', label: 'Antebraço direito' },
    ],
  },
  {
    key: 'left_lower',
    label: 'Região inferior esquerda',
    sites: [
      { id: 'l_hip', label: 'Quadril/glúteo esquerdo' },
      { id: 'l_upper_leg', label: 'Coxa esquerda' },
      { id: 'l_lower_leg', label: 'Perna esquerda' },
    ],
  },
  {
    key: 'right_lower',
    label: 'Região inferior direita',
    sites: [
      { id: 'r_hip', label: 'Quadril/glúteo direito' },
      { id: 'r_upper_leg', label: 'Coxa direita' },
      { id: 'r_lower_leg', label: 'Perna direita' },
    ],
  },
  {
    key: 'axial',
    label: 'Região axial',
    sites: [
      { id: 'neck', label: 'Pescoço' },
      { id: 'upper_back', label: 'Dorso superior' },
      { id: 'lower_back', label: 'Dorso inferior (lombar)' },
      { id: 'chest', label: 'Tórax' },
      { id: 'abdomen', label: 'Abdome' },
    ],
  },
];

const SSS_SYMPTOMS = [
  { key: 'fatigue', label: 'Fadiga' },
  { key: 'sleep', label: 'Sono não reparador' },
  { key: 'cognitive', label: 'Sintomas cognitivos' },
];

const SSS_OPTIONS = [
  { value: 0, label: 'Sem problema' },
  { value: 1, label: 'Leve / intermitente' },
  { value: 2, label: 'Moderado / frequente' },
  { value: 3, label: 'Grave / contínuo' },
];

const SOMATIC_SYMPTOMS = [
  { key: 'headache', label: 'Cefaleia' },
  { key: 'abdominal_pain', label: 'Dor/cólicas abdominais' },
  { key: 'depression', label: 'Depressão' },
];

export function FibromyalgiaCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();

  const [sites, setSites] = useState<Record<string, boolean>>({});
  const [sss, setSss] = useState<Record<string, number>>({});
  const [somatic, setSomatic] = useState<Record<string, boolean>>({});
  const [duration3m, setDuration3m] = useState<boolean>(false);
  const [excluded, setExcluded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSite = (id: string) => setSites((s) => ({ ...s, [id]: !s[id] }));
  const toggleSomatic = (k: string) => setSomatic((s) => ({ ...s, [k]: !s[k] }));

  const wpi = useMemo(
    () => WPI_REGIONS.reduce((acc, r) => acc + r.sites.filter((s) => sites[s.id]).length, 0),
    [sites]
  );

  const regionsWithPain = useMemo(
    () => WPI_REGIONS.filter((r) => r.sites.some((s) => sites[s.id])).length,
    [sites]
  );

  const sssCore = useMemo(
    () => SSS_SYMPTOMS.reduce((acc, s) => acc + (sss[s.key] ?? 0), 0),
    [sss]
  );

  const somaticCount = useMemo(
    () => SOMATIC_SYMPTOMS.filter((s) => somatic[s.key]).length,
    [somatic]
  );

  const sssTotal = sssCore + somaticCount; // 0–12

  const generalizedPain = regionsWithPain >= 4;
  const criteriaScore = (wpi >= 7 && sssTotal >= 5) || (wpi >= 4 && wpi <= 6 && sssTotal >= 9);
  const meetsDiagnosis = criteriaScore && generalizedPain && duration3m && excluded;

  const fsScore = wpi + sssTotal; // Fibromyalgia Severity Scale (0–31)

  const performSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'ACR-FM-2016',
        data_json: { sites, sss, somatic, duration3m, excluded, wpi, sssTotal, regionsWithPain } as any,
        calculated_score: fsScore,
      });
      if (error) throw error;
      toast.success('Critérios FM salvos');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critérios ACR 2016 — Fibromialgia</CardTitle>
        <CardDescription>
          Diagnóstico clínico baseado em Widespread Pain Index (WPI) + Symptom Severity Scale (SSS)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Diagnóstico de fibromialgia se: <strong>WPI ≥ 7 e SSS ≥ 5</strong> OU{' '}
            <strong>WPI 4–6 e SSS ≥ 9</strong>; dor generalizada (≥ 4 de 5 regiões); sintomas por
            ≥ 3 meses; e diagnóstico não exclui outras condições clinicamente relevantes.
          </AlertDescription>
        </Alert>

        {/* WPI */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">1. Widespread Pain Index (WPI) — 0 a 19</Label>
            <Badge variant="outline">WPI: {wpi}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Marque os locais com dor nas <strong>últimas 7 dias</strong>.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            {WPI_REGIONS.map((region) => (
              <div key={region.key} className="rounded-lg border p-3 bg-card">
                <p className="text-sm font-medium mb-2">{region.label}</p>
                <div className="space-y-1.5">
                  {region.sites.map((site) => (
                    <label
                      key={site.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={!!sites[site.id]}
                        onCheckedChange={() => toggleSite(site.id)}
                      />
                      <span>{site.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Regiões com dor: {regionsWithPain}/5</span>
            {generalizedPain ? (
              <Badge variant="outline" className="text-success border-success/40">
                Dor generalizada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Não generalizada
              </Badge>
            )}
          </div>
        </section>

        {/* SSS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">2. Symptom Severity Scale (SSS) — 0 a 12</Label>
            <Badge variant="outline">SSS: {sssTotal}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Gravidade nos últimos 7 dias (0–3 cada).
          </p>

          {SSS_SYMPTOMS.map((s) => (
            <div key={s.key}>
              <Label className="text-sm">{s.label}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-1.5">
                {SSS_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    variant={sss[s.key] === o.value ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start h-auto py-2 text-left whitespace-normal"
                    onClick={() => setSss((v) => ({ ...v, [s.key]: o.value }))}
                  >
                    <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                    <span className="font-normal">{o.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <Label className="text-sm">Sintomas somáticos adicionais (últimos 6 meses)</Label>
            <div className="grid sm:grid-cols-3 gap-2 mt-1.5">
              {SOMATIC_SYMPTOMS.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2"
                >
                  <Checkbox
                    checked={!!somatic[s.key]}
                    onCheckedChange={() => toggleSomatic(s.key)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cada sintoma presente adiciona 1 ponto ao SSS (máx +3).
            </p>
          </div>
        </section>

        {/* Conditions */}
        <section className="space-y-2">
          <Label className="text-base font-semibold">3. Critérios adicionais</Label>
          <label className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2">
            <Checkbox checked={duration3m} onCheckedChange={(v) => setDuration3m(!!v)} />
            <span>Sintomas presentes em nível semelhante há ≥ 3 meses</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2">
            <Checkbox checked={excluded} onCheckedChange={(v) => setExcluded(!!v)} />
            <span>
              Diagnóstico de fibromialgia é válido independentemente de outras doenças
              (não as exclui)
            </span>
          </label>
        </section>

        {/* Result */}
        <div
          className={`rounded-lg p-4 border ${
            meetsDiagnosis
              ? 'bg-warning/10 border-warning/30'
              : 'bg-muted/50 border-border'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {meetsDiagnosis ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-semibold">
              {meetsDiagnosis
                ? 'Critérios ACR 2016 para fibromialgia ATENDIDOS'
                : 'Critérios não atendidos'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">WPI</p>
              <p className="text-xl font-bold">{wpi}<span className="text-xs text-muted-foreground">/19</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SSS</p>
              <p className="text-xl font-bold">{sssTotal}<span className="text-xs text-muted-foreground">/12</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">FS Score</p>
              <p className="text-xl font-bold">{fsScore}<span className="text-xs text-muted-foreground">/31</span></p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            FS (Fibromyalgia Severity Scale) = WPI + SSS. Útil para acompanhamento longitudinal,
            mesmo em pacientes que não preencham critérios diagnósticos completos.
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2"
            onClick={() => requireAuth(performSave)}
            disabled={isSaving}
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
