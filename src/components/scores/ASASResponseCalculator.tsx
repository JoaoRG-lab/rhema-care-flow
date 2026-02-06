import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Info, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainScores {
  patientGlobal: string;
  pain: string;
  function: string;
  inflammation: string;
}

interface ASASResult {
  asas20: boolean;
  asas40: boolean;
  partialRemission: boolean;
  domainImprovements: {
    domain: string;
    baseline: number;
    current: number;
    percentChange: number;
    absoluteChange: number;
    meets20: boolean;
    meets40: boolean;
  }[];
}

const DOMAIN_LABELS = {
  patientGlobal: 'Patient Global Assessment',
  pain: 'Pain (VAS)',
  function: 'Function (BASFI)',
  inflammation: 'Inflammation (Morning Stiffness)',
};

const DOMAIN_DESCRIPTIONS = {
  patientGlobal: '0-10 VAS scale',
  pain: '0-10 VAS scale',
  function: 'BASFI 0-10 mean score',
  inflammation: 'Mean of last 2 BASDAI questions (0-10)',
};

function calculateASASResponse(baseline: DomainScores, current: DomainScores): ASASResult | null {
  const domains = ['patientGlobal', 'pain', 'function', 'inflammation'] as const;
  
  const domainImprovements = domains.map(domain => {
    const baselineVal = parseFloat(baseline[domain]);
    const currentVal = parseFloat(current[domain]);
    
    if (isNaN(baselineVal) || isNaN(currentVal)) {
      return null;
    }
    
    const absoluteChange = baselineVal - currentVal;
    const percentChange = baselineVal > 0 ? (absoluteChange / baselineVal) * 100 : 0;
    
    // ASAS20: ≥20% improvement AND ≥1 unit absolute improvement
    const meets20 = percentChange >= 20 && absoluteChange >= 1;
    
    // ASAS40: ≥40% improvement AND ≥2 unit absolute improvement
    const meets40 = percentChange >= 40 && absoluteChange >= 2;
    
    return {
      domain: DOMAIN_LABELS[domain],
      baseline: baselineVal,
      current: currentVal,
      percentChange,
      absoluteChange,
      meets20,
      meets40,
    };
  });
  
  if (domainImprovements.some(d => d === null)) {
    return null;
  }
  
  const validDomains = domainImprovements as NonNullable<typeof domainImprovements[0]>[];
  
  // Count domains meeting criteria
  const domains20Met = validDomains.filter(d => d.meets20).length;
  const domains40Met = validDomains.filter(d => d.meets40).length;
  
  // Check for worsening in remaining domains
  const hasWorsening20 = validDomains.some(d => 
    !d.meets20 && (d.percentChange <= -20 && d.absoluteChange <= -1)
  );
  const hasAnyWorsening = validDomains.some(d => d.absoluteChange < 0);
  
  // ASAS20: ≥3 domains improved, no worsening ≥20%/1 unit in remaining
  const asas20 = domains20Met >= 3 && !hasWorsening20;
  
  // ASAS40: ≥3 domains improved, no worsening at all in remaining
  const asas40 = domains40Met >= 3 && !hasAnyWorsening;
  
  // Partial Remission: All 4 domains ≤2
  const partialRemission = validDomains.every(d => d.current <= 2);
  
  return {
    asas20,
    asas40,
    partialRemission,
    domainImprovements: validDomains,
  };
}

