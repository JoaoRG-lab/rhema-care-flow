import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Baby,
  BookOpen,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Search,
  Sparkles,
  Video,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { usePublicEducationContent } from '@/hooks/usePublicEducationContent';
import { ContentVoteButtons } from '@/components/education/ContentVoteButtons';
import { exportContentAsPdf } from '@/lib/contentPdfExport';
import { cn } from '@/lib/utils';
import { EDUCATION_CATEGORIES, type ContentType, type EducationContent } from '@/types/education';

const PEDIA_COLOR = 'hsl(199 89% 48%)';
const PEDIA_GRADIENT = 'from-[hsl(199_89%_48%)] to-[hsl(217_91%_60%)]';

const TYPE_ICONS: Record<ContentType, typeof FileText> = {
  article: FileText,
  video: Video,
  infographic: ImageIcon,
  guide: BookOpen,
  faq: HelpCircle,
};

type SortOption = 'recent' | 'popular' | 'reading_time' | 'oldest';

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="aspect-video overflow-hidden rounded-t-xl relative bg-muted">
      {!loaded && !errored && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            'w-full h-full object-cover transition-all duration-500 group-hover:scale-105',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  );
}

export default function LearnPediatrics() {
  const { content, loading } = usePublicEducationContent();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewing, setViewing] = useState<EducationContent | null>(null);

  // Open a specific article from ?content=<slug>
  useEffect(() => {
    const slug = searchParams.get('content');
    if (!slug || !content.length) return;
    const match = content.find((c) => c.slug === slug);
    if (match) setViewing(match);
  }, [searchParams, content]);

  const pediatricContent = useMemo(
    () =>
      content.filter(
        (c) =>
          c.specialty?.toLowerCase() === 'pediatrics' ||
          c.specialty?.toLowerCase() === 'pediatria',
      ),
    [content],
  );

  const categoriesInUse = useMemo(() => {
    const set = new Set<string>();
    pediatricContent.forEach((c) => c.category && set.add(c.category));
    return Array.from(set).sort();
  }, [pediatricContent]);

  const filtered = useMemo(() => {
    let list = [...pediatricContent];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary?.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.diagnosis_tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      list = list.filter((c) => c.content_type === selectedType);
    }

    switch (sortBy) {
      case 'recent':
        list.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at).getTime() -
            new Date(a.published_at || a.created_at).getTime(),
        );
        break;
      case 'oldest':
        list.sort(
          (a, b) =>
            new Date(a.published_at || a.created_at).getTime() -
            new Date(b.published_at || b.created_at).getTime(),
        );
        break;
      case 'popular':
        list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'reading_time':
        list.sort(
          (a, b) => (a.reading_time_minutes || 0) - (b.reading_time_minutes || 0),
        );
        break;
    }

    return list;
  }, [pediatricContent, searchQuery, selectedCategory, selectedType, sortBy]);

  const featuredCount = pediatricContent.filter((c) => c.is_featured).length;
  const hasActiveFilters =
    searchQuery || selectedCategory !== 'all' || selectedType !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSortBy('recent');
  };

  const closeViewer = () => {
    setViewing(null);
    if (searchParams.get('content')) {
      searchParams.delete('content');
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${PEDIA_COLOR}15, ${PEDIA_COLOR}05 60%, transparent)`,
        }}
      >
        <div className="container mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-6">
            <Link to="/pediatria">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Pediatria
              </Button>
            </Link>
            <Link to="/learn">
              <Button variant="ghost" size="sm" className="gap-2">
                Toda a biblioteca
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
                style={{ backgroundColor: `${PEDIA_COLOR}20`, color: PEDIA_COLOR }}
              >
                <Baby className="h-3.5 w-3.5" />
                Biblioteca Pediátrica
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Conhecimento <span style={{ color: PEDIA_COLOR }}>Pedia</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Artigos, diretrizes e revisões pediátricas publicadas pela comunidade
                clínica, alinhadas com SBP e AAP. Navegue, filtre e leia gratuitamente.
              </p>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-2xl font-bold" style={{ color: PEDIA_COLOR }}>
                  {pediatricContent.length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Publicações
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: PEDIA_COLOR }}>
                  {featuredCount}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Destaques
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: PEDIA_COLOR }}>
                  {categoriesInUse.length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Categorias
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, resumo ou diagnóstico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="md:w-56">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {(categoriesInUse.length
                ? categoriesInUse
                : (EDUCATION_CATEGORIES as readonly string[])
              ).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="popular">Mais lidos</SelectItem>
              <SelectItem value="reading_time">Leitura mais rápida</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Type tabs */}
        <Tabs
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as ContentType | 'all')}
          className="mb-6"
        >
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="article" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Artigos
            </TabsTrigger>
            <TabsTrigger value="guide" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Guias
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="infographic" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Infográficos
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {pediatricContent.length === 0
                  ? 'Nenhum conteúdo pediátrico publicado ainda.'
                  : 'Nenhum resultado para os filtros selecionados.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4 gap-2">
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} {filtered.length === 1 ? 'publicação' : 'publicações'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const TypeIcon = TYPE_ICONS[item.content_type] || FileText;
                return (
                  <Card
                    key={item.id}
                    onClick={() => setViewing(item)}
                    className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 flex flex-col h-full cursor-pointer"
                  >
                    {item.featured_image_url && (
                      <CardImage src={item.featured_image_url} alt={item.title} />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1"
                          style={{ backgroundColor: `${PEDIA_COLOR}15`, color: PEDIA_COLOR }}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {item.category}
                        </Badge>
                        {item.is_featured && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                        <div className="flex items-center gap-3">
                          {item.reading_time_minutes && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.reading_time_minutes} min
                            </span>
                          )}
                          {item.published_at && (
                            <span>{format(new Date(item.published_at), 'dd MMM yyyy')}</span>
                          )}
                        </div>
                        <span
                          className="inline-flex items-center gap-1 font-medium group-hover:underline"
                          style={{ color: PEDIA_COLOR }}
                        >
                          Ler <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                      <div
                        className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Foi útil?
                        </span>
                        <ContentVoteButtons contentId={item.id} accentColor={PEDIA_COLOR} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Reader */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${PEDIA_COLOR}15`, color: PEDIA_COLOR }}
                  >
                    {viewing.category}
                  </Badge>
                  {viewing.is_featured && (
                    <Badge variant="default" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Destaque
                    </Badge>
                  )}
                  {viewing.diagnosis_tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <DialogTitle className="text-2xl">{viewing.title}</DialogTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                  {viewing.reading_time_minutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {viewing.reading_time_minutes} min de leitura
                    </span>
                  )}
                  {viewing.published_at && (
                    <span>{format(new Date(viewing.published_at), 'dd MMMM yyyy')}</span>
                  )}
                </div>
              </DialogHeader>

              {viewing.featured_image_url && (
                <img
                  src={viewing.featured_image_url}
                  alt={viewing.title}
                  className="w-full rounded-lg my-4"
                />
              )}

              {viewing.summary && (
                <p className="text-base text-muted-foreground italic border-l-2 border-primary pl-4 my-4">
                  {viewing.summary}
                </p>
              )}

              <article className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                <ReactMarkdown>{viewing.content}</ReactMarkdown>
              </article>

              {viewing.external_url && (
                <a
                  href={viewing.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
                >
                  <ExternalLink className="h-3 w-3" />
                  Recurso externo
                </a>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t">
                <ContentVoteButtons contentId={viewing.id} accentColor={PEDIA_COLOR} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      exportContentAsPdf(viewing.title, viewing.content, {
                        category: viewing.category,
                        date: viewing.published_at
                          ? format(new Date(viewing.published_at), 'MMMM d, yyyy')
                          : undefined,
                        tags: viewing.diagnosis_tags,
                      })
                    }
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    className={`gap-2 bg-gradient-to-r ${PEDIA_GRADIENT} hover:opacity-90`}
                    onClick={closeViewer}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
