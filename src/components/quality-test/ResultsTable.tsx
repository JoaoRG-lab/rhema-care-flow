import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TestResult, TestCategory, CATEGORY_LABELS, MajorityDecision, Severity } from "@/lib/qualityTestEngine";

interface Props { results: TestResult[] }

const statusColors: Record<MajorityDecision, string> = {
  pass: "bg-green-500/15 text-green-600 border-green-500/30",
  fail: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  critical_inconsistency: "bg-purple-500/15 text-purple-500 border-purple-500/30",
};

const checkerBadge = (r: string) => r === "pass" ? "bg-green-500/15 text-green-600" : r === "fail" ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-600";

const severityColors: Record<Severity, string> = {
  low: "text-muted-foreground", medium: "text-yellow-500", high: "text-orange-500", critical: "text-destructive font-semibold",
};

export function ResultsTable({ results }: Props) {
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (sevFilter !== "all" && r.severity !== sevFilter) return false;
      if (statusFilter !== "all" && r.majorityDecision !== statusFilter) return false;
      return true;
    });
  }, [results, catFilter, sevFilter, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as TestCategory[]).map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical_inconsistency">Critical</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} of {results.length} tests</span>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs w-[100px]">ID</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs text-center">A</TableHead>
                <TableHead className="text-xs text-center">B</TableHead>
                <TableHead className="text-xs text-center">C</TableHead>
                <TableHead className="text-xs">Decision</TableHead>
                <TableHead className="text-xs">Repro</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(r => (
                <TableRow key={r.testId} className="text-xs">
                  <TableCell className="font-mono text-[11px]">{r.testId}</TableCell>
                  <TableCell>{CATEGORY_LABELS[r.category]}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] px-1.5 ${checkerBadge(r.checkerA)}`}>{r.checkerA}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] px-1.5 ${checkerBadge(r.checkerB)}`}>{r.checkerB}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] px-1.5 ${checkerBadge(r.checkerC)}`}>{r.checkerC}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[r.majorityDecision]}`}>{r.majorityDecision.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-[11px]">{r.reproResult.replace(/_/g, " ")}</TableCell>
                  <TableCell className={`text-[11px] ${severityColors[r.severity]}`}>{r.severity}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate hidden lg:table-cell">{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && <div className="text-xs text-center py-2 text-muted-foreground border-t">Showing first 100 of {filtered.length} results</div>}
      </div>
    </div>
  );
}
