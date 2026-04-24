import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { differenceInDays, parseISO, isValid } from 'date-fns';

export function GestationalAgeCalculator() {
  const [lmp, setLmp] = useState('');
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));

  let result: { weeks: number; days: number } | null = null;
  if (lmp && refDate) {
    const lmpDate = parseISO(lmp);
    const ref = parseISO(refDate);
    if (isValid(lmpDate) && isValid(ref) && ref >= lmpDate) {
      const diff = differenceInDays(ref, lmpDate);
      result = { weeks: Math.floor(diff / 7), days: diff % 7 };
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestational Age Calculator</CardTitle>
        <CardDescription>Based on last menstrual period (LMP)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lmp">Last menstrual period</Label>
          <Input id="lmp" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ref">Reference date</Label>
          <Input id="ref" type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
        </div>
        {result && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <span className="font-medium">Gestational age:</span> {result.weeks}w {result.days}d
          </div>
        )}
      </CardContent>
    </Card>
  );
}
