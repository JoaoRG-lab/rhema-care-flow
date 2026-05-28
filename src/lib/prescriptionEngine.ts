export type PrescriptionRiskLevel = 'info' | 'warning' | 'danger';

export interface PrescriptionTemplate {
  id: string;
  label: string;
  category: 'analgesic' | 'anti-inflammatory' | 'csdmard' | 'supplement' | 'gastroprotection' | 'bone-health' | 'corticosteroid' | 'biologic-screening' | 'other';
  medication: string;
  concentration: string;
  route: string;
  dose: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  safetyNotes: string[];
}

export interface PrescriptionDraftItem {
  medication: string;
  concentration: string;
  route: string;
  dose: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

export interface PrescriptionAlert {
  level: PrescriptionRiskLevel;
  title: string;
  message: string;
}

export const prescriptionTemplates: PrescriptionTemplate[] = [
  {
    id: 'paracetamol-500-prn',
    label: 'Paracetamol 500 mg — dor/febre se necessário',
    category: 'analgesic',
    medication: 'Paracetamol',
    concentration: '500 mg comprimido',
    route: 'VO',
    dose: '1 comprimido',
    frequency: 'a cada 6–8 horas se dor ou febre',
    duration: 'por até 3–5 dias, salvo orientação médica',
    quantity: '1 caixa',
    instructions: 'Evitar exceder dose diária máxima. Atenção a hepatopatia e uso concomitante de álcool.',
    safetyNotes: ['Conferir doença hepática.', 'Conferir outros produtos contendo paracetamol.'],
  },
  {
    id: 'dipirona-500-prn',
    label: 'Dipirona 500 mg — dor/febre se necessário',
    category: 'analgesic',
    medication: 'Dipirona',
    concentration: '500 mg comprimido',
    route: 'VO',
    dose: '1 comprimido',
    frequency: 'a cada 6–8 horas se dor ou febre',
    duration: 'por curto período, conforme sintomas',
    quantity: '1 caixa',
    instructions: 'Suspender e procurar atendimento se reação alérgica, queda importante do estado geral ou sinais infecciosos.',
    safetyNotes: ['Conferir alergia prévia.', 'Cautela em histórico hematológico relevante.'],
  },
  {
    id: 'naproxen-safety-shell',
    label: 'Naproxeno — estrutura com alerta de AINE',
    category: 'anti-inflammatory',
    medication: 'Naproxeno',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose]',
    frequency: '[preencher frequência]',
    duration: 'menor tempo necessário',
    quantity: '[preencher quantidade]',
    instructions: 'Usar após alimentação se apropriado. Conferir contraindicações e risco gastrointestinal, renal e cardiovascular.',
    safetyNotes: ['AINE: revisar DRC, anticoagulação, úlcera, IC/HAS e risco CV.', 'Evitar duplicidade com outros AINEs.'],
  },
  {
    id: 'omeprazol-20-gastroprotection',
    label: 'Omeprazol 20 mg — gastroproteção',
    category: 'gastroprotection',
    medication: 'Omeprazol',
    concentration: '20 mg cápsula',
    route: 'VO',
    dose: '1 cápsula',
    frequency: 'pela manhã, em jejum',
    duration: 'enquanto houver indicação clínica',
    quantity: '1 caixa',
    instructions: 'Reavaliar necessidade de uso contínuo; evitar cronificação sem indicação.',
    safetyNotes: ['Reavaliar uso prolongado.', 'Checar interações e indicação real.'],
  },
  {
    id: 'calcium-vitd-bone',
    label: 'Cálcio + vitamina D — saúde óssea',
    category: 'bone-health',
    medication: 'Cálcio + Vitamina D',
    concentration: 'conforme apresentação disponível',
    route: 'VO',
    dose: 'conforme ingestão dietética e necessidade individual',
    frequency: 'diariamente',
    duration: 'conforme plano terapêutico',
    quantity: 'conforme prescrição',
    instructions: 'Individualizar conforme dieta, DMO, risco de fratura, função renal e cálcio sérico.',
    safetyNotes: ['Conferir função renal.', 'Evitar excesso de cálcio em hipercalcemia/nefrólitíase ativa.'],
  },
  {
    id: 'prednisone-taper-shell',
    label: 'Prednisona — estrutura com plano de desmame',
    category: 'corticosteroid',
    medication: 'Prednisona',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose atual]',
    frequency: 'pela manhã, conforme plano',
    duration: '[preencher duração e desmame]',
    quantity: '[preencher quantidade]',
    instructions: 'Registrar objetivo, menor dose pelo menor tempo possível, plano de redução e medidas preventivas conforme risco.',
    safetyNotes: ['Checar PA, glicemia, osteoporose, infecção, glaucoma/catarata e risco gastrointestinal.', 'Registrar plano de desmame quando aplicável.'],
  },
  {
    id: 'methotrexate-safety-shell',
    label: 'Metotrexato — estrutura segura sem dose pré-preenchida',
    category: 'csdmard',
    medication: 'Metotrexato',
    concentration: '[preencher apresentação]',
    route: 'VO/SC',
    dose: '[preencher dose semanal]',
    frequency: '1 vez por semana, em dia fixo',
    duration: 'uso contínuo conforme acompanhamento',
    quantity: '[preencher quantidade]',
    instructions: 'Atenção: uso semanal, nunca diário. Associar orientação sobre ácido fólico quando indicado. Conferir hemograma, função hepática/renal, gestação, álcool e interações.',
    safetyNotes: ['Alerta de dose semanal.', 'Checar gestação/contracepção.', 'Checar hemograma, TGO/TGP, creatinina.', 'Evitar prescrição automática sem revisão clínica.'],
  },
  {
    id: 'folic-acid-mtx-shell',
    label: 'Ácido fólico — suporte ao metotrexato',
    category: 'supplement',
    medication: 'Ácido fólico',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose]',
    frequency: '[preencher esquema, evitando confusão com o dia do MTX quando aplicável]',
    duration: 'enquanto houver indicação',
    quantity: '[preencher quantidade]',
    instructions: 'Alinhar esquema ao uso de metotrexato e evitar instruções ambíguas.',
    safetyNotes: ['Conferir esquema local associado ao MTX.', 'Evitar ambiguidade de dias.'],
  },
  {
    id: 'leflunomide-safety-shell',
    label: 'Leflunomida — estrutura com monitorização',
    category: 'csdmard',
    medication: 'Leflunomida',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose]',
    frequency: '1 vez ao dia, conforme indicação',
    duration: 'uso contínuo conforme acompanhamento',
    quantity: '[preencher quantidade]',
    instructions: 'Conferir TGO/TGP, hemograma, PA, gestação/contracepção e interações. Registrar orientação de sinais de toxicidade.',
    safetyNotes: ['Hepatotoxicidade.', 'Teratogenicidade.', 'Monitorização laboratorial.'],
  },
  {
    id: 'hydroxychloroquine-safety-shell',
    label: 'Hidroxicloroquina — estrutura com oftalmo',
    category: 'csdmard',
    medication: 'Hidroxicloroquina',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose conforme peso/contexto]',
    frequency: '[preencher frequência]',
    duration: 'uso contínuo conforme acompanhamento',
    quantity: '[preencher quantidade]',
    instructions: 'Conferir dose por peso, função renal, risco retiniano e acompanhamento oftalmológico conforme protocolo.',
    safetyNotes: ['Risco retiniano.', 'Dose por peso.', 'Ajuste/risco em DRC.'],
  },
  {
    id: 'biologic-screening-checklist',
    label: 'Checklist pré-biológico/JAK — rastreios',
    category: 'biologic-screening',
    medication: 'Checklist pré-imunossupressão avançada',
    concentration: 'não se aplica',
    route: 'Interno',
    dose: 'não se aplica',
    frequency: 'antes de iniciar/renovar terapia conforme risco',
    duration: 'revisão periódica',
    quantity: 'não se aplica',
    instructions: 'Revisar TB, HBV, HCV/HIV quando indicado, vacinas, hemograma, renal/hepático, gestação/contracepção e contraindicações específicas.',
    safetyNotes: ['Não é receita; é checklist de segurança.', 'Documentar resultados antes de terapia avançada.'],
  },
];

