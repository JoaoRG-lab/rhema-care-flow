import type { RheumatologyGuide } from '@/components/reumatismos/RheumatologyGuidePage';

export const rheumatoidArthritisGuide: RheumatologyGuide = {
  badge: 'Guia educativo',
  slug: 'artrite-reumatoide',
  keywords: ['Artrite reumatoide', 'artrite inflamatória', 'rigidez matinal', 'reumatologia'],
  title: 'Artrite reumatoide: inflamação articular, diagnóstico precoce e cuidado contínuo.',
  subtitle:
    'A artrite reumatoide é uma doença inflamatória autoimune que pode causar dor, rigidez matinal, inchaço articular e perda de função. Reconhecer cedo muda o prognóstico.',
  centralIdeaTitle: 'Ideia central',
  centralIdea: [
    'Artrite reumatoide não é apenas “dor nas juntas”. O centro do problema é inflamação persistente da membrana sinovial, com risco de dano articular se não houver controle adequado.',
    'O cuidado moderno busca remissão ou baixa atividade de doença, com acompanhamento, metas objetivas e ajuste terapêutico individualizado por profissional habilitado.',
  ],
  commonSignsTitle: 'Sinais e sintomas comuns',
  commonSigns: [
    'Rigidez matinal prolongada, especialmente nas mãos e punhos',
    'Dor e inchaço em pequenas articulações, geralmente de forma simétrica',
    'Piora funcional para abrir potes, segurar objetos ou fechar as mãos',
    'Fadiga e sensação de inflamação sistêmica em alguns períodos',
    'Evolução em semanas ou meses, não apenas dor passageira de esforço',
  ],
  redFlags: [
    'Inchaço articular persistente por mais de algumas semanas',
    'Rigidez matinal importante associada a perda de função',
    'Dor em múltiplas articulações com calor ou limitação progressiva',
    'Febre, perda de peso ou sintomas sistêmicos associados',
    'Uso frequente de anti-inflamatórios sem investigação adequada',
  ],
  journey: [
    { title: '1. Suspeitar cedo', text: 'Dor articular inflamatória, rigidez matinal e inchaço objetivo devem acender alerta para investigação reumatológica.' },
    { title: '2. Confirmar atividade', text: 'História clínica, exame físico e exames complementares ajudam a diferenciar artrite reumatoide de outras causas de dor articular.' },
    { title: '3. Tratar por metas', text: 'O acompanhamento ideal usa metas como remissão ou baixa atividade, evitando cuidado apenas reativo a crises.' },
    { title: '4. Proteger função', text: 'Controle de inflamação, adesão, vacinação, comorbidades e reabilitação ajudam a preservar autonomia ao longo do tempo.' },
  ],
  principlesTitle: 'Inflamação controlada protege futuro.',
  principlesIntro: 'A meta não é apenas aliviar dor no dia da consulta, mas reduzir inflamação, prevenir dano e preservar função.',
  principles: ['Diagnóstico precoce reduz risco de dano articular.', 'Acompanhamento por metas é melhor que cuidado episódico.', 'Adesão e monitorização laboratorial importam.', 'Dor sem inchaço nem inflamação pode exigir raciocínio diferente.'],
  faqs: [
    {
      question: 'Artrite reumatoide aparece no exame de sangue?',
      answer: 'Exames como fator reumatoide e anti-CCP podem ajudar, mas não substituem história clínica e exame físico. Algumas pessoas podem ter artrite reumatoide mesmo com exames negativos.',
    },
    {
      question: 'Rigidez matinal é sinal de artrite reumatoide?',
      answer: 'Rigidez matinal prolongada, especialmente associada a inchaço em mãos, punhos ou pés, é uma pista de inflamação articular e deve ser avaliada por profissional de saúde.',
    },
    {
      question: 'Artrite reumatoide tem cura?',
      answer: 'A artrite reumatoide costuma ser crônica, mas pode entrar em remissão ou baixa atividade com acompanhamento adequado. O objetivo é controlar inflamação, preservar função e prevenir dano articular.',
    },
    {
      question: 'Quando procurar um reumatologista?',
      answer: 'Procure avaliação se houver inchaço articular persistente, rigidez matinal importante, dor em múltiplas articulações ou perda de função. Quanto mais cedo a inflamação é reconhecida, melhor tende a ser a proteção articular.',
    },
  ],
};

