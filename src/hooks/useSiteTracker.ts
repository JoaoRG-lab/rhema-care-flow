import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getVisitorId(): string {
  let id = localStorage.getItem('uhs_vid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('uhs_vid', id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('uhs_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('uhs_sid', id);
  }
  return id;
}

function parseUserAgent(ua: string) {
  let browser = 'Other';
  let os = 'Other';
  let deviceType = 'desktop';

  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  if (/Mobile|Android|iPhone/i.test(ua)) deviceType = 'mobile';
  else if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';

  return { browser, os, deviceType };
}

export function useSiteTracker() {
  const location = useLocation();
  const startTime = useRef(Date.now());
  const lastPath = useRef('');

  useEffect(() => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);

    // Update duration for previous page — select the row first, then update by id
    // so we never accidentally update every matching row.
    if (lastPath.current) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const previousPath = lastPath.current;
      (async () => {
        const { data, error: selectError } = await supabase
          .from('site_visits')
          .select('id')
          .eq('visitor_id', visitorId)
          .eq('page_path', previousPath)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (selectError) {
          console.error('[useSiteTracker] failed to find previous visit:', selectError);
          return;
        }
        if (!data) return;

        const { error: updateError } = await supabase
          .from('site_visits')
          .update({ duration_seconds: duration, is_bounce: false })
          .eq('id', data.id);

        if (updateError) {
          console.error('[useSiteTracker] failed to update visit duration:', updateError);
        }
      })();
    }

    startTime.current = Date.now();
    lastPath.current = location.pathname;

    // Record new page visit
    supabase
      .from('site_visits')
      .insert({
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: location.pathname,
        referrer: document.referrer || null,
        user_agent: ua,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language,
        device_type: deviceType,
        browser,
        os,
      })
      .then(({ error }) => {
        if (error) console.error('[useSiteTracker] failed to insert visit:', error);
      });
  }, [location.pathname]);
}
