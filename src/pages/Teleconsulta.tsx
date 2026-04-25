import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TeleconsultaLobby } from '@/components/teleconsulta/TeleconsultaLobby';
import { TeleconsultaRoom } from '@/components/teleconsulta/TeleconsultaRoom';
import { useTeleconsulta, type Teleconsulta as TeleconsultaModel } from '@/hooks/useTeleconsulta';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Teleconsulta() {
  const [activeRoom, setActiveRoom] = useState<TeleconsultaModel | null>(null);
  const { finalizarConsulta } = useTeleconsulta();

  const handleEnterRoom = (tc: TeleconsultaModel) => setActiveRoom(tc);

  const handleEndRoom = async () => {
    if (activeRoom) await finalizarConsulta(activeRoom.id);
    setActiveRoom(null);
  };

  return (
    <AppLayout>
      {activeRoom ? (
        // Sala de teleconsulta (tela cheia dentro do layout)
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-3 px-4 py-2 bg-background border-b">
            <Button size="sm" variant="ghost" onClick={handleEndRoom} className="gap-1.5 h-8 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Sair da sala
            </Button>
            <span className="text-sm text-muted-foreground">
              Teleconsulta com {activeRoom.patient_name ?? 'Paciente'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <TeleconsultaRoom teleconsulta={activeRoom} onEnd={handleEndRoom} />
          </div>
        </div>
      ) : (
        // Lobby
        <div className="max-w-4xl mx-auto px-4 py-6">
          <TeleconsultaLobby onEnterRoom={handleEnterRoom} />
        </div>
      )}
    </AppLayout>
  );
}
