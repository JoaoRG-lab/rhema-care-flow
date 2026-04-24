import { useState, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import {
  Search,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SPECIALTIES, 
  getSpecialtyById, 
  getActiveSpecialties, 
  getInactiveSpecialties,
  ACTIVE_SPECIALTIES,
} from '@/config/specialties';
import { SpecialtyPortalTemplate } from '@/components/specialty/SpecialtyPortalTemplate';
import PediatriaPortal from '@/pages/PediatriaPortal';
import GinecologiaPortal from '@/pages/GinecologiaPortal';
import ReumatoPortal from '@/pages/ReumatoPortal';

export default function SpecialtyPortal() {
  const { specialtyId } = useParams<{ specialtyId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter specialties based on search
  const filteredSpecialties = useMemo(() => {
    if (!searchQuery.trim()) return SPECIALTIES;
    
    const query = searchQuery.toLowerCase();
    return SPECIALTIES.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.namePt.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.descriptionPt.toLowerCase().includes(query) ||
      s.conditions.some(c => c.name.toLowerCase().includes(query)) ||
      s.diseaseAreas.some(d => d.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const activeSpecialties = filteredSpecialties.filter(s => s.isActive);
  const inactiveSpecialties = filteredSpecialties.filter(s => !s.isActive);

  // If we have a specialty ID, show that specialty's portal
  if (specialtyId) {
    const specialty = getSpecialtyById(specialtyId);

    // If specialty not found or not active, redirect to main portal
    if (!specialty || !specialty.isActive) {
      return <Navigate to="/especialidades" replace />;
    }

    // Rheumatology dedicated portal
    if (specialty.id === 'rheumatology') {
      return <ReumatoPortal />;
    }
    // Pediatrics has a dedicated, full portal (parity with /reumato)
    if (specialty.id === 'pediatrics') {
      return <PediatriaPortal />;
    }
    // Obstetrics & Gynecology has a dedicated PT-BR portal at /ginecologia
    if (specialty.id === 'obstetrics') {
      return <GinecologiaPortal />;
    }

    return <SpecialtyPortalTemplate specialty={specialty} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 uhs-glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <UHSLogo size="sm" showText={false} />
            <div>
              <span className="font-bold text-lg gradient-text">HealthOS</span>
              <span className="text-xs text-muted-foreground block">Escolha sua Especialidade</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
                Criar Conta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 hero-pattern overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[hsl(42_85%_55%)]/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Plataforma Clínica Universal
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Escolha sua{' '}
              <span className="gradient-text">Especialidade</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Ferramentas clínicas baseadas em evidências para todas as especialidades 
              médicas que exigem residência em Clínica Médica.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar especialidade ou condição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Active Specialties */}
      {activeSpecialties.length > 0 && (
        <section className="py-12 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold">Especialidades Ativas</h2>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {activeSpecialties.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeSpecialties.map((specialty) => {
                const Icon = specialty.icon;
                const href =
                  specialty.id === 'rheumatology' ? '/reumato'
                  : specialty.id === 'pediatrics'  ? '/pediatria'
                  : specialty.id === 'obstetrics'  ? '/ginecologia'
                  : `/specialty/${specialty.id}`;
                
                return (
                  <Link key={specialty.id} to={href}>
                    <Card className={cn(
                      "h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
                      "ring-2 ring-offset-2"
                    )} style={{ borderColor: specialty.color, boxShadow: `0 0 0 2px ${specialty.color}40` }}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${specialty.color}20` }}
                          >
                            <Icon className="h-6 w-6" style={{ color: specialty.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {specialty.namePt}
                              </h3>
                              <span 
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0"
                                style={{ backgroundColor: `${specialty.color}20`, color: specialty.color }}
                              >
                                ATIVO
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {specialty.descriptionPt}
                            </p>
                            
                            {/* Society */}
                            <div className="text-[10px] text-muted-foreground mb-2 truncate">
                              {specialty.society.split(' - ')[0]}
                            </div>

                            {/* Conditions preview */}
                            {specialty.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {specialty.conditions.slice(0, 2).map((cond) => (
                                  <span
                                    key={cond.name}
                                    className="px-2 py-0.5 text-[10px] rounded-full"
                                    style={{ 
                                      backgroundColor: `${specialty.color}15`,
                                      color: specialty.color 
                                    }}
                                  >
                                    {cond.name}
                                  </span>
                                ))}
                                {specialty.conditions.length > 2 && (
                                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                                    +{specialty.conditions.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <span className="text-xs text-primary flex items-center gap-1">
                            Acessar Portal
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon Specialties */}
      {inactiveSpecialties.length > 0 && (
        <section className="py-12 px-6 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-muted-foreground">Em Breve</h2>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                {inactiveSpecialties.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inactiveSpecialties.map((specialty) => {
                const Icon = specialty.icon;
                
                return (
                  <Card 
                    key={specialty.id}
                    className="h-full opacity-60 cursor-not-allowed"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div 
                          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${specialty.color}10` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: specialty.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate mb-1">
                            {specialty.namePt}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {specialty.descriptionPt}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Em breve
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-4">
            <GraduationCap className="h-4 w-4" />
            Formação Médica
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Pré-requisito: <span className="gradient-text">Clínica Médica</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Todas as especialidades listadas aqui seguem as normas da CNRM (Comissão Nacional 
            de Residência Médica) e exigem conclusão prévia da residência em Clínica Médica.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <TrustBadge variant="verified" size="md" />
            <TrustBadge variant="privacy" size="md" />
            <TrustBadge variant="blockchain" size="md" />
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
                <p className="font-medium text-foreground">UHS Health OS</p>
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
              Esta é uma ferramenta organizacional para profissionais de saúde. Não é um sistema de prontuário eletrônico.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
