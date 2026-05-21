import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Route, ShieldCheck, Stethoscope } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSection, buildFAQJsonLd, type FAQItem } from '@/components/reumatismos/FAQSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type GuideStep = {
  title: string;
  text: string;
};

export type RheumatologyGuide = {
  badge: string;
  title: string;
  subtitle: string;
  slug: string;
  keywords: string[];
  centralIdeaTitle: string;
  centralIdea: string[];
  commonSignsTitle?: string;
  commonSigns: string[];
  redFlags: string[];
  journey: GuideStep[];
  principlesTitle: string;
  principlesIntro: string;
  principles: string[];
  faqs?: FAQItem[];
};

type RheumatologyGuidePageProps = {
  guide: RheumatologyGuide;
};

function buildMedicalJsonLd(guide: RheumatologyGuide) {
  const url = `https://www.reumatismos.com/reumatismos/${guide.slug}`;
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: guide.title,
      description: guide.subtitle,
      url,
      inLanguage: 'pt-BR',
      medicalAudience: {
        '@type': 'MedicalAudience',
        audienceType: 'Patient',
      },
      publisher: {
        '@type': 'Organization',
        name: 'UHS Health OS / Protocolo Vida',
        url: 'https://www.reumatismos.com',
      },
      about: guide.keywords.map((keyword) => ({
        '@type': 'MedicalCondition',
        name: keyword,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Reumatismos',
          item: 'https://www.reumatismos.com/reumatismos',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: guide.keywords[0] ?? guide.title,
          item: url,
        },
      ],
    },
  ];

  if (guide.faqs?.length) {
    schemas.push(buildFAQJsonLd(guide.faqs));
  }

  return schemas;
}

export function RheumatologyGuidePage({ guide }: RheumatologyGuidePageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={guide.title}
        description={guide.subtitle}
        path={`/reumatismos/${guide.slug}`}
        type="article"
        jsonLd={buildMedicalJsonLd(guide)}
      />
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/reumatismos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Reumatismos
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/tell-us">Sugerir tema</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto grid gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit">{guide.badge}</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                {guide.title}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                {guide.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/learn">Ver biblioteca</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/reumato">Portal de Reumatologia</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Conteúdo educativo. Não substitui consulta, diagnóstico ou tratamento individualizado.
            </p>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                {guide.centralIdeaTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              {guide.centralIdea.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="border-y bg-muted/30 py-14">
          <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {guide.commonSignsTitle ?? 'Sinais e sintomas comuns'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guide.commonSigns.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Sinais que pedem avaliação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guide.redFlags.map((item) => (
                  <div key={item} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <div className="mb-8 max-w-3xl space-y-3">
            <h2 className="text-3xl font-bold">Jornada de cuidado</h2>
            <p className="text-muted-foreground">
              O cuidado ganha força quando sai de ações soltas e passa a ter etapas, metas e acompanhamento.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {guide.journey.map((step) => (
              <Card key={step.title} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Route className="h-5 w-5 text-primary" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30 py-14">
          <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit">Base do cuidado</Badge>
              <h2 className="text-3xl font-bold">{guide.principlesTitle}</h2>
              <p className="text-muted-foreground">{guide.principlesIntro}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {guide.principles.map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-4">
                  <BookOpen className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {guide.faqs?.length ? <FAQSection items={guide.faqs} /> : null}

        <section className="container mx-auto px-4 py-14">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Quer continuar aprendendo?</h2>
                <p className="max-w-2xl text-primary-foreground/85">
                  Use a biblioteca pública para educação e procure avaliação profissional para decisões clínicas individuais.
                </p>
              </div>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/learn">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Continuar na biblioteca
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
