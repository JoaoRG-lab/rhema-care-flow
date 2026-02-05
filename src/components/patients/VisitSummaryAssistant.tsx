 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
 import ReactMarkdown from 'react-markdown';
 import { toast } from 'sonner';
 
 interface Visit {
   id: string;
   visit_date: string;
   disease_activity: any;
   actions: string[] | null;
   labs_ordered: string[] | null;
   imaging: string[] | null;
   next_steps: string | null;
 }
 
 interface VisitSummaryAssistantProps {
   visits: Visit[];
   patientCode: string;
   diagnosisTags: string[] | null;
 }
 
 export function VisitSummaryAssistant({ visits, patientCode, diagnosisTags }: VisitSummaryAssistantProps) {
   const [summary, setSummary] = useState<string>('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const summarizeVisits = async () => {
     setIsLoading(true);
     setError(null);
     setSummary('');
 
     try {
       const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-visits`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({
           visits: visits.map(v => ({
             visit_date: v.visit_date,
             disease_activity: v.disease_activity,
             actions: v.actions,
             labs_ordered: v.labs_ordered,
             imaging: v.imaging,
             next_steps: v.next_steps,
           })),
           patientCode,
           diagnosisTags,
         }),
       });
 
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Summarization failed');
       }
 
       if (!response.body) {
         throw new Error('No response body');
       }
 
       const reader = response.body.getReader();
       const decoder = new TextDecoder();
       let textBuffer = '';
       let summaryText = '';
 
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         
         textBuffer += decoder.decode(value, { stream: true });
 
         let newlineIndex: number;
         while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
           let line = textBuffer.slice(0, newlineIndex);
           textBuffer = textBuffer.slice(newlineIndex + 1);
 
           if (line.endsWith('\r')) line = line.slice(0, -1);
           if (line.startsWith(':') || line.trim() === '') continue;
           if (!line.startsWith('data: ')) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === '[DONE]') break;
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) {
               summaryText += content;
               setSummary(summaryText);
             }
           } catch {
             textBuffer = line + '\n' + textBuffer;
             break;
           }
         }
       }
     } catch (err) {
       console.error('Summary error:', err);
       const errorMessage = err instanceof Error ? err.message : 'Failed to summarize visits';
       setError(errorMessage);
       toast.error(errorMessage);
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <Card className="border-info/20 bg-gradient-to-br from-info/5 to-transparent mb-4">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-info/10">
               <FileText className="h-4 w-4 text-info" />
             </div>
             <div>
               <CardTitle className="text-base">AI Visit Summary</CardTitle>
               <CardDescription className="text-xs">Quick overview of patient visits</CardDescription>
             </div>
           </div>
           <Button 
             onClick={summarizeVisits} 
             disabled={isLoading || visits.length === 0}
             size="sm"
             variant="outline"
             className="gap-2"
           >
             {isLoading ? (
               <>
                 <Loader2 className="h-4 w-4 animate-spin" />
                 Summarizing...
               </>
             ) : summary ? (
               <>
                 <RefreshCw className="h-4 w-4" />
                 Refresh
               </>
             ) : (
               <>
                 <FileText className="h-4 w-4" />
                 Summarize
               </>
             )}
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         {!summary && !isLoading && !error && (
           <p className="text-sm text-muted-foreground text-center py-4">
             {visits.length === 0 
               ? "No visits to summarize yet."
               : "Click \"Summarize\" to generate an AI summary of this patient's visit history."}
           </p>
         )}
 
         {error && (
           <div className="flex items-center gap-2 text-destructive text-sm py-4">
             <AlertCircle className="h-4 w-4" />
             <span>{error}</span>
           </div>
         )}
 
         {(summary || isLoading) && (
           <ScrollArea className="h-[250px] pr-4">
             <div className="prose prose-sm dark:prose-invert max-w-none">
               <ReactMarkdown>{summary || 'Generating summary...'}</ReactMarkdown>
             </div>
             {isLoading && (
               <div className="flex items-center gap-2 text-muted-foreground mt-2">
                 <Loader2 className="h-3 w-3 animate-spin" />
                 <span className="text-xs">Generating...</span>
               </div>
             )}
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 }