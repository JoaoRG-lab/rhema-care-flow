import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CANONICAL_URL = "https://rfsaxstpfpigrjyiochi.supabase.co";
const DEPRECATED_URL = "https://rqaqdhmdeyzyjglhxrne.supabase.co";

function getRuntimeEnv() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || "");
  const projectId = String(import.meta.env.VITE_SUPABASE_PROJECT_ID || "");
  const hasPublishable = Boolean(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
  );

  return { url, projectId, hasPublishable };
}

export default function LoopDebug() {
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const env = getRuntimeEnv();
  const isDeprecated = env.url === DEPRECATED_URL || env.projectId === "rqaqdhmdeyzyjglhxrne";
  const isCanonical = env.url === CANONICAL_URL || env.projectId === "rfsaxstpfpigrjyiochi";

  async function testSupabase() {
    setBusy(true);
    setResult("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const { data, error } = await supabase.functions.invoke("code-console-chat", {
        body: {
          threadId: crypto.randomUUID(),
          prompt: "Responda apenas: Code Console conectado.",
          agent: "chatgpt",
        },
      });

      setResult(
        JSON.stringify(
          {
            runtimeEnv: env,
            expectedUrl: CANONICAL_URL,
            hasSession: Boolean(session),
            userEmail: session?.user?.email ?? null,
            invokeError: error ? { name: error.name, message: error.message } : null,
            invokeData: data,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      setResult(
        JSON.stringify(
          {
            runtimeEnv: env,
            expectedUrl: CANONICAL_URL,
            thrown: err instanceof Error ? err.message : String(err),
          },
          null,
          2,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Runtime Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {isCanonical && <Badge>canonical runtime</Badge>}
            {isDeprecated && <Badge variant="destructive">deprecated runtime</Badge>}
            {!isCanonical && !isDeprecated && <Badge variant="secondary">unknown runtime</Badge>}
          </div>

          <div className="rounded-lg border p-3 font-mono text-xs space-y-1">
            <div>VITE_SUPABASE_URL: {env.url || "(empty)"}</div>
            <div>VITE_SUPABASE_PROJECT_ID: {env.projectId || "(empty)"}</div>
            <div>Has publishable key: {String(env.hasPublishable)}</div>
            <div>Expected URL: {CANONICAL_URL}</div>
          </div>

          <Button onClick={testSupabase} disabled={busy}>
            {busy ? "Testing..." : "Test code-console-chat"}
          </Button>

          {result && (
            <pre className="max-h-[520px] overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
