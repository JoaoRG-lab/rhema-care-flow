import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Video, 
  Image, 
  HelpCircle,
  Clock,
  Calendar,
  Star,
  ArrowLeft,
  ExternalLink,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { usePublicEducationContent } from '@/hooks/usePublicEducationContent';
import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
import { EDUCATION_CATEGORIES, type EducationContent, type ContentType } from '@/types/education';

const CONTENT_TYPE_ICONS: Record<ContentType, typeof FileText> = {
  article: FileText,
  video: Video,
  infographic: Image,
  guide: BookOpen,
  faq: HelpCircle,
};

export default function PatientEducationLibrary() {
  const { content, loading } = usePublicEducationContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('all');
  const [viewingContent, setViewingContent] = useState<EducationContent | null>(null);

  // Get unique diagnosis tags from all content
  const allDiagnosisTags = useMemo(() => {
    const tags = new Set<string>();
    content.forEach(item => {
      item.diagnosis_tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [content]);

  // Featured content
  const featuredContent = useMemo(() => {
    return content.filter(item => item.is_featured).slice(0, 3);
  }, [content]);

  // Filtered content
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesDiagnosis = selectedDiagnosis === 'all' || 
        item.diagnosis_tags?.includes(selectedDiagnosis);
      
      return matchesSearch && matchesCategory && matchesDiagnosis;
    });
  }, [content, searchQuery, selectedCategory, selectedDiagnosis]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">RheumaFlow</h1>
                <p className="text-xs text-muted-foreground">Patient Education Library</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Understanding Your <span className="text-primary">Rheumatic Condition</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert-curated educational resources to help you better understand and manage your health
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles, guides, and resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </section>

        {/* Featured Content */}
        {featuredContent.length > 0 && !searchQuery && selectedCategory === 'all' && selectedDiagnosis === 'all' && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-warning fill-warning" />
              Featured Resources
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredContent.map(item => (
                <FeaturedCard 
                  key={item.id} 
                  content={item} 
                  onClick={() => setViewingContent(item)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="space-y-4">
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted/50">
              <TabsTrigger value="all" className="text-xs">All Topics</TabsTrigger>
              {EDUCATION_CATEGORIES.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Diagnosis Filter */}
          {allDiagnosisTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground py-1">Filter by condition:</span>
              <Badge
                variant={selectedDiagnosis === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedDiagnosis('all')}
              >
                All
              </Badge>
              {allDiagnosisTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedDiagnosis === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedDiagnosis(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* Content Grid */}
        <section>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Check back soon for new educational content'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredContent.length} resource{filteredContent.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map(item => (
                  <ContentCard 
                    key={item.id} 
                    content={item} 
                    onClick={() => setViewingContent(item)} 
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold">RheumaFlow</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Educational content provided by verified healthcare professionals. 
              Always consult your doctor for medical advice.
            </p>
            <Button variant="link" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </footer>

      {/* Content Viewer Dialog */}
      <ContentViewerDialog 
        content={viewingContent} 
        open={!!viewingContent}
        onClose={() => setViewingContent(null)}
      />
    </div>
  );
}

function FeaturedCard({ content, onClick }: { content: EducationContent; onClick: () => void }) {
  const Icon = CONTENT_TYPE_ICONS[content.content_type];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">{content.category}</Badge>
          <Star className="h-4 w-4 text-warning fill-warning ml-auto" />
        </div>
        <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{content.summary}</p>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        {content.reading_time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {content.reading_time_minutes} min read
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

function ContentCard({ content, onClick }: { content: EducationContent; onClick: () => void }) {
  const Icon = CONTENT_TYPE_ICONS[content.content_type];
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Badge variant="outline" className="text-xs">{content.category}</Badge>
        </div>
        <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {content.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{content.summary}</p>
        )}
        {content.diagnosis_tags && content.diagnosis_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.diagnosis_tags.slice(0, 3).map(tag => (
              <DiagnosisTag key={tag} tag={tag} size="sm" />
            ))}
            {content.diagnosis_tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.diagnosis_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground gap-3">
        {content.reading_time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {content.reading_time_minutes} min
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(content.published_at || content.created_at), 'MMM d, yyyy')}
        </span>
      </CardFooter>
    </Card>
  );
}

function ContentViewerDialog({ 
  content, 
  open, 
  onClose 
}: { 
  content: EducationContent | null; 
  open: boolean;
  onClose: () => void;
}) {
  if (!content) return null;
  
  const Icon = CONTENT_TYPE_ICONS[content.content_type];
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="p-1 rounded bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="outline">{content.content_type}</Badge>
                <Badge>{content.category}</Badge>
                {content.is_featured && (
                  <Star className="h-4 w-4 text-warning fill-warning" />
                )}
              </div>
              <DialogTitle className="text-xl text-left">{content.title}</DialogTitle>
              {content.summary && (
                <p className="text-muted-foreground mt-2 text-left">{content.summary}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-3">
            {content.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {content.reading_time_minutes} min read
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(content.published_at || content.created_at), 'MMMM d, yyyy')}
            </span>
          </div>
          
          {content.diagnosis_tags && content.diagnosis_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3">
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
        
        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          This content is for educational purposes only. Always consult your healthcare provider for medical advice.
        </div>
      </DialogContent>
    </Dialog>
  );
}
