import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Lightbulb,
  BookOpen,
  Stethoscope,
  FileText,
  ThumbsUp,
  Filter,
  SlidersHorizontal,
  Clock,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  MessageCircle,
  Bot,
  Globe,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useKnowledgeContributions, ContributionCategory, KnowledgeContribution } from '@/hooks/useKnowledgeContributions';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommentThread } from '@/components/knowledge/CommentThread';
import { exportContentAsPdf } from '@/lib/contentPdfExport';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SPECIALTIES, getSpecialtyById, type SpecialtyConfig } from '@/config/specialties';

const CATEGORY_CONFIG: Record<ContributionCategory, { label: string; icon: typeof Lightbulb; color: string }> = {
  clinical_pearl: { label: 'Clinical Pearl', icon: Lightbulb, color: 'text-warning' },
  guideline_summary: { label: 'Guideline Summary', icon: BookOpen, color: 'text-info' },
  case_insight: { label: 'Case Insight', icon: Stethoscope, color: 'text-success' },
  resource: { label: 'Resource', icon: FileText, color: 'text-primary' },
};

const DISEASE_AREAS = ['All', 'RA', 'SLE', 'SpA', 'PsA', 'Gout', 'OA', 'Vasculitis', 'Myositis', 'General'];

type SortOption = 'popular' | 'recent' | 'oldest';

export default function KnowledgeLibrary() {
  const isMobile = useIsMobile();
  const { tier } = useVerificationStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const specialtyParam = searchParams.get('specialty');
  const currentSpecialty = specialtyParam ? getSpecialtyById(specialtyParam) : null;
  
  const { 
    contributions, 
    loading, 
    voteOnContribution,
    refreshContributions,
  } = useKnowledgeContributions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContributionCategory | 'all'>('all');
  const [selectedDiseaseArea, setSelectedDiseaseArea] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Get disease areas based on specialty or default
  const diseaseAreas = useMemo(() => {
    if (currentSpecialty) {
      return ['All', ...currentSpecialty.conditions.slice(0, 10)];
    }
    return DISEASE_AREAS;
  }, [currentSpecialty]);
  
  const clearSpecialtyFilter = () => {
    setSearchParams({});
  };

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refreshContributions();
  }, [refreshContributions]);

  const {
    ref: pullRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldTrigger,
  } = usePullToRefresh<HTMLDivElement>({
    onRefresh: handleRefresh,
    enabled: isMobile,
  });

  // Filter and sort contributions
  const filteredContributions = useMemo(() => {
    let result = [...contributions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query) ||
        c.author_name?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Disease area filter
    if (selectedDiseaseArea !== 'All') {
      result = result.filter(c => c.disease_area === selectedDiseaseArea);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }

    return result;
  }, [contributions, searchQuery, selectedCategory, selectedDiseaseArea, sortBy]);

  const handleVote = async (contributionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await voteOnContribution(contributionId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDiseaseArea('All');
    setSortBy('popular');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedDiseaseArea !== 'All';

  const FilterPanel = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <Badge
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(key as ContributionCategory)}
            >
              <config.icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Disease Area Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Disease Area</label>
        <Select value={selectedDiseaseArea} onValueChange={setSelectedDiseaseArea}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {diseaseAreas.map(area => {
              const areaName = typeof area === 'string' ? area : area.name;
              return (
                <SelectItem key={areaName} value={areaName}>{areaName}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Helpful
              </span>
            </SelectItem>
            <SelectItem value="recent">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Most Recent
              </span>
            </SelectItem>
            <SelectItem value="oldest">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Oldest First
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  const ContributionCard = ({ contribution }: { contribution: KnowledgeContribution }) => {
    const config = CATEGORY_CONFIG[contribution.category];
    const Icon = config.icon;
    const isExpanded = expandedId === contribution.id;

    return (
      <Card 
        className={cn(
          'transition-all cursor-pointer hover:shadow-md',
          isExpanded && 'ring-2 ring-primary'
        )}
        onClick={() => setExpandedId(isExpanded ? null : contribution.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg bg-muted shrink-0', config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                    {contribution.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                    {contribution.disease_area && (
                      <Badge variant="outline" className="text-xs">
                        {contribution.disease_area}
                      </Badge>
                    )}
                  </div>
                </div>
                {contribution.is_featured && (
                  <Sparkles className="h-4 w-4 text-warning shrink-0" />
                )}
              </div>

              <p className={cn(
                'text-sm text-muted-foreground mt-2',
                isExpanded ? '' : 'line-clamp-2'
              )}>
                {contribution.content}
              </p>

              {contribution.resource_url && isExpanded && (
                <a
                  href={contribution.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  View Resource
                </a>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {contribution.author_name}
                  </span>
                  {contribution.author_tier && (
                    <VerifiedBadge tier={contribution.author_tier as any} size="xs" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    · {format(new Date(contribution.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {contribution.comment_count || 0}
                  </span>
                  <button
                    onClick={(e) => handleVote(contribution.id, e)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                      contribution.user_has_voted 
                        ? 'text-primary bg-primary/10 font-medium' 
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    <ThumbsUp className={cn(
                      'h-4 w-4',
                      contribution.user_has_voted && 'fill-current'
                    )} />
                    <span>{contribution.helpful_count}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section - only when expanded */}
              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <CommentThread 
                    contributionId={contribution.id} 
                    commentCount={contribution.comment_count || 0}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div ref={pullRef} className="p-4 md:p-6 lg:p-8 relative overflow-auto min-h-screen">
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
          shouldTrigger={shouldTrigger}
        />

        {/* Specialty Banner */}
        {currentSpecialty && (
          <div 
            className="mb-6 p-4 rounded-xl border"
            style={{ 
              background: `linear-gradient(135deg, ${currentSpecialty.color}10, ${currentSpecialty.color}05)`,
              borderColor: `${currentSpecialty.color}30`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${currentSpecialty.color}20` }}
                >
                  <currentSpecialty.icon className="h-5 w-5" style={{ color: currentSpecialty.color }} />
                </div>
                <div>
                  <h2 className="font-semibold" style={{ color: currentSpecialty.color }}>
                    {currentSpecialty.namePt}
                  </h2>
                  <p className="text-xs text-muted-foreground">{currentSpecialty.society}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSpecialtyFilter} className="gap-1">
                <Globe className="h-4 w-4" />
                Ver Todas Especialidades
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              {currentSpecialty ? `Biblioteca ${currentSpecialty.namePt}` : 'Knowledge Library'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentSpecialty 
                ? `Insights clínicos compartilhados pela comunidade de ${currentSpecialty.namePt.toLowerCase()}`
                : 'Clinical insights shared by the medical community'}
            </p>
          </div>
          <Link to="/ai-research">
            <Button className="gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90">
              <Bot className="h-4 w-4" />
              AI Research Engine
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contributions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {isMobile ? (
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    filtersOpen && 'rotate-180'
                  )} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>

        {/* Desktop Filters Collapsible */}
        {!isMobile && (
          <Collapsible open={filtersOpen}>
            <CollapsibleContent>
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <FilterPanel />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Quick Category Tabs (Desktop) */}
        {!isMobile && !filtersOpen && (
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <config.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${filteredContributions.length} contribution${filteredContributions.length !== 1 ? 's' : ''}`}
          </p>
          {!isMobile && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Helpful</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Contributions Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-1">No contributions found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search query'
                  : 'Be the first to share your clinical knowledge!'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredContributions.map(contribution => (
              <ContributionCard key={contribution.id} contribution={contribution} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
