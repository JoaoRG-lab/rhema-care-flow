import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const topics = [
  {
    title: 'Fibromialgia',
    summary:
      'Dor crônica generalizada, sono não reparador, fadiga e hipersensibilidade. A educação em saúde ajuda a reduzir medo, atraso diagnóstico e uso inadequado de exames.',
    tags: ['dor crônica', 'sono', 'educação'],
  },
  {
    title: 'Artrite reumatoide',
    summary:
      'Doença inflamatória autoimune que pode causar dor, rigidez matinal e inchaço articular. O reconhecimento precoce muda prognóstico e função.',
    tags: ['inflamação', 'articulações', 'DMARDs'],
  },
  {
    title: 'Lúpus eritematoso sistêmico',
    summary:
      'Condição autoimune sistêmica com manifestações variadas. Informação clara é essencial para adesão, monitorização e cuidado longitudinal.',
    tags: ['autoimune', 'monitorização', 'longitudinal'],
  },
  {
    title: 'Osteoporose',
    summary:
      'Fragilidade óssea e risco de fraturas, frequentemente silenciosa até o primeiro evento. Prevenção, rastreio e adesão são decisivos.',
    tags: ['osso', 'fratura', 'prevenção'],
  },
  {
    title: 'Gota',
    summary:
      'Artrite por cristais associada ao ácido úrico. Crises recorrentes podem ser prevenidas com diagnóstico correto, metas e acompanhamento.',
    tags: ['cristais', 'ácido úrico', 'crises'],
  },
  {
    title: 'Dor lombar inflamatória',
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

export default function ReumatismosKnowledge() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
        <section className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit" variant="secondary">
              Semente pública de conhecimento
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                Reumatologia explicada com clareza, segurança e continuidade.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                Um hub público para organizar temas frequentes em reumatologia, reduzir ruído informacional e preparar a biblioteca clínica do UHS Health OS.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/learn">
                  Ver biblioteca atual <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/reumato">Conhecer portal de Reumatologia</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Este conteúdo é educativo e não substitui consulta, diagnóstico ou tratamento individualizado.
            </p>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Como esta semente cresce
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
        </section>

        <section className="border-y bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <div className="mb-8 max-w-3xl space-y-3">
              <h2 className="text-3xl font-bold">Temas âncora iniciais</h2>
              <p className="text-muted-foreground">
                Estes blocos são a fundação editorial. Cada tema pode evoluir para artigo, FAQ, checklist, calculadora, infográfico e trilha de acompanhamento.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => (
                <Card key={topic.title} className="h-full transition hover:-translate-y-1 hover:shadow-md">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Próximo broto: transformar temas em artigos vivos.</h2>
                <p className="max-w-2xl text-primary-foreground/85">
                  A próxima etapa é criar páginas individuais, FAQ estruturado e schema SEO para cada condição, conectando conteúdo, educação e jornada assistencial.
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
