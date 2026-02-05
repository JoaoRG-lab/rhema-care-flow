 import { useState, useRef } from 'react';
 import { Mic, MicOff, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 interface VoiceNoteButtonProps {
   onTranscript: (text: string) => void;
   className?: string;
 }
 
 export function VoiceNoteButton({ onTranscript, className }: VoiceNoteButtonProps) {
   const [isRecording, setIsRecording] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const chunksRef = useRef<Blob[]>([]);
 
   const startRecording = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const mediaRecorder = new MediaRecorder(stream);
       mediaRecorderRef.current = mediaRecorder;
       chunksRef.current = [];
 
       mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) {
           chunksRef.current.push(e.data);
         }
       };
 
       mediaRecorder.onstop = async () => {
         setIsProcessing(true);
         const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
         
         // For now, simulate transcription since we'd need ElevenLabs/Whisper API
         // In production, this would call an edge function
         setTimeout(() => {
           toast.info('Voice notes require ElevenLabs integration', {
             description: 'Connect ElevenLabs to enable speech-to-text'
           });
           setIsProcessing(false);
         }, 1000);
 
         stream.getTracks().forEach(track => track.stop());
       };
 
       mediaRecorder.start();
       setIsRecording(true);
       toast.success('Recording started', { duration: 1500 });
     } catch (error) {
       toast.error('Microphone access denied');
     }
   };
 
   const stopRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.stop();
       setIsRecording(false);
     }
   };
 
   return (
     <Button
       type="button"
       variant={isRecording ? 'destructive' : 'outline'}
       size="icon"
       onClick={isRecording ? stopRecording : startRecording}
       disabled={isProcessing}
       className={cn('relative', className)}
     >
       {isProcessing ? (
         <Loader2 className="h-4 w-4 animate-spin" />
       ) : isRecording ? (
         <>
           <MicOff className="h-4 w-4" />
           <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
         </>
       ) : (
         <Mic className="h-4 w-4" />
       )}
     </Button>
   );
 }