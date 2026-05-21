/**
 * aiCycleEngine
 * Motor de ciclos contínuos para o orquestrador de agentes IA.
 *
 * Fluxo por ciclo:
 *   DATA → CORRECT → BUILD → TEST → AUDIT → REPORT
 *                                        ↓
 *                              approved? → DONE  (return true)
 *                                        → next iteration  (loop)
 *
 * O motor continua ciclando até que o Auditor retorne approved=true,
 * ou até atingir o limite máximo de iterações (safety cap).
 *
 * Emite eventos tipados para que a UI reaja em tempo real.
 */

export type CycleStage =
  | 'IDLE'
  | 'DATA'
  | 'CORRECT'
  | 'BUILD'
  | 'TEST'
  | 'AUDIT'
  | 'REPORT'
  | 'DONE'
  | 'ABORTED';

export interface CycleIteration {
  iteration: number;
  stage: CycleStage;
  score: number;           // 0-100 — score do auditor nesta iteração
  approved: boolean;
  findings: string[];
  startedAt: number;       // epoch ms
  endedAt?: number;
}

export interface CycleEngineOptions {
  /** Payload inicial (ex: nome do arquivo, descrição da tarefa). */
  payload?: Record<string, unknown>;
  /** Número máximo de iterações antes de abortar (default 10). */
  maxIterations?: number;
  /** Tempo mínimo de espera entre iterações em ms (default 400). */
  iterationDelayMs?: number;
  /** Score mínimo para approved=true (default 80). */
  approvalThreshold?: number;
  /**
   * Função que simula / chama o backend de auditoria.
   * Recebe a iteração atual e retorna { score, findings }.
   * Se não fornecida, usa o simulador interno (útil em dev/demo).
   */
  auditorFn?: (iteration: number, payload: Record<string, unknown>) => Promise<{ score: number; findings: string[] }>;
}

export type CycleEvent =
  | { type: 'cycle:start';    iteration: number }
  | { type: 'stage:change';   iteration: number; stage: CycleStage }
  | { type: 'audit:result';   iteration: CycleIteration }
  | { type: 'cycle:approved'; iteration: CycleIteration }
  | { type: 'cycle:retry';    iteration: number; score: number; reason: string }
  | { type: 'cycle:aborted';  reason: string; totalIterations: number }
  | { type: 'cycle:log';      iteration: number; message: string; level: 'info' | 'warn' | 'error' };

export type CycleEventListener = (event: CycleEvent) => void;

