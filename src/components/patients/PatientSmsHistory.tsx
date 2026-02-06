import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, Clock, Send, AlertCircle, CheckCircle2, XCircle, 
  Plus, Trash2, Calendar, Phone, RefreshCw, Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduledSms, ScheduledSMS } from '@/hooks/useScheduledSms';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PatientSmsHistoryProps {
  patientId: string;
  patientCode: string;
  refreshKey?: number;
}

interface SmsStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
}

export function PatientSmsHistory({ patientId, patientCode, refreshKey }: PatientSmsHistoryProps) {
  const { user } = useAuth();
  const { cancelScheduledSms, deleteScheduledSms, scheduleSms } = useScheduledSms();
  const [smsHistory, setSmsHistory] = useState<ScheduledSMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SmsStats>({ total: 0, pending: 0, sent: 0, failed: 0 });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSms, setNewSms] = useState({
    phoneNumber: '',
    message: '',
    scheduledFor: '',
  });

  const fetchSmsHistory = useCallback(async () => {
    if (!user || !patientId) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_sms')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_card_id', patientId)
        .order('scheduled_for', { ascending: false });

      if (error) throw error;

      const typedData = data as ScheduledSMS[];
      setSmsHistory(typedData);

      // Calculate stats
      setStats({
        total: typedData.length,
        pending: typedData.filter(s => s.status === 'pending').length,
        sent: typedData.filter(s => s.status === 'sent').length,
        failed: typedData.filter(s => s.status === 'failed').length,
      });
    } catch (error) {
      console.error('Error fetching SMS history:', error);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    fetchSmsHistory();
  }, [fetchSmsHistory, refreshKey]);

  const handleScheduleSms = async () => {
    if (!newSms.phoneNumber || !newSms.message || !newSms.scheduledFor) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await scheduleSms({
      patientCardId: patientId,
      phoneNumber: newSms.phoneNumber,
      message: newSms.message,
      scheduledFor: new Date(newSms.scheduledFor),
      reminderType: 'custom',
      sourceType: 'followup',
      sourceId: patientId,
    });

    if (result) {
      setNewSms({ phoneNumber: '', message: '', scheduledFor: '' });
      setShowScheduleDialog(false);
      fetchSmsHistory();
    }
  };

  const handleCancel = async (id: string) => {
    await cancelScheduledSms(id);
    fetchSmsHistory();
  };

  const handleDelete = async (id: string) => {
    await deleteScheduledSms(id);
    fetchSmsHistory();
  };

  const getStatusIcon = (status: ScheduledSMS['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'sent': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ScheduledSMS['status']) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      sent: { variant: 'default', label: 'Delivered' },
      failed: { variant: 'destructive', label: 'Failed' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getReminderTypeBadge = (type: ScheduledSMS['reminder_type']) => {
    const labels: Record<string, string> = {
      '24h': '24h Reminder',
      '1h': '1h Reminder',
      'custom': 'Custom',
    };
    return <Badge variant="outline" className="text-xs">{labels[type]}</Badge>;
  };

  const getSourceTypeBadge = (type: ScheduledSMS['source_type']) => {
    const config: Record<string, { color: string; label: string }> = {
      followup: { color: 'bg-info/20 text-info', label: 'Follow-up' },
      infusion: { color: 'bg-success/20 text-success', label: 'Infusion' },
      monitoring: { color: 'bg-destructive/20 text-destructive', label: 'Monitoring' },
      shift: { color: 'bg-warning/20 text-warning', label: 'Shift' },
    };
    const { color, label } = config[type];
    return <span className={cn('px-2 py-0.5 rounded text-xs font-medium', color)}>{label}</span>;
  };

  const renderSmsCard = (sms: ScheduledSMS) => (
    <div
      key={sms.id}
      className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {getStatusIcon(sms.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{sms.phone_number}</span>
              {getReminderTypeBadge(sms.reminder_type)}
              {getSourceTypeBadge(sms.source_type)}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {sms.message}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sms.status === 'pending' 
                  ? `Scheduled ${formatDistanceToNow(parseISO(sms.scheduled_for), { addSuffix: true })}`
                  : sms.status === 'sent' && sms.sent_at
                  ? `Sent ${format(parseISO(sms.sent_at), 'MMM d, h:mm a')}`
                  : format(parseISO(sms.scheduled_for), 'MMM d, h:mm a')
                }
              </span>
            </div>
            {sms.error_message && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {sms.error_message}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(sms.status)}
          {sms.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleCancel(sms.id)}
            >
              Cancel
            </Button>
          )}
          {(sms.status === 'cancelled' || sms.status === 'failed') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-destructive"
              onClick={() => handleDelete(sms.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const filterByStatus = (status: ScheduledSMS['status'] | 'all') => {
    if (status === 'all') return smsHistory;
    return smsHistory.filter(s => s.status === status);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-lg font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMS History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS History
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSmsHistory}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-3 w-3" />
                    Schedule SMS
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule SMS for {patientCode}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={newSms.phoneNumber}
                        onChange={(e) => setNewSms(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1234567890"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduledFor">Send At</Label>
                      <Input
                        id="scheduledFor"
                        type="datetime-local"
                        value={newSms.scheduledFor}
                        onChange={(e) => setNewSms(prev => ({ ...prev, scheduledFor: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        value={newSms.message}
                        onChange={(e) => setNewSms(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Enter your message..."
                        rows={4}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newSms.message.length}/160 chars ({Math.ceil(newSms.message.length / 160) || 1} SMS)
                      </p>
                    </div>
                    <Button 
                      onClick={handleScheduleSms} 
                      disabled={!newSms.phoneNumber || !newSms.message || !newSms.scheduledFor}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Schedule SMS
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-3">
              <TabsTrigger value="all" className="text-xs">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">
                Sent ({stats.sent})
              </TabsTrigger>
              <TabsTrigger value="failed" className="text-xs">
                Failed ({stats.failed})
              </TabsTrigger>
            </TabsList>

            {['all', 'pending', 'sent', 'failed'].map((status) => (
              <TabsContent key={status} value={status} className="mt-0">
                <ScrollArea className="h-[400px]">
                  {filterByStatus(status as any).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No {status === 'all' ? '' : status} messages</p>
                      {status === 'all' && (
                        <p className="text-xs mt-1">Schedule an SMS to get started</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filterByStatus(status as any).map(renderSmsCard)}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
