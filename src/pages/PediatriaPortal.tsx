import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid } from '@/components/brand/FeatureCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicEducationContent } from '@/hooks/usePublicEducationContent';
import { ContentVoteButtons } from '@/components/education/ContentVoteButtons';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Calculator,
  Users,
  Shield,
  Syringe,
  ClipboardCheck,
  ArrowRight,
  Stethoscope,
  Brain,
  Baby,
  Activity,
  Pill,
  Ruler,
  HeartPulse,
  Thermometer,
  BookOpen,
  Clock,
  ExternalLink,
} from 'lucide-react';

const PEDIA_COLOR = 'hsl(195 75% 55%)';
const PEDIA_GRADIENT = 'from-[hsl(195_75%_55%)] to-[hsl(210_70%_60%)]';

const pediaTools = [
  {
    icon: Ruler,
    title: 'Curvas de Crescimento OMS',
    description: 'Peso/idade, estatura/idade, IMC/idade e perímetro cefálico (0-19 anos) com z-scores e percentis.',
    badge: 'Core',
  },
  {
    icon: Baby,
    title: 'APGAR & Avaliação Neonatal',
    description: 'APGAR 1º/5º minuto, Capurro, Ballard e Silverman-Andersen para o recém-nascido.',
  },
  {
    icon: HeartPulse,
    title: 'PEWS — Pediatric Early Warning',
    description: 'Score de deterioração clínica pediátrica com gatilhos para resposta rápida.',
    badge: 'Critical',
  },
  {
    icon: Pill,
    title: 'Doses Pediátricas por Peso',
    description: 'Calculadora mg/kg para antibióticos, analgésicos, antitérmicos, broncodilatadores e drogas de PCR.',
  },
  {
    icon: Syringe,
    title: 'Calendário Vacinal PNI/SBP',
    description: 'Esquema vacinal atualizado, catch-up, contraindicações e situações especiais.',
  },
  {
    icon: Thermometer,
    title: 'Febre Sem Sinais Localizatórios',
    description: 'Critérios de Rochester, Boston e Filadélfia para lactentes febris.',
  },
  {
    icon: Activity,
    title: 'Asma & Bronquiolite',
    description: 'Pulmonary Score, Wood-Downes, escala de Tal e protocolos de manejo escalonado.',
  },
  {
    icon: ClipboardCheck,
    title: 'Desidratação & Reidratação',
    description: 'Avaliação clínica, Holliday-Segar, plano A/B/C da OMS e cálculo de manutenção.',
  },
  {
    icon: Brain,
    title: 'Desenvolvimento Neuropsicomotor',
    description: 'Marcos de Denver II, M-CHAT-R/F para triagem de TEA e sinais de alerta.',
  },
];