export const lupusGuide: RheumatologyGuide = {
  badge: 'Guia educativo',
  slug: 'lupus',
  keywords: ['Lúpus', 'lúpus eritematoso sistêmico', 'doença autoimune', 'reumatologia'],
  title: 'Lúpus: doença autoimune sistêmica que exige contexto, vigilância e continuidade.',
  subtitle:
    'O lúpus pode afetar pele, articulações, sangue, rins, sistema nervoso e outros órgãos. A chave é integrar sinais clínicos, exames e acompanhamento longitudinal.',
  centralIdeaTitle: 'Ideia central',
  centralIdea: [
    'Lúpus não é definido por um exame isolado. O diagnóstico depende do conjunto: sintomas, exame físico, marcadores imunológicos e padrões de acometimento.',
    'Como a doença pode alternar períodos de atividade e estabilidade, o cuidado precisa equilibrar controle inflamatório, prevenção de dano e segurança terapêutica.',
  ],
  commonSignsTitle: 'Manifestações possíveis',
  commonSigns: ['Dor ou inchaço articular, fadiga e sintomas constitucionais', 'Lesões de pele, fotossensibilidade ou feridas orais em alguns casos', 'Alterações no sangue, como anemia, leucopenia ou plaquetopenia', 'Proteinúria ou alterações urinárias quando há acometimento renal', 'Sintomas variáveis, que podem mudar com o tempo'],
  redFlags: ['Urina espumosa, inchaço importante ou pressão alta nova', 'Falta de ar, dor torácica ou sintomas neurológicos novos', 'Febre persistente sem causa clara em paciente imunossuprimido', 'Queda importante de células do sangue', 'Gestação ou desejo gestacional sem planejamento em doença ativa'],
  journey: [
    { title: '1. Integrar sintomas e exames', text: 'O raciocínio precisa evitar tanto banalizar sintomas quanto fechar diagnóstico apenas por autoanticorpo positivo.' },
    { title: '2. Estratificar órgãos envolvidos', text: 'Pele, articulações, rins, sangue, pulmões e sistema nervoso mudam risco, acompanhamento e intensidade de tratamento.' },
    { title: '3. Monitorar atividade e dano', text: 'Consultas, exames e adesão ajudam a diferenciar atividade inflamatória de sequelas, infecção ou efeitos adversos.' },
    { title: '4. Planejar ciclos de vida', text: 'Vacinação, exposição solar, fertilidade, gestação e comorbidades devem entrar no plano longitudinal.' },
  ],
  principlesTitle: 'Lúpus exige mapa, não improviso.',
  principlesIntro: 'O cuidado melhora quando o paciente entende a doença, reconhece sinais de alerta e mantém seguimento regular.',
  principles: ['Exame positivo isolado não fecha diagnóstico.', 'Acometimento renal muda prioridade de seguimento.', 'Fotoproteção e adesão podem reduzir atividade.', 'Gestação deve ser planejada com doença controlada.'],
};

