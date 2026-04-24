import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid } from '@/components/brand/FeatureCard';
import {
  Calculator,
  Users,
  Shield,
  ClipboardCheck,
  ArrowRight,
  Stethoscope,
  Brain,
  Activity,
  HeartPulse,
  Baby,
  Droplets,
  Scale,
  Ruler,
} from 'lucide-react';

const OBS_COLOR = 'hsl(335 65% 55%)';
const OBS_GRADIENT = 'from-[hsl(335_65%_55%)] to-[hsl(320_60%_60%)]';

const obsTools = [
  {
    icon: Ruler,
    title: 'Idade Gestacional & DPP',
    description: 'Cálculo da IG pela DUM (Naegele) ou medida ultrassonográfica. Data provável do parto automática.',
    badge: 'Core',
  },
  {
    icon: ClipboardCheck,
    title: 'Bishop Score',
    description: 'Avaliação do colo uterino para indução do parto — dilatação, apagamento, consistência, posição e altura da apresentação.',
    badge: 'Core',
  },
  {
    icon: Shield,
    title: 'Risco de Pré-eclâmpsia (1º Trim)',
    description: 'Triagem combinada FMF: fatores maternos + PAM + IP artérias uterinas + PlGF. Risco a termo e pré-termo.',
  },
  {
    icon: HeartPulse,
    title: 'Critérios de Pré-eclâmpsia',
    description: 'Diagnóstico ACOG, critérios de gravidade e HELLP — tabela dinâmica por critério com alerta de emergência.',
    badge: 'Critical',
  },
  {
    icon: Droplets,
    title: 'Protocolo HPP (Hemorragia Pós-parto)',
    description: 'Estimativa de perda pelos 4T (Tônus, Tecido, Trauma, Trombina), estadiamento OMS e protocolo de resposta.',
    badge: 'Critical',
  },
  {
    icon: Scale,
    title: 'Diabetes Gestacional (TOTG 75g)',
    description: 'Critérios IADPSG — jejum, 1h e 2h. Rastreio de fatores de risco e metas glicêmicas por trimestre.',
  },
  {
    icon: Activity,
    title: 'PVPC / VBAC (Grobman)',
    description: 'Score de Grobman com probabilidade de parto vaginal após cesárea. Identificação de contraindicações absolutas.',
  },
  {
    icon: Baby,
    title: 'Perfil Biofísico Fetal (Manning)',
    description: '5 parâmetros: MNR, MRF, Tônus Fetal, Movimentos Respiratórios e ILA. Interpretação e conduta integradas.',
  },
  {
    icon: Brain,
    title: 'Risco de Parto Prematuro',
    description: 'Comprimento cervical (USG TV), fFN (fibronectina fetal) e fatores clínicos de risco para parto < 37 semanas.',
  },
  {
    icon: Ruler,
    title: 'Índice de Líquido Amniótico (ILA)',
    description: 'Método de Phelan (4 quadrantes) ou bolsão único. Classificação: oligoâmnio, normal, polidrâmnio.',
  },
];

const conditions = [
  { name: 'Pré-natal', color: 'bg-[hsl(335_65%_55%)]' },
  { name: 'Pré-eclâmpsia', color: 'bg-[hsl(0_72%_51%)]' },
  { name: 'Diabetes Gestacional', color: 'bg-[hsl(35_85%_52%)]' },
  { name: 'Trabalho de Parto', color: 'bg-[hsl(280_55%_55%)]' },
  { name: 'Hemorragia Pós-parto', color: 'bg-[hsl(0_60%_40%)]' },
  { name: 'Climatério', color: 'bg-[hsl(168_55%_42%)]' },
];

export default function ObstetriciaPortal() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/especialidades" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg" style={{ color: OBS_COLOR }}>ObsGyn</span>
              <span className="text-xs text-muted-foreground block">by UHS Health OS</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button
                size="sm"
                className={`gap-2 bg-gradient-to-r ${OBS_GRADIENT} hover:opacity-90`}
              >
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ backgroundColor: OBS_COLOR }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: OBS_COLOR }} />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: `${OBS_COLOR}20`, color: OBS_COLOR }}
            >
              <Stethoscope className="h-4 w-4" />
              Plataforma Clínica de Obstetrícia e Ginecologia
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Ferramentas Clínicas para{' '}
              <span style={{ color: OBS_COLOR }}>Obstetrícia & Ginecologia</span>
              <br />
              da Gestação ao Pós-parto
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Bishop Score, IG pela DUM/USG, triagem de pré-eclâmpsia, protocolo HPP,
              VBAC, perfil biofísico e mais — baseados nas diretrizes da FEBRASGO e ACOG
              para o obstetra e ginecologista moderno.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {conditions.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm"
                >
                  <span className={`w-2 h-2 rounded-full ${c.color}`} />
                  {c.name}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/scores">
                <Button
                  size="lg"
                  className={`gap-2 px-8 h-12 text-base shadow-lg bg-gradient-to-r ${OBS_GRADIENT} hover:opacity-90`}
                >
                  <Calculator className="h-5 w-5" />
                  Abrir Calculadoras Obstétricas
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <Users className="h-5 w-5" />
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Toolkit Obstétrico{' '}
              <span style={{ color: OBS_COLOR }}>Completo</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Construído para obstetras, ginecologistas e equipes de maternidade.
              Calculadoras validadas, critérios diagnósticos atualizados e protocolos de emergência.
            </p>
          </div>

          <FeatureGrid columns={3}>
            {obsTools.map((tool) => (
              <FeatureCard key={tool.title} {...tool} gradient />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold text-center mb-8">Acesso Rápido</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/scores">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Calculator className="h-6 w-6" style={{ color: OBS_COLOR }} />
                <span>Calculadoras</span>
              </Button>
            </Link>
            <Link to="/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Users className="h-6 w-6" style={{ color: OBS_COLOR }} />
                <span>Pacientes</span>
              </Button>
            </Link>
            <Link to="/monitoring">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Shield className="h-6 w-6" style={{ color: OBS_COLOR }} />
                <span>Monitorização</span>
              </Button>
            </Link>
            <Link to="/knowledge?specialty=obstetrics">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Brain className="h-6 w-6" style={{ color: OBS_COLOR }} />
                <span>Conhecimento</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Society */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            Conteúdo alinhado com as diretrizes da{' '}
            <a
              href="https://www.febrasgo.org.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: OBS_COLOR }}
            >
              FEBRASGO — Federação Brasileira das Associações de Ginecologia e Obstetrícia
            </a>{' '}
            e do ACOG (American College of Obstetricians and Gynecologists).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">ObsGyn by UHS Health OS</p>
                <p className="text-xs">Plataforma Clínica de Obstetrícia e Ginecologia</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TrustBadge variant="privacy" size="sm" />
              <TrustBadge variant="verified" size="sm" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Esta é uma ferramenta organizacional para profissionais de saúde. Não é um sistema de prontuário eletrônico.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
