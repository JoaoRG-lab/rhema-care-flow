import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, TrendingDown, TrendingUp, Minus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type EULARResponse = 'good' | 'moderate' | 'none';

interface ResponseResult {
  response: EULARResponse;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: typeof TrendingDown;
}

const RESPONSE_DEFINITIONS: Record<EULARResponse, Omit<ResponseResult, 'response'>> = {
  good: {
    label: 'Good Response',
    description: 'Significant improvement with low disease activity achieved',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/30',
    icon: TrendingDown,
  },
  moderate: {
    label: 'Moderate Response',
    description: 'Meaningful improvement but treatment optimization may be considered',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/30',
    icon: Minus,
  },
  none: {
    label: 'No Response',
    description: 'Insufficient improvement; consider treatment modification',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    icon: TrendingUp,
  },
};

// DAS28 thresholds
const LOW_ACTIVITY_THRESHOLD = 3.2;
const HIGH_ACTIVITY_THRESHOLD = 5.1;

// Improvement thresholds
const SIGNIFICANT_IMPROVEMENT = 1.2;
const MODERATE_IMPROVEMENT = 0.6;

function calculateEULARResponse(baselineDAS28: number, currentDAS28: number): EULARResponse {
  const improvement = baselineDAS28 - currentDAS28;

  // Good response: Current ≤ 3.2 AND improvement > 1.2
  if (currentDAS28 <= LOW_ACTIVITY_THRESHOLD && improvement > SIGNIFICANT_IMPROVEMENT) {
    return 'good';
  }

  // No response scenarios
  if (improvement <= MODERATE_IMPROVEMENT) {
    return 'none';
  }
  if (currentDAS28 > HIGH_ACTIVITY_THRESHOLD) {
    return 'none';
  }

  // Moderate response: everything else that's not good or none
  // Cases:
  // 1. Current ≤ 3.2 AND 0.6 < improvement ≤ 1.2
  // 2. 3.2 < Current ≤ 5.1 AND improvement > 0.6
  return 'moderate';
}

function getDAS28State(score: number): { label: string; color: string } {
  if (score < 2.6) return { label: 'Remission', color: 'text-success' };
  if (score < 3.2) return { label: 'Low Activity', color: 'text-info' };
  if (score <= 5.1) return { label: 'Moderate Activity', color: 'text-warning' };
  return { label: 'High Activity', color: 'text-destructive' };
}

