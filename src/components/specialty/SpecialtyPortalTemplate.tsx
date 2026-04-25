import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { FeatureCard, FeatureGrid } from '@/components/brand/FeatureCard';
import {
  Calculator,
  ArrowRight,
  BookOpen,
  Users,
  Search,
  Sparkles,
  Video,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { type SpecialtyConfig } from '@/config/specialties';

interface SpecialtyPortalTemplateProps {
  specialty: SpecialtyConfig;
}

export function SpecialtyPortalTemplate({ specialty }: SpecialtyPortalTemplateProps) {
  const Icon = specialty.icon;
  const redirectParam = `?redirect=${encodeURIComponent(`/specialty/${specialty.id}`)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/especialidades" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg" style={{ color: specialty.color }}>
                {specialty.shortName}
              </span>
              <span className="text-xs text-muted-foreground block">by UHS Health OS</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to={`/login${redirectParam}`}>
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to={`/signup${redirectParam}`}>
              <Button
                size="sm"
                className="gap-2 hover:opacity-90"
                style={{ background: `linear-gradient(to right, ${specialty.color}, ${specialty.color}dd)` }}
              >
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ backgroundColor: specialty.color }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: specialty.color }} />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: `${specialty.color}20`, color: specialty.color }}
            >
              <Icon className="h-4 w-4" />
              {specialty.namePt} — Plataforma Clínica
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Ferramentas Clínicas para{' '}
              <span style={{ color: specialty.color }}>{specialty.namePt}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              {specialty.descriptionPt}. Calculadoras, protocolos, teleconsulta
              e conhecimento baseado em evidências para sua prática clínica.
            </p>

            {/* Condition Pills */}
            {specialty.conditions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {specialty.conditions.map((condition) => (
                  <span
                    key={condition.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm"
                  >
                    <span className={`w-2 h-2 rounded-full ${condition.color}`} />
                    {condition.name}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/scores">
                <Button
                  size="lg"
                  className="gap-2 px-8 h-12 text-base shadow-lg hover:opacity-90"
                  style={{ background: `linear-gradient(to right, ${specialty.color}, ${specialty.color}dd)` }}
                >
                  <Calculator className="h-5 w-5" />
                  Calculadoras
                </Button>
              </Link>
              <Link to="/teleconsulta">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <Video className="h-5 w-5" />
                  Teleconsulta
                </Button>
              </Link>
              <Link to={`/knowledge?specialty=${specialty.id}`}>
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <BookOpen className="h-5 w-5" />
                  Biblioteca
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TELECONSULTA + PRESCRIÇÃO MEMED ── destaque para todas as especialidades */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border-y border-blue-100 dark:border-blue-900">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge className="bg-blue-600 text-white mb-4 px-3 py-1 text-xs">
              <Video className="h-3 w-3 mr-1.5 inline" />
              Teleconsulta + Prescrição Digital
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Atenda por vídeo e prescreva com{' '}
              <span className="text-blue-600">assinatura digital</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Para médicos de <strong>{specialty.namePt}</strong> — realize teleconsultas, 
              emita prescrições digitais pela plataforma Memed e assine com certificado 
              digital A1 ou A3 diretamente pelo navegador.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {/* Card 1: Teleconsulta */}
            <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <Video className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Vídeo Consulta</h3>
                <p className="text-xs text-muted-foreground">
                  Sala de vídeo WebRTC segura via Daily.co. Agendamento, histórico 
                  e acesso com 1 clique.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Prescrição Memed */}
            <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Prescrição Memed</h3>
                <p className="text-xs text-muted-foreground">
                  Integração oficial com o módulo Memed. Prescreva medicamentos 
                  durante a consulta, com auto-complete e posologia completa.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Assinatura A1/A3 */}
            <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Assinatura A1 / A3</h3>
                <p className="text-xs text-muted-foreground">
                  Validade jurídica garantida. O módulo Memed detecta automaticamente 
                  seu certificado digital instalado (ICP-Brasil).
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/teleconsulta">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 h-11">
                <Video className="h-4 w-4" />
                Acessar Teleconsulta
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="gap-2 px-8 h-11 border-blue-300 text-blue-700 dark:text-blue-400">
                Criar Conta Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      {specialty.tools.length > 0 && (
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ferramentas <span style={{ color: specialty.color }}>Clínicas</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Scores validados, calculadoras e protocolos baseados em evidências 
                para {specialty.namePt}.
              </p>
            </div>
            <FeatureGrid columns={3}>
              {specialty.tools.map((tool) => (
                <FeatureCard
                  key={tool.label}
                  icon={tool.icon}
                  title={tool.label}
                  description={tool.description}
                  badge={tool.badge}
                  gradient
                />
              ))}
            </FeatureGrid>
          </div>
        </section>
      )}

      {/* Acesso Rápido */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold text-center mb-8">Acesso Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { to: '/scores',      Icon: Calculator,  label: 'Calculadoras' },
              { to: '/teleconsulta',Icon: Video,        label: 'Teleconsulta' },
              { to: '/patients',    Icon: Users,        label: 'Pacientes'    },
              { to: `/knowledge?specialty=${specialty.id}`, Icon: BookOpen, label: 'Conhecimento' },
              { to: '/ai-assistant',Icon: Sparkles,     label: 'AI Assistant' },
            ].map(({ to, Icon: I, label }) => (
              <Link to={to} key={label}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50"
                >
                  <I className="h-6 w-6" style={{ color: specialty.color }} />
                  <span className="text-xs">{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Busca de Conhecimento */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Biblioteca de Conhecimento</h3>
            <p className="text-muted-foreground">
              Artigos, guidelines e pearls clínicas específicos para {specialty.namePt}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/knowledge?specialty=${specialty.id}`}>
              <Button variant="outline" className="gap-2 px-6">
                <Search className="h-4 w-4" />
                Explorar Biblioteca
              </Button>
            </Link>
            <Link to={`/learn?specialty=${specialty.id}`}>
              <Button variant="outline" className="gap-2 px-6">
                <BookOpen className="h-4 w-4" />
                Artigos Publicados
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sociedade */}
      {specialty.society && (
        <section className="py-10 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="text-sm mb-4">Sociedade Médica de Referência</Badge>
            <p className="text-muted-foreground">
              Conteúdo alinhado com as diretrizes da{' '}
              {specialty.societyUrl ? (
                <a href={specialty.societyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {specialty.society}
                </a>
              ) : (
                <span className="font-medium">{specialty.society}</span>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UHSLogo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{specialty.shortName} — UHS Health OS</p>
                <p className="text-xs">{specialty.namePt} — Plataforma Clínica</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TrustBadge variant="privacy" size="sm" />
              <TrustBadge variant="verified" size="sm" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Ferramenta organizacional para profissionais de saúde. Não substitui prontuário eletrônico (PEP).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