const medicationAliases: Array<[RegExp, string]> = [
  [/metotrexato|methotrexate|mtx/i, 'Metotrexato'],
  [/leflunomida|leflunomide/i, 'Leflunomida'],
  [/hidroxicloroquina|hydroxychloroquine|hcq/i, 'Hidroxicloroquina'],
  [/prednisona|prednisone/i, 'Prednisona'],
  [/ibuprofeno|naproxeno|diclofenaco|cetoprofeno|nimesulida|aine|anti-inflamat/i, 'AINE'],
  [/paracetamol/i, 'Paracetamol'],
  [/dipirona|metamizol/i, 'Dipirona'],
  [/ácido fólico|acido folico|folic acid/i, 'Ácido fólico'],
];

export function normalizeMedicationName(input: string) {
  const raw = input.trim();
  if (!raw) return '';
  const match = medicationAliases.find(([regex]) => regex.test(raw));
  return match?.[1] ?? raw;
}

export function applyPrescriptionTemplate(templateId: string): PrescriptionDraftItem | null {
  const template = prescriptionTemplates.find((item) => item.id === templateId);
  if (!template) return null;

  return {
    medication: template.medication,
    concentration: template.concentration,
    route: template.route,
    dose: template.dose,
    frequency: template.frequency,
    duration: template.duration,
    quantity: template.quantity,
    instructions: template.instructions,
  };
}

