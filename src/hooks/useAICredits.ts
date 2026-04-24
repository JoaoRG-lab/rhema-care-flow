import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AICredits {
  credits_balance: number;
  free_quota_used: number;
  free_quota_limit: number;
  quota_reset_at: string;
}

export function useAICredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<AICredits | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_ai_credits")
      .select("credits_balance, free_quota_used, free_quota_limit, quota_reset_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCredits(data as AICredits);
    } else {
      // initialize row
      await supabase.from("user_ai_credits").insert({ user_id: user.id });
      setCredits({
        credits_balance: 0,
        free_quota_used: 0,
        free_quota_limit: 10,
        quota_reset_at: new Date().toISOString(),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime updates when payment is confirmed
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`credits:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_ai_credits",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const hasAccess =
    !!credits && (credits.credits_balance > 0 || credits.free_quota_used < credits.free_quota_limit);

  const remainingFree = credits
    ? Math.max(0, credits.free_quota_limit - credits.free_quota_used)
    : 0;

  return { credits, loading, refresh, hasAccess, remainingFree };
}
