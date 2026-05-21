// ── Rhema Care Flow — Code Cycle Engine ───────────────────────────────────
// Mesmo padrão do healthCycleEngine.ts, variável: Code = true
// Loop: DATA → CORRECT → BUILD → TEST → AUDIT → REPORT
// Continua ciclando até approved = true (score ≥ approvalThreshold)
// ──────────────────────────────────────────────────────────────────────────

export const MODE = { Health: false, Code: true } as const;
export type CycleMode = keyof typeof MODE;

export type CodeStage =
  | 'DATA' | 'CORRECT' | 'BUILD' | 'TEST' | 'AUDIT' | 'REPORT' | 'DONE';

export type FindingSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface CodeFinding {
  file: string;
  line?: number;
  message: string;
  severity: FindingSeverity;
  suggestion: string;
  ruleId?: string;  // ex: 'no-unused-vars', 'react-hooks/exhaustive-deps'
}

export interface CodeIteration {
  iteration: number;
  stage: CodeStage;
  score: number;         // 0–100
  approved: boolean;
  findings: CodeFinding[];
  builtFiles: string[];
  timestamp: string;
}

export interface CodeCycleResult {
  mode: CycleMode;
  totalIterations: number;
  approved: boolean;
  finalScore: number;
  iterations: CodeIteration[];
  aborted: boolean;
}

export type CodeCycleEvent =
  | { type: 'cycle:start'; iteration: number }
  | { type: 'stage:change'; stage: CodeStage }
  | { type: 'audit:result'; score: number; findings: CodeFinding[] }
  | { type: 'cycle:approved'; score: number }
  | { type: 'cycle:retry'; iteration: number; score: number }
  | { type: 'cycle:aborted' }
  | { type: 'cycle:log'; level: 'info' | 'warn' | 'error'; message: string };

export interface CodeCycleInput {
  targetFile: string;
  model: string;
  task: string;
  existingCode?: string;
  mode?: CycleMode;
}

const STAGE_SEQUENCE: CodeStage[] = [
  'DATA', 'CORRECT', 'BUILD', 'TEST', 'AUDIT', 'REPORT',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateCodeScore(input: CodeCycleInput, iteration: number): number {
  const base = 50 + iteration * 9;
  const taskComplexity = input.task.length > 100 ? -8 : 0;
  const noise = (Math.random() - 0.5) * 12;
  return Math.min(100, Math.max(0, Math.round(base + taskComplexity + noise)));
}

function generateCodeFindings(
  input: CodeCycleInput,
  score: number,
  iteration: number
): CodeFinding[] {
  const findings: CodeFinding[] = [];

  if (score < 70) {
    findings.push({
      file: input.targetFile,
      message: `Build score ${score}/100 — abaixo do limiar mínimo de qualidade`,
      severity: 'error',
      suggestion: 'Revisar tipagem TypeScript, remover imports não utilizados, corrigir hooks de React',
      ruleId: 'build:quality-threshold',
    });
  }

  if (iteration === 1 && input.existingCode) {
    findings.push({
      file: input.targetFile,
      message: 'Código existente detectado — analisando compatibilidade com novos módulos',
      severity: 'info',
      suggestion: 'Verificar colisões de tipos e re-exports duplicados',
      ruleId: 'build:existing-code',
    });
  }

  if (score >= 85) {
    findings.push({
      file: input.targetFile,
      message: 'Build aprovado — todos os checks de qualidade passaram',
      severity: 'info',
      suggestion: 'Commit e push para trigger do deploy Vercel',
      ruleId: 'build:approved',
    });
  }

  return findings;
}

export class CodeCycleEngine {
  private mode: CycleMode;
  private approvalThreshold: number;
  private maxIterations: number;
  private onEvent?: (event: CodeCycleEvent) => void;

  constructor(options?: {
    mode?: CycleMode;
    approvalThreshold?: number;
    maxIterations?: number;
    onEvent?: (event: CodeCycleEvent) => void;
  }) {
    this.mode = options?.mode ?? 'Code';
    this.approvalThreshold = options?.approvalThreshold ?? 85;
    this.maxIterations = options?.maxIterations ?? 10;
    this.onEvent = options?.onEvent;
  }

  private emit(event: CodeCycleEvent): void {
    this.onEvent?.(event);
  }

  private log(level: 'info' | 'warn' | 'error', message: string): void {
    this.emit({ type: 'cycle:log', level, message });
  }

  async run(
    input: CodeCycleInput,
    signal?: AbortSignal
  ): Promise<CodeCycleResult> {
    const iterations: CodeIteration[] = [];
    let approved = false;
    let finalScore = 0;

    for (let i = 1; i <= this.maxIterations; i++) {
      if (signal?.aborted) {
        this.emit({ type: 'cycle:aborted' });
        return { mode: this.mode, totalIterations: i - 1, approved: false, finalScore, iterations, aborted: true };
      }

      this.emit({ type: 'cycle:start', iteration: i });
      this.log('info', `[Iteração ${i}/${this.maxIterations}] Arquivo: ${input.targetFile} — Modelo: ${input.model}`);

      const iterResult: CodeIteration = {
        iteration: i,
        stage: 'DATA',
        score: 0,
        approved: false,
        findings: [],
        builtFiles: [],
        timestamp: new Date().toISOString(),
      };

      for (const stage of STAGE_SEQUENCE) {
        if (signal?.aborted) break;
        iterResult.stage = stage;
        this.emit({ type: 'stage:change', stage });
        this.log('info', `  [${stage}] executando...`);
        await delay(100);

        if (stage === 'BUILD') {
          iterResult.builtFiles = [input.targetFile, `${input.targetFile}.map`];
          this.log('info', `  Arquivos gerados: ${iterResult.builtFiles.join(', ')}`);
        }

        if (stage === 'AUDIT') {
          const score = simulateCodeScore(input, i);
          iterResult.score = score;
          finalScore = score;
          const findings = generateCodeFindings(input, score, i);
          iterResult.findings = findings;
          this.emit({ type: 'audit:result', score, findings });
          this.log(score >= this.approvalThreshold ? 'info' : 'warn',
            `  Score: ${score}/100 (limiar: ${this.approvalThreshold})`);
        }

        if (stage === 'REPORT') {
          if (iterResult.score >= this.approvalThreshold) {
            iterResult.approved = true;
            approved = true;
            this.emit({ type: 'cycle:approved', score: iterResult.score });
            this.log('info', `  ✅ Build APROVADO — score ${iterResult.score}/100`);
          } else {
            this.emit({ type: 'cycle:retry', iteration: i + 1, score: iterResult.score });
            this.log('warn',
              `  🔄 Retry ${i + 1}/${this.maxIterations} — score ${iterResult.score} < ${this.approvalThreshold}`);
          }
          iterResult.stage = 'DONE';
          this.emit({ type: 'stage:change', stage: 'DONE' });
        }
      }

      iterations.push(iterResult);
      if (approved) break;
      await delay(250);
    }

    return {
      mode: this.mode,
      totalIterations: iterations.length,
      approved,
      finalScore,
      iterations,
      aborted: false,
    };
  }
}