export const osteoporosisGuide: RheumatologyGuide = {
  badge: 'Guia educativo',
  slug: 'osteoporose',
  keywords: ['Osteoporose', 'fratura por fragilidade', 'densitometria óssea', 'prevenção de quedas'],
  title: 'Osteoporose: doença silenciosa, risco de fratura e prevenção inteligente.',
  subtitle:
    'A osteoporose reduz resistência óssea e aumenta risco de fraturas. Muitas vezes só aparece depois de uma queda ou fratura, por isso rastreio e prevenção são fundamentais.',
  centralIdeaTitle: 'Ideia central',
  centralIdea: ['O principal desfecho da osteoporose não é o número da densitometria: é a fratura. Quadril, coluna e punho têm grande impacto funcional.', 'O cuidado combina avaliação de risco, investigação de causas secundárias, nutrição, força muscular, prevenção de quedas e tratamento quando indicado.'],
  commonSignsTitle: 'Situações frequentes',
  commonSigns: ['Fratura após queda da própria altura ou trauma mínimo', 'Perda de altura ou dor dorsal associada a fratura vertebral', 'Densitometria com baixa massa óssea ou osteoporose', 'Uso prolongado de corticoide ou doenças inflamatórias crônicas', 'Menopausa, envelhecimento e histórico familiar de fratura'],
  redFlags: ['Dor súbita na coluna após esforço mínimo ou queda', 'Fratura de quadril, vértebra ou múltiplas fraturas', 'Uso crônico de corticoide sem plano de proteção óssea', 'Quedas recorrentes ou perda de equilíbrio', 'Perda de peso, anemia ou dor óssea persistente sem explicação'],
  journey: [
    { title: '1. Estimar risco', text: 'Idade, fraturas prévias, corticoide, densitometria, quedas e comorbidades ajudam a estimar risco real.' },
    { title: '2. Procurar causas secundárias', text: 'Deficiência de vitamina D, alterações hormonais, doenças inflamatórias e medicamentos podem contribuir.' },
    { title: '3. Prevenir quedas e fortalecer', text: 'Força, equilíbrio, visão, ambiente e revisão medicamentosa reduzem risco de fratura além do tratamento farmacológico.' },
    { title: '4. Acompanhar adesão', text: 'O tratamento precisa de tempo, persistência e revisão periódica para manter proteção.' },
  ],
  principlesTitle: 'Proteger osso é proteger independência.',
  principlesIntro: 'A meta é reduzir risco de fratura e preservar mobilidade, não apenas corrigir um exame.',
  principles: ['Fratura prévia muda o risco futuro.', 'Prevenção de quedas é parte do tratamento.', 'Corticoide exige atenção óssea precoce.', 'Acompanhamento melhora adesão e segurança.'],
};

export const goutGuide: RheumatologyGuide = {
  badge: 'Guia educativo',
  slug: 'gota',
  keywords: ['Gota', 'ácido úrico', 'artrite por cristais', 'urato'],
  title: 'Gota: cristais, crises articulares e controle do ácido úrico ao longo do tempo.',
  subtitle:
    'A gota é uma artrite por cristais de urato. Pode causar crises intensas, mas também pode ser controlada com metas, educação e acompanhamento adequado.',
  centralIdeaTitle: 'Ideia central',
  centralIdea: ['A crise de gota é apenas a parte visível. O problema de base é deposição de cristais, geralmente associada a hiperuricemia sustentada.', 'Cuidar só da dor da crise, sem plano de longo prazo quando indicado, favorece recorrência, tofos e dano articular.'],
  commonSignsTitle: 'Padrões comuns',
  commonSigns: ['Crise súbita de dor, calor e inchaço, muitas vezes no dedão do pé', 'Episódios recorrentes com períodos de melhora entre crises', 'Relação com álcool, desidratação, dieta, doença renal ou medicamentos em alguns casos', 'Ácido úrico elevado, embora o valor possa variar durante a crise', 'Tofos em doença crônica não controlada'],
  redFlags: ['Primeira crise articular intensa sem diagnóstico definido', 'Febre ou suspeita de infecção articular', 'Crises frequentes, tofos ou doença renal associada', 'Uso de múltiplos anti-inflamatórios sem orientação', 'Dor e inchaço articular persistentes sem melhora'],
  journey: [
    { title: '1. Diferenciar crise de infecção', text: 'Articulação muito inflamada pode exigir avaliação para afastar artrite séptica ou outras causas urgentes.' },
    { title: '2. Confirmar padrão e risco', text: 'História, exame, ácido úrico, imagem ou análise de líquido articular podem ajudar conforme o contexto.' },
    { title: '3. Controlar crises com segurança', text: 'Tratamento de crise deve considerar rim, estômago, coração, interações e contraindicações.' },
    { title: '4. Pensar em meta de urato', text: 'Quando há indicação, o controle do ácido úrico precisa de meta e seguimento, não apenas remédio eventual.' },
  ],
  principlesTitle: 'Menos crises exige plano, não só resgate.',
  principlesIntro: 'A gota é uma das artrites com maior potencial de controle quando há educação e acompanhamento por metas.',
  principles: ['Ácido úrico normal durante crise não exclui gota.', 'Infecção articular precisa ser lembrada em quadros intensos.', 'Meta de urato depende do perfil clínico.', 'Dieta ajuda, mas nem sempre substitui tratamento indicado.'],
};

