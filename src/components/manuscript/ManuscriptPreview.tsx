import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ArrowLeft, Printer } from 'lucide-react';
import type { ManuscriptSection, CitationStyle, ArticleType } from './types';
import { ARTICLE_TYPES } from './types';

interface Props {
  sections: ManuscriptSection[];
  citationStyle: CitationStyle;
  articleType: ArticleType;
  onBack: () => void;
}

export function ManuscriptPreview({ sections, citationStyle, articleType, onBack }: Props) {
  const typeInfo = ARTICLE_TYPES.find((t) => t.id === articleType);
  const filled = sections.filter((s) => s.content.trim());

  const titleSection = filled.find((s) => s.id === 'title');
  const runningTitle = filled.find((s) => s.id === 'running_title');
  const authorsSection = filled.find((s) => s.id === 'authors');
  const affiliationsSection = filled.find((s) => s.id === 'affiliations');
  const correspondingSection = filled.find((s) => s.id === 'corresponding');
  const abstractSection = filled.find((s) => s.id === 'abstract');
  const keywordsSection = filled.find((s) => s.id === 'keywords');
  const bodySections = filled.filter((s) =>
    !['title', 'running_title', 'authors', 'affiliations', 'corresponding', 'abstract', 'keywords', 'cover_letter', 'journal_notes'].includes(s.id)
  );

  return (
    <div className="h-full flex flex-col bg-stone-100">
      {/* Toolbar */}
      <div className="h-12 border-b border-stone-200 bg-white flex items-center px-4 gap-2 shrink-0 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Editor
        </Button>
        <div className="flex-1" />
        <span className="text-[10px] text-stone-400 font-mono">Manuscript Preview · {citationStyle.toUpperCase()}</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => window.print()}>
          <Printer className="h-3 w-3" /> Print
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-[700px] mx-auto my-8 bg-white shadow-lg border border-stone-200 print:shadow-none print:border-none print:my-0">
          <article className="p-12 md:p-16 font-serif text-stone-800 text-[13px] leading-[2]">
            {/* Running title */}
            {runningTitle && (
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-8 text-right">
                {runningTitle.content}
              </p>
            )}

            {/* Article type badge */}
            {typeInfo && (
              <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-2">
                {typeInfo.label}
              </p>
            )}

            {/* Title */}
            {titleSection && (
              <h1 className="text-2xl font-bold leading-[1.3] text-stone-900 mb-4">
                {titleSection.content}
              </h1>
            )}

            {/* Authors */}
            {authorsSection && (
              <p className="text-sm text-stone-600 mb-1 whitespace-pre-line leading-relaxed">
                {authorsSection.content}
              </p>
            )}

            {/* Affiliations */}
            {affiliationsSection && (
              <p className="text-[11px] text-stone-500 whitespace-pre-line leading-relaxed mb-2">
                {affiliationsSection.content}
              </p>
            )}

            {/* Corresponding */}
            {correspondingSection && (
              <p className="text-[10px] text-stone-400 whitespace-pre-line leading-relaxed mb-8 border-b border-stone-100 pb-6">
                {correspondingSection.content}
              </p>
            )}

            {/* Abstract */}
            {abstractSection && (
              <div className="mb-6">
                <h2 className="text-xs font-bold font-sans uppercase tracking-[0.15em] text-stone-800 mb-2 border-b border-stone-200 pb-1">
                  Abstract
                </h2>
                <p className="text-[12px] leading-[1.9] text-stone-700 whitespace-pre-line">
                  {abstractSection.content}
                </p>
              </div>
            )}

            {/* Keywords */}
            {keywordsSection && (
              <div className="mb-8">
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 mb-0.5">Keywords</p>
                <p className="text-[11px] text-stone-600 italic">{keywordsSection.content}</p>
              </div>
            )}

            {/* Body sections */}
            {bodySections.map((s) => (
              <div key={s.id} className="mb-6">
                <h2 className="text-xs font-bold font-sans uppercase tracking-[0.15em] text-stone-800 mb-2 border-b border-stone-200 pb-1">
                  {s.title}
                </h2>
                <div className="whitespace-pre-line text-stone-700">{s.content}</div>
              </div>
            ))}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-stone-200">
              <p className="text-[9px] font-sans text-stone-300 text-center uppercase tracking-[0.2em]">
                Generated with Manuscript Foundry · UHS Health OS
              </p>
            </div>
          </article>
        </div>
      </ScrollArea>
    </div>
  );
}
