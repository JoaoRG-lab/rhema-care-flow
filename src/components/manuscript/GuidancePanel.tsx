import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, BookOpen, Lightbulb, ShieldCheck } from 'lucide-react';
import type { ManuscriptSection, ArticleType, ReportingChecklist } from './types';
import { ARTICLE_TYPES, CHECKLIST_INFO, STUDY_DESIGN_METHODS } from './types';

interface Props {
  section: ManuscriptSection;
  articleType: ArticleType;
}

export function GuidancePanel({ section, articleType }: Props) {
  const typeInfo = ARTICLE_TYPES.find((t) => t.id === articleType);
  const checklist = typeInfo?.reportingChecklist ? CHECKLIST_INFO[typeInfo.reportingChecklist] : null;
  const designMethods = STUDY_DESIGN_METHODS[articleType];

  return (
    <aside className="w-64 xl:w-72 border-l border-border/30 bg-stone-50/40 shrink-0 hidden xl:flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* What to include */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Must Include</p>
            </div>
            <ul className="space-y-1">
              {section.mustInclude.map((item, i) => (
                <li key={i} className="text-[11px] text-stone-600 leading-relaxed flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-1 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-stone-200/50" />

          {/* What to avoid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Do Not Include</p>
            </div>
            <ul className="space-y-1">
              {section.mustNotInclude.map((item, i) => (
                <li key={i} className="text-[11px] text-stone-500 leading-relaxed flex items-start gap-1.5">
                  <span className="text-red-400 mt-1 shrink-0">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-stone-200/50" />

          {/* Common mistakes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Common Mistakes</p>
            </div>
            <ul className="space-y-1">
              {section.commonMistakes.map((item, i) => (
                <li key={i} className="text-[11px] text-stone-500 leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-500 mt-1 shrink-0">⚠</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Study-design-specific hints for Methods */}
          {section.id === 'methods' && designMethods && (
            <>
              <Separator className="bg-stone-200/50" />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                    {typeInfo?.label} — Key Elements
                  </p>
                </div>
                <ul className="space-y-1">
                  {designMethods.map((item, i) => (
                    <li key={i} className="text-[11px] text-blue-700 leading-relaxed flex items-start gap-1.5">
                      <span className="text-blue-400 mt-1 shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Reporting checklist */}
          {checklist && (
            <>
              <Separator className="bg-stone-200/50" />
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                    {checklist.name} Checklist
                  </p>
                </div>
                <p className="text-[9px] text-stone-400 mb-2 leading-relaxed">{checklist.fullName}</p>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-indigo-200 text-indigo-500 mb-2">
                  Auto-suggested for {typeInfo?.label}
                </Badge>
                <ul className="space-y-1">
                  {checklist.items.map((item, i) => (
                    <li key={i} className="text-[10px] text-stone-500 leading-relaxed flex items-start gap-1.5">
                      <span className="text-indigo-400 mt-0.5 shrink-0 font-mono text-[8px]">{String(i + 1).padStart(2, '0')}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Article type info */}
          {typeInfo && (
            <>
              <Separator className="bg-stone-200/50" />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-stone-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Article Type</p>
                </div>
                <div className="space-y-1 text-[10px] text-stone-500">
                  <p>Type: <span className="font-medium text-stone-700">{typeInfo.label}</span></p>
                  <p>Typical length: <span className="font-medium text-stone-700">{typeInfo.typicalWordCount[0].toLocaleString()}–{typeInfo.typicalWordCount[1].toLocaleString()} words</span></p>
                  <p>Abstract: <span className="font-medium text-stone-700">{typeInfo.abstractStructured ? 'Structured' : 'Unstructured'}</span></p>
                  {typeInfo.reportingChecklist && (
                    <p>Checklist: <span className="font-medium text-indigo-600">{typeInfo.reportingChecklist}</span></p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
