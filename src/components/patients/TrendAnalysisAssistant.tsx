 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
 import ReactMarkdown from 'react-markdown';
 import { toast } from 'sonner';
 
 interface ScoreEntry {
   id: string;
   score_type: string;
   calculated_score: number | null;
   created_at: string;
 }
 
 interface TrendAnalysisAssistantProps {
   scores: ScoreEntry[];
   patientCode: string;
   diagnosisTags: string[] | null;
 }
 
 export function TrendAnalysisAssistant({ scores, patientCode, diagnosisTags }: TrendAnalysisAssistantProps) {
   const [analysis, setAnalysis] = useState<string>('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const analyzeScores = async () => {
     setIsLoading(true);
     setError(null);
     setAnalysis('');
 
     try {
       const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-trends`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({
           scores: scores.map(s => ({
             score_type: s.score_type,
             calculated_score: s.calculated_score,
             created_at: s.created_at,
           })),
           patientCode,
           diagnosisTags,
         }),
       });
 
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Analysis failed');
       }
 
       if (!response.body) {
         throw new Error('No response body');
       }
 
       const reader = response.body.getReader();
       const decoder = new TextDecoder();
       let textBuffer = '';
       let analysisText = '';
 
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
               analysisText += content;
               setAnalysis(analysisText);
             }
           } catch {
             textBuffer = line + '\n' + textBuffer;
             break;
           }
         }
       }
     } catch (err) {
       console.error('Analysis error:', err);
       const errorMessage = err instanceof Error ? err.message : 'Failed to analyze trends';
       setError(errorMessage);
       toast.error(errorMessage);
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-primary/10">
               <Sparkles className="h-4 w-4 text-primary" />
             </div>
             <div>
               <CardTitle className="text-base">AI Trend Analysis</CardTitle>
               <CardDescription className="text-xs">Clinical decision support assistant</CardDescription>
             </div>
           </div>
           <Button 
             onClick={analyzeScores} 
             disabled={isLoading || scores.length === 0}
             size="sm"
             className="gap-2"
           >
             {isLoading ? (
               <>
                 <Loader2 className="h-4 w-4 animate-spin" />
                 Analyzing...
               </>
             ) : analysis ? (
               <>
                 <RefreshCw className="h-4 w-4" />
                 Re-analyze
               </>
             ) : (
               <>
                 <Sparkles className="h-4 w-4" />
                 Analyze Trends
               </>
             )}
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         {!analysis && !isLoading && !error && (
           <div className="text-center py-6 text-muted-foreground">
             <p className="text-sm">
               {scores.length === 0 
                 ? "No scores to analyze. Record some disease activity scores first."
                 : "Click \"Analyze Trends\" to get AI-powered insights on this patient's disease activity."}
             </p>
           </div>
         )}
 
         {error && (
           <div className="flex items-center gap-2 text-destructive text-sm py-4">
             <AlertCircle className="h-4 w-4" />
             <span>{error}</span>
           </div>
         )}
 
         {(analysis || isLoading) && (
           <ScrollArea className="h-[300px] pr-4">
             <div className="prose prose-sm dark:prose-invert max-w-none">
               <ReactMarkdown>{analysis || 'Analyzing disease activity trends...'}</ReactMarkdown>
             </div>
             {isLoading && (
               <div className="flex items-center gap-2 text-muted-foreground mt-2">
                 <Loader2 className="h-3 w-3 animate-spin" />
                 <span className="text-xs">Generating analysis...</span>
               </div>
             )}
           </ScrollArea>
         )}
 
         <p className="text-xs text-muted-foreground mt-4 italic">
           This analysis is for clinical decision support only. Always apply professional judgment.
         </p>
       </CardContent>
     </Card>
   );
 }