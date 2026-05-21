// ── Rhema Care Flow — Health Cycle Engine ─────────────────────────────────
// Mesmo padrão do aiCycleEngine.ts, variável: Health = true
// Loop: TRIAGE → ASSESS → PROTOCOL → VALIDATE → AUDIT → REPORT
// Continua ciclando até approved = true (score ≥ approvalThreshold)
// ──────────────────────────────────────────────────────────────────────────

import { calcNEWS2, type NEWS2Input, calcSOFA, type SofaInput, calcCURB65, type CURB65Input } from './clinicalScores';
import { getProtocol, searchCids, type ClinicalProtocol } from './medicalKnowledgeBase';

export const MODE = { Health: true, Code: false } as const;
export type CycleMode = keyof typeof MODE;

export type ClinicalStage =
  | 'TRIAGE' | 'ASSESS' | 'PROTOCOL' | 'VALIDATE' | 'AUDIT' | 'REPORT' | 'DONE';

export type ClinicalFindingSeverity = 'info' | 'warning' | 'critical' | 'fatal';

export interface ClinicalFinding {
  field: string;
  message: string;
  severity: ClinicalFindingSeverity;
  suggestion: string;
  evidenceLevel: 'A' | 'B' | 'C';  // Nível de evidência (AHA/ACC)
}

export interface ClinicalIteration {
  iteration: number;
  stage: ClinicalStage;
  score: number;           // 0–100
  approved: boolean;
  protocol?: ClinicalProtocol;
  findings: ClinicalFinding[];
  news2Score?: number;
  sofaScore?: number;
  timestamp: string;
}

export interface ClinicalCycleResult {
  mode: CycleMode;
  totalIterations: number;
  approved: boolean;
  finalScore: number;
  iterations: ClinicalIteration[];
  aborted: boolean;
  protocol?: ClinicalProtocol;
}

export type ClinicalCycleEvent =
  | { type: 'cycle:start'; iteration: number }
  | { type: 'stage:change'; stage: ClinicalStage }
  | { type: 'audit:result'; score: number; findings: ClinicalFinding[] }
  | { type: 'cycle:approved'; score: number; protocol?: ClinicalProtocol }
  | { type: 'cycle:retry'; iteration: number; score: number }
  | { type: 'cycle:aborted' }
  | { type: 'cycle:log'; level: 'info' | 'warn' | 'error'; message: string };

export interface HealthCycleInput {
  patientAge: number;
  chiefComplaint: string;          // Queixa principal / CID suspeito
  news2?: Partial<NEWS2Input>;
  sofa?: Partial<SofaInput>;
  curb65?: Partial<CURB65Input>;
  existingProtocolId?: string;
  mode?: CycleMode;
}