export function ASASResponseCalculator() {
  const [baseline, setBaseline] = useState<DomainScores>({
    patientGlobal: '',
    pain: '',
    function: '',
    inflammation: '',
  });
  const [current, setCurrent] = useState<DomainScores>({
    patientGlobal: '',
    pain: '',
    function: '',
    inflammation: '',
  });
  const [result, setResult] = useState<ASASResult | null>(null);

  const updateBaseline = (field: keyof DomainScores, value: string) => {
    setBaseline(prev => ({ ...prev, [field]: value }));
  };

  const updateCurrent = (field: keyof DomainScores, value: string) => {
    setCurrent(prev => ({ ...prev, [field]: value }));
  };

  const calculate = () => {
    const res = calculateASASResponse(baseline, current);
    setResult(res);
  };

  const reset = () => {
    setBaseline({ patientGlobal: '', pain: '', function: '', inflammation: '' });
    setCurrent({ patientGlobal: '', pain: '', function: '', inflammation: '' });
    setResult(null);
  };

  const allFieldsFilled = Object.values(baseline).every(v => v !== '') && 
                          Object.values(current).every(v => v !== '');

  const domains = ['patientGlobal', 'pain', 'function', 'inflammation'] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          ASAS Response Criteria
        </CardTitle>
        <CardDescription>
          Assessment of SpondyloArthritis international Society response criteria for axSpA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ASAS response criteria assess treatment response in axial spondyloarthritis across 
            4 domains: Patient Global, Pain, Function (BASFI), and Inflammation.
          </AlertDescription>
        </Alert>

        {/* Input Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium">
            <div>Domain</div>
            <div className="text-center">Baseline</div>
            <div className="text-center">Current</div>
          </div>
          
          <Separator />
          
          {domains.map(domain => (
            <div key={domain} className="grid grid-cols-3 gap-4 items-center">
              <div>
                <Label className="text-sm font-medium">{DOMAIN_LABELS[domain]}</Label>
                <p className="text-xs text-muted-foreground">{DOMAIN_DESCRIPTIONS[domain]}</p>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={baseline[domain]}
                onChange={(e) => updateBaseline(domain, e.target.value)}
                placeholder="0-10"
                className="text-center"
              />
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={current[domain]}
                onChange={(e) => updateCurrent(domain, e.target.value)}
                placeholder="0-10"
                className="text-center"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={calculate} 
            className="flex-1 gap-2"
            disabled={!allFieldsFilled}
          >
            <Calculator className="h-4 w-4" />
            Calculate Response
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Response Badges */}
            <div className="flex flex-wrap gap-3 justify-center">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border',
                result.asas20 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : 'bg-muted border-border text-muted-foreground'
              )}>
                {result.asas20 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">ASAS20</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border',
                result.asas40 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : 'bg-muted border-border text-muted-foreground'
              )}>
                {result.asas40 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">ASAS40</span>
              </div>
              
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border',
                result.partialRemission 
                  ? 'bg-info/10 border-info/30 text-info' 
                  : 'bg-muted border-border text-muted-foreground'
              )}>
                {result.partialRemission ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">Partial Remission</span>
              </div>
            </div>

            {/* Domain Details */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-left font-medium">Domain</th>
                    <th className="p-2 text-center font-medium">Change</th>
                    <th className="p-2 text-center font-medium">ASAS20</th>
                    <th className="p-2 text-center font-medium">ASAS40</th>
                  </tr>
                </thead>
                <tbody>
                  {result.domainImprovements.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{d.domain}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.baseline.toFixed(1)} <ArrowRight className="inline h-3 w-3" /> {d.current.toFixed(1)}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <div className={cn(
                          'font-medium',
                          d.absoluteChange > 0 ? 'text-success' : d.absoluteChange < 0 ? 'text-destructive' : ''
                        )}>
                          {d.absoluteChange > 0 ? '-' : '+'}{Math.abs(d.absoluteChange).toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({d.percentChange > 0 ? '-' : '+'}{Math.abs(d.percentChange).toFixed(0)}%)
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {d.meets20 ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {d.meets40 ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>ASAS20:</strong> ≥20% improvement AND ≥1 unit in ≥3 domains, no worsening ≥20%/1 unit in remaining
              </p>
              <p>
                <strong>ASAS40:</strong> ≥40% improvement AND ≥2 units in ≥3 domains, no worsening in remaining
              </p>
              <p>
                <strong>Partial Remission:</strong> Value ≤2 in all 4 domains
              </p>
            </div>
          </div>
        )}

        {/* Reference */}
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Reference: Anderson JJ, et al. Arthritis Rheum. 2001;44(8):1876-86
        </p>
      </CardContent>
    </Card>
  );
}