// ---------------------------------------------------------------------------
// Simulador padrão (usado quando auditorFn não é fornecida)
// Melhora progressivamente o score a cada iteração, simulando convergência.
// ---------------------------------------------------------------------------
async function defaultAuditorFn(
  iteration: number,
  _payload: Record<string, unknown>,
): Promise<{ score: number; findings: string[] }> {
  await delay(150 + Math.random() * 200);
  // Score base que cresce a cada iteração: 40 + 12*i + ruído
  const base = Math.min(40 + iteration * 12 + Math.round((Math.random() - 0.3) * 10), 100);
  const findings: string[] = [];
  if (base < 60)  findings.push('Cobertura de testes insuficiente');
  if (base < 75)  findings.push('Tipos implícitos detectados — adicionar anotações TS');
  if (base < 85)  findings.push('Handlers de erro ausentes em fetch');
  if (base < 95)  findings.push('Comentários JSDoc incompletos');
  return { score: base, findings };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export class AICycleEngine {
  private listeners = new Set<CycleEventListener>();
  private running = false;
  private aborted = false;
  private history: CycleIteration[] = [];

  private emit(event: CycleEvent) {
    this.listeners.forEach((l) => { try { l(event); } catch { /* noop */ } });
  }

  private log(iteration: number, message: string, level: CycleEvent & { type: 'cycle:log' } extends { level: infer L } ? L : never = 'info') {
    this.emit({ type: 'cycle:log', iteration, message, level });
  }

  subscribe(fn: CycleEventListener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  getHistory(): CycleIteration[] {
    return this.history.slice();
  }

  isRunning(): boolean {
    return this.running;
  }

  abort() {
    this.aborted = true;
  }

  /**
   * Inicia o loop de ciclos.
   * Retorna true se aprovado dentro do limite, false se abortado/estourado.
   */
  async run(opts: CycleEngineOptions = {}): Promise<boolean> {
    if (this.running) throw new Error('AICycleEngine: já em execução');

    const maxIterations    = opts.maxIterations    ?? 10;
    const iterationDelayMs = opts.iterationDelayMs ?? 400;
    const approvalThreshold = opts.approvalThreshold ?? 80;
    const auditorFn        = opts.auditorFn        ?? defaultAuditorFn;
    const payload          = opts.payload          ?? {};

    this.running = true;
    this.aborted = false;
    this.history = [];

    const stages: CycleStage[] = ['DATA', 'CORRECT', 'BUILD', 'TEST', 'AUDIT', 'REPORT'];
    let approved = false;

    for (let i = 1; i <= maxIterations; i++) {
      if (this.aborted) {
        this.emit({ type: 'cycle:aborted', reason: 'abort() chamado', totalIterations: i - 1 });
        this.running = false;
        return false;
      }

      this.emit({ type: 'cycle:start', iteration: i });
      this.log(i, `▶ Iteração ${i} iniciada`);

      const iter: CycleIteration = {
        iteration: i,
        stage: 'DATA',
        score: 0,
        approved: false,
        findings: [],
        startedAt: Date.now(),
      };

      // Percorre cada estágio do pipeline
      for (const stage of stages) {
        if (this.aborted) break;
        iter.stage = stage;
        this.emit({ type: 'stage:change', iteration: i, stage });
        this.log(i, `  → ${stage}`);

        // Simula trabalho do agente em cada etapa
        await delay(iterationDelayMs / stages.length + Math.random() * 60);

        if (stage === 'AUDIT') {
          this.log(i, '  🔍 Auditor avaliando...');
          const result = await auditorFn(i, payload);
          iter.score    = result.score;
          iter.findings = result.findings;
          this.emit({ type: 'audit:result', iteration: iter });
          this.log(
            i,
            `  📊 Score: ${result.score} | Aprovação: ${result.score >= approvalThreshold ? 'SIM ✅' : 'NÃO ❌'}`,
            result.score >= approvalThreshold ? 'info' : 'warn',
          );
        }
      }

      iter.endedAt = Date.now();

      if (this.aborted) {
        this.emit({ type: 'cycle:aborted', reason: 'abort() chamado durante estágio', totalIterations: i });
        this.running = false;
        return false;
      }

      // Verifica aprovação
      iter.approved = iter.score >= approvalThreshold;
      this.history.push(iter);
      iter.stage = iter.approved ? 'DONE' : 'DATA'; // reseta para próxima iteração

      if (iter.approved) {
        this.emit({ type: 'cycle:approved', iteration: iter });
        this.log(i, `✅ APROVADO na iteração ${i} com score ${iter.score}`);
        approved = true;
        break;
      } else {
        const reason = iter.findings[0] ?? 'Score abaixo do limiar';
        this.emit({ type: 'cycle:retry', iteration: i, score: iter.score, reason });
        this.log(i, `🔄 Retry → ${reason}`, 'warn');
        await delay(iterationDelayMs);
      }
    }

    if (!approved && !this.aborted) {
      this.emit({
        type: 'cycle:aborted',
        reason: `Limite de ${maxIterations} iterações atingido sem aprovação`,
        totalIterations: maxIterations,
      });
      this.log(0, `⛔ Limite de iterações atingido (${maxIterations})`, 'error');
    }

    this.running = false;
    return approved;
  }
}

/** Instância singleton para uso simples — importar e chamar .run() */
export const aiCycleEngine = new AICycleEngine();
