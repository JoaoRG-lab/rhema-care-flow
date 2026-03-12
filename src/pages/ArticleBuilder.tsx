import { useState, useMemo, useCallback, useEffect } from 'react';
import { createDefaultSections, type ManuscriptState, type ArticleType, type CitationStyle, type WritingMode, type SectionStatus } from '@/components/manuscript/types';
import { ManuscriptTopBar } from '@/components/manuscript/ManuscriptTopBar';
import { ManuscriptOutline } from '@/components/manuscript/ManuscriptOutline';
import { SectionEditor } from '@/components/manuscript/SectionEditor';
import { GuidancePanel } from '@/components/manuscript/GuidancePanel';
import { ManuscriptPreview } from '@/components/manuscript/ManuscriptPreview';
import { SubmissionReadiness, isSubmissionReady } from '@/components/manuscript/SubmissionReadiness';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Eye, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const STORAGE_KEY = 'manuscript-foundry-state';

function loadState(): ManuscriptState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    title: '',
    articleType: 'original',
    citationStyle: 'vancouver',
    mode: 'basic',
    sections: createDefaultSections(),
    activeSection: 'title',
    journalNotes: '',
    coverLetter: '',
    lastSaved: null,
  };
}

export default function ArticleBuilder() {
  const [state, setState] = useState<ManuscriptState>(loadState);
  const [showPreview, setShowPreview] = useState(false);

  // Autosave
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSaved: new Date().toISOString() }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  const visibleSections = useMemo(
    () => state.mode === 'advanced' ? state.sections : state.sections.filter((s) => s.category === 'core'),
    [state.sections, state.mode]
  );

  const activeSection = useMemo(
    () => visibleSections.find((s) => s.id === state.activeSection) || visibleSections[0],
    [visibleSections, state.activeSection]
  );

  const activeIndex = visibleSections.findIndex((s) => s.id === activeSection?.id);

  const progress = useMemo(() => {
    const filled = visibleSections.filter((s) => s.content.trim().length > 10).length;
    return Math.round((filled / visibleSections.length) * 100);
  }, [visibleSections]);

  const totalWords = useMemo(
    () => state.sections.reduce((sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length, 0),
    [state.sections]
  );

  const submissionReady = useMemo(() => isSubmissionReady(state.sections), [state.sections]);

  const updateSection = useCallback((id: string, updates: Partial<{ content: string; status: SectionStatus; coauthorNote: string }>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const setActive = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeSection: id }));
  }, []);

  if (showPreview) {
    return (
      <div className="h-screen flex flex-col">
        <ManuscriptPreview
          sections={visibleSections}
          citationStyle={state.citationStyle}
          articleType={state.articleType}
          onBack={() => setShowPreview(false)}
        />
      </div>
    );
  }

  const outlineContent = (
    <>
      <ManuscriptOutline sections={visibleSections} activeSection={state.activeSection} onSelect={setActive} />
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      <ManuscriptTopBar
        state={state}
        progress={progress}
        totalWords={totalWords}
        submissionReady={submissionReady}
        onArticleTypeChange={(t) => setState((p) => ({ ...p, articleType: t }))}
        onCitationStyleChange={(s) => setState((p) => ({ ...p, citationStyle: s }))}
        onModeChange={(m) => setState((p) => ({ ...p, mode: m }))}
      />

      <div className="flex-1 flex min-h-0">
        {/* Mobile menu */}
        <div className="lg:hidden fixed bottom-4 left-4 z-40 flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 shadow-md bg-white">
                <Menu className="h-4 w-4 mr-1.5" /> Sections
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ManuscriptOutline sections={visibleSections} activeSection={state.activeSection} onSelect={setActive} />
              <Separator />
              <SubmissionReadiness sections={state.sections} />
            </SheetContent>
          </Sheet>
          <Button size="sm" variant="outline" className="h-9 shadow-md bg-white" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Left: Outline */}
        <div className="hidden lg:flex flex-col">
          <ManuscriptOutline sections={visibleSections} activeSection={state.activeSection} onSelect={setActive} />
          <Separator />
          <SubmissionReadiness sections={state.sections} />
        </div>

        {/* Center: Editor */}
        {activeSection && (
          <SectionEditor
            section={activeSection}
            citationStyle={state.citationStyle}
            onContentChange={(v) => updateSection(activeSection.id, { content: v })}
            onStatusChange={(s) => updateSection(activeSection.id, { status: s })}
            onCoauthorNoteChange={(v) => updateSection(activeSection.id, { coauthorNote: v })}
            onPrev={() => activeIndex > 0 && setActive(visibleSections[activeIndex - 1].id)}
            onNext={() => activeIndex < visibleSections.length - 1 && setActive(visibleSections[activeIndex + 1].id)}
            hasPrev={activeIndex > 0}
            hasNext={activeIndex < visibleSections.length - 1}
          />
        )}

        {/* Right: Guidance */}
        {activeSection && (
          <GuidancePanel section={activeSection} articleType={state.articleType} />
        )}
      </div>
    </div>
  );
}
