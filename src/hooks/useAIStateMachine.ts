/**
 * useAIStateMachine — Loop de Comportamento das IAs
 *
 * Implementa o ciclo de qualidade definido:
 *
 *   DATA → CORRECT (if !valid) → BUILD → TEST → AUDIT
 *             ↑                                    |
 *             └──────── (if !passed) ──────────────┘
 *                                                  |
 *                                           (if passed)
 *                                                  ↓
 *                                              REPORT → DONE
 *
 * Cada etapa é executada por uma IA especializada.
 * O loop repete BUILD→TEST→AUDIT até que audit.passed = true,
 * com limite de MAX_ITERATIONS para evitar loop infinito.
 */

import { useState, useCallback } from 'react';
import { useCodeAuditor, type AuditReport } from './useCodeAuditor';
import { useCodeBuilder, type BuildResult } from './useCodeBuilder';

const MAX_ITERATIONS = 5;

export type MachineState =
  | 'idle'
  | 'data'       // recebeu input, valida dados
  | 'correct'    // corrige se dados inválidos
  | 'build'      // constrói/corrige código
  | 'test'       // valida se build foi bem-sucedido
  | 'audit'      // IA auditora revisa o resultado
  | 'report'     // gera issue/relatório
  | 'done'       // ciclo completo com sucesso
  | 'error';     // falha irrecuperável

export interface CycleEntry {
  iteration: number;
  state: MachineState;
  passed: boolean;
  auditScore?: number;
  findings?: number;
  buildFilename?: string;
  message: string;
  timestamp: string;
}

export interface StateMachineResult {
  state: MachineState;
  iterations: number;
  log: CycleEntry[];
  lastAudit: AuditReport | null;
  lastBuild: BuildResult | null;
  reportIssueBody: string | null;
}

