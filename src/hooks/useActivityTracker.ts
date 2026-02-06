import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

const ACTIVITY_DEBOUNCE_MS = 30000; // Log at most every 30 seconds
const INTERACTION_EVENTS = ['click', 'scroll', 'keypress', 'mousemove'];

export function useActivityTracker() {
  const location = useLocation();
  const lastLogRef = useRef<number>(0);
  const userIdRef = useRef<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id || null;
    });
  }, []);

  const logActivity = useCallback(async (activityType: string, metadata: Record<string, unknown> = {}) => {
    const now = Date.now();
    
    // Debounce: don't log more than once per 30 seconds
    if (now - lastLogRef.current < ACTIVITY_DEBOUNCE_MS) {
      return;
    }
    
    lastLogRef.current = now;

    try {
      await supabase.from('site_activity_log').insert({
        activity_type: activityType,
        user_id: userIdRef.current,
        metadata: {
          ...metadata,
          path: location.pathname,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Silently fail - activity logging shouldn't break the app
      console.debug('[ActivityTracker] Failed to log:', error);
    }
  }, [location.pathname]);

  // Log page views
  useEffect(() => {
    logActivity('page_view', { path: location.pathname });
  }, [location.pathname, logActivity]);

  // Log user interactions (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleInteraction = () => {
      if (timeoutId) return;
      
      timeoutId = setTimeout(() => {
        logActivity('interaction');
        timeoutId = null;
      }, ACTIVITY_DEBOUNCE_MS);
    };

    INTERACTION_EVENTS.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      INTERACTION_EVENTS.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [logActivity]);

  return { logActivity };
}
