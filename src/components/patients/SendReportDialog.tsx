import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Send, Loader2, User, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  reportType: string;
  generatePdfBase64: () => Promise<string>;
}

type RecipientType = 'patient' | 'physician';

export function SendReportDialog({
  open,
  onOpenChange,
  patientName,
  reportType,
  generatePdfBase64,
}: SendReportDialogProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>('patient');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      // Generate PDF as base64
      toast.info('Generating report...');
      const pdfBase64 = await generatePdfBase64();

      // Send email via edge function
      toast.info('Sending email...');
      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: {
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          recipientType,
          patientName,
          reportType,
          pdfBase64,
          additionalMessage: additionalMessage.trim(),
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send email');
      }

      toast.success(`Report sent successfully to ${recipientEmail}`);
      onOpenChange(false);
      
      // Reset form
      setRecipientEmail('');
      setRecipientName('');
      setAdditionalMessage('');
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error(error.message || 'Failed to send report. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Report via Email
          </DialogTitle>
          <DialogDescription>
            Send the {reportType} report for {patientName} as a PDF attachment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Type */}
          <div className="space-y-2">
            <Label>Send to</Label>
            <RadioGroup
              value={recipientType}
              onValueChange={(v) => setRecipientType(v as RecipientType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="patient" />
                <Label htmlFor="patient" className="flex items-center gap-1 cursor-pointer">
                  <User className="h-4 w-4" />
                  Patient
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physician" id="physician" />
                <Label htmlFor="physician" className="flex items-center gap-1 cursor-pointer">
                  <Stethoscope className="h-4 w-4" />
                  Referring Physician
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">
              {recipientType === 'patient' ? 'Patient Name' : 'Physician Name'} (optional)
            </Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={recipientType === 'patient' ? 'Patient name' : 'Dr. Smith'}
            />
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email Address *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (optional)</Label>
            <Textarea
              id="message"
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="Add a personal note to include in the email..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !recipientEmail.trim()}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