const conditions = [
  { name: 'Asma Infantil', color: 'bg-[hsl(195_75%_55%)]' },
  { name: 'Bronquiolite', color: 'bg-[hsl(210_75%_50%)]' },
  { name: 'Doenças Exantemáticas', color: 'bg-[hsl(0_72%_51%)]' },
  { name: 'Distúrbios do Crescimento', color: 'bg-[hsl(35_85%_52%)]' },
  { name: 'Imunizações', color: 'bg-[hsl(168_55%_42%)]' },
  { name: 'Neonatologia', color: 'bg-[hsl(320_50%_55%)]' },
];

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="aspect-video overflow-hidden rounded-t-xl relative bg-muted">
      {!loaded && !errored && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

export default function PediatriaPortal() {
  const { content, loading } = usePublicEducationContent();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const allPediatric = useMemo(
    () =>
      content.filter(
        (c) =>
          c.specialty?.toLowerCase() === 'pediatrics' ||
          c.specialty?.toLowerCase() === 'pediatria',
      ),
    [content],
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    allPediatric.forEach((c) => {
      if (!c.category) return;
      map.set(c.category, (map.get(c.category) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [allPediatric]);

  const filteredPediatric = useMemo(
    () =>
      activeCategory === 'all'
        ? allPediatric
        : allPediatric.filter((c) => c.category === activeCategory),
    [allPediatric, activeCategory],
  );

  const pediatricContent = filteredPediatric.slice(0, 9);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/especialidades" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg" style={{ color: PEDIA_COLOR }}>Pedia</span>
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
                className={`gap-2 bg-gradient-to-r ${PEDIA_GRADIENT} hover:opacity-90`}
              >
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ backgroundColor: PEDIA_COLOR }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: PEDIA_COLOR }} />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: `${PEDIA_COLOR}20`, color: PEDIA_COLOR }}
            >
              <Stethoscope className="h-4 w-4" />
              Plataforma Clínica de Pediatria
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Ferramentas Clínicas para{' '}
              <span style={{ color: PEDIA_COLOR }}>Pediatria</span>
              <br />
              do Recém-Nascido ao Adolescente
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Curvas OMS, APGAR, PEWS, doses por peso, calendário vacinal e protocolos
              baseados nas diretrizes da SBP e AAP — desenhados para a prática diária do pediatra.
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
                  className={`gap-2 px-8 h-12 text-base shadow-lg bg-gradient-to-r ${PEDIA_GRADIENT} hover:opacity-90`}
                >
                  <Calculator className="h-5 w-5" />
                  Abrir Calculadoras Pediátricas
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
              Toolkit Pediátrico <span style={{ color: PEDIA_COLOR }}>Completo</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Construído para pediatras e equipes de pronto-atendimento infantil.
              Scores validados, dosagem segura por peso e protocolos de emergência.
            </p>
          </div>

          <FeatureGrid columns={3}>
            {pediaTools.map((tool) => (
              <FeatureCard key={tool.title} {...tool} gradient />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Pediatric Knowledge */}
      <section id="knowledge" className="py-20 px-6 bg-card/40 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: `${PEDIA_COLOR}20`, color: PEDIA_COLOR }}
            >
              <BookOpen className="h-4 w-4" />
              Conhecimento Pediátrico
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Biblioteca <span style={{ color: PEDIA_COLOR }}>Pedia</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Artigos, diretrizes e revisões publicadas pela comunidade clínica, alinhadas com SBP e AAP.
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : pediatricContent.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Nenhum conteúdo pediátrico publicado ainda.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  A biblioteca completa está disponível para usuários registrados.
                </p>
                <Link to="/learn/pediatrics">
                  <Button className={`gap-2 bg-gradient-to-r ${PEDIA_GRADIENT} hover:opacity-90`}>
                    <BookOpen className="h-4 w-4" />
                    Explorar Biblioteca Completa
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pediatricContent.map((item) => (
                  <Link
                    key={item.id}
                    to="/learn/pediatrics"
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    aria-label={`Ler: ${item.title}`}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 flex flex-col h-full cursor-pointer">
                      {item.featured_image_url && (
                        <CardImage src={item.featured_image_url} alt={item.title} />
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: `${PEDIA_COLOR}15`, color: PEDIA_COLOR }}
                          >
                            {item.category}
                          </Badge>
                          {item.is_featured && (
                            <Badge variant="default" className="text-xs">Destaque</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        {item.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {item.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                          <div className="flex items-center gap-3">
                            {item.reading_time_minutes && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.reading_time_minutes} min
                              </span>
                            )}
                            {item.published_at && (
                              <span>{format(new Date(item.published_at), 'dd MMM yyyy')}</span>
                            )}
                          </div>
                          <span
                            className="inline-flex items-center gap-1 font-medium group-hover:underline"
                            style={{ color: PEDIA_COLOR }}
                          >
                            Ler <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Foi útil?
                          </span>
                          <ContentVoteButtons contentId={item.id} accentColor={PEDIA_COLOR} />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link to="/learn/pediatrics">
                  <Button size="lg" variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Ver toda a biblioteca pediátrica
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold text-center mb-8">Acesso Rápido</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/scores">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Calculator className="h-6 w-6" style={{ color: PEDIA_COLOR }} />
                <span>Calculadoras</span>
              </Button>
            </Link>
            <Link to="/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Users className="h-6 w-6" style={{ color: PEDIA_COLOR }} />
                <span>Pacientes</span>
              </Button>
            </Link>
            <Link to="/monitoring">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Shield className="h-6 w-6" style={{ color: PEDIA_COLOR }} />
                <span>Monitorização</span>
              </Button>
            </Link>
            <a href="#knowledge">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50">
                <Brain className="h-6 w-6" style={{ color: PEDIA_COLOR }} />
                <span>Conhecimento</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Society */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            Conteúdo alinhado com as diretrizes da{' '}
            <a
              href="https://www.sbp.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: PEDIA_COLOR }}
            >
              SBP — Sociedade Brasileira de Pediatria
            </a>{' '}
            e da AAP (American Academy of Pediatrics).
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
                <p className="font-medium text-foreground">Pedia by UHS Health OS</p>
                <p className="text-xs">Plataforma Clínica de Pediatria</p>
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
