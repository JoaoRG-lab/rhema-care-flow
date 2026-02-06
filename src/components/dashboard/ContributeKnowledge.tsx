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
  ThumbsUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { useKnowledgeContributions, ContributionCategory } from '@/hooks/useKnowledgeContributions';
import { Skeleton } from '@/components/ui/skeleton';

const KNOWLEDGE_CATEGORIES = [
  { id: 'clinical_pearl' as ContributionCategory, label: 'Clinical Pearl', icon: Lightbulb, description: 'Quick tips from practice' },
  { id: 'guideline_summary' as ContributionCategory, label: 'Guideline Summary', icon: BookOpen, description: 'Summarize key guidelines' },
  { id: 'case_insight' as ContributionCategory, label: 'Case Insight', icon: Stethoscope, description: 'Anonymized case learnings' },
  { id: 'resource' as ContributionCategory, label: 'Resource Link', icon: FileText, description: 'Share useful resources' },
];

const DISEASE_AREAS = ['RA', 'SLE', 'SpA', 'PsA', 'Gout', 'OA', 'Vasculitis', 'Myositis', 'General'];

export function ContributeKnowledge() {
  const { tier } = useVerificationStatus();
  const { 
    contributions, 
    loading, 
    createContribution, 
    voteOnContribution 
  } = useKnowledgeContributions();
  
  const [selectedCategory, setSelectedCategory] = useState<ContributionCategory | ''>('');
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
    
    const success = await createContribution({
      category: selectedCategory,
      title: title.trim(),
      content: content.trim(),
      disease_area: diseaseArea || undefined,
      resource_url: resourceUrl.trim() || undefined,
    });
    
    if (success) {
      // Reset form
      setSelectedCategory('');
      setTitle('');
      setContent('');
      setDiseaseArea('');
      setResourceUrl('');
    }
    
    setIsSubmitting(false);
  };

  const handleVote = async (contributionId: string) => {
    await voteOnContribution(contributionId);
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
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            ) : contributions.length === 0 ? (
              <div className="text-center py-6">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No contributions yet. Be the first to share!
                </p>
              </div>
            ) : (
              contributions.map((contribution) => {
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
                      {contribution.disease_area && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {contribution.disease_area}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {contribution.content}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{contribution.author_name}</span>
                        {contribution.author_tier && (
                          <VerifiedBadge tier={contribution.author_tier as any} size="xs" />
                        )}
                      </div>
                      <button
                        onClick={() => handleVote(contribution.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                          contribution.user_has_voted 
                            ? 'text-primary bg-primary/10' 
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                        )}
                      >
                        <ThumbsUp className={cn(
                          'h-3 w-3',
                          contribution.user_has_voted && 'fill-current'
                        )} />
                        <span>{contribution.helpful_count}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {contributions.length > 0 && (
              <Button variant="outline" className="w-full mt-2" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Contributions
              </Button>
            )}
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