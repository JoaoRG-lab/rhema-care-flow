import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const topics = [
  {
    title: 'Fibromialgia',
    href: '/reumatismos/fibromialgia',
    summary:
      'Dor crônica generalizada, sono não reparador, fadiga e hipersensibilidade. A educação em saúde ajuda a reduzir medo, atraso diagnóstico e uso inadequado de exames.',
    tags: ['dor crônica', 'sono', 'educação'],
  },
  {
    title: 'Artrite reumatoide',
    href: '/reumatismos/artrite-reumatoide',
    summary:
      'Doença inflamatória autoimune que pode causar dor, rigidez matinal e inchaço articular. O reconhecimento precoce muda prognóstico e função.',
    tags: ['inflamação', 'articulações', 'DMARDs'],
  },
  {
    title: 'Lúpus eritematoso sistêmico',
    href: '/reumatismos/lupus',
    summary:
      'Condição autoimune sistêmica com manifestações variadas. Informação clara é essencial para adesão, monitorização e cuidado longitudinal.',
    tags: ['autoimune', 'monitorização', 'longitudinal'],
  },
  {
    title: 'Osteoporose',
    href: '/reumatismos/osteoporose',
    summary:
      'Fragilidade óssea e risco de fraturas, frequentemente silenciosa até o primeiro evento. Prevenção, rastreio e adesão são decisivos.',
    tags: ['osso', 'fratura', 'prevenção'],
  },
  {
    title: 'Gota',
    href: '/reumatismos/gota',
    summary:
      'Artrite por cristais associada ao ácido úrico. Crises recorrentes podem ser prevenidas com diagnóstico correto, metas e acompanhamento.',
    tags: ['cristais', 'ácido úrico', 'crises'],
  },
  {
    title: 'Dor lombar inflamatória',
    href: '/reumatismos/dor-lombar-inflamatoria',
    summary:
      'Dor lombar com padrão inflamatório pode sugerir espondiloartrites. Diferenciar de dor mecânica evita anos de atraso diagnóstico.',
    tags: ['coluna', 'espondiloartrite', 'diagnóstico precoce'],
  },
];

const principles = [
  'Conteúdo educativo, sem substituir avaliação médica.',
  'Linguagem clara para pacientes e útil para profissionais.',
  'Organização por jornada clínica e não apenas por páginas soltas.',
  'Privacidade by design: sem coleta de dados sensíveis no ambiente público.',
];

const journeys = [
  {
    title: 'Tenho dor ou rigidez persistente',
    description: 'Comece por sinais de alerta, padrões de dor e quando procurar avaliação especializada.',
  },
  {
    title: 'Recebi um diagnóstico reumatológico',
    description: 'Entenda o nome da doença, objetivos do tratamento, seguimento e dúvidas comuns.',
  },
  {
    title: 'Quero acompanhar melhor minha saúde',
    description: 'Use educação, registros, escalas clínicas e consulta regular para reduzir ruído e melhorar decisões.',
  },
];

const hubJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Reumatismos.com — Biblioteca pública de reumatologia',
  description: 'Hub educativo sobre fibromialgia, artrite reumatoide, lúpus, osteoporose, gota e dor lombar inflamatória.',
  url: 'https://www.reumatismos.com/reumatismos',
  inLanguage: 'pt-BR',
  publisher: {
    '@type': 'Organization',
    name: 'UHS Health OS / Protocolo Vida',
    url: 'https://www.reumatismos.com',
  },
};

export default function ReumatismosKnowledge() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Reumatismos.com — Biblioteca pública de Reumatologia"
        description="Guias educativos sobre fibromialgia, artrite reumatoide, lúpus, osteoporose, gota e dor lombar inflamatória. Conteúdo claro, seguro e sem substituir avaliação médica."
        path="/reumatismos"
        jsonLd={hubJsonLd}
      />
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Reumatismos.com</p>
              <p className="text-xs text-muted-foreground">UHS Health OS / Protocolo Vida</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/learn">Biblioteca</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/reumato">Reumatologia</Link>
            </Button>
            <Button asChild>
              <Link to="/tell-us">Fale conosco</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]" />
          <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div className="space-y-6">
              <Badge className="w-fit" variant="secondary">
                Biblioteca pública de reumatologia
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  Entenda sintomas, diagnósticos e tratamentos reumatológicos com mais clareza.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Um hub educativo para pacientes, cuidadores e profissionais navegarem temas frequentes em reumatologia sem alarmismo, sem promessas fáceis e sem substituir a consulta médica.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <a href="#temas">
                    Escolher um tema <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#jornada">Ver por onde começar</a>
                </Button>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4 text-sm text-muted-foreground shadow-sm">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>
                  Informação em saúde precisa orientar, não assustar. Procure atendimento presencial em sintomas intensos, perda funcional importante, febre persistente, falta de ar, dor torácica ou piora rápida do estado geral.
                </p>
              </div>
            </div>

            <Card className="border-primary/20 bg-card/95 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  O que torna esta biblioteca diferente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {principles.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl bg-muted/50 p-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="jornada" className="container mx-auto px-4 py-14">
          <div className="mb-8 max-w-3xl space-y-3">
            <Badge variant="outline" className="w-fit">Jornada do usuário</Badge>
            <h2 className="text-3xl font-bold">Por onde começar?</h2>
            <p className="text-muted-foreground">
              A navegação foi pensada para diferentes momentos: quem ainda está investigando sintomas, quem recebeu um diagnóstico e quem precisa acompanhar melhor uma condição crônica.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {journeys.map((item, index) => (
              <Card key={item.title} className="h-full border-primary/10 bg-card/80">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="temas" className="border-y bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <div className="mb-8 max-w-3xl space-y-3">
              <Badge variant="outline" className="w-fit">Condições frequentes</Badge>
              <h2 className="text-3xl font-bold">Temas âncora iniciais</h2>
              <p className="text-muted-foreground">
                Cada tema pode evoluir para artigo, FAQ, checklist, calculadora, infográfico e trilha de acompanhamento. O objetivo é transformar informação dispersa em uma jornada clínica compreensível.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => {
                const card = (
                  <Card className="h-full transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-start gap-2 text-xl">
                        <BookOpen className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">{topic.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {topic.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                      <p className="inline-flex items-center text-sm font-medium text-primary">
                        Ler guia completo <ArrowRight className="ml-1 h-4 w-4" />
                      </p>
                    </CardContent>
                  </Card>
                );

                return (
                  <Link key={topic.title} to={topic.href} className="block h-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                <h2 className="text-2xl font-bold">Conteúdo público, cuidado real.</h2>
              </div>
              <p className="text-primary-foreground/85">
                A biblioteca pública ajuda a organizar dúvidas, mas decisões clínicas dependem de avaliação individual, exame físico, contexto e acompanhamento.
              </p>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/tell-us">Sugerir tema</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Próxima evolução da biblioteca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                O próximo passo é ampliar cada guia com perguntas frequentes, sinais de alerta, glossário, recursos visuais e links entre condições relacionadas.
              </p>
              <p>
                O site público deve continuar útil mesmo quando recursos dinâmicos, como assistente de IA ou backend, estiverem indisponíveis.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}