import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ManuscriptSection, SectionStatus, CitationStyle } from './types';
import { CITATION_EXAMPLES } from './types';

interface Props {
  section: ManuscriptSection;
  citationStyle: CitationStyle;
  onContentChange: (value: string) => void;
  onStatusChange: (status: SectionStatus) => void;
  onCoauthorNoteChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function SectionEditor({
  section, citationStyle, onContentChange, onStatusChange, onCoauthorNoteChange,
  onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const wordCount = section.content.split(/\s+/).filter(Boolean).length;
  const charCount = section.content.length;
  const [targetMin, targetMax] = section.wordCountTarget || [0, 0];
  const isOverTarget = targetMax > 0 && wordCount > targetMax;
  const isUnderTarget = targetMin > 0 && wordCount > 0 && wordCount < targetMin;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      {/* Section header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {section.required && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-stone-300 text-stone-500">Required</Badge>
              )}
              {!section.required && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-stone-200 text-stone-400">Optional</Badge>
              )}
            </div>
            <h2 className="text-xl font-serif font-semibold text-stone-900 tracking-tight">{section.title}</h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xl">{section.purpose}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={section.status} onValueChange={(v) => onStatusChange(v as SectionStatus)}>
              <SelectTrigger className="h-7 text-[10px] w-[90px] border-stone-200 bg-stone-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty" className="text-xs">Empty</SelectItem>
                <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                <SelectItem value="revised" className="text-xs">Revised</SelectItem>
                <SelectItem value="complete" className="text-xs">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Writing area */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Prompt */}
        <div className="bg-stone-50 border border-stone-200/60 rounded-lg p-3 mb-4">
          <p className="text-[11px] font-medium text-stone-600 mb-1">Writing Prompt</p>
          <p className="text-xs text-stone-500 italic leading-relaxed">{section.writingPrompt}</p>
        </div>

        {/* Sentence starters */}
        {section.sentenceStarters.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">Sentence Starters</p>
            <div className="flex flex-wrap gap-1.5">
              {section.sentenceStarters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onContentChange(section.content + (section.content ? '\n' : '') + s)}
                  className="text-[10px] px-2 py-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors font-mono"
                >
                  {s.length > 50 ? s.substring(0, 50) + '…' : s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main textarea */}
        <Textarea
          value={section.content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={section.placeholder}
          className="min-h-[320px] text-sm leading-[1.9] font-serif resize-y bg-white border-stone-200 focus:border-stone-400 focus:ring-stone-200/50 placeholder:text-stone-300 placeholder:text-xs"
        />

        {/* Stats bar */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
          <div className="flex items-center gap-3">
            <span className={isOverTarget ? 'text-red-500 font-medium' : isUnderTarget ? 'text-amber-500' : ''}>
              {wordCount} words · {charCount} characters
            </span>
            {targetMax > 0 && (
              <span className="text-stone-300">Target: {targetMin}–{targetMax} words</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onPrev} disabled={!hasPrev}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onNext} disabled={!hasNext}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Citation examples for References section */}
        {section.id === 'references' && (
          <div className="mt-4 bg-stone-50 border border-stone-200/60 rounded-lg p-3">
            <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mb-2">
              {citationStyle === 'vancouver' ? 'Vancouver' : 'APA'} Format Examples
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[9px] text-stone-400 font-medium">Journal Article</p>
                <p className="text-[10px] text-stone-600 font-mono leading-relaxed">{CITATION_EXAMPLES[citationStyle].journal}</p>
              </div>
              <div>
                <p className="text-[9px] text-stone-400 font-medium">Book</p>
                <p className="text-[10px] text-stone-600 font-mono leading-relaxed">{CITATION_EXAMPLES[citationStyle].book}</p>
              </div>
            </div>
          </div>
        )}

        <Separator className="my-4 bg-stone-100" />

        {/* Co-author notes */}
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">Co-author Notes</p>
          <Input
            value={section.coauthorNote}
            onChange={(e) => onCoauthorNoteChange(e.target.value)}
            placeholder="Add notes for co-authors or reviewers..."
            className="text-xs h-8 border-stone-200 bg-stone-50/50 placeholder:text-stone-300"
          />
        </div>
      </div>
    </div>
  );
}