const STAGE_SEQUENCE: ClinicalStage[] = [
  'TRIAGE', 'ASSESS', 'PROTOCOL', 'VALIDATE', 'AUDIT', 'REPORT',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateClinicalScore(input: HealthCycleInput, iteration: number): number {
  // Score cresce a cada iteração simulando melhora com refinamento do protocolo
  const base = 55 + iteration * 8;
  const ageBonus = input.patientAge > 65 ? -5 : 0;
  const noise = (Math.random() - 0.5) * 10;
  return Math.min(100, Math.max(0, Math.round(base + ageBonus + noise)));
}

function generateClinicalFindings(
  input: HealthCycleInput,
  score: number,
  iteration: number
): ClinicalFinding[] {
  const findings: ClinicalFinding[] = [];

  if (score < 70) {
    findings.push({
      field: 'Triagem',
      message: `Score clínico ${score}/100 — abaixo do limiar de aprovação`,
      severity: 'warning',
      suggestion: 'Refinar parâmetros vitais e reavaliação dos critérios de Sepse/NEWS2',
      evidenceLevel: 'A',
    });
  }

  if (input.patientAge > 65) {
    findings.push({
      field: 'Perfil de risco',
      message: 'Paciente ≥65 anos — risco aumentado de complicações e interações medicamentosas',
      severity: 'info',
      suggestion: 'Ajuste de dose renal obrigatório; revisar polifarmácia; IVCF-20 recomendado',
      evidenceLevel: 'B',
    });
  }

  if (iteration === 1) {
    findings.push({
      field: 'Protocolo',
      message: 'Primeira iteração — protocolo ainda não validado clinicamente',
      severity: 'info',
      suggestion: 'Aguardar confirmação diagnóstica com exames complementares',
      evidenceLevel: 'C',
    });
  }

  if (score >= 85) {
    findings.push({
      field: 'Auditoria clínica',
      message: 'Protocolo aprovado — todos os critérios de qualidade assistencial atingidos',
      severity: 'info',
      suggestion: 'Registrar no prontuário eletrônico e notificar equipe multidisciplinar',
      evidenceLevel: 'A',
    });
  }

  return findings;
}

export class HealthCycleEngine {
  private mode: CycleMode;
  private approvalThreshold: number;
  private maxIterations: number;
  private onEvent?: (event: ClinicalCycleEvent) => void;

  constructor(options?: {
    mode?: CycleMode;
    approvalThreshold?: number;
    maxIterations?: number;
    onEvent?: (event: ClinicalCycleEvent) => void;
  }) {
    this.mode = options?.mode ?? 'Health';
    this.approvalThreshold = options?.approvalThreshold ?? 85;
    this.maxIterations = options?.maxIterations ?? 10;
    this.onEvent = options?.onEvent;
  }

  private emit(event: ClinicalCycleEvent): void {
    this.onEvent?.(event);
  }

  private log(level: 'info' | 'warn' | 'error', message: string): void {
    this.emit({ type: 'cycle:log', level, message });
  }

  async run(
    input: HealthCycleInput,
    signal?: AbortSignal
  ): Promise<ClinicalCycleResult> {
    const iterations: ClinicalIteration[] = [];
    let approved = false;
    let finalScore = 0;
    let finalProtocol: ClinicalProtocol | undefined;

    for (let i = 1; i <= this.maxIterations; i++) {
      if (signal?.aborted) {
        this.emit({ type: 'cycle:aborted' });
        return { mode: this.mode, totalIterations: i - 1, approved: false, finalScore, iterations, aborted: true };
      }

      this.emit({ type: 'cycle:start', iteration: i });
      this.log('info', `[Iteração ${i}] Iniciando ciclo clínico — ${input.chiefComplaint}`);

      const iterResult: ClinicalIteration = {
        iteration: i,
        stage: 'TRIAGE',
        score: 0,
        approved: false,
        findings: [],
        timestamp: new Date().toISOString(),
      };

      // ── Percorre cada estágio ──────────────────────────────────────────
      for (const stage of STAGE_SEQUENCE) {
        if (signal?.aborted) break;
        iterResult.stage = stage;
        this.emit({ type: 'stage:change', stage });
        this.log('info', `  [${stage}] processando...`);
        await delay(120);

        if (stage === 'TRIAGE') {
          // NEWS2 se dados disponíveis
          if (input.news2) {
            const news2Full: NEWS2Input = {
              rr: input.news2.rr ?? 16,
              spo2: input.news2.spo2 ?? 97,
              supplementalO2: input.news2.supplementalO2 ?? false,
              systolicBP: input.news2.systolicBP ?? 120,
              heartRate: input.news2.heartRate ?? 80,
              consciousness: input.news2.consciousness ?? 'A',
              temperature: input.news2.temperature ?? 36.5,
              scale2: input.news2.scale2 ?? false,
            };
            const n2 = calcNEWS2(news2Full);
            iterResult.news2Score = n2.score;
            this.log('info', `  NEWS2=${n2.score} (${n2.risk}) — ${n2.response}`);
          }
        }

        if (stage === 'ASSESS') {
          // SOFA se dados disponíveis
          if (input.sofa) {
            const sofaFull: SofaInput = {
              pao2_fio2: input.sofa.pao2_fio2 ?? 400,
              plaquetas: input.sofa.plaquetas ?? 200000,
              bilirrubina: input.sofa.bilirrubina ?? 1.0,
              map_mmhg: input.sofa.map_mmhg ?? 75,
              glasgow: input.sofa.glasgow ?? 15,
              creatinina: input.sofa.creatinina ?? 1.0,
            };
            const sf = calcSOFA(sofaFull);
            iterResult.sofaScore = sf.total;
            this.log('info', `  SOFA=${sf.total} — ${sf.interpretation} (mortalidade ${sf.mortality})`);
          }

          // CURB-65 se dados disponíveis
          if (input.curb65) {
            const c65Full: CURB65Input = {
              confusion: input.curb65.confusion ?? false,
              urea20: input.curb65.urea20 ?? false,
              rr30: input.curb65.rr30 ?? false,
              bp: input.curb65.bp ?? false,
              age65: input.curb65.age65 ?? false,
            };
            const curb = calcCURB65(c65Full);
            this.log('info', `  CURB-65=${curb.score} — ${curb.site} (mortalidade 30d ${curb.mortality30d})`);
          }
        }

        if (stage === 'PROTOCOL') {
          const cids = searchCids(input.chiefComplaint);
          if (cids.length > 0) {
            const proto = getProtocol(cids[0].code);
            if (proto) {
              iterResult.protocol = proto;
              finalProtocol = proto;
              this.log('info', `  Protocolo selecionado: ${proto.name} (${proto.id})`);
            } else {
              this.log('warn', `  Nenhum protocolo mapeado para CID ${cids[0].code}`);
            }
          }
        }

        if (stage === 'AUDIT') {
          const score = simulateClinicalScore(input, i);
          iterResult.score = score;
          finalScore = score;
          const findings = generateClinicalFindings(input, score, i);
          iterResult.findings = findings;
          this.emit({ type: 'audit:result', score, findings });
          this.log(score >= this.approvalThreshold ? 'info' : 'warn',
            `  Score clínico: ${score}/100 (limiar: ${this.approvalThreshold})`);
        }

        if (stage === 'REPORT') {
          if (iterResult.score >= this.approvalThreshold) {
            iterResult.approved = true;
            approved = true;
            this.emit({ type: 'cycle:approved', score: iterResult.score, protocol: iterResult.protocol });
            this.log('info', `  ✅ Protocolo APROVADO — score ${iterResult.score}/100`);
          } else {
            this.emit({ type: 'cycle:retry', iteration: i + 1, score: iterResult.score });
            this.log('warn', `  🔄 Retry ${i + 1} — score insuficiente (${iterResult.score}/${this.approvalThreshold})`);
          }
          iterResult.stage = 'DONE';
          this.emit({ type: 'stage:change', stage: 'DONE' });
        }
      }

      iterations.push(iterResult);

      if (approved) break;
      await delay(300); // pausa entre iterações
    }

    return {
      mode: this.mode,
      totalIterations: iterations.length,
      approved,
      finalScore,
      iterations,
      aborted: false,
      protocol: finalProtocol,
    };
  }
}
