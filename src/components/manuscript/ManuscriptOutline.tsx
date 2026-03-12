import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, Minus, PenLine } from 'lucide-react';
import type { ManuscriptSection, SectionStatus } from './types';
import { cn } from '@/lib/utils';

function StatusIcon({ status }: { status: SectionStatus }) {
  switch (status) {
    case 'complete': return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
    case 'revised': return <PenLine className="h-3 w-3 text-blue-500" />;
    case 'draft': return <Minus className="h-3 w-3 text-amber-500" />;
    default: return <Circle className="h-3 w-3 text-stone-300" />;
  }
}

interface Props {
  sections: ManuscriptSection[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export function ManuscriptOutline({ sections, activeSection, onSelect }: Props) {
  const core = sections.filter((s) => s.category === 'core');
  const advanced = sections.filter((s) => s.category === 'advanced');
  const filledCore = core.filter((s) => s.content.trim().length > 10).length;
  const filledAdv = advanced.filter((s) => s.content.trim().length > 10).length;

  return (
    <aside className="w-56 xl:w-64 border-r border-border/30 bg-stone-50/60 shrink-0 hidden lg:flex flex-col h-full">
      <div className="p-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 mb-3">Manuscript Structure</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {/* Core */}
          <div className="mb-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-400 px-2 mb-1">
              Core · {filledCore}/{core.length}
            </p>
            {core.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-150',
                  activeSection === s.id
                    ? 'bg-white shadow-sm text-stone-900 font-medium'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-white/60'
                )}
              >
                <StatusIcon status={s.status} />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>

          {advanced.length > 0 && (
            <>
              <Separator className="my-2 bg-stone-200/60" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-400 px-2 mb-1">
                  Publishing · {filledAdv}/{advanced.length}
                </p>
                {advanced.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-150',
                      activeSection === s.id
                        ? 'bg-white shadow-sm text-stone-900 font-medium'
                        : 'text-stone-400 hover:text-stone-600 hover:bg-white/60'
                    )}
                  >
                    <StatusIcon status={s.status} />
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
