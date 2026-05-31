import { clinicalScores } from './clinicalScores';

export interface ProblemScoreLink {
  problemTemplateId: string;
  scoreIds: string[];
  rationale: string;
}

export const problemScoreLinks: ProblemScoreLink[] = [
  {
    problemTemplateId: 'rheum-ra',
    scoreIds: ['das28_esr', 'das28_crp', 'cdai', 'sdai', 'acr_eular_ra_2010'],
    rationale: 'Artrite reumatoide: atividade inflamatória, treat-to-target e critério classificatório contextual.',
  },
  {
    problemTemplateId: 'rheum-sle',
    scoreIds: ['sledai_2k_operational'],
    rationale: 'Lúpus: atividade longitudinal por domínios e alerta para órgão-alvo.',
  },
  {
    problemTemplateId: 'spa',
    scoreIds: ['basdai', 'asdas_crp'],
    rationale: 'Espondiloartrite: atividade axial e resposta terapêutica.',
  },
];

export function getScoreDefinitionsForProblem(templateId?: string | null, title?: string) {
  const normalizedTitle = (title ?? '').toLowerCase();
  const direct = templateId ? problemScoreLinks.find((link) => link.problemTemplateId === templateId) : undefined;
  const inferred = direct ?? problemScoreLinks.find((link) => {
    if (link.problemTemplateId === 'rheum-ra') return normalizedTitle.includes('artrite reumatoide') || normalizedTitle === 'ar';
    if (link.problemTemplateId === 'rheum-sle') return normalizedTitle.includes('lúpus') || normalizedTitle.includes('lupus') || normalizedTitle.includes('les');
    if (link.problemTemplateId === 'spa') return normalizedTitle.includes('espondilo') || normalizedTitle.includes('axial');
    return false;
  });

  const scoreIds = inferred?.scoreIds ?? [];
  return clinicalScores.filter((score) => scoreIds.includes(score.id));
}
