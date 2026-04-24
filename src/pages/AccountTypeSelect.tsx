import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { useAccountType, type AccountType } from '@/contexts/AccountTypeContext';
import { Stethoscope, HeartPulse, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function OptionCard({ selected, onClick, icon, title, description, bullets, color }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode;
  title: string; description: string; bullets: string[]; color: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30'
          : 'border-border bg-card hover:border-border/80 hover:bg-accent/30',
      )}
    >
      {selected && (
        <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
        </span>
      )}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function AccountTypeSelect() {
  const { setAccountType } = useAccountType();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    await setAccountType(selected);
    navigate(selected === 'clinician' ? '/dashboard' : '/patient-portal', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 hero-pattern">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4"><UHSLogo size="md" /></div>
          <h1 className="text-2xl font-bold mt-2">Como você vai usar a plataforma?</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            Escolha seu perfil. Isso define sua área de acesso e as ferramentas disponíveis.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <OptionCard
            selected={selected === 'clinician'} onClick={() => setSelected('clinician')}
            icon={<Stethoscope className="h-6 w-6" />}
            title="Profissional de Saúde"
            description="Médico, enfermeiro ou outro profissional clínico com acesso ao workflow completo."
            bullets={['Gestão de pacientes (isolados por conta)', 'Calculadoras clínicas e scores', 'Monitorização em tempo real', 'Ferramentas de IA e conhecimento', 'Infusões, calendário e tarefas']}
            color="hsl(168 55% 42%)"
          />
          <OptionCard
            selected={selected === 'patient'} onClick={() => setSelected('patient')}
            icon={<HeartPulse className="h-6 w-6" />}
            title="Paciente"
            description="Acompanhe sua saúde e mantenha contato com sua equipe pelo portal dedicado."
            bullets={['Portal do paciente simplificado', 'Histórico de consultas e scores', 'Conteúdo educacional personalizado', 'Lembretes de medicamentos', 'Comunicação com seu médico']}
            color="hsl(335 65% 55%)"
          />
        </div>
        <Button
          className="w-full h-12 rounded-xl gap-2 text-base bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90"
          disabled={!selected || saving} onClick={handleConfirm}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>Continuar como {selected === 'clinician' ? 'Profissional' : selected === 'patient' ? 'Paciente' : '…'} <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-5">
          Profissionais têm acesso isolado apenas aos seus próprios pacientes. Nenhum dado identificável é compartilhado entre contas.
        </p>
      </div>
    </div>
  );
}