export const inflammatoryBackPainGuide: RheumatologyGuide = {
  badge: 'Guia educativo',
  slug: 'dor-lombar-inflamatoria',
  keywords: ['Dor lombar inflamatória', 'espondiloartrite', 'sacroiliíte', 'rigidez matinal'],
  title: 'Dor lombar inflamatória: quando a coluna pode apontar para espondiloartrite.',
  subtitle:
    'Nem toda dor lombar é igual. Algumas características sugerem inflamação e exigem raciocínio diferente da dor mecânica comum.',
  centralIdeaTitle: 'Ideia central',
  centralIdea: ['Dor lombar inflamatória costuma começar mais jovem, melhorar com movimento, piorar em repouso e causar rigidez matinal.', 'Identificar esse padrão é importante porque espondiloartrites podem envolver coluna, articulações periféricas, pele, olhos e intestino.'],
  commonSignsTitle: 'Características sugestivas',
  commonSigns: ['Dor lombar crônica iniciada antes dos 40–45 anos', 'Rigidez matinal e melhora com atividade física', 'Piora em repouso ou durante a segunda metade da noite', 'Dor alternante em nádegas ou região sacroilíaca', 'História de uveíte, psoríase, doença inflamatória intestinal ou entesite'],
  redFlags: ['Perda de força, alteração urinária ou perda de sensibilidade progressiva', 'Febre, perda de peso ou história de câncer associada à dor', 'Trauma importante ou dor intensa em pessoa com risco de fratura', 'Dor noturna progressiva sem alívio', 'Olho vermelho doloroso com sensibilidade à luz'],
  journey: [
    { title: '1. Separar padrão mecânico de inflamatório', text: 'A história clínica é decisiva: horário da dor, rigidez, resposta ao movimento e sintomas associados mudam o caminho.' },
    { title: '2. Procurar pistas extra-articulares', text: 'Psoríase, uveíte, intestino inflamado e entesites ajudam a montar o quebra-cabeça das espondiloartrites.' },
    { title: '3. Usar exames com critério', text: 'Radiografia, ressonância, HLA-B27 e marcadores inflamatórios podem ajudar, mas precisam de contexto.' },
    { title: '4. Preservar mobilidade', text: 'Exercícios, postura, controle inflamatório e seguimento reduzem impacto funcional.' },
  ],
  principlesTitle: 'Coluna também pode inflamar.',
  principlesIntro: 'Reconhecer dor lombar inflamatória reduz anos de atraso diagnóstico em espondiloartrites.',
  principles: ['Melhora com movimento é pista importante.', 'Uveíte e psoríase mudam o raciocínio.', 'Exames precisam ser interpretados no contexto.', 'Mobilidade deve ser protegida desde cedo.'],
};

export const rheumatologyGuides = {
  rheumatoidArthritisGuide,
  lupusGuide,
  osteoporosisGuide,
  goutGuide,
  inflammatoryBackPainGuide,
};
