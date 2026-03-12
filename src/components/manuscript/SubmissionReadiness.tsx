import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { ManuscriptSection } from './types';
import { cn } from '@/lib/utils';

interface CheckItem {
  label: string;
  passed: boolean;
}

interface Props {
  sections: ManuscriptSection[];
}

export function SubmissionReadiness({ sections }: Props) {
  const has = (id: string) => (sections.find((s) => s.id === id)?.content.trim().length ?? 0) > 10;

  const checks: CheckItem[] = [
    { label: 'Title completed', passed: has('title') },
    { label: 'Authors listed', passed: has('authors') },
    { label: 'Corresponding author', passed: has('corresponding') },
    { label: 'Abstract completed', passed: has('abstract') },
    { label: 'Keywords provided', passed: has('keywords') },
    { label: 'Introduction written', passed: has('introduction') },
    { label: 'Methods written', passed: has('methods') },
    { label: 'Results presented', passed: has('results') },
    { label: 'Discussion completed', passed: has('discussion') },
    { label: 'Conclusion provided', passed: has('conclusion') },
    { label: 'References listed', passed: has('references') },
    { label: 'Ethics considered', passed: has('ethics') },
    { label: 'Funding disclosed', passed: has('funding') },
    { label: 'Conflicts declared', passed: has('conflicts') },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const ready = passed >= 11; // at minimum all core sections

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">Submission Readiness</p>
        <Badge
          variant={ready ? 'default' : 'outline'}
          className={cn(
            'text-[9px] h-4',
            ready ? 'bg-emerald-600 text-white' : 'border-stone-300 text-stone-400'
          )}
        >
          {passed}/{total}
        </Badge>
      </div>
      <div className="space-y-0.5">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {c.passed ? (
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-2.5 w-2.5 text-stone-300 shrink-0" />
            )}
            <span className={cn('text-[10px]', c.passed ? 'text-stone-600' : 'text-stone-400')}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function isSubmissionReady(sections: ManuscriptSection[]): boolean {
  const coreIds = ['title', 'authors', 'corresponding', 'abstract', 'keywords', 'introduction', 'methods', 'results', 'discussion', 'conclusion', 'references'];
  return coreIds.every((id) => {
    const s = sections.find((sec) => sec.id === id);
    return s && s.content.trim().length > 10;
  });
}