export function EULARResponseCalculator() {
  const [baselineDAS28, setBaselineDAS28] = useState<string>('');
  const [currentDAS28, setCurrentDAS28] = useState<string>('');
  const [result, setResult] = useState<ResponseResult | null>(null);

  const calculate = () => {
    const baseline = parseFloat(baselineDAS28);
    const current = parseFloat(currentDAS28);

    if (isNaN(baseline) || isNaN(current) || baseline < 0 || current < 0) {
      return;
    }

    const response = calculateEULARResponse(baseline, current);
    const responseData = RESPONSE_DEFINITIONS[response];
    setResult({ response, ...responseData });
  };

  const reset = () => {
    setBaselineDAS28('');
    setCurrentDAS28('');
    setResult(null);
  };

  const baseline = parseFloat(baselineDAS28);
  const current = parseFloat(currentDAS28);
  const improvement = !isNaN(baseline) && !isNaN(current) ? baseline - current : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          EULAR Response Criteria
        </CardTitle>
        <CardDescription>
          Classify treatment response based on DAS28 change from baseline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            EULAR response criteria classify RA treatment response using both the current DAS28 level 
            and the magnitude of improvement from baseline.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseline" className="flex items-center justify-between">
                <span>Baseline DAS28</span>
                {!isNaN(baseline) && baseline > 0 && (
                  <Badge variant="outline" className={cn('text-xs', getDAS28State(baseline).color)}>
                    {getDAS28State(baseline).label}
                  </Badge>
                )}
              </Label>
              <Input
                id="baseline"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={baselineDAS28}
                onChange={(e) => setBaselineDAS28(e.target.value)}
                placeholder="e.g., 5.8"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                DAS28 score before treatment initiation
              </p>
            </div>

            <div>
              <Label htmlFor="current" className="flex items-center justify-between">
                <span>Current DAS28</span>
                {!isNaN(current) && current >= 0 && (
                  <Badge variant="outline" className={cn('text-xs', getDAS28State(current).color)}>
                    {getDAS28State(current).label}
                  </Badge>
                )}
              </Label>
              <Input
                id="current"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={currentDAS28}
                onChange={(e) => setCurrentDAS28(e.target.value)}
                placeholder="e.g., 3.1"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                DAS28 score after treatment period
              </p>
            </div>

            {/* Improvement Preview */}
            {improvement !== null && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Change in DAS28:</span>
                  <span className={cn(
                    'text-lg font-semibold',
                    improvement > 0 ? 'text-success' : improvement < 0 ? 'text-destructive' : ''
                  )}>
                    {improvement > 0 ? '-' : '+'}{Math.abs(improvement).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={calculate} 
                className="flex-1 gap-2"
                disabled={!baselineDAS28 || !currentDAS28}
              >
                <Calculator className="h-4 w-4" />
                Classify Response
              </Button>
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>

          {/* Result Section */}
          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted/30 border min-h-[250px]">
            {result ? (
              <div className="text-center space-y-4 w-full">
                <div className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full border',
                  result.bgColor
                )}>
                  <result.icon className={cn('h-5 w-5', result.color)} />
                  <span className={cn('font-semibold', result.color)}>
                    {result.label}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {result.description}
                </p>

                {/* Visual Flow */}
                <div className="flex items-center justify-center gap-3 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{parseFloat(baselineDAS28).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Baseline</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{parseFloat(currentDAS28).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Calculator className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Enter DAS28 values to classify response</p>
              </div>
            )}
          </div>
        </div>

        {/* Reference Table */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-semibold">EULAR Response Matrix</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium border-r">DAS28 Improvement</th>
                  <th className="p-2 text-center font-medium border-r">
                    Current ≤3.2<br/>
                    <span className="text-xs text-muted-foreground font-normal">Low Activity</span>
                  </th>
                  <th className="p-2 text-center font-medium border-r">
                    3.2 &lt; Current ≤5.1<br/>
                    <span className="text-xs text-muted-foreground font-normal">Moderate</span>
                  </th>
                  <th className="p-2 text-center font-medium">
                    Current &gt;5.1<br/>
                    <span className="text-xs text-muted-foreground font-normal">High Activity</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 font-medium border-r border-t">&gt;1.2</td>
                  <td className="p-2 text-center border-r border-t bg-success/10 text-success font-medium">Good</td>
                  <td className="p-2 text-center border-r border-t bg-warning/10 text-warning font-medium">Moderate</td>
                  <td className="p-2 text-center border-t bg-warning/10 text-warning font-medium">Moderate</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium border-r border-t">0.6 - 1.2</td>
                  <td className="p-2 text-center border-r border-t bg-warning/10 text-warning font-medium">Moderate</td>
                  <td className="p-2 text-center border-r border-t bg-warning/10 text-warning font-medium">Moderate</td>
                  <td className="p-2 text-center border-t bg-destructive/10 text-destructive font-medium">None</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium border-r border-t">≤0.6</td>
                  <td className="p-2 text-center border-r border-t bg-destructive/10 text-destructive font-medium">None</td>
                  <td className="p-2 text-center border-r border-t bg-destructive/10 text-destructive font-medium">None</td>
                  <td className="p-2 text-center border-t bg-destructive/10 text-destructive font-medium">None</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Reference: van Gestel AM, et al. Arthritis Rheum. 1996;39(1):34-40
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
