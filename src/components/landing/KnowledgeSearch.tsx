import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, FileText, Stethoscope, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickSearches = [
  { label: 'DAS28 Calculator', path: '/scores?q=das28' },
  { label: 'Biologic Monitoring', path: '/monitoring' },
  { label: 'RA Classification', path: '/scores?q=ra' },
  { label: 'BASDAI Score', path: '/scores?q=basdai' },
  { label: 'Lupus Criteria', path: '/scores?q=sle' },
];

interface KnowledgeSearchProps {
  className?: string;
  size?: 'default' | 'large';
}

export function KnowledgeSearch({ className, size = 'default' }: KnowledgeSearchProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/knowledge?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const isLarge = size === 'large';

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSearch} className="relative">
        <div className={cn(
          'relative flex items-center',
          isLarge && 'shadow-xl rounded-2xl'
        )}>
          <Search className={cn(
            'absolute left-4 text-muted-foreground',
            isLarge ? 'h-6 w-6' : 'h-5 w-5'
          )} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clinical knowledge, protocols, guidelines..."
            className={cn(
              'pl-12 pr-32 rounded-xl border-border bg-background/80 backdrop-blur-sm',
              isLarge ? 'h-16 text-lg rounded-2xl' : 'h-12'
            )}
          />
          <Button 
            type="submit"
            className={cn(
              'absolute right-2 gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90',
              isLarge ? 'h-12 px-6' : 'h-8 px-4'
            )}
          >
            <Sparkles className={isLarge ? 'h-5 w-5' : 'h-4 w-4'} />
            Search
          </Button>
        </div>
      </form>

      {/* Quick search tags */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-xs text-muted-foreground">Quick:</span>
        {quickSearches.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-accent transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function KnowledgeStats() {
  const stats = [
    { icon: BookOpen, value: '500+', label: 'Clinical Guidelines' },
    { icon: FileText, value: '2,000+', label: 'Research Summaries' },
    { icon: Stethoscope, value: '50+', label: 'Disease Protocols' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="text-center p-4 rounded-xl bg-muted/50">
          <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold gradient-text">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
