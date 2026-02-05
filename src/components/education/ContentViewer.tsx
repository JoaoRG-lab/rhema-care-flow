 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Clock, ExternalLink, Calendar, Star } from 'lucide-react';
 import { format } from 'date-fns';
 import ReactMarkdown from 'react-markdown';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import type { EducationContent } from '@/types/education';
 
 interface ContentViewerProps {
   content: EducationContent | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function ContentViewer({ content, open, onOpenChange }: ContentViewerProps) {
   if (!content) return null;
   
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
         <DialogHeader>
           <div className="flex items-start gap-3">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="outline">{content.content_type}</Badge>
                 <Badge>{content.category}</Badge>
                 {content.is_featured && (
                   <Star className="h-4 w-4 text-warning fill-warning" />
                 )}
               </div>
               <DialogTitle className="text-xl">{content.title}</DialogTitle>
               {content.summary && (
                 <p className="text-muted-foreground mt-2">{content.summary}</p>
               )}
             </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
             {content.reading_time_minutes && (
               <span className="flex items-center gap-1">
                 <Clock className="h-4 w-4" />
                 {content.reading_time_minutes} min read
               </span>
             )}
             <span className="flex items-center gap-1">
               <Calendar className="h-4 w-4" />
               {content.published_at 
                 ? format(new Date(content.published_at), 'MMMM d, yyyy')
                 : format(new Date(content.created_at), 'MMMM d, yyyy')
               }
             </span>
           </div>
           
           {content.diagnosis_tags && content.diagnosis_tags.length > 0 && (
             <div className="flex flex-wrap gap-1.5 pt-2">
               {content.diagnosis_tags.map(tag => (
                 <DiagnosisTag key={tag} tag={tag} size="md" />
               ))}
             </div>
           )}
         </DialogHeader>
         
         <ScrollArea className="flex-1 mt-4">
           <article className="prose prose-sm dark:prose-invert max-w-none pr-4">
             <ReactMarkdown>{content.content}</ReactMarkdown>
           </article>
         </ScrollArea>
         
         {content.external_url && (
           <div className="pt-4 border-t mt-4">
             <Button asChild variant="outline" className="w-full">
               <a href={content.external_url} target="_blank" rel="noopener noreferrer">
                 <ExternalLink className="h-4 w-4 mr-2" />
                 View External Resource
               </a>
             </Button>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }