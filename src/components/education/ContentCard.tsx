 import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
 import { 
   MoreVertical, 
   Eye, 
   EyeOff, 
   Pencil, 
   Trash2, 
   Clock, 
   FileText, 
   Video, 
   Image, 
   BookOpen,
   HelpCircle,
   ExternalLink,
   Star,
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import type { EducationContent, ContentType } from '@/types/education';
 
 interface ContentCardProps {
   content: EducationContent;
   onEdit: () => void;
   onDelete: () => void;
   onTogglePublish: () => void;
   onView: () => void;
 }
 
 const CONTENT_TYPE_ICONS: Record<ContentType, typeof FileText> = {
   article: FileText,
   video: Video,
   infographic: Image,
   guide: BookOpen,
   faq: HelpCircle,
 };
 
 export function ContentCard({ content, onEdit, onDelete, onTogglePublish, onView }: ContentCardProps) {
   const Icon = CONTENT_TYPE_ICONS[content.content_type];
   
   return (
     <Card className={cn(
       'transition-all hover:shadow-md',
       !content.is_published && 'opacity-75 border-dashed'
     )}>
       <CardHeader className="pb-2">
         <div className="flex items-start justify-between gap-2">
           <div className="flex items-center gap-2 min-w-0">
             <div className={cn(
               'p-1.5 rounded shrink-0',
               content.is_published ? 'bg-primary/10' : 'bg-muted'
             )}>
               <Icon className={cn(
                 'h-4 w-4',
                 content.is_published ? 'text-primary' : 'text-muted-foreground'
               )} />
             </div>
             <div className="min-w-0">
               <h3 className="font-semibold text-sm line-clamp-1">{content.title}</h3>
               <p className="text-xs text-muted-foreground">{content.category}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-1 shrink-0">
             {content.is_featured && (
               <Star className="h-4 w-4 text-warning fill-warning" />
             )}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={onView}>
                   <Eye className="h-4 w-4 mr-2" />
                   View
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onEdit}>
                   <Pencil className="h-4 w-4 mr-2" />
                   Edit
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onTogglePublish}>
                   {content.is_published ? (
                     <>
                       <EyeOff className="h-4 w-4 mr-2" />
                       Unpublish
                     </>
                   ) : (
                     <>
                       <Eye className="h-4 w-4 mr-2" />
                       Publish
                     </>
                   )}
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={onDelete} className="text-destructive">
                   <Trash2 className="h-4 w-4 mr-2" />
                   Delete
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </div>
       </CardHeader>
       
       <CardContent className="pb-3">
         {content.summary && (
           <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
             {content.summary}
           </p>
         )}
         
         <div className="flex flex-wrap gap-1">
           {content.diagnosis_tags?.slice(0, 3).map(tag => (
             <DiagnosisTag key={tag} tag={tag} size="sm" />
           ))}
           {(content.diagnosis_tags?.length || 0) > 3 && (
             <Badge variant="outline" className="text-xs">
               +{content.diagnosis_tags!.length - 3}
             </Badge>
           )}
         </div>
       </CardContent>
       
       <CardFooter className="pt-0 text-xs text-muted-foreground gap-3">
         <Badge variant={content.is_published ? 'default' : 'secondary'} className="text-xs">
           {content.is_published ? 'Published' : 'Draft'}
         </Badge>
         
         {content.reading_time_minutes && (
           <span className="flex items-center gap-1">
             <Clock className="h-3 w-3" />
             {content.reading_time_minutes} min
           </span>
         )}
         
         {content.external_url && (
           <ExternalLink className="h-3 w-3" />
         )}
         
         <span className="ml-auto">
           {format(new Date(content.updated_at), 'MMM d')}
         </span>
       </CardFooter>
     </Card>
   );
 }