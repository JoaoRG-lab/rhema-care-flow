export type ProtocolSectionType = 'diagnostic' | 'monitoring' | 'safety' | 'treatment' | 'followup';

export interface ProtocolItem {
  id: string;
  label: string;
  priority: 'routine' | 'important' | 'critical';
  note?: string;
}

export interface ProblemProtocolDefinition {
  problemTemplateId: string;
  title: string;
  sections: Array<{
    type: ProtocolSectionType;
    title: string;
    items: ProtocolItem[];
  }>;
}

export const clinicalProtocolRegistry: ProblemProtocolDefinition[] = [
  {
    problemTemplateId: 'rheum-ra',
    title: 'Artrite Reumatoide — protocolo longitudinal',
    sections: [
      {
        type: 'diagnostic',
        title: 'Base diagnóstica/classificatória',
        items: [
          { id: 'synovitis', label: 'Sinovite clínica documentada', priority: 'critical' },
          { id: 'rf-acpa', label: 'FR e/ou ACPA revisados', priority: 'important' },
          { id: 'esr-crp', label: 'VHS/PCR basal', priority: 'important' },
          { id: 'baseline-imaging', label: 'Imagem basal quando indicada', priority: 'routine', note: 'Radiografia, USG ou RM conforme contexto.' },
        ],
      },
      {
        type: 'monitoring',
        title: 'Monitorização treat-to-target',
        items: [
          { id: 'activity-score', label: 'DAS28/CDAI/SDAI seriado', priority: 'critical' },
          { id: 'function-pain', label: 'Dor, função e rigidez revisadas', priority: 'important' },
          { id: 'labs-safety', label: 'Hemograma, TGO/TGP, creatinina conforme terapia', priority: 'critical' },
        ],
      },
      {
        type: 'safety',
        title: 'Segurança terapêutica',
        items: [
          { id: 'infection-screen', label: 'TB/HBV/HCV antes de terapia avançada', priority: 'critical' },
          { id: 'vaccines', label: 'Vacinas revisadas', priority: 'critical' },
          { id: 'pregnancy', label: 'Gestação/contracepção quando aplicável', priority: 'critical' },
        ],
      },
    ],
  },
  {
    problemTemplateId: 'rheum-sle',
    title: 'Lúpus — protocolo longitudinal',
    sections: [
      {
        type: 'diagnostic',
        title: 'Atividade e órgãos-alvo',
        items: [
          { id: 'organ-domains', label: 'Domínios de atividade revisados', priority: 'critical' },
          { id: 'renal-screen', label: 'Urina I, proteinúria e creatinina', priority: 'critical' },
          { id: 'complement-dsdna', label: 'Complemento e anti-dsDNA quando aplicável', priority: 'important' },
        ],
      },
      {
        type: 'monitoring',
        title: 'Monitorização',
        items: [
          { id: 'sledai-trend', label: 'SLEDAI operacional ou equivalente seriado', priority: 'important' },
          { id: 'steroid-sparing', label: 'Dose acumulada de corticoide revisada', priority: 'important' },
          { id: 'infection-mimic', label: 'Infecção/mimetizadores excluídos antes de escalar imunossupressão', priority: 'critical' },
        ],
      },
      {
        type: 'safety',
        title: 'Segurança',
        items: [
          { id: 'hcq-retina', label: 'Rastreamento ocular se hidroxicloroquina', priority: 'important' },
          { id: 'pregnancy-aps', label: 'Gestação/SAF revisados quando aplicável', priority: 'critical' },
          { id: 'vaccines-infection', label: 'Vacinas e risco infeccioso revisados', priority: 'important' },
        ],
      },
    ],
  },
  {
    problemTemplateId: 'general-hypertension',
    title: 'Hipertensão — protocolo longitudinal',
    sections: [
      {
        type: 'diagnostic',
        title: 'Confirmação e estratificação',
        items: [
          { id: 'bp-confirmation', label: 'PA confirmada por medidas seriadas/MRPA/MAPA quando indicado', priority: 'critical' },
          { id: 'cv-risk', label: 'Risco cardiovascular global estimado', priority: 'important' },
          { id: 'secondary-causes', label: 'Causas secundárias consideradas quando suspeitas', priority: 'routine' },
        ],
      },
      {
        type: 'monitoring',
        title: 'Monitorização',
        items: [
          { id: 'home-bp', label: 'PA domiciliar ou seriada acompanhada', priority: 'important' },
          { id: 'renal-potassium', label: 'Creatinina/eTFG e potássio conforme fármacos', priority: 'critical' },
          { id: 'adherence', label: 'Adesão, sal, peso e atividade física revisados', priority: 'important' },
        ],
      },
      {
        type: 'safety',
        title: 'Segurança',
        items: [
          { id: 'orthostasis-falls', label: 'Hipotensão ortostática/queda avaliadas', priority: 'important' },
          { id: 'nsaid-interaction', label: 'AINEs e interações revisadas', priority: 'important' },
        ],
      },
    ],
  },
];

export function getProtocolForProblem(templateId?: string | null, title?: string) {
  const normalized = (title ?? '').toLowerCase();
  const direct = templateId ? clinicalProtocolRegistry.find((protocol) => protocol.problemTemplateId === templateId) : undefined;
  return direct ?? clinicalProtocolRegistry.find((protocol) => {
    if (protocol.problemTemplateId === 'rheum-ra') return normalized.includes('artrite reumatoide') || normalized === 'ar';
    if (protocol.problemTemplateId === 'rheum-sle') return normalized.includes('lúpus') || normalized.includes('lupus') || normalized.includes('les');
    if (protocol.problemTemplateId === 'general-hypertension') return normalized.includes('hipertensão') || normalized.includes('has');
    return false;
  }) ?? null;
}
