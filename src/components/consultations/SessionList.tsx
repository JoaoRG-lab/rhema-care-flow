import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MoreVertical, 
  Pencil, 
  Trash2,
  CheckCircle,
  XCircle,
  UserX,
  Video,
  Phone,
  Mail,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useConsultationSessions, 
  ConsultationSession,
  SESSION_TYPES,
  SESSION_STATUSES,
} from '@/hooks/useConsultationSessions';
import { SessionDialog } from './SessionDialog';

interface SessionListProps {
  patientCardId?: string;
  compact?: boolean;
}

export function SessionList({ patientCardId, compact = false }: SessionListProps) {
  const { sessions, loading, updateSession, deleteSession } = useConsultationSessions();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<ConsultationSession | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredSessions = patientCardId 
    ? sessions.filter(s => s.patient_card_id === patientCardId)
    : sessions;

  const upcomingSessions = filteredSessions.filter(s => 
    ['scheduled', 'confirmed'].includes(s.status) && 
    !isPast(parseISO(s.scheduled_date + 'T' + s.start_time))
  );

  const pastSessions = filteredSessions.filter(s => 
    !['scheduled', 'confirmed'].includes(s.status) ||
    isPast(parseISO(s.scheduled_date + 'T' + s.start_time))
  );

  const handleEdit = (session: ConsultationSession) => {
    setEditingSession(session);
    setShowDialog(true);
  };

  const handleStatusChange = async (id: string, status: ConsultationSession['status']) => {
    await updateSession(id, { status });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = SESSION_STATUSES.find(s => s.value === status);
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'text-xs',
          status === 'scheduled' && 'border-info text-info',
          status === 'confirmed' && 'border-success text-success',
          status === 'completed' && 'border-muted-foreground text-muted-foreground',
          status === 'cancelled' && 'border-destructive text-destructive',
          status === 'no_show' && 'border-warning text-warning',
        )}
      >
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const SessionCard = ({ session }: { session: ConsultationSession }) => {
    const typeInfo = SESSION_TYPES.find(t => t.value === session.session_type);
    
    return (
      <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{session.title}</span>
              {getStatusBadge(session.status)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {getDateLabel(session.scheduled_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.start_time.slice(0, 5)} ({session.duration_minutes}min)
              </span>
            </div>
            {!compact && session.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {session.description}
              </p>
            )}
            {!compact && (session.patient_phone || session.patient_email) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {session.patient_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {session.patient_phone}
                  </span>
                )}
                {session.patient_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {session.patient_email}
                  </span>
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(session)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {session.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'confirmed')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-success" />
                  Mark Confirmed
                </DropdownMenuItem>
              )}
              {['scheduled', 'confirmed'].includes(session.status) && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'cancelled')}>
                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                    Cancel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'no_show')}>
                    <UserX className="h-4 w-4 mr-2 text-warning" />
                    No Show
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteId(session.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Patient Consultation Sessions
              </CardTitle>
              <CardDescription>
                Schedule 1:1 educational sessions with patients
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => { setEditingSession(null); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Schedule Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No sessions scheduled yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => { setEditingSession(null); setShowDialog(true); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Schedule First Session
              </Button>
            </div>
          ) : (
            <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
              <div className="space-y-4">
                {upcomingSessions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Upcoming ({upcomingSessions.length})
                    </h4>
                    <div className="space-y-2">
                      {upcomingSessions.map(session => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  </div>
                )}

                {pastSessions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      Past Sessions ({pastSessions.length})
                    </h4>
                    <div className="space-y-2">
                      {pastSessions.slice(0, compact ? 3 : 10).map(session => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <SessionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        session={editingSession}
        patientCardId={patientCardId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The session will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
