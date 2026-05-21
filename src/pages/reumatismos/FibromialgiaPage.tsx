import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, Brain, CheckCircle2, Moon, Route, ShieldCheck, Stethoscope } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const symptoms = [
  'Dor difusa ou em múltiplas regiões do corpo',
  'Fadiga persistente e sensação de energia baixa',
  'Sono não reparador, mesmo após muitas horas na cama',
  'Dificuldade de concentração ou memória, frequentemente chamada de “fibro fog”',
  'Cefaleia, sintomas intestinais, ansiedade ou piora com estresse em parte dos casos',
];

const journey = [
  {
    title: '1. Reconhecer o padrão',
    text: 'A fibromialgia costuma envolver dor persistente, fadiga, sono ruim e hipersensibilidade. O reconhecimento do padrão reduz medo e investigação sem direção.',
  },
  {
    title: '2. Excluir sinais de outra doença ativa',
    text: 'Exames podem ser úteis quando há suspeita de inflamação, anemia, alterações hormonais ou outras condições associadas. Exame normal não torna a dor “imaginária”.',
  },
  {
    title: '3. Construir plano gradual',
    text: 'Educação, sono, movimento progressivo e manejo de estresse formam a base. Medicamentos podem ter papel em casos selecionados, sempre individualizados por profissional habilitado.',
  },
  {
    title: '4. Acompanhar com metas pequenas',
    text: 'Melhora sustentável costuma vir por metas realistas: caminhar um pouco mais, dormir melhor, reduzir crises e recuperar função, não por promessas rápidas.',
  },
];

const redFlags = [
  'Febre persistente ou perda de peso inexplicada',
  'Inchaço articular objetivo, calor ou vermelhidão nas articulações',
  'Fraqueza progressiva, perda de força ou alteração neurológica nova',
  'Dor noturna intensa e progressiva sem alívio',
  'Sintomas novos e importantes após infecção, trauma ou uso de nova medicação',
];

const principles = [
  'Dor real não exige exame alterado para ser validada.',
  'Exercício precisa ser gradual, adaptado e sustentável.',
  'Sono, estresse e rotina importam tanto quanto remédios.',
  'O objetivo é recuperar função e autonomia, não perseguir uma cura instantânea.',
];

const fibromyalgiaJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Fibromialgia: dor real, sistema sensível e cuidado progressivo',
    description:
      'Guia educativo sobre fibromialgia, dor crônica generalizada, fadiga, sono não reparador e sinais que pedem avaliação profissional.',
    url: 'https://www.reumatismos.com/reumatismos/fibromialgia',
    inLanguage: 'pt-BR',
    medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
    about: { '@type': 'MedicalCondition', name: 'Fibromialgia' },
    publisher: {
      '@type': 'Organization',
      name: 'UHS Health OS / Protocolo Vida',
      url: 'https://www.reumatismos.com',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Reumatismos', item: 'https://www.reumatismos.com/reumatismos' },
      { '@type': 'ListItem', position: 2, name: 'Fibromialgia', item: 'https://www.reumatismos.com/reumatismos/fibromialgia' },
    ],
  },
];

export default function FibromialgiaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Fibromialgia: dor real, sistema sensível e cuidado progressivo"
        description="Guia educativo sobre fibromialgia, dor crônica generalizada, fadiga, sono não reparador, sinais de atenção e cuidado progressivo."
        path="/reumatismos/fibromialgia"
        type="article"
        jsonLd={fibromyalgiaJsonLd}
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
            <Badge variant="secondary" className="w-fit">Guia educativo</Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                Fibromialgia: dor real, sistema sensível e cuidado progressivo.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                A fibromialgia é uma condição crônica associada a dor generalizada, fadiga, sono não reparador e maior sensibilidade do sistema nervoso. Informação clara ajuda a reduzir medo, atraso diagnóstico e tratamentos mal direcionados.
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
                <Brain className="h-5 w-5 text-primary" />
                Ideia central
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Fibromialgia não é uma inflamação articular clássica nem uma doença autoimune típica. O problema envolve processamento da dor, sono, fadiga, resposta ao estresse e sensibilidade corporal.
              </p>
              <p>
                Por isso, o cuidado precisa ser longitudinal: compreender o quadro, excluir sinais de alerta, organizar rotina e construir metas pequenas de recuperação funcional.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="border-y bg-muted/30 py-14">
          <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Sintomas comuns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {symptoms.map((item) => (
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
                {redFlags.map((item) => (
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
              A fibromialgia costuma melhorar quando o cuidado deixa de ser episódico e passa a ser organizado em etapas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {journey.map((step) => (
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
              <Badge variant="outline" className="w-fit">Base do tratamento</Badge>
              <h2 className="text-3xl font-bold">O plano precisa caber na vida real.</h2>
              <p className="text-muted-foreground">
                Movimento gradual, sono, educação, manejo de estresse e acompanhamento são pilares. O excesso de intensidade cedo demais pode piorar adesão; a progressão precisa ser inteligente.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {principles.map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-4">
                  <Moon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Quer entender melhor sua jornada?</h2>
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
