import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { SpecialtyConfig } from '@/config/specialties';

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
              <span 
                className="font-bold text-lg"
                style={{ color: specialty.color }}
              >
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
                style={{ 
                  background: `linear-gradient(to right, ${specialty.color}, ${specialty.color}dd)` 
                }}
              >
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 hero-pattern overflow-hidden">
        <div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: specialty.color }}
        />
        <div 
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: specialty.color }}
        />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ 
                backgroundColor: `${specialty.color}20`,
                color: specialty.color 
              }}
            >
              <Icon className="h-4 w-4" />
              {specialty.namePt} - Plataforma Clínica
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Ferramentas Clínicas para{' '}
              <span style={{ color: specialty.color }}>
                {specialty.namePt}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              {specialty.descriptionPt}. Calculadoras, protocolos, monitorização 
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/scores">
                <Button 
                  size="lg" 
                  className="gap-2 px-8 h-12 text-base shadow-lg hover:opacity-90"
                  style={{ 
                    background: `linear-gradient(to right, ${specialty.color}, ${specialty.color}dd)` 
                  }}
                >
                  <Calculator className="h-5 w-5" />
                  Abrir Calculadoras
                </Button>
              </Link>
              <Link to={`/knowledge?specialty=${specialty.id}`}>
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <BookOpen className="h-5 w-5" />
                  Biblioteca de Conhecimento
                </Button>
              </Link>
            </div>
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
                Construído por especialistas, para especialistas. Scores validados e 
                protocolos baseados em evidências ao seu alcance.
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

      {/* Knowledge Search CTA */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Busca de Conhecimento</h3>
            <p className="text-muted-foreground">
              Acesse artigos, guidelines e pearls clínicas específicos para {specialty.namePt}
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

      {/* Quick Links */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-xl font-semibold text-center mb-8">Acesso Rápido</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/scores">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50"
                style={{ ['--hover-color' as string]: specialty.color }}
              >
                <Calculator className="h-6 w-6" style={{ color: specialty.color }} />
                <span>Calculadoras</span>
              </Button>
            </Link>
            <Link to="/patients">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50"
              >
                <Users className="h-6 w-6" style={{ color: specialty.color }} />
                <span>Pacientes</span>
              </Button>
            </Link>
            <Link to={`/knowledge?specialty=${specialty.id}`}>
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50"
              >
                <BookOpen className="h-6 w-6" style={{ color: specialty.color }} />
                <span>Conhecimento</span>
              </Button>
            </Link>
            <Link to="/ai-assistant">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/50"
              >
                <Sparkles className="h-6 w-6" style={{ color: specialty.color }} />
                <span>AI Assistant</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Society Info */}
      {specialty.society && (
        <section className="py-10 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="text-sm mb-4">
              Sociedade Médica
            </Badge>
            <p className="text-muted-foreground">
              Conteúdo alinhado com as diretrizes da{' '}
              {specialty.societyUrl ? (
                <a 
                  href={specialty.societyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
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
                <p className="font-medium text-foreground">
                  {specialty.shortName} by UHS Health OS
                </p>
                <p className="text-xs">{specialty.namePt} - Plataforma Clínica</p>
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
