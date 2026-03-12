import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, Check, AlertCircle } from 'lucide-react';
import { ARTICLE_TYPES, type ManuscriptState, type ArticleType, type CitationStyle, type WritingMode } from './types';
import { cn } from '@/lib/utils';

interface Props {
  state: ManuscriptState;
  progress: number;
  totalWords: number;
  submissionReady: boolean;
  onArticleTypeChange: (t: ArticleType) => void;
  onCitationStyleChange: (s: CitationStyle) => void;
  onModeChange: (m: WritingMode) => void;
}

export function ManuscriptTopBar({
  state, progress, totalWords, submissionReady,
  onArticleTypeChange, onCitationStyleChange, onModeChange,
}: Props) {
  return (
    <header className="h-14 border-b border-border/40 bg-white/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 rounded bg-stone-900 flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-serif font-bold text-sm text-stone-900 hidden sm:block tracking-tight">Manuscript Foundry</span>
      </div>

      <div className="h-5 w-px bg-border/60 hidden sm:block" />

      {/* Article type */}
      <Select value={state.articleType} onValueChange={(v) => onArticleTypeChange(v as ArticleType)}>
        <SelectTrigger className="h-8 text-xs w-[180px] border-border/40 bg-stone-50/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {ARTICLE_TYPES.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Citation style */}
      <Select value={state.citationStyle} onValueChange={(v) => onCitationStyleChange(v as CitationStyle)}>
        <SelectTrigger className="h-8 text-xs w-[110px] border-border/40 bg-stone-50/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="vancouver" className="text-xs">Vancouver</SelectItem>
          <SelectItem value="apa" className="text-xs">APA</SelectItem>
        </SelectContent>
      </Select>

      {/* Mode */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[10px] text-muted-foreground">Basic</span>
        <Switch
          checked={state.mode === 'advanced'}
          onCheckedChange={(v) => onModeChange(v ? 'advanced' : 'basic')}
          className="scale-75"
        />
        <span className="text-[10px] text-muted-foreground">Advanced</span>
      </div>

      <div className="flex-1" />

      {/* Word count */}
      <span className="text-[10px] font-mono text-muted-foreground hidden md:block">
        {totalWords.toLocaleString()} words
      </span>

      {/* Progress */}
      <div className="hidden md:flex items-center gap-2 w-32">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{progress}%</span>
      </div>

      {/* Submission badge */}
      <Badge
        variant={submissionReady ? 'default' : 'outline'}
        className={cn(
          'text-[10px] h-6 gap-1',
          submissionReady
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'text-muted-foreground border-border/40'
        )}
      >
        {submissionReady ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        {submissionReady ? 'Ready' : 'Draft'}
      </Badge>
    </header>
  );
}