export function useAIStateMachine() {
  const { audit } = useCodeAuditor();
  const { build } = useCodeBuilder();

  const [state, setState] = useState<MachineState>('idle');
  const [log, setLog] = useState<CycleEntry[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (entry: Omit<CycleEntry, 'timestamp'>) => {
    const full: CycleEntry = { ...entry, timestamp: new Date().toISOString() };
    setLog(prev => [...prev, full]);
    return full;
  };

  /**
   * run — executa o ciclo completo
   * @param code         código-fonte a ser avaliado
   * @param filename     nome do arquivo
   * @param taskDescription  descrição da tarefa de build (se necessário)
   * @param onReport     callback chamado quando issue deve ser criado
   */
  const run = useCallback(async (
    code: string,
    filename: string,
    taskDescription: string,
    onReport?: (body: string) => void
  ): Promise<StateMachineResult> => {
    setRunning(true);
    setLog([]);
    setState('data');

    let currentCode = code;
    let lastAudit: AuditReport | null = null;
    let lastBuild: BuildResult | null = null;
    let iteration = 0;

    // ── ETAPA 1: DATA — valida se há código para processar ──────────────
    const hasData = currentCode.trim().length > 10;
    addLog({ iteration: 0, state: 'data', passed: hasData, message: hasData ? 'Código recebido. Iniciando ciclo.' : 'Código vazio ou inválido — entrando em modo BUILD.', });

    if (!hasData) {
      // ── ETAPA 2a: CORRECT — sem dados, constrói do zero ───────────────
      setState('correct');
      addLog({ iteration: 0, state: 'correct', passed: false, message: 'Dados inválidos. Construindo arquivo do zero.' });
      setState('build');
    }

    // ── LOOP PRINCIPAL: BUILD → TEST → AUDIT ────────────────────────────
    while (iteration < MAX_ITERATIONS) {
      iteration++;

      // BUILD
      setState('build');
      const buildResult = await build(taskDescription, lastAudit?.findings ?? [], currentCode);
      lastBuild = buildResult;
      const buildOk = buildResult.code.trim().length > 10;
      addLog({
        iteration, state: 'build', passed: buildOk,
        buildFilename: buildResult.filename,
        message: buildOk
          ? `Build #${iteration} concluído: ${buildResult.filename}`
          : `Build #${iteration} falhou. Repetindo...`,
      });

      if (!buildOk) continue; // TEST falha implicitamente, volta ao BUILD

      // Atualiza código com o resultado do build
      currentCode = buildResult.code;

      // TEST — valida estrutura básica do código gerado
      setState('test');
      const testOk = [
        currentCode.includes('export'),
        currentCode.length > 50,
        !currentCode.includes('TODO: implement'),
        !currentCode.includes('undefined undefined'),
      ].every(Boolean);

      addLog({
        iteration, state: 'test', passed: testOk,
        message: testOk
          ? `Test #${iteration} passou. Enviando para auditoria.`
          : `Test #${iteration} falhou (código incompleto). Repetindo BUILD.`,
      });

      if (!testOk) continue; // volta ao BUILD

      // AUDIT
      setState('audit');
      const auditResult = await audit(currentCode, buildResult.filename || filename);
      lastAudit = auditResult;
      addLog({
        iteration, state: 'audit', passed: auditResult.passed,
        auditScore: auditResult.score,
        findings: auditResult.findings.length,
        message: auditResult.passed
          ? `Audit #${iteration} aprovado! Score: ${auditResult.score}/100`
          : `Audit #${iteration} reprovado. Score: ${auditResult.score}/100. ${auditResult.findings.length} problema(s). Repetindo.`,
      });

      if (auditResult.passed) break; // sai do loop → vai para REPORT
    }

    // ── ETAPA FINAL: REPORT ──────────────────────────────────────────────
    setState('report');
    const passed = lastAudit?.passed ?? false;
    const reportBody = buildIssueBody(
      filename, iteration, passed, lastAudit, lastBuild, log
    );

    addLog({
      iteration, state: 'report', passed,
      message: passed
        ? `✅ Ciclo completo em ${iteration} iteração(ões). Relatório gerado.`
        : `⚠️ Limite de ${MAX_ITERATIONS} iterações atingido. Relatório de falha gerado.`,
    });

    if (onReport) onReport(reportBody);
    setState(passed ? 'done' : 'error');
    setRunning(false);

    return {
      state: passed ? 'done' : 'error',
      iterations: iteration,
      log,
      lastAudit,
      lastBuild,
      reportIssueBody: reportBody,
    };
  }, [audit, build, log]);

  const reset = useCallback(() => {
    setState('idle');
    setLog([]);
  }, []);

  return { run, reset, state, log, running };
}

// ── Gerador de corpo do GitHub Issue ────────────────────────────────────────
function buildIssueBody(
  filename: string,
  iterations: number,
  passed: boolean,
  auditReport: AuditReport | null,
  buildResult: BuildResult | null,
  cycleLog: CycleEntry[]
): string {
  const status = passed ? '✅ APROVADO' : '❌ FALHOU APÓS LIMITE DE ITERAÇÕES';
  const score = auditReport?.score ?? 0;
  const criticals = auditReport?.findings.filter(f => f.severity === 'critical') ?? [];
  const highs = auditReport?.findings.filter(f => f.severity === 'high') ?? [];

  return [
    `## 🤖 Relatório Automático de IA — ${filename}`,
    ``,
    `**Status:** ${status}`,
    `**Score Final:** ${score}/100`,
    `**Iterações:** ${iterations}`,
    `**Gerado em:** ${new Date().toISOString()}`,
    ``,
    `---`,
    `## 📋 Log do Ciclo`,
    ``,
    `| # | Estado | Passou | Mensagem |`,
    `|---|--------|--------|---------|`,
    ...cycleLog.map(e =>
      `| ${e.iteration} | \`${e.state}\` | ${e.passed ? '✅' : '❌'} | ${e.message} |`
    ),
    ``,
    `---`,
    `## 🔍 Problemas Críticos`,
    ``,
    criticals.length === 0 && highs.length === 0
      ? '_Nenhum problema crítico ou alto encontrado._'
      : [...criticals, ...highs].map(f =>
          `- **[${f.severity.toUpperCase()}]** \`${f.file}\` — ${f.description}\n  > 💡 ${f.suggestion}`
        ).join('\n'),
    ``,
    `---`,
    `## 🔧 Último Build`,
    ``,
    buildResult?.filename ? `**Arquivo:** \`${buildResult.filename}\`` : '_Nenhum build realizado._',
    buildResult?.explanation ? `\n**Explicação:** ${buildResult.explanation}` : '',
    ``,
    `---`,
    `> Este issue foi gerado automaticamente pelo sistema de IA do Rhema Care Flow.`,
    `> Revisores: @JoaoRG-lab`,
    `> Tags: \`ai-report\` \`auto-generated\` \`${passed ? 'passed' : 'needs-review'}\``,
  ].join('\n');
}
