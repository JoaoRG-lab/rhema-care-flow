import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search, ShieldCheck, AlertCircle, Calendar, FlaskConical,
  Image, ArrowRight, Stethoscope, FileText, Loader2, Lock, Eye, RotateCcw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSharedRecord, type EvolucaoShared } from '@/hooks/useSharedRecord';
import { cn } from '@/lib/utils';

export function SharedRecordViewer({ codigoInicial = '' }: { codigoInicial?: string }) {
  const { loading, result, error, buscarPorCodigo, limpar } = useSharedRecord();
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nome, setNome] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [etapa, setEtapa] = useState<'busca' | 'resultado'>('busca');

  useEffect(() => {
    if (codigoInicial.trim().length >= 4) {
      buscarPorCodigo(codigoInicial).then(r => { if (r) setEtapa('resultado'); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = async () => {
    const r = await buscarPorCodigo(codigo, {
      name: nome || undefined,
      crm: crm || undefined,
      specialty: especialidade || undefined,
    });
    if (r) setEtapa('resultado');
  };

  const handleNovaBusca = () => {
    limpar();
    setCodigo('');
    setEtapa('busca');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header institucional */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Prontuário Integrado — Acesso por Código
        </div>
        <h1 className="text-2xl font-bold">Consultar Histórico do Paciente</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Acesse as evoluções clínicas de um paciente usando seu <strong>código único</strong> — 
          fornecido pelo paciente ou por outro profissional responsável. 
          Dados de identificação permanecem protegidos.
        </p>
      </div>

      {/* Aviso de privacidade */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Nenhum dado de identificação pessoal (nome, CPF, endereço) é armazenado no prontuário digital. 
          O código do paciente é o único vínculo. Todos os acessos são registrados para auditoria.
        </span>
      </div>

      {etapa === 'busca' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar por Código do Paciente
            </CardTitle>
            <CardDescription>
              O código do paciente é gerado automaticamente pelo sistema (ex: RHM-2024-001)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Código obrigatório */}
            <div className="space-y-1.5">
              <Label htmlFor="cod-paciente">
                Código do Paciente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cod-paciente"
                placeholder="Ex: RHM-2024-001"
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                className="font-mono text-base tracking-widest"
                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              />
            </div>

            <Separator />

            {/* Dados do profissional (opcional mas registrado no log) */}
            <div>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Seus dados abaixo são registrados no log de acesso (auditoria) — opcional
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Seu nome</Label>
                  <Input
                    placeholder="Dr. João Silva"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CRM</Label>
                  <Input
                    placeholder="CRM/SP 123456"
                    value={crm}
                    onChange={e => setCrm(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Especialidade</Label>
                  <Input
                    placeholder="Reumatologia"
                    value={especialidade}
                    onChange={e => setEspecialidade(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleBuscar} disabled={loading || !codigo.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Buscando prontuário…' : 'Consultar Prontuário'}
            </Button>
          </CardContent>
        </Card>
      )}

      {etapa === 'resultado' && result && (
        <div className="space-y-4">
          {/* Cabeçalho do resultado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold tracking-widest">{result.patient_code}</p>
                <p className="text-xs text-muted-foreground">
                  {result.total} evolução{result.total !== 1 ? 'ões' : ''} encontrada{result.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleNovaBusca} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Nova busca
            </Button>
          </div>

          {result.total === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 gap-2 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma evolução registrada para este paciente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {result.evolucoes.map((ev, idx) => (
                <EvolucaoCard key={ev.id ?? idx} evolucao={ev} index={idx} total={result.total} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvolucaoCard({ evolucao, index, total }: { evolucao: EvolucaoShared; index: number; total: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const dataFormatada = evolucao.visit_date
    ? format(parseISO(evolucao.visit_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Data não informada';

  const temConteudo = (
    (evolucao.actions?.length ?? 0) > 0 ||
    (evolucao.labs_ordered?.length ?? 0) > 0 ||
    (evolucao.imaging?.length ?? 0) > 0 ||
    evolucao.next_steps ||
    evolucao.disease_activity
  );

  return (
    <Card className={cn(
      'transition-all',
      index === 0 && 'ring-2 ring-primary/20'
    )}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
              index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {total - index}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{dataFormatada}</span>
                {index === 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    Mais recente
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {evolucao.medico_iniciais} · {evolucao.specialty_do_medico}
                </span>
              </div>
            </div>
          </div>
          <ArrowRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <Separator />

          {!temConteudo && (
            <p className="text-sm text-muted-foreground text-center py-2">Evolução sem detalhes registrados</p>
          )}

          {/* Conduta / Ações */}
          {(evolucao.actions?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3" /> Conduta
              </h4>
              <ul className="space-y-1">
                {evolucao.actions!.map((a, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exames solicitados */}
          {(evolucao.labs_ordered?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FlaskConical className="h-3 w-3" /> Exames Solicitados
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {evolucao.labs_ordered!.map((lab, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{lab}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Imagem */}
          {(evolucao.imaging?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Image className="h-3 w-3" /> Imagem / Procedimentos
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {evolucao.imaging!.map((img, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{img}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Próximos passos */}
          {evolucao.next_steps && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Próximos Passos
              </h4>
              <p className="text-sm whitespace-pre-line">{evolucao.next_steps}</p>
            </div>
          )}

          {/* Atividade de doença */}
          {evolucao.disease_activity && Object.keys(evolucao.disease_activity).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Atividade de Doença
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(evolucao.disease_activity).map(([key, val]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">{key}</p>
                    <p className="text-sm font-semibold">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
