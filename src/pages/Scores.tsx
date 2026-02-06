 import { useState, useMemo, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
 import { 
  Activity, Search, Star, Clock, Trash2, ArrowLeft, Menu,
   Calculator, BookOpen, HeartPulse, TrendingUp, ClipboardCheck,
   AlertTriangle, CheckCircle, Info
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { 
   CALCULATORS, 
   CALCULATOR_CATEGORIES, 
   DISEASE_LABELS,
   getFavorites, 
   toggleFavorite, 
   getHistory, 
   clearHistory,
   type Calculator as CalculatorType,
   type CalculatorCategory,
   type DiseaseType,
 } from '@/lib/calculators';
import { DAS28Calculator } from '@/components/scores/DAS28Calculator';
import { CDAICalculator } from '@/components/scores/CDAICalculator';
import { BASDAICalculator } from '@/components/scores/BASDAICalculator';
import { SLEDAICalculator } from '@/components/scores/SLEDAICalculator';
import { DAS28CRPCalculator } from '@/components/scores/DAS28CRPCalculator';
import { ACREULARRACalculator } from '@/components/scores/ACREULARRACalculator';
import { DAS28ComparisonCalculator } from '@/components/scores/DAS28ComparisonCalculator';
import { SDAICalculator } from '@/components/scores/SDAICalculator';
import { CASPARCalculator } from '@/components/scores/CASPARCalculator';
import { DAPSACalculator } from '@/components/scores/DAPSACalculator';
import { MDACalculator } from '@/components/scores/MDACalculator';
import { ACRResponseCalculator } from '@/components/scores/ACRResponseCalculator';
import { EULARResponseCalculator } from '@/components/scores/EULARResponseCalculator';
import { ASASResponseCalculator } from '@/components/scores/ASASResponseCalculator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
 
 const CATEGORY_ICONS: Record<CalculatorCategory, typeof Activity> = {
   'disease-activity': Activity,
   'classification': BookOpen,
   'functional': HeartPulse,
   'prognosis': TrendingUp,
   'monitoring': ClipboardCheck,
 };
 
 export default function Scores() {
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<CalculatorCategory | 'all' | 'favorites'>('all');
   const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);
   const [favorites, setFavorites] = useState<string[]>([]);
   const [historyCount, setHistoryCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
   useEffect(() => {
     setFavorites(getFavorites());
     setHistoryCount(getHistory().length);
   }, []);
 
   const filteredCalculators = useMemo(() => {
     return CALCULATORS.filter((calc) => {
       // Search filter
       const matchesSearch = !searchQuery || 
         calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         calc.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         calc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
         calc.diseases.some(d => DISEASE_LABELS[d].label.toLowerCase().includes(searchQuery.toLowerCase()));
       
       // Category filter
       const matchesCategory = 
         selectedCategory === 'all' ||
         (selectedCategory === 'favorites' && favorites.includes(calc.id)) ||
         calc.category === selectedCategory;
       
       return matchesSearch && matchesCategory;
     });
   }, [searchQuery, selectedCategory, favorites]);
 
   const handleToggleFavorite = (calcId: string, e: React.MouseEvent) => {
     e.stopPropagation();
     const newFavorites = toggleFavorite(calcId);
     setFavorites(newFavorites);
     toast.success(newFavorites.includes(calcId) ? 'Added to favorites' : 'Removed from favorites');
   };
 
   const handleClearHistory = () => {
     clearHistory();
     setHistoryCount(0);
     toast.success('History cleared');
   };
 
   const renderCalculator = (calcId: string) => {
     switch (calcId) {
       case 'das28-esr':
         return <DAS28Calculator />;
      case 'das28-crp':
        return <DAS28CRPCalculator />;
      case 'das28-comparison':
        return <DAS28ComparisonCalculator />;
       case 'cdai':
         return <CDAICalculator />;
      case 'sdai':
        return <SDAICalculator />;
       case 'basdai':
         return <BASDAICalculator />;
       case 'sledai':
         return <SLEDAICalculator />;
      case 'acr-eular-ra':
        return <ACREULARRACalculator />;
       case 'caspar':
         return <CASPARCalculator />;
       case 'dapsa':
         return <DAPSACalculator />;
       case 'mda':
         return <MDACalculator />;
      case 'acr-response':
        return <ACRResponseCalculator />;
      case 'eular-response':
        return <EULARResponseCalculator />;
      case 'asas-response':
        return <ASASResponseCalculator />;
      default:
        return null;
    }
   };
 
   const selectedCalc = selectedCalculator ? CALCULATORS.find(c => c.id === selectedCalculator) : null;
 
  const handleSelectCalculator = (calcId: string) => {
    setSelectedCalculator(calcId);
    setSidebarOpen(false);
  };

  // Sidebar content - reusable for both desktop and mobile
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Calculators
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Rheumatology scores & criteria
        </p>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search calculators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-3 border-b space-y-1">
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedCategory === 'favorites' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setSelectedCategory('favorites')}
          >
            <Star className="h-3 w-3" />
            Favorites ({favorites.length})
          </Button>
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(CALCULATOR_CATEGORIES).map(([key, { label }]) => {
            const Icon = CATEGORY_ICONS[key as CalculatorCategory];
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setSelectedCategory(key as CalculatorCategory)}
              >
                <Icon className="h-3 w-3" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Calculator List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredCalculators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No calculators found
            </p>
          ) : (
            filteredCalculators.map((calc) => (
              <button
                key={calc.id}
                onClick={() => handleSelectCalculator(calc.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedCalculator === calc.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{calc.shortName}</span>
                      {!calc.implemented && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">Soon</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {calc.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {calc.diseases.map((d) => (
                        <span
                          key={d}
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                            DISEASE_LABELS[d].color
                          )}
                        >
                          {DISEASE_LABELS[d].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(calc.id, e)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        favorites.includes(calc.id)
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* History Footer */}
      <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {historyCount} calculations
        </span>
        {historyCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={handleClearHistory}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </>
  );

   return (
     <AppLayout>
      <div className="flex h-[calc(100vh-64px)] w-full">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden md:flex w-80 border-r bg-card flex-col shrink-0">
          <SidebarContent />
        </aside>
 
        {/* Mobile Sidebar - Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
 
         {/* Main Content */}
         <main className="flex-1 overflow-auto">
           <div className="p-6 max-w-4xl mx-auto">
            {/* Mobile Header with Menu Button */}
            <div className="md:hidden flex items-center gap-3 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Calculators</h1>
                <p className="text-xs text-muted-foreground">
                  {selectedCalc ? selectedCalc.shortName : 'Select a calculator'}
                </p>
              </div>
            </div>

             {selectedCalc ? (
               <>
                 {/* Back button and header */}
                 <div className="mb-6">
                   <Button
                     variant="ghost"
                     size="sm"
                    className="mb-3 -ml-2 hidden md:inline-flex"
                     onClick={() => setSelectedCalculator(null)}
                   >
                     <ArrowLeft className="h-4 w-4 mr-1" />
                     All Calculators
                   </Button>
                   <div className="flex items-start justify-between">
                     <div>
                       <h2 className="text-2xl font-bold">{selectedCalc.name}</h2>
                       <p className="text-muted-foreground mt-1">{selectedCalc.description}</p>
                       <div className="flex flex-wrap gap-2 mt-3">
                         {selectedCalc.diseases.map((d) => (
                           <span
                             key={d}
                             className={cn(
                               'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                               DISEASE_LABELS[d].color
                             )}
                           >
                             {DISEASE_LABELS[d].label}
                           </span>
                         ))}
                         <Badge variant="outline">
                           {CALCULATOR_CATEGORIES[selectedCalc.category].label}
                         </Badge>
                       </div>
                     </div>
                     <Button
                       variant="outline"
                       size="icon"
                       onClick={(e) => handleToggleFavorite(selectedCalc.id, e)}
                     >
                       <Star
                         className={cn(
                           'h-4 w-4',
                           favorites.includes(selectedCalc.id)
                             ? 'fill-warning text-warning'
                             : ''
                         )}
                       />
                     </Button>
                   </div>
                 </div>
 
                 {/* Calculator or Coming Soon */}
                 {selectedCalc.implemented ? (
                   renderCalculator(selectedCalc.id)
                 ) : (
                   <Card>
                     <CardContent className="py-12 text-center">
                       <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                       <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                       <p className="text-muted-foreground max-w-md mx-auto">
                         This calculator is on our roadmap. It will be available in a future update.
                       </p>
                       {selectedCalc.formula && (
                         <div className="mt-6 p-4 bg-muted/50 rounded-lg inline-block">
                           <p className="text-xs text-muted-foreground mb-1">Formula</p>
                           <code className="text-sm font-mono">{selectedCalc.formula}</code>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 )}
 
                 {/* Reference */}
                 {selectedCalc.reference && (
                   <p className="text-xs text-muted-foreground mt-4">
                     Reference: {selectedCalc.reference}
                   </p>
                 )}
               </>
             ) : (
               /* Welcome / Overview */
               <div className="space-y-6">
                 <div>
                   <h2 className="text-2xl font-bold">Select a Calculator</h2>
                   <p className="text-muted-foreground mt-1">
                     Choose from disease activity scores, classification criteria, and functional assessments
                   </p>
                 </div>
 
                 <Alert>
                   <Info className="h-4 w-4" />
                   <AlertDescription>
                     Classification criteria ≠ diagnosis. These tools are for clinical decision support only.
                   </AlertDescription>
                 </Alert>
 
                 {/* Quick Stats */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <Card>
                     <CardContent className="pt-4 text-center">
                       <p className="text-3xl font-bold text-primary">{CALCULATORS.length}</p>
                       <p className="text-xs text-muted-foreground">Total Calculators</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardContent className="pt-4 text-center">
                       <p className="text-3xl font-bold text-success">
                         {CALCULATORS.filter(c => c.implemented).length}
                       </p>
                       <p className="text-xs text-muted-foreground">Implemented</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardContent className="pt-4 text-center">
                       <p className="text-3xl font-bold text-warning">{favorites.length}</p>
                       <p className="text-xs text-muted-foreground">Favorites</p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardContent className="pt-4 text-center">
                       <p className="text-3xl font-bold">{historyCount}</p>
                       <p className="text-xs text-muted-foreground">Calculations</p>
                     </CardContent>
                   </Card>
                 </div>
 
                 {/* Categories Overview */}
                 <div className="grid md:grid-cols-2 gap-4">
                   {Object.entries(CALCULATOR_CATEGORIES).map(([key, { label, description }]) => {
                     const Icon = CATEGORY_ICONS[key as CalculatorCategory];
                     const count = CALCULATORS.filter(c => c.category === key).length;
                     return (
                       <Card
                         key={key}
                         className="cursor-pointer hover:border-primary transition-colors"
                         onClick={() => setSelectedCategory(key as CalculatorCategory)}
                       >
                         <CardContent className="pt-4">
                           <div className="flex items-start gap-3">
                             <div className="p-2 rounded-lg bg-primary/10">
                               <Icon className="h-5 w-5 text-primary" />
                             </div>
                             <div>
                               <h3 className="font-semibold">{label}</h3>
                               <p className="text-sm text-muted-foreground">{description}</p>
                               <p className="text-xs text-muted-foreground mt-1">{count} calculators</p>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     );
                   })}
                 </div>
               </div>
             )}
           </div>
         </main>
       </div>
     </AppLayout>
   );
 }