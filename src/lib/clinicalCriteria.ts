export type CriteriaDomain = 'Artrite Reumatoide' | 'Espondiloartrite' | 'Lúpus' | 'Fibromialgia' | 'Osteoporose' | 'Segurança Terapêutica';

export interface ClinicalCriteriaCard {
  id: string;
  title: string;
  domain: CriteriaDomain;
  purpose: 'classificação' | 'diagnóstico diferencial' | 'atividade' | 'segurança' | 'rastreio';
  summary: string;
  requiredContext: string[];
  positiveSignals: string[];
  redFlags: string[];
  nextSteps: string[];
  caveat: string;
}

export const clinicalCriteriaCards: ClinicalCriteriaCard[] = [
  {
    id: 'ra-acr-eular-2010-context',
    title: 'AR — ACR/EULAR 2010 no contexto certo',
    domain: 'Artrite Reumatoide',
    purpose: 'classificação',
    summary: 'Critério classificatório para paciente com sinovite clínica não melhor explicada por outra doença. Pontuação ≥6/10 classifica AR no contexto apropriado.',
    requiredContext: ['Sinovite clínica objetiva', 'Exclusão de melhor explicação', 'Duração e padrão articular documentados', 'RF/ACPA e PCR/VHS quando disponíveis'],
    positiveSignals: ['Pequenas articulações', 'Poliartrite', 'ACPA/RF positivos', 'Reagentes de fase aguda elevados', 'Sintomas ≥6 semanas'],
    redFlags: ['Monoartrite infecciosa/cristalina', 'Psoríase/entesite/dactilite dominantes', 'Febre persistente', 'Perda ponderal inexplicada', 'Padrão mecânico puro'],
    nextSteps: ['Documentar articulações dolorosas/edemaciadas', 'Checar sorologia e fase aguda', 'Considerar USG musculoesquelético quando exame físico for duvidoso', 'Registrar alvo terapêutico e score longitudinal'],
    caveat: 'Classificação não substitui diagnóstico clínico. AR soronegativa pode exigir acompanhamento evolutivo e imagem.',
  },
  {
    id: 'spa-asas-context',
    title: 'Espondiloartrite axial — raciocínio ASAS',
    domain: 'Espondiloartrite',
    purpose: 'diagnóstico diferencial',
    summary: 'Estrutura de raciocínio para dor lombar inflamatória e suspeita de espondiloartrite axial, integrando imagem, HLA-B27 e manifestações SpA.',
    requiredContext: ['Dor lombar crônica com início antes de 45 anos', 'Caracterizar padrão inflamatório', 'Radiografia/RM sacroilíacas quando indicado', 'HLA-B27 quando útil'],
    positiveSignals: ['Melhora com exercício', 'Não melhora com repouso', 'Dor noturna/segunda metade da noite', 'Entesite', 'Dactilite', 'Uveíte', 'Psoríase', 'DII', 'Boa resposta a AINE'],
    redFlags: ['Déficit neurológico progressivo', 'Febre', 'Câncer conhecido', 'Trauma', 'Perda ponderal', 'Dor mecânica pura sem sinais inflamatórios'],
    nextSteps: ['Aplicar BASDAI/ASDAS', 'Checar PCR e imagem', 'Mapear manifestações extra-articulares', 'Evitar tratar apenas dor mecânica como inflamação sistêmica'],
    caveat: 'Critérios ASAS são classificatórios. RM pode ter falso positivo; correlacionar com probabilidade pré-teste.',
  },
  {
    id: 'sle-eular-acr-context',
    title: 'LES — entrada imunológica e domínios clínicos',
    domain: 'Lúpus',
    purpose: 'classificação',
    summary: 'Raciocínio baseado em entrada por FAN positivo e domínios ponderados clínico-imunológicos; útil para organizar suspeita e documentação.',
    requiredContext: ['FAN em título compatível como porta de entrada quando aplicável', 'Domínios clínicos e imunológicos separados', 'Avaliação renal/hematológica/cutânea/musculoesquelética', 'Complemento e anti-dsDNA quando indicados'],
    positiveSignals: ['Fotossensibilidade/rash típico', 'Úlceras orais', 'Artrite não erosiva', 'Citopenias', 'Proteinúria/sedimento ativo', 'Complemento baixo', 'Anti-dsDNA/anti-Sm'],
    redFlags: ['Infecção simulando atividade', 'Droga indutora', 'Neoplasia/hematológica', 'SAF isolada sem LES', 'Proteinúria por causa não inflamatória'],
    nextSteps: ['Quantificar atividade com SLEDAI operacional', 'Checar urina I, relação proteína/creatinina e função renal', 'Separar dano acumulado de atividade atual', 'Registrar órgão-alvo e gravidade'],
    caveat: 'Atividade lúpica exige contexto. Evitar escalar imunossupressão sem excluir infecção e mimetizadores.',
  },
  {
    id: 'fibromyalgia-wpi-sss-context',
    title: 'Fibromialgia — WPI/SSS e exclusões inteligentes',
    domain: 'Fibromialgia',
    purpose: 'diagnóstico diferencial',
    summary: 'Organiza critérios WPI/SSS, dor generalizada e duração, sem negligenciar comorbidades e diagnósticos diferenciais tratáveis.',
    requiredContext: ['WPI', 'SSS', 'Dor em regiões corporais', 'Sintomas ≥3 meses', 'Avaliação de sono, humor, fadiga e cognição'],
    positiveSignals: ['Dor difusa', 'Sono não reparador', 'Fadiga', 'Fibrofog', 'Hiperalgesia', 'Comorbidades funcionais'],
    redFlags: ['Artrite objetiva', 'Fraqueza muscular progressiva', 'Perda ponderal', 'Febre', 'Elevação inflamatória persistente', 'Sintomas neurológicos focais'],
    nextSteps: ['Aplicar WPI/SSS e FIQR longitudinal', 'Evitar cascata excessiva sem sinais de alarme', 'Tratar sono, atividade física, humor e educação em dor', 'Reavaliar se surgirem sinais objetivos'],
    caveat: 'Fibromialgia pode coexistir com doença inflamatória; não deve invalidar queixas nem mascarar atividade objetiva.',
  },
  {
    id: 'immunosuppression-safety-context',
    title: 'Imunossupressão — checklist antes de avançar',
    domain: 'Segurança Terapêutica',
    purpose: 'segurança',
    summary: 'Checklist operacional para reduzir omissões antes de DMARDs, biológicos, JAK e corticoide prolongado.',
    requiredContext: ['Fármaco pretendido', 'Infecções prévias', 'Vacinas', 'Gestação/contracepção quando aplicável', 'Exames basais'],
    positiveSignals: ['TB/HBV/HCV/HIV revisados quando indicados', 'Vacinas atualizadas', 'Hemograma/renal/hepático basais', 'Risco cardiovascular e trombótico considerado', 'Plano de monitorização'],
    redFlags: ['Infecção ativa', 'HBV sem plano', 'TB latente não endereçada', 'Gestação com fármaco teratogênico', 'Citopenia/hepatopatia não explicada', 'Uso de JAK com risco CV/trombótico alto sem discussão'],
    nextSteps: ['Aplicar checklist de segurança imunossupressão', 'Documentar risco/benefício', 'Registrar plano de monitorização', 'Alinhar vacinação antes de imunossupressão quando possível'],
    caveat: 'Protocolos variam por serviço e fármaco. O checklist reduz risco operacional, mas não substitui julgamento clínico.',
  },
];

export function criteriaByDomain(domain?: CriteriaDomain) {
  return domain ? clinicalCriteriaCards.filter((card) => card.domain === domain) : clinicalCriteriaCards;
}
