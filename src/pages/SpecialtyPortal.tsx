import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import {
  Heart,
  Brain,
  Bone,
  Stethoscope,
  Droplets,
  Activity,
  Shield,
  Pill,
  Baby,
  Microscope,
  Wind,
  Syringe,
  Zap,
  Moon,
  Apple,
  ArrowRight,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Especialidades que exigem pré-requisito de Clínica Médica no Brasil
const SPECIALTIES = [
  {
    id: 'reumatologia',
    name: 'Reumatologia',
    nameEn: 'Rheumatology',
    icon: Bone,
    color: 'hsl(168 55% 42%)',
    bgColor: 'bg-[hsl(168_55%_42%)]/10',
    borderColor: 'border-[hsl(168_55%_42%)]/30',
    description: 'Doenças autoimunes, artrites, lúpus, vasculites e osteoporose.',
    societies: ['SBR', 'ACR', 'EULAR'],
    conditions: ['Artrite Reumatoide', 'Lúpus', 'Espondiloartrites', 'Vasculites'],
    href: '/reumato',
    active: true,
  },
  {
    id: 'cardiologia',
    name: 'Cardiologia',
    nameEn: 'Cardiology',
    icon: Heart,
    color: 'hsl(0 70% 50%)',
    bgColor: 'bg-[hsl(0_70%_50%)]/10',
    borderColor: 'border-[hsl(0_70%_50%)]/30',
    description: 'Insuficiência cardíaca, arritmias, coronariopatias e hipertensão.',
    societies: ['SBC', 'ACC', 'ESC'],
    conditions: ['ICC', 'Fibrilação Atrial', 'DAC', 'Hipertensão'],
    href: '/specialty/cardiologia',
    active: false,
  },
  {
    id: 'gastroenterologia',
    name: 'Gastroenterologia',
    nameEn: 'Gastroenterology',
    icon: Activity,
    color: 'hsl(35 85% 52%)',
    bgColor: 'bg-[hsl(35_85%_52%)]/10',
    borderColor: 'border-[hsl(35_85%_52%)]/30',
    description: 'Doenças do aparelho digestivo, fígado, pâncreas e vias biliares.',
    societies: ['FBG', 'AGA', 'ESGE'],
    conditions: ['DII', 'DRGE', 'Hepatites', 'Cirrose'],
    href: '/specialty/gastroenterologia',
    active: false,
  },
  {
    id: 'pneumologia',
    name: 'Pneumologia',
    nameEn: 'Pulmonology',
    icon: Wind,
    color: 'hsl(200 70% 50%)',
    bgColor: 'bg-[hsl(200_70%_50%)]/10',
    borderColor: 'border-[hsl(200_70%_50%)]/30',
    description: 'Asma, DPOC, pneumonias, fibrose pulmonar e apneia do sono.',
    societies: ['SBPT', 'ATS', 'ERS'],
    conditions: ['Asma', 'DPOC', 'Fibrose Pulmonar', 'Tuberculose'],
    href: '/specialty/pneumologia',
    active: false,
  },
  {
    id: 'nefrologia',
    name: 'Nefrologia',
    nameEn: 'Nephrology',
    icon: Droplets,
    color: 'hsl(280 55% 55%)',
    bgColor: 'bg-[hsl(280_55%_55%)]/10',
    borderColor: 'border-[hsl(280_55%_55%)]/30',
    description: 'Doença renal crônica, diálise, transplante renal e glomerulonefrites.',
    societies: ['SBN', 'ASN', 'ERA-EDTA'],
    conditions: ['DRC', 'Glomerulonefrites', 'IRA', 'Transplante Renal'],
    href: '/specialty/nefrologia',
    active: false,
  },
  {
    id: 'endocrinologia',
    name: 'Endocrinologia',
    nameEn: 'Endocrinology',
    icon: Zap,
    color: 'hsl(45 90% 48%)',
    bgColor: 'bg-[hsl(45_90%_48%)]/10',
    borderColor: 'border-[hsl(45_90%_48%)]/30',
    description: 'Diabetes, tireoide, obesidade, osteoporose e distúrbios hormonais.',
    societies: ['SBEM', 'Endocrine Society', 'ESE'],
    conditions: ['Diabetes', 'Tireoide', 'Obesidade', 'Suprarrenal'],
    href: '/specialty/endocrinologia',
    active: false,
  },
  {
    id: 'hematologia',
    name: 'Hematologia',
    nameEn: 'Hematology',
    icon: Droplets,
    color: 'hsl(350 70% 45%)',
    bgColor: 'bg-[hsl(350_70%_45%)]/10',
    borderColor: 'border-[hsl(350_70%_45%)]/30',
    description: 'Anemias, leucemias, linfomas, coagulopatias e transplante de medula.',
    societies: ['ABHH', 'ASH', 'EHA'],
    conditions: ['Leucemias', 'Linfomas', 'Anemias', 'Coagulopatias'],
    href: '/specialty/hematologia',
    active: false,
  },
  {
    id: 'oncologia',
    name: 'Oncologia Clínica',
    nameEn: 'Medical Oncology',
    icon: Microscope,
    color: 'hsl(270 60% 50%)',
    bgColor: 'bg-[hsl(270_60%_50%)]/10',
    borderColor: 'border-[hsl(270_60%_50%)]/30',
    description: 'Tratamento sistêmico de tumores sólidos e neoplasias.',
    societies: ['SBOC', 'ASCO', 'ESMO'],
    conditions: ['Mama', 'Pulmão', 'Colorretal', 'Imunoterapia'],
    href: '/specialty/oncologia',
    active: false,
  },
  {
    id: 'geriatria',
    name: 'Geriatria',
    nameEn: 'Geriatrics',
    icon: Users,
    color: 'hsl(180 50% 45%)',
    bgColor: 'bg-[hsl(180_50%_45%)]/10',
    borderColor: 'border-[hsl(180_50%_45%)]/30',
    description: 'Saúde do idoso, fragilidade, demências e polifarmácia.',
    societies: ['SBGG', 'AGS', 'EUGMS'],
    conditions: ['Demências', 'Fragilidade', 'Quedas', 'Polifarmácia'],
    href: '/specialty/geriatria',
    active: false,
  },
  {
    id: 'infectologia',
    name: 'Infectologia',
    nameEn: 'Infectious Diseases',
    icon: Shield,
    color: 'hsl(140 60% 40%)',
    bgColor: 'bg-[hsl(140_60%_40%)]/10',
    borderColor: 'border-[hsl(140_60%_40%)]/30',
    description: 'HIV/AIDS, hepatites virais, infecções hospitalares e antibioticoterapia.',
    societies: ['SBI', 'IDSA', 'ESCMID'],
    conditions: ['HIV/AIDS', 'Hepatites', 'Sepse', 'Tuberculose'],
    href: '/specialty/infectologia',
    active: false,
  },
  {
    id: 'neurologia',
    name: 'Neurologia',
    nameEn: 'Neurology',
    icon: Brain,
    color: 'hsl(220 70% 55%)',
    bgColor: 'bg-[hsl(220_70%_55%)]/10',
    borderColor: 'border-[hsl(220_70%_55%)]/30',
    description: 'AVC, epilepsia, esclerose múltipla, Parkinson e cefaléias.',
    societies: ['ABN', 'AAN', 'EAN'],
    conditions: ['AVC', 'Epilepsia', 'Esclerose Múltipla', 'Parkinson'],
    href: '/specialty/neurologia',
    active: false,
  },
  {
    id: 'dermatologia',
    name: 'Dermatologia',
    nameEn: 'Dermatology',
    icon: Activity,
    color: 'hsl(320 50% 55%)',
    bgColor: 'bg-[hsl(320_50%_55%)]/10',
    borderColor: 'border-[hsl(320_50%_55%)]/30',
    description: 'Psoríase, dermatite atópica, melanoma e doenças autoimunes cutâneas.',
    societies: ['SBD', 'AAD', 'EADV'],
    conditions: ['Psoríase', 'Dermatite Atópica', 'Melanoma', 'Lupus Cutâneo'],
    href: '/specialty/dermatologia',
    active: false,
  },
  {
    id: 'alergia',
    name: 'Alergia e Imunologia',
    nameEn: 'Allergy & Immunology',
    icon: Shield,
    color: 'hsl(30 80% 55%)',
    bgColor: 'bg-[hsl(30_80%_55%)]/10',
    borderColor: 'border-[hsl(30_80%_55%)]/30',
    description: 'Rinite, asma alérgica, urticária, anafilaxia e imunodeficiências.',
    societies: ['ASBAI', 'AAAAI', 'EAACI'],
    conditions: ['Rinite', 'Urticária', 'Anafilaxia', 'Imunodeficiências'],
    href: '/specialty/alergia',
    active: false,
  },
  {
    id: 'nutrologia',
    name: 'Nutrologia',
    nameEn: 'Nutrology',
    icon: Apple,
    color: 'hsl(120 50% 45%)',
    bgColor: 'bg-[hsl(120_50%_45%)]/10',
    borderColor: 'border-[hsl(120_50%_45%)]/30',
    description: 'Terapia nutricional, desnutrição, obesidade e suporte nutricional.',
    societies: ['ABRAN', 'ASPEN', 'ESPEN'],
    conditions: ['Desnutrição', 'Obesidade', 'Suporte Enteral', 'Suporte Parenteral'],
    href: '/specialty/nutrologia',
    active: false,
  },
  {
    id: 'intensiva',
    name: 'Medicina Intensiva',
    nameEn: 'Critical Care',
    icon: Activity,
    color: 'hsl(0 80% 45%)',
    bgColor: 'bg-[hsl(0_80%_45%)]/10',
    borderColor: 'border-[hsl(0_80%_45%)]/30',
    description: 'Sepse, SDRA, choque, ventilação mecânica e cuidados críticos.',
    societies: ['AMIB', 'SCCM', 'ESICM'],
    conditions: ['Sepse', 'SDRA', 'Choque', 'VM'],
    href: '/specialty/intensiva',
    active: false,
  },
  {
    id: 'sono',
    name: 'Medicina do Sono',
    nameEn: 'Sleep Medicine',
    icon: Moon,
    color: 'hsl(250 50% 50%)',
    bgColor: 'bg-[hsl(250_50%_50%)]/10',
    borderColor: 'border-[hsl(250_50%_50%)]/30',
    description: 'Apneia obstrutiva, insônia, narcolepsia e distúrbios do sono.',
    societies: ['ABS', 'AASM', 'ESRS'],
    conditions: ['SAOS', 'Insônia', 'Narcolepsia', 'SPI'],
    href: '/specialty/sono',
    active: false,
  },
  {
    id: 'clinica-medica',
    name: 'Clínica Médica',
    nameEn: 'Internal Medicine',
    icon: Stethoscope,
    color: 'hsl(210 60% 50%)',
    bgColor: 'bg-[hsl(210_60%_50%)]/10',
    borderColor: 'border-[hsl(210_60%_50%)]/30',
    description: 'Base da medicina interna, diagnóstico diferencial e manejo clínico.',
    societies: ['SBCM', 'ACP', 'EFIM'],
    conditions: ['Diagnóstico', 'Manejo Clínico', 'Medicina Hospitalar', 'Ambulatório'],
    href: '/specialty/clinica-medica',
    active: false,
  },
];

export default function SpecialtyPortal() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = SPECIALTIES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.conditions.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      {/* Specialties Grid */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpecialties.map((specialty) => {
              const Icon = specialty.icon;
              return (
                <Link key={specialty.id} to={specialty.href}>
                  <Card className={cn(
                    "h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
                    specialty.borderColor,
                    specialty.active && "ring-2 ring-primary ring-offset-2"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div 
                          className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                            specialty.bgColor
                          )}
                        >
                          <Icon className="h-6 w-6" style={{ color: specialty.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {specialty.name}
                            </h3>
                            {specialty.active && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary shrink-0">
                                ATIVO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {specialty.description}
                          </p>
                          
                          {/* Societies */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {specialty.societies.map((soc) => (
                              <span
                                key={soc}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground"
                              >
                                {soc}
                              </span>
                            ))}
                          </div>

                          {/* Conditions preview */}
                          <div className="flex flex-wrap gap-1">
                            {specialty.conditions.slice(0, 2).map((cond) => (
                              <span
                                key={cond}
                                className={cn(
                                  "px-2 py-0.5 text-[10px] rounded-full",
                                  specialty.bgColor
                                )}
                                style={{ color: specialty.color }}
                              >
                                {cond}
                              </span>
                            ))}
                            {specialty.conditions.length > 2 && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                                +{specialty.conditions.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coming Soon overlay for inactive */}
                      {!specialty.active && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Em breve
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
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
              Ferramenta organizacional para profissionais de saúde. Não é um sistema de prontuário.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
