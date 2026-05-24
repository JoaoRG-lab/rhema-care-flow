import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HeartPulse,
  Layers3,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
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

const trustMarkers = [
  'Guias por condição clínica',
  'Leitura clara para pacientes',
  'Base para jornada assistencial',
  'IA pública como apoio progressivo',
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
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 ring-1 ring-primary/15">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Reumatismos.com</p>
              <p className="text-xs text-muted-foreground">Biblioteca pública Rhema Care</p>
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
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_34%),linear-gradient(180deg,hsl(var(--muted)/0.65),transparent_65%)]" />
          <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="space-y-7">
              <div className="flex flex-wrap gap-2">
                <Badge className="w-fit" variant="secondary">
                  Biblioteca pública de reumatologia
                </Badge>
                <Badge className="w-fit bg-background/80" variant="outline">
                  Conteúdo educativo e seguro
                </Badge>
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  Entenda sintomas, diagnósticos e caminhos de cuidado em reumatologia.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Uma porta de entrada clara para pacientes, familiares e profissionais: guias por doença, linguagem acessível e integração progressiva com o Rhema Care Flow.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/reumatismos/fibromialgia">
                    Começar pelos guias <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/tell-us">Sugerir tema ou dúvida</Link>
                </Button>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {trustMarkers.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Este conteúdo é educativo e não substitui consulta, diagnóstico ou tratamento individualizado. Em sintomas intensos, sinais de alarme ou dúvida clínica pessoal, procure avaliação profissional.
              </p>
            </div>

            <Card className="border-primary/20 bg-background/85 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Como usar esta biblioteca
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {principles.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl bg-muted/50 p-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <HeartPulse className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Jornada, não só artigo.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cada tema pode evoluir para FAQ, checklist, calculadora, infográfico e trilha de acompanhamento.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge variant="outline" className="w-fit">Guias iniciais</Badge>
                <h2 className="text-3xl font-bold">Temas âncora da biblioteca</h2>
                <p className="text-muted-foreground">
                  Blocos editoriais para transformar busca confusa em entendimento prático. Cada guia foi pensado como uma porta de entrada para cuidado longitudinal.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/learn">Ver biblioteca completa</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => {
                const card = (
                  <Card className="h-full border-border/80 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
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

        <section className="container mx-auto grid gap-4 px-4 py-14 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers3 className="h-5 w-5 text-primary" />
                Conteúdo público resiliente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              As páginas públicas são pensadas para continuar úteis mesmo quando backend, IA ou painéis internos estiverem indisponíveis.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Privacidade desde o início
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              A área pública informa sem pedir dados sensíveis. O assistente deve apoiar a navegação, não substituir consulta médica.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartPulse className="h-5 w-5 text-primary" />
                Ponte para cuidado real
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              O objetivo não é apenas explicar doenças: é construir uma trilha clara entre educação, triagem segura e acompanhamento.
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Próximo passo: transformar dúvida em trilha de cuidado.</h2>
                <p className="max-w-2xl text-primary-foreground/85">
                  A biblioteca evolui para artigos vivos, FAQ estruturado, calculadoras e navegação orientada por jornada clínica.
                </p>
              </div>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/tell-us">Sugerir tema</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