export function validatePrescriptionItem(item: PrescriptionDraftItem): PrescriptionAlert[] {
  const alerts: PrescriptionAlert[] = [];
  const medication = normalizeMedicationName(item.medication);
  const lower = `${item.medication} ${item.dose} ${item.frequency} ${item.instructions}`.toLowerCase();

  if (!item.medication.trim()) alerts.push({ level: 'danger', title: 'Medicamento ausente', message: 'Informe o nome do medicamento antes de salvar.' });
  if (!item.dose.trim()) alerts.push({ level: 'danger', title: 'Dose ausente', message: 'Informe a dose para reduzir risco de prescrição ambígua.' });
  if (!item.frequency.trim()) alerts.push({ level: 'danger', title: 'Frequência ausente', message: 'Informe frequência/intervalo de administração.' });
  if (!item.route.trim()) alerts.push({ level: 'warning', title: 'Via ausente', message: 'Informe via de administração.' });
  if (/\[preencher|não informado|nao informado/i.test(`${item.concentration} ${item.dose} ${item.frequency} ${item.quantity}`)) alerts.push({ level: 'warning', title: 'Campo placeholder', message: 'Há campos ainda marcados para preenchimento manual.' });

  if (medication === 'Metotrexato') {
    if (/di[aá]ri|todo dia|1x ao dia|uma vez ao dia/.test(lower)) alerts.push({ level: 'danger', title: 'Metotrexato com frequência suspeita', message: 'Metotrexato reumatológico costuma ser semanal. Frequência diária pode ser evento grave; revisar imediatamente.' });
    if (!/semana|semanal|1x\/sem|uma vez por semana/.test(lower)) alerts.push({ level: 'warning', title: 'Confirmar frequência semanal', message: 'Deixe explícito o dia fixo semanal e revise ácido fólico/exames basais.' });
  }

  if (medication === 'AINE') alerts.push({ level: 'warning', title: 'AINE: checagem de segurança', message: 'Conferir DRC, HAS/IC, anticoagulação, gastrite/úlcera, idade, risco CV e interações.' });
  if (medication === 'Hidroxicloroquina') alerts.push({ level: 'info', title: 'HCQ: monitorização', message: 'Conferir peso/dose, risco retiniano, função renal e acompanhamento oftalmológico conforme protocolo.' });
  if (medication === 'Leflunomida') alerts.push({ level: 'warning', title: 'Leflunomida: segurança', message: 'Conferir TGO/TGP, hemograma, gestação/contracepção, PA e interações.' });
  if (medication === 'Prednisona') alerts.push({ level: 'info', title: 'Corticoide: plano de desmame', message: 'Registrar dose, duração, plano de redução e medidas de proteção conforme risco.' });

  return alerts;
}

export function formatPrescriptionItem(item: PrescriptionDraftItem, index: number) {
  const title = `${index + 1}. ${normalizeMedicationName(item.medication) || '[medicamento não informado]'}`;
  const concentration = item.concentration.trim() ? ` ${item.concentration.trim()}` : '';
  const route = item.route.trim() ? `\n   Via: ${item.route.trim()}` : '';
  const dose = item.dose.trim() ? `\n   Dose: ${item.dose.trim()}` : '';
  const frequency = item.frequency.trim() ? `\n   Frequência: ${item.frequency.trim()}` : '';
  const duration = item.duration.trim() ? `\n   Duração: ${item.duration.trim()}` : '';
  const quantity = item.quantity.trim() ? `\n   Quantidade: ${item.quantity.trim()}` : '';
  const instructions = item.instructions.trim() ? `\n   Orientações: ${item.instructions.trim()}` : '';

  return `${title}${concentration}${route}${dose}${frequency}${duration}${quantity}${instructions}`;
}

export function formatPrescription(items: PrescriptionDraftItem[]) {
  const filled = items.filter((item) => Object.values(item).some((value) => value.trim().length > 0));
  const alerts = filled.flatMap(validatePrescriptionItem);
  const critical = alerts.filter((alert) => alert.level === 'danger');
  const warning = alerts.filter((alert) => alert.level === 'warning');

  const body = filled.map(formatPrescriptionItem).join('\n\n');
  const alertBlock = alerts.length
    ? `\n\nAlertas/checagens:\n${alerts.map((alert) => `- [${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`).join('\n')}`
    : '\n\nChecagem mínima: medicamento, dose, via e frequência informados nos itens preenchidos.';

  const footer = '\n\nObservação: conferir alergias, função renal/hepática, gestação quando aplicável, interações, disponibilidade local e protocolo institucional antes de entregar ao paciente.';

  return {
    text: `PRESCRIÇÃO\n\n${body || '[sem itens preenchidos]'}${alertBlock}${footer}`,
    alerts,
    canFinalize: critical.length === 0,
    summary: `${filled.length} item(ns), ${critical.length} alerta(s) crítico(s), ${warning.length} aviso(s).`,
  };
}
