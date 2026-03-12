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
    { label: 'Title completed', passed: has('title') > 0 },
    { label: 'Authors listed', passed: has('authors') > 0 },
    { label: 'Corresponding author', passed: has('corresponding') > 0 },
    { label: 'Abstract completed', passed: has('abstract') > 0 },
    { label: 'Keywords provided', passed: has('keywords') > 0 },
    { label: 'Introduction written', passed: has('introduction') > 0 },
    { label: 'Methods written', passed: has('methods') > 0 },
    { label: 'Results presented', passed: has('results') > 0 },
    { label: 'Discussion completed', passed: has('discussion') > 0 },
    { label: 'Conclusion provided', passed: has('conclusion') > 0 },
    { label: 'References listed', passed: has('references') > 0 },
    { label: 'Ethics considered', passed: has('ethics') > 0 },
    { label: 'Funding disclosed', passed: has('funding') > 0 },
    { label: 'Conflicts declared', passed: has('conflicts') > 0 },
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
