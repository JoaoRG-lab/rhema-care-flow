/**
 * AIControlCenter — Painel de controle com motor de ciclos contínuos.
 * Rota: /admin/ai-control
 *
 * Executa o aiCycleEngine em loop até approved=true, exibindo
 * cada iteração, estágio e score em tempo real.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AICycleEngine, CycleEvent, CycleIteration, CycleStage } from '@/lib/aiCycleEngine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
const STAGE_ORDER: CycleStage[] = ['DATA', 'CORRECT', 'BUILD', 'TEST', 'AUDIT', 'REPORT', 'DONE'];

const STAGE_COLOR: Record<string, string> = {
  IDLE:    'bg-slate-400',
  DATA:    'bg-blue-500',
  CORRECT: 'bg-indigo-500',
  BUILD:   'bg-violet-500',
  TEST:    'bg-amber-500',
  AUDIT:   'bg-orange-500',
  REPORT:  'bg-teal-500',
  DONE:    'bg-emerald-500',
  ABORTED: 'bg-red-500',
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

type LogLine = { iteration: number; message: string; level: 'info' | 'warn' | 'error'; ts: string };

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export function AIControlCenter() {
  const engineRef    = useRef<AICycleEngine>(new AICycleEngine());
  const logEndRef    = useRef<HTMLDivElement>(null);

  const [running,     setRunning]     = useState(false);
  const [approved,    setApproved]    = useState<boolean | null>(null);
  const [currentIter, setCurrentIter] = useState(0);
  const [currentStage, setCurrentStage] = useState<CycleStage>('IDLE');
  const [history,     setHistory]     = useState<CycleIteration[]>([]);
  const [logs,        setLogs]        = useState<LogLine[]>([]);
  const [maxIter,     setMaxIter]     = useState(10);
  const [threshold,   setThreshold]   = useState(80);

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const pushLog = useCallback((line: Omit<LogLine, 'ts'>) => {
    setLogs((prev) => [...prev.slice(-300), { ...line, ts: new Date().toLocaleTimeString() }]);
  }, []);

  const handleStart = useCallback(async () => {
    const engine = new AICycleEngine();
    engineRef.current = engine;

    setRunning(true);
    setApproved(null);
    setHistory([]);
    setLogs([]);
    setCurrentIter(0);
    setCurrentStage('IDLE');

    engine.subscribe((ev: CycleEvent) => {
      switch (ev.type) {
        case 'cycle:start':
          setCurrentIter(ev.iteration);
          setCurrentStage('DATA');
          break;
        case 'stage:change':
          setCurrentStage(ev.stage);
          break;
        case 'audit:result':
          setHistory((h) => {
            const existing = h.findIndex((x) => x.iteration === ev.iteration.iteration);
            if (existing >= 0) {
              const next = [...h];
              next[existing] = ev.iteration;
              return next;
            }
            return [...h, ev.iteration];
          });
          break;
        case 'cycle:approved':
          setCurrentStage('DONE');
          setApproved(true);
          setHistory((h) => {
            const existing = h.findIndex((x) => x.iteration === ev.iteration.iteration);
            if (existing >= 0) {
              const next = [...h];
              next[existing] = ev.iteration;
              return next;
            }
            return [...h, ev.iteration];
          });
          break;
        case 'cycle:aborted':
          setCurrentStage('ABORTED');
          setApproved(false);
          break;
        case 'cycle:log':
          pushLog({ iteration: ev.iteration, message: ev.message, level: ev.level });
          break;
      }
    });

    const result = await engine.run({ maxIterations: maxIter, approvalThreshold: threshold });
    setRunning(false);
    setApproved(result);
    if (!result && !engine.isRunning()) setCurrentStage('ABORTED');
  }, [maxIter, threshold, pushLog]);

  const handleAbort = useCallback(() => {
    engineRef.current.abort();
  }, []);

  // Cálculo de progresso para barra visual
  const latestScore = history.length ? history[history.length - 1].score : 0;
  const stageIndex  = STAGE_ORDER.indexOf(currentStage);
  const stageProgress = stageIndex < 0 ? 0 : Math.round((stageIndex / (STAGE_ORDER.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Rhema AI" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
            <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="10" r="2" fill="white" />
          </svg>
          <div>
            <h1 className="text-lg font-semibold leading-none">Rhema AI Cycle Engine</h1>
            <p className="text-xs text-muted-foreground">Loop contínuo até approved = true</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <Badge variant="outline" className="animate-pulse text-amber-600 border-amber-400">
              ● Iteração {currentIter}
            </Badge>
          )}
          {approved === true && (
            <Badge className="bg-emerald-500 text-white">✅ Aprovado</Badge>
          )}
          {approved === false && (
            <Badge variant="destructive">⛔ Abortado</Badge>
          )}
          <Button onClick={handleStart} disabled={running} size="sm">
            {running ? 'Rodando…' : 'Iniciar Ciclos'}
          </Button>
          {running && (
            <Button variant="destructive" size="sm" onClick={handleAbort}>
              Abort
            </Button>
          )}
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Config row */}
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Máx. iterações</span>
            <input
              type="number" min={1} max={50} value={maxIter}
              onChange={(e) => setMaxIter(Number(e.target.value))}
              disabled={running}
              className="w-24 rounded border bg-background px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Score mínimo (%)</span>
            <input
              type="number" min={1} max={100} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={running}
              className="w-24 rounded border bg-background px-2 py-1 text-sm"
            />
          </label>
        </div>

        {/* Stage pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline de estágios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {STAGE_ORDER.map((stage) => (
                <div
                  key={stage}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-mono font-semibold text-white transition-all duration-300',
                    currentStage === stage
                      ? (STAGE_COLOR[stage] ?? 'bg-slate-500') + ' ring-2 ring-offset-1 ring-primary scale-110'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {stage}
                </div>
              ))}
            </div>
            <Progress value={stageProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Iteração atual</p>
            <p className="text-2xl font-semibold tabular-nums">{currentIter}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Score recente</p>
            <p className={`text-2xl font-semibold tabular-nums ${scoreColor(latestScore)}`}>{latestScore}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Estágio</p>
            <p className="text-2xl font-semibold font-mono">{currentStage}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">
              {running ? '⏳ Loop ativo' : approved === true ? '✅ Done' : approved === false ? '⛔ Abort' : '⬜ Idle'}
            </p>
          </CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Histórico de iterações */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Histórico de iterações</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma iteração concluída ainda.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {[...history].reverse().map((it) => (
                    <li key={it.iteration} className="border rounded-md p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Iteração {it.iteration}</span>
                        {it.approved
                          ? <Badge className="bg-emerald-500 text-white text-[10px]">APROVADO</Badge>
                          : <Badge variant="secondary" className="text-[10px]">RETRY</Badge>}
                      </div>
                      <div className={`font-mono font-bold ${scoreColor(it.score)}`}>Score: {it.score}</div>
                      {it.findings.length > 0 && (
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {it.findings.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Terminal de log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Log em tempo real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 dark:bg-black rounded-md p-3 h-64 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <span className="text-slate-500">Aguardando início…</span>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className={[
                      'leading-5',
                      l.level === 'error' ? 'text-red-400' :
                      l.level === 'warn'  ? 'text-amber-400' :
                      'text-slate-300',
                    ].join(' ')}>
                      <span className="text-slate-600 select-none">{l.ts} </span>
                      {l.message}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AIControlCenter;
