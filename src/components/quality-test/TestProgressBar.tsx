import { Progress } from "@/components/ui/progress";

interface Props { progress: number; running: boolean }

export function TestProgressBar({ progress, running }: Props) {
  if (!running && progress === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{running ? "Running tests..." : "Complete"}</span>
        <span className="font-mono">{progress.toFixed(0)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
