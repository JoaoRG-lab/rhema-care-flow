import { useEffect, useState } from "react";
import { loopDetector, type WarnEntry } from "@/lib/loopDetector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Snap = ReturnType<typeof loopDetector.snapshot>;

export default function LoopDebug() {
  const [snap, setSnap] = useState<Snap>([]);
  const [warns, setWarns] = useState<WarnEntry[]>([]);
  const [enabled, setEnabled] = useState(loopDetector.isEnabled());

  useEffect(() => {
    const refresh = () => {
      setSnap(loopDetector.snapshot().sort((a, b) => b.recent - a.recent));
      setWarns(loopDetector.warnings());
      setEnabled(loopDetector.isEnabled());
    };
    refresh();
    const unsub = loopDetector.subscribe(refresh);
    const id = window.setInterval(refresh, 1000);
    return () => { unsub(); window.clearInterval(id); };
  }, []);

  const toggle = () => {
    try {
      if (enabled) localStorage.removeItem("loopDebug");
      else localStorage.setItem("loopDebug", "1");
    } catch { /* noop */ }
    setEnabled(loopDetector.isEnabled());
  };

  const totalWarns = snap.reduce((a, b) => a + b.totalWarns, 0);
  const totalRecent = snap.reduce((a, b) => a + b.recent, 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Loop Detector</h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento contínuo de recorrências e loops suspeitos.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Ativo" : "Inativo"}
          </Badge>
          <Button size="sm" variant="outline" onClick={toggle}>
            {enabled ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => loopDetector.reset()}>
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Buckets</div>
          <div className="text-2xl font-semibold">{snap.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Hits recentes</div>
          <div className="text-2xl font-semibold">{totalRecent}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Warnings (total)</div>
          <div className="text-2xl font-semibold">{totalWarns}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Warnings (histórico)</div>
          <div className="text-2xl font-semibold">{warns.length}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Buckets ativos</CardTitle></CardHeader>
        <CardContent>
          {snap.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Recentes (1s)</TableHead>
                    <TableHead className="text-right">Warnings</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snap.map((b) => (
                    <TableRow key={b.label}>
                      <TableCell className="font-mono text-xs">{b.label}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={b.recent >= 25 ? "destructive" : "secondary"}>
                          {b.recent}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {b.totalWarns > 0
                          ? <Badge variant="destructive">{b.totalWarns}</Badge>
                          : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => loopDetector.reset(b.label)}>
                          Reset
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Últimos warnings</CardTitle></CardHeader>
        <CardContent>
          {warns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum warning disparado.</p>
          ) : (
            <ul className="space-y-2">
              {warns.map((w, i) => (
                <li key={i} className="border rounded-md p-2 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold">{w.label}</span>
                    <span className="text-muted-foreground">
                      {new Date(w.at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {w.hitsInWindow} hits / {w.windowMs}ms (threshold {w.threshold})
                  </div>
                  {w.context && Object.keys(w.context).length > 0 && (
                    <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all">
                      {JSON.stringify(w.context, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
