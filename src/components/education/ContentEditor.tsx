import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, Plus } from 'lucide-react';
import { DIAGNOSIS_OPTIONS } from '@/config/clinical';
import { FeaturedImageUpload } from './FeaturedImageUpload';
import { 
  CONTENT_TYPES, 
  EDUCATION_CATEGORIES,
  type EducationContent,
  type CreateEducationContentInput,
  type ContentType,
} from '@/types/education';
 
 interface ContentEditorProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   content?: EducationContent | null;
   onSave: (data: CreateEducationContentInput) => Promise<any>;
   onUpdate?: (id: string, data: Partial<CreateEducationContentInput>) => Promise<boolean>;
 }
 
 export function ContentEditor({ 
   open, 
   onOpenChange, 
   content, 
   onSave,
   onUpdate,
 }: ContentEditorProps) {
   const isEditing = !!content;
   
  const [title, setTitle] = useState(content?.title || '');
  const [summary, setSummary] = useState(content?.summary || '');
  const [contentText, setContentText] = useState(content?.content || '');
  const [contentType, setContentType] = useState<ContentType>(content?.content_type || 'article');
  const [category, setCategory] = useState(content?.category || '');
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>(content?.diagnosis_tags || []);
  const [readingTime, setReadingTime] = useState(content?.reading_time_minutes?.toString() || '');
  const [externalUrl, setExternalUrl] = useState(content?.external_url || '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(content?.featured_image_url || null);
  const [isPublished, setIsPublished] = useState(content?.is_published || false);
  const [isFeatured, setIsFeatured] = useState(content?.is_featured || false);
  const [isSaving, setIsSaving] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!title.trim() || !contentText.trim() || !category) {
       return;
     }
     
     setIsSaving(true);
     
      const data: CreateEducationContentInput = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: contentText.trim(),
        content_type: contentType,
        category,
        diagnosis_tags: diagnosisTags,
        reading_time_minutes: readingTime ? parseInt(readingTime) : undefined,
        featured_image_url: featuredImageUrl || undefined,
        external_url: externalUrl.trim() || undefined,
        is_published: isPublished,
        is_featured: isFeatured,
      };
     
     try {
       if (isEditing && onUpdate && content) {
         await onUpdate(content.id, data);
       } else {
         await onSave(data);
       }
       onOpenChange(false);
     } finally {
       setIsSaving(false);
     }
   };
 
   const toggleDiagnosisTag = (tag: string) => {
     setDiagnosisTags(prev => 
       prev.includes(tag) 
         ? prev.filter(t => t !== tag)
         : [...prev, tag]
     );
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
         <DialogHeader>
           <DialogTitle>{isEditing ? 'Edit Content' : 'Create New Content'}</DialogTitle>
           <DialogDescription>
             {isEditing ? 'Update this educational resource' : 'Add a new article or resource for patients'}
           </DialogDescription>
         </DialogHeader>
         
         <ScrollArea className="flex-1 pr-4">
           <form onSubmit={handleSubmit} className="space-y-6 pb-4">
             {/* Title */}
             <div className="space-y-2">
               <Label htmlFor="title">Title *</Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="Enter article title..."
                 required
               />
              </div>

              {/* Featured Image */}
              <FeaturedImageUpload
                value={featuredImageUrl}
                onChange={setFeaturedImageUrl}
              />
              
              {/* Summary */}
             <div className="space-y-2">
               <Label htmlFor="summary">Summary</Label>
               <Textarea
                 id="summary"
                 value={summary}
                 onChange={(e) => setSummary(e.target.value)}
                 placeholder="Brief description for preview..."
                 rows={2}
               />
             </div>
             
             {/* Content Type & Category */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Content Type *</Label>
                 <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {CONTENT_TYPES.map(type => (
                       <SelectItem key={type.value} value={type.value}>
                         {type.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label>Category *</Label>
                 <Select value={category} onValueChange={setCategory}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select category..." />
                   </SelectTrigger>
                   <SelectContent>
                     {EDUCATION_CATEGORIES.map(cat => (
                       <SelectItem key={cat} value={cat}>
                         {cat}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
             
             {/* Diagnosis Tags */}
             <div className="space-y-2">
               <Label>Related Conditions</Label>
               <div className="flex flex-wrap gap-2">
                 {DIAGNOSIS_OPTIONS.map(tag => (
                   <Badge
                     key={tag}
                     variant={diagnosisTags.includes(tag) ? 'default' : 'outline'}
                     className="cursor-pointer"
                     onClick={() => toggleDiagnosisTag(tag)}
                   >
                     {tag}
                   </Badge>
                 ))}
               </div>
             </div>
             
             {/* Content */}
             <div className="space-y-2">
               <Label htmlFor="content">Content *</Label>
               <Textarea
                 id="content"
                 value={contentText}
                 onChange={(e) => setContentText(e.target.value)}
                 placeholder="Write your content here... (Markdown supported)"
                 rows={12}
                 className="font-mono text-sm"
                 required
               />
               <p className="text-xs text-muted-foreground">
                 Supports Markdown formatting for headers, lists, links, and more.
               </p>
             </div>
             
             {/* External URL & Reading Time */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="externalUrl">External URL (optional)</Label>
                 <Input
                   id="externalUrl"
                   type="url"
                   value={externalUrl}
                   onChange={(e) => setExternalUrl(e.target.value)}
                   placeholder="https://..."
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                 <Input
                   id="readingTime"
                   type="number"
                   min={1}
                   value={readingTime}
                   onChange={(e) => setReadingTime(e.target.value)}
                   placeholder="5"
                 />
               </div>
             </div>
             
             {/* Publish Settings */}
             <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/50">
               <div className="flex items-center gap-2">
                 <Switch
                   id="published"
                   checked={isPublished}
                   onCheckedChange={setIsPublished}
                 />
                 <Label htmlFor="published" className="cursor-pointer">
                   Published
                 </Label>
               </div>
               
               <div className="flex items-center gap-2">
                 <Switch
                   id="featured"
                   checked={isFeatured}
                   onCheckedChange={setIsFeatured}
                 />
                 <Label htmlFor="featured" className="cursor-pointer">
                   Featured
                 </Label>
               </div>
             </div>
             
             {/* Actions */}
             <div className="flex justify-end gap-2 pt-4 border-t">
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                 <X className="h-4 w-4 mr-2" />
                 Cancel
               </Button>
               <Button type="submit" disabled={isSaving || !title || !contentText || !category}>
                 <Save className="h-4 w-4 mr-2" />
                 {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
               </Button>
             </div>
           </form>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }