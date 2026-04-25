import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Video, Plus, Clock, Calendar, Users, PlayCircle, Trash2, CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTeleconsulta, type Teleconsulta, type CreateTeleconsultaInput } from '@/hooks/useTeleconsulta';
import { cn } from '@/lib/utils';

// Especialidades disponíveis na plataforma
const ESPECIALIDADES = [
  'Reumatologia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Cardiologia',
  'Clínica Médica',
  'Neurologia',
  'Ortopedia',
  'Dermatologia',
  'Endocrinologia',
  'Psiquiatria',
  'Oftalmologia',
  'Otorrinolaringologia',
  'Urologia',
  'Oncologia',
  'Gastroenterologia',
  'Pneumologia',
  'Nefrologia',
  'Infectologia',
  'Hematologia',
  'Outra',
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  in_progress: { label: 'Em andamento', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  completed: { label: 'Concluída', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

interface TeleconsultaLobbyProps {
  patientCardId?: string;
  patientName?: string;
  onEnterRoom: (teleconsulta: Teleconsulta) => void;
}

export function TeleconsultaLobby({ patientCardId, patientName, onEnterRoom }: TeleconsultaLobbyProps) {
  const { teleconsultas, loading, createTeleconsulta, deleteTeleconsulta, iniciarConsulta } = useTeleconsulta(patientCardId);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTeleconsultaInput>({
    patient_name: patientName ?? '',
    specialty: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_minutes: 30,
    notes: '',
  });

  const handleCreate = async () => {
    if (!form.scheduled_date || !form.start_time) return;
    setSaving(true);
    const created = await createTeleconsulta({ ...form, patient_card_id: patientCardId });
    if (created) setOpen(false);
    setSaving(false);
  };

  const handleEntrar = async (tc: Teleconsulta) => {
    const updated = await iniciarConsulta(tc.id);
    onEnterRoom(updated ?? tc);
  };

  const hoje = new Date().toISOString().split('T')[0];
  const proximas = teleconsultas.filter(t => t.scheduled_date >= hoje && t.status !== 'cancelled');
  const passadas = teleconsultas.filter(t => t.scheduled_date < hoje || t.status === 'completed' || t.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Teleconsulta
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Atendimento por vídeo com prescrição digital (Memed) e assinatura A1/A3
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Agendar consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Teleconsulta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Paciente */}
              <div className="space-y-1.5">
                <Label htmlFor="tc-patient">Paciente</Label>
                <Input
                  id="tc-patient"
                  placeholder="Nome do paciente…"
                  value={form.patient_name ?? ''}
                  onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                />
              </div>

              {/* Especialidade */}
              <div className="space-y-1.5">
                <Label>Especialidade</Label>
                <Select value={form.specialty ?? ''} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map(esp => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data e hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tc-date">Data</Label>
                  <Input
                    id="tc-date"
                    type="date"
                    value={form.scheduled_date}
                    min={hoje}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tc-time">Horário</Label>
                  <Input
                    id="tc-time"
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  />
                </div>
              </div>

              {/* Duração */}
              <div className="space-y-1.5">
                <Label>Duração</Label>
                <Select
                  value={String(form.duration_minutes ?? 30)}
                  onValueChange={v => setForm(f => ({ ...f, duration_minutes: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 20, 30, 45, 60, 90].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} minutos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="tc-notes">Observações (opcional)</Label>
                <Input
                  id="tc-notes"
                  placeholder="Motivo da consulta, queixas principais…"
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Agendando…' : 'Agendar'}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Próximas consultas */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Próximas consultas
        </h3>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        )}

        {!loading && proximas.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Video className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma teleconsulta agendada</p>
              <p className="text-xs text-muted-foreground/70">Clique em "Agendar consulta" para criar uma</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {proximas.map(tc => (
            <TeleconsultaCard
              key={tc.id}
              tc={tc}
              onEnter={() => handleEntrar(tc)}
              onDelete={() => deleteTeleconsulta(tc.id)}
            />
          ))}
        </div>
      </div>

      {/* Histórico */}
      {passadas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Histórico
          </h3>
          <div className="space-y-2">
            {passadas.slice(0, 5).map(tc => (
              <TeleconsultaCard key={tc.id} tc={tc} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeleconsultaCard({
  tc,
  onEnter,
  onDelete,
  compact = false,
}: {
  tc: Teleconsulta;
  onEnter?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const status = STATUS_CONFIG[tc.status] ?? STATUS_CONFIG['scheduled'];
  const isToday = tc.scheduled_date === new Date().toISOString().split('T')[0];
  const canEnter = ['scheduled', 'in_progress'].includes(tc.status);

  return (
    <Card className={cn('transition-all', compact ? 'opacity-70 hover:opacity-100' : '')}>
      <CardContent className={cn('flex items-center gap-4', compact ? 'py-3 px-4' : 'py-4 px-4')}>
        {/* Indicador de data */}
        <div className={cn('flex flex-col items-center min-w-[48px] text-center', compact && 'hidden sm:flex')}>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(tc.scheduled_date), 'MMM', { locale: ptBR }).toUpperCase()}
          </span>
          <span className="text-2xl font-bold leading-tight">
            {format(parseISO(tc.scheduled_date), 'dd')}
          </span>
          {isToday && <span className="text-[10px] text-blue-600 font-medium">HOJE</span>}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{tc.patient_name ?? 'Paciente'}</span>
            <Badge className={cn('text-[10px] px-1.5 py-0', status.color)}>{status.label}</Badge>
            {tc.specialty && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tc.specialty}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tc.start_time.slice(0, 5)} · {tc.duration_minutes} min
            </span>
            {compact && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(tc.scheduled_date), 'dd/MM/yyyy')}
              </span>
            )}
          </div>
          {tc.notes && !compact && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{tc.notes}</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          {canEnter && onEnter && (
            <Button
              size="sm"
              className={cn('gap-1.5 h-8', tc.status === 'in_progress' ? 'bg-green-600 hover:bg-green-700 text-white' : '')}
              onClick={onEnter}
            >
              {tc.status === 'in_progress' ? (
                <><PlayCircle className="h-3.5 w-3.5" /> Continuar</>
              ) : (
                <><Video className="h-3.5 w-3.5" /> Entrar</>
              )}
            </Button>
          )}
          {tc.status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {onDelete && canEnter && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
