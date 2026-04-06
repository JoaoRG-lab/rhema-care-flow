import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEpidemiologicalMatrix } from '@/hooks/useEpidemiologicalMatrix';
import {
  encodeFeatureVector,
  encryptVector,
  addLaplaceNoise,
  computeRiskScore,
  VARIABLE_CATEGORIES,
  type FeatureVectorInput,
  type VariableDefinition,
} from '@/lib/epidemiologicalMatrix';
import { sha256, toBase64 } from '@/lib/crypto';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield, Lock, Brain, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Users, Database,
} from 'lucide-react';

export default function EpidemiologicalMatrix() {
  const { user } = useAuth();
  const { variables, loading, submitVector } = useEpidemiologicalMatrix();
  const [formData, setFormData] = useState<FeatureVectorInput>({});
  const [submitting, setSubmitting] = useState(false);
  const [riskResult, setRiskResult] = useState<{
    score: number;
    category: string;
    factors: Record<string, number>;
  } | null>(null);

  const groupedVars = useMemo(() => {
    const groups: Record<string, VariableDefinition[]> = {};
    for (const cat of VARIABLE_CATEGORIES) {
      groups[cat.code] = variables.filter(v => v.category === cat.code);
    }
    return groups;
  }, [variables]);

  const filledCount = Object.values(formData).filter(v => v !== null && v !== undefined && v !== '').length;
  const totalCount = variables.length;
  const completionPct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  function handleChange(code: string, value: string | number | null) {
    setFormData(prev => ({ ...prev, [code]: value }));
  }

  async function handleSubmit() {
    if (!user) {
      toast.error('You must be logged in to contribute data');
      return;
    }
    if (filledCount < 3) {
      toast.error('Please fill at least 3 variables');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Encode to numeric vector
      const encoded = encodeFeatureVector(formData, variables);

      // 2. Compute risk score BEFORE noise
      const risk = computeRiskScore(encoded.values, encoded.codes);
      setRiskResult(risk);

      // 3. Add differential privacy noise
      const noisyValues = addLaplaceNoise(encoded.values, 1.0);

      // 4. Generate encryption key (in production, derive from user's key)
      const keyBytes = crypto.getRandomValues(new Uint8Array(32));

      // 5. Encrypt vector
      const encResult = await encryptVector(
        { values: noisyValues, codes: encoded.codes, dimension: encoded.dimension },
        keyBytes
      );

      // 6. Store encrypted vector
      const vectorBytes = new TextEncoder().encode(encResult.encrypted);
      await submitVector(
        encResult.hash,
        vectorBytes,
        encResult.codes,
        encResult.dimension,
        undefined,
        'manual'
      );

      toast.success('Epidemiological data contributed securely!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  }

  function renderVariableInput(def: VariableDefinition) {
    const range = def.value_range;
    const currentVal = formData[def.code];

    if (def.data_type === 'binary') {
      return (
        <Select
          value={currentVal !== null && currentVal !== undefined ? String(currentVal) : ''}
          onValueChange={(v) => handleChange(def.code, Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No</SelectItem>
            <SelectItem value="1">Yes</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (def.data_type === 'categorical' && range?.values) {
      return (
        <Select
          value={currentVal !== null && currentVal !== undefined ? String(currentVal) : ''}
          onValueChange={(v) => handleChange(def.code, v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {range.values.map(v => (
              <SelectItem key={String(v)} value={String(v)}>
                {String(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Numeric
    return (
      <Input
        type="number"
        placeholder={range ? `${range.min ?? ''} – ${range.max ?? ''}` : 'Value'}
        min={range?.min}
        max={range?.max}
        step="any"
        value={currentVal !== null && currentVal !== undefined ? String(currentVal) : ''}
        onChange={(e) => handleChange(def.code, e.target.value ? parseFloat(e.target.value) : null)}
      />
    );
  }

  const riskColor = riskResult
    ? riskResult.category === 'HIGH' ? 'text-destructive'
    : riskResult.category === 'MODERATE' ? 'text-yellow-500'
    : 'text-green-500'
    : '';

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Epidemiological Matrix
          </h1>
          <p className="text-muted-foreground mt-1">
            Privacy-preserving clinical risk prediction — no patient identification, only encrypted coded variables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" /> AES-256-GCM
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" /> Differential Privacy
          </Badge>
        </div>
      </div>

      {/* Privacy notice */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Zero-Knowledge Contribution</p>
              <p className="text-muted-foreground">
                All data is encrypted client-side with AES-256-GCM before leaving your device.
                Differential privacy noise (ε=1.0) is added to prevent re-identification.
                Only coded clinical variables are collected — <strong>no names, IDs, or identifying information</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Variables filled: {filledCount}/{totalCount}</span>
            <span className="text-sm text-muted-foreground">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="demographics">
        <TabsList className="flex-wrap h-auto gap-1">
          {VARIABLE_CATEGORIES.filter(c => (groupedVars[c.code]?.length ?? 0) > 0).map(cat => (
            <TabsTrigger key={cat.code} value={cat.code} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {VARIABLE_CATEGORIES.map(cat => {
          const vars = groupedVars[cat.code] || [];
          if (vars.length === 0) return null;
          return (
            <TabsContent key={cat.code} value={cat.code}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                  <CardDescription>
                    {vars.length} variables — fill what's available for this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vars.map(v => (
                      <div key={v.code} className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center gap-1">
                          {v.label}
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {v.code}
                          </Badge>
                        </Label>
                        {renderVariableInput(v)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Submit & Risk Result */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !user || filledCount < 3}
          size="lg"
        >
          {submitting ? 'Encrypting & Submitting...' : 'Encrypt & Contribute Data'}
          <Database className="h-4 w-4 ml-2" />
        </Button>
        {!user && (
          <p className="text-sm text-muted-foreground">Login required to contribute</p>
        )}
      </div>

      {riskResult && (
        <Card className="border-2" style={{ borderColor: riskResult.category === 'HIGH' ? 'hsl(var(--destructive))' : undefined }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risk Assessment Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${riskColor}`}>
                  {riskResult.score}
                </div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
              <div>
                <Badge
                  variant={riskResult.category === 'HIGH' ? 'destructive' : 'secondary'}
                  className="text-lg px-3 py-1"
                >
                  {riskResult.category === 'HIGH' && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {riskResult.category === 'MINIMAL' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {riskResult.category}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Contributing Factors
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(riskResult.factors)
                  .sort(([, a], [, b]) => b - a)
                  .map(([code, value]) => (
                    <div key={code} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                      <span className="font-mono">{code}</span>
                      <span className="font-medium">{value.toFixed(1)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              v1 heuristic model — future versions will use ML trained on aggregated privacy-preserved data
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
