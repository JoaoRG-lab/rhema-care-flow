 import { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Lightbulb,
   BookOpen,
   Stethoscope,
   FileText,
   Send,
   Sparkles,
   Users,
   CheckCircle2,
   ExternalLink,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { useVerificationStatus } from '@/hooks/useVerificationStatus';
 import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
 import { cn } from '@/lib/utils';
 
 const KNOWLEDGE_CATEGORIES = [
   { id: 'clinical_pearl', label: 'Clinical Pearl', icon: Lightbulb, description: 'Quick tips from practice' },
   { id: 'guideline_summary', label: 'Guideline Summary', icon: BookOpen, description: 'Summarize key guidelines' },
   { id: 'case_insight', label: 'Case Insight', icon: Stethoscope, description: 'Anonymized case learnings' },
   { id: 'resource', label: 'Resource Link', icon: FileText, description: 'Share useful resources' },
 ];
 
 const DISEASE_AREAS = ['RA', 'SLE', 'SpA', 'PsA', 'Gout', 'OA', 'Vasculitis', 'Myositis', 'General'];
 
 // Sample community contributions
 const SAMPLE_CONTRIBUTIONS = [
   {
     id: '1',
     category: 'clinical_pearl',
     title: 'MTX dosing with renal impairment',
     content: 'Consider 50% dose reduction when GFR < 30. Monitor weekly CBC initially.',
     author: 'Dr. Sarah M.',
     tier: 'gold' as const,
     diseaseArea: 'RA',
     likes: 24,
   },
   {
     id: '2',
     category: 'guideline_summary',
     title: 'ACR 2024 RA Treatment Update',
     content: 'Key change: JAKi now positioned equally with bDMARDs after csDMARD failure in most patients.',
     author: 'Dr. James K.',
     tier: 'expert' as const,
     diseaseArea: 'RA',
     likes: 47,
   },
   {
     id: '3',
     category: 'case_insight',
     title: 'SLE flare masking infection',
     content: 'Always rule out infection in SLE flares. Procalcitonin can help differentiate - typically elevated in bacterial infection but not lupus activity.',
     author: 'Dr. Maria L.',
     tier: 'silver' as const,
     diseaseArea: 'SLE',
     likes: 18,
   },
 ];
 
 export function ContributeKnowledge() {
   const { tier } = useVerificationStatus();
   const [selectedCategory, setSelectedCategory] = useState<string>('');
   const [title, setTitle] = useState('');
   const [content, setContent] = useState('');
   const [diseaseArea, setDiseaseArea] = useState('');
   const [resourceUrl, setResourceUrl] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const handleSubmit = async () => {
     if (!selectedCategory || !title.trim() || !content.trim()) {
       toast.error('Please fill in all required fields');
       return;
     }
 
     if (!tier) {
       toast.error('Please verify your credentials to contribute');
       return;
     }
 
     setIsSubmitting(true);
     
     // Simulate submission - in production this would save to database
     await new Promise(resolve => setTimeout(resolve, 1000));
     
     toast.success('Thank you for your contribution!', {
       description: 'Your knowledge will be reviewed and published soon.',
     });
     
     // Reset form
     setSelectedCategory('');
     setTitle('');
     setContent('');
     setDiseaseArea('');
     setResourceUrl('');
     setIsSubmitting(false);
   };
 
   const getCategoryIcon = (categoryId: string) => {
     const cat = KNOWLEDGE_CATEGORIES.find(c => c.id === categoryId);
     return cat?.icon || Lightbulb;
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-base md:text-lg flex items-center gap-2">
           <Sparkles className="h-5 w-5 text-warning" />
           Contribute Knowledge
         </CardTitle>
         <CardDescription>
           Share your clinical expertise with the rheumatology community
         </CardDescription>
       </CardHeader>
       <CardContent>
         <Tabs defaultValue="browse" className="w-full">
           <TabsList className="grid w-full grid-cols-2 mb-4">
             <TabsTrigger value="browse" className="gap-2">
               <Users className="h-4 w-4" />
               Community
             </TabsTrigger>
             <TabsTrigger value="contribute" className="gap-2">
               <Send className="h-4 w-4" />
               Contribute
             </TabsTrigger>
           </TabsList>
 
           {/* Browse Community Contributions */}
           <TabsContent value="browse" className="space-y-3">
             {SAMPLE_CONTRIBUTIONS.map((contribution) => {
               const Icon = getCategoryIcon(contribution.category);
               return (
                 <div
                   key={contribution.id}
                   className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                 >
                   <div className="flex items-start justify-between gap-2 mb-2">
                     <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-md bg-primary/10">
                         <Icon className="h-3.5 w-3.5 text-primary" />
                       </div>
                       <span className="font-medium text-sm">{contribution.title}</span>
                     </div>
                     <Badge variant="outline" className="text-xs shrink-0">
                       {contribution.diseaseArea}
                     </Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                     {contribution.content}
                   </p>
                   <div className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                       <span className="text-muted-foreground">{contribution.author}</span>
                       <VerifiedBadge tier={contribution.tier} size="xs" />
                     </div>
                     <div className="flex items-center gap-1 text-muted-foreground">
                       <CheckCircle2 className="h-3 w-3" />
                       <span>{contribution.likes} found helpful</span>
                     </div>
                   </div>
                 </div>
               );
             })}
             <Button variant="outline" className="w-full mt-2" size="sm">
               <ExternalLink className="h-4 w-4 mr-2" />
               View All Contributions
             </Button>
           </TabsContent>
 
           {/* Contribute Form */}
           <TabsContent value="contribute" className="space-y-4">
             {!tier ? (
               <div className="text-center py-6">
                 <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-sm text-muted-foreground mb-3">
                   Verify your credentials to share knowledge with the community
                 </p>
                 <Button variant="outline" size="sm" asChild>
                   <a href="/verification-request">Get Verified</a>
                 </Button>
               </div>
             ) : (
               <>
                 {/* Category Selection */}
                 <div className="space-y-2">
                   <Label className="text-xs text-muted-foreground">Type of Contribution</Label>
                   <div className="grid grid-cols-2 gap-2">
                     {KNOWLEDGE_CATEGORIES.map((cat) => (
                       <button
                         key={cat.id}
                         type="button"
                         onClick={() => setSelectedCategory(cat.id)}
                         className={cn(
                           'flex items-center gap-2 p-2 rounded-lg border text-left transition-colors',
                           selectedCategory === cat.id
                             ? 'border-primary bg-primary/5'
                             : 'border-border hover:bg-muted/50'
                         )}
                       >
                         <cat.icon className={cn(
                           'h-4 w-4 shrink-0',
                           selectedCategory === cat.id ? 'text-primary' : 'text-muted-foreground'
                         )} />
                         <div className="min-w-0">
                           <p className="text-xs font-medium truncate">{cat.label}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
 
                 {/* Disease Area */}
                 <div className="space-y-2">
                   <Label htmlFor="diseaseArea" className="text-xs text-muted-foreground">
                     Disease Area
                   </Label>
                   <Select value={diseaseArea} onValueChange={setDiseaseArea}>
                     <SelectTrigger id="diseaseArea" className="h-9">
                       <SelectValue placeholder="Select area..." />
                     </SelectTrigger>
                     <SelectContent>
                       {DISEASE_AREAS.map((area) => (
                         <SelectItem key={area} value={area}>
                           {area}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 {/* Title */}
                 <div className="space-y-2">
                   <Label htmlFor="title" className="text-xs text-muted-foreground">
                     Title
                   </Label>
                   <Input
                     id="title"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Brief, descriptive title..."
                     className="h-9"
                     maxLength={100}
                   />
                 </div>
 
                 {/* Content */}
                 <div className="space-y-2">
                   <Label htmlFor="content" className="text-xs text-muted-foreground">
                     Content
                   </Label>
                   <Textarea
                     id="content"
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     placeholder="Share your knowledge..."
                     className="min-h-[80px] resize-none"
                     maxLength={500}
                   />
                   <p className="text-xs text-muted-foreground text-right">
                     {content.length}/500
                   </p>
                 </div>
 
                 {/* Resource URL (conditional) */}
                 {selectedCategory === 'resource' && (
                   <div className="space-y-2">
                     <Label htmlFor="resourceUrl" className="text-xs text-muted-foreground">
                       Resource URL
                     </Label>
                     <Input
                       id="resourceUrl"
                       type="url"
                       value={resourceUrl}
                       onChange={(e) => setResourceUrl(e.target.value)}
                       placeholder="https://..."
                       className="h-9"
                     />
                   </div>
                 )}
 
                 <Button
                   onClick={handleSubmit}
                   disabled={isSubmitting || !selectedCategory || !title.trim() || !content.trim()}
                   className="w-full"
                   size="sm"
                 >
                   {isSubmitting ? (
                     'Submitting...'
                   ) : (
                     <>
                       <Send className="h-4 w-4 mr-2" />
                       Submit Contribution
                     </>
                   )}
                 </Button>
 
                 <p className="text-xs text-muted-foreground text-center">
                   Contributions are reviewed before publishing
                 </p>
               </>
             )}
           </TabsContent>
         </Tabs>
       </CardContent>
     </Card>
   );
 }