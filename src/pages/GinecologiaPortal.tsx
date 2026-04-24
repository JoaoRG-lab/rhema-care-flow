import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import {
  ArrowRight,
  Calculator,
  BookOpen,
  Sparkles,
  Stethoscope,
  Activity,
  Shield,
  Baby,
  Droplets,
  HeartPulse,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { getSpecialtyById } from '@/config/specialties';

const GYN_GRADIENT = 'from-[hsl(335_65%_55%)] to-[hsl(320_60%_60%)]';
const GYN_COLOR = 'hsl(335 65% 55%)';

const CALCULATORS = [
  {
    id: 'gestational-age',
    name: 'Idade Gestacional (DUM)',
    desc: 'Naegele — IG, trimestre e DPP a partir da última menstruação.',
    icon: Activity,
    badge: 'Core',
  },
  {
    id: 'bishop',
    name: 'Bishop Score',
    desc: 'Maturidade cervical para indução do trabalho de parto (0–13).',
    icon: HeartPulse,
  },
  {
    id: 'preeclampsia-risk',
    name: 'Risco de Pré-eclâmpsia',
    desc: 'ACOG/USPSTF/FEBRASGO — indicação de profilaxia com AAS.',
    icon: Shield,
  },
  {
    id: 'pregnancy-bmi',
    name: 'IMC e Ganho Ponderal',
    desc: 'IOM 2009 — faixas por IMC pré-gestacional.',
    icon: Baby,
  },
];

const KNOWLEDGE = [
  {
    title: 'Pré-natal de baixo risco',
    body: 'Roteiro de consultas, exames por trimestre e suplementação conforme FEBRASGO 2023.',
    icon: Stethoscope,
  },
  {
    title: 'Hipertensão na gestação',
    body: 'Critérios diagnósticos, sinais de gravidade e manejo da pré-eclâmpsia (ACOG 2020).',
    icon: Droplets,
  },
  {
    title: 'Diabetes Gestacional',
    body: 'Rastreio com TOTG 75 g entre 24–28 sem, metas glicêmicas e indicações de insulina.',
    icon: Activity,
  },
  {
    title: 'Hemorragia Pós-parto',
    body: 'Bundle FEBRASGO/WHO: prevenção, mnemônico HEMOSTASIA e código vermelho obstétrico.',
    icon: Shield,
  },
  {
    title: 'Climatério e TH',
    body: 'Avaliação de risco, indicações e contraindicações da terapia hormonal (NAMS/FEBRASGO).',
    icon: HeartPulse,
  },
  {
    title: 'Rastreio de câncer ginecológico',
    body: 'Citologia, HPV-DNA e mamografia conforme INCA, USPSTF e ACOG.',
    icon: BookOpen,
  },
];

const REFS = [
  { label: 'FEBRASGO', url: 'https://www.febrasgo.org.br' },
  { label: 'ACOG', url: 'https://www.acog.org' },
  { label: 'WHO Maternal Health', url: 'https://www.who.int/health-topics/maternal-health' },
  { label: 'INCA', url: 'https://www.gov.br/inca' },
];

export default function GinecologiaPortal() {
  const specialty = getSpecialtyById('obstetrics');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/especialidades" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg" style={{ color: GYN_COLOR }}>
                Ginecologia & Obstetrícia
              </span>
              <span className="text-xs text-muted-foreground block">by UHS Health OS</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login?redirect=%2Fginecologia">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup?redirect=%2Fginecologia">
              <Button size="sm" className={`gap-2 bg-gradient-to-r ${GYN_GRADIENT} hover:opacity-90 text-white`}>
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-12 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(335_65%_55%)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[hsl(320_60%_60%)]/10 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-5xl relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Portal Clínico — Ginecologia & Obstetrícia
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Cuidado da{' '}
            <span className="bg-gradient-to-r bg-clip-text text-transparent from-[hsl(335_65%_55%)] to-[hsl(320_60%_60%)]">
              mulher e da gestação
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Calculadoras obstétricas, protocolos baseados em evidência e biblioteca de
            conhecimento alinhada à FEBRASGO, ACOG e WHO.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/scores">
              <Button size="lg" className={`gap-2 bg-gradient-to-r ${GYN_GRADIENT} hover:opacity-90 text-white`}>
                <Calculator className="h-4 w-4" />
                Abrir Calculadoras
              </Button>
            </Link>
            <Link to="/knowledge?specialty=obstetrics">
              <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Biblioteca de Conhecimento
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Conditions */}
      {specialty && (
        <section className="py-10 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold mb-4">Áreas clínicas cobertas</h2>
            <div className="flex flex-wrap gap-2">
              {specialty.conditions.map((c) => (
                <Badge key={c.name} variant="secondary" className="text-sm py-1.5 px-3">
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Calculators */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Calculator className="h-6 w-6" style={{ color: GYN_COLOR }} />
                Calculadoras Obstétricas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ferramentas baseadas em evidência. Sem armazenamento de dados pessoais.
              </p>
            </div>
            <Link to="/scores" className="text-sm flex items-center gap-1 hover:underline" style={{ color: GYN_COLOR }}>
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CALCULATORS.map((calc) => {
              const Icon = calc.icon;
              return (
                <Link key={calc.id} to={`/scores?calc=${calc.id}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="p-5">
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${GYN_COLOR}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: GYN_COLOR }} />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{calc.name}</h3>
                        {calc.badge && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                            style={{ backgroundColor: `${GYN_COLOR}20`, color: GYN_COLOR }}
                          >
                            {calc.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{calc.desc}</p>
                      <div className="mt-3 pt-3 border-t flex items-center text-xs" style={{ color: GYN_COLOR }}>
                        Abrir calculadora <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Knowledge */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BookOpen className="h-6 w-6" style={{ color: GYN_COLOR }} />
                Conhecimento Clínico
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Resumos curados a partir das principais sociedades de ginecologia e obstetrícia.
              </p>
            </div>
            <Link
              to="/knowledge?specialty=obstetrics"
              className="text-sm flex items-center gap-1 hover:underline"
              style={{ color: GYN_COLOR }}
            >
              Biblioteca completa <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KNOWLEDGE.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="h-full">
                  <CardContent className="p-5">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${GYN_COLOR}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: GYN_COLOR }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* References */}
      <section className="py-10 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-xl font-semibold mb-4">Sociedades e diretrizes de referência</h2>
          <div className="flex flex-wrap gap-3">
            {REFS.map((r) => (
              <a
                key={r.label}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm"
              >
                {r.label}
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Ginecologia & Obstetrícia · UHS</p>
                <p className="text-xs">Plataforma Clínica Universal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TrustBadge variant="privacy" size="sm" />
              <TrustBadge variant="verified" size="sm" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Ferramenta organizacional para profissionais de saúde. Não é prontuário eletrônico
              nem substitui o julgamento clínico.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
