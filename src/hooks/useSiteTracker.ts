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

    // Update duration for previous page
    if (lastPath.current) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      // Fire and forget - update is best effort
      supabase
        .from('site_visits' as any)
        .update({ duration_seconds: duration, is_bounce: false } as any)
        .eq('visitor_id', visitorId)
        .eq('page_path', lastPath.current)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(() => {});
    }

    startTime.current = Date.now();
    lastPath.current = location.pathname;

    // Record new page visit
    supabase
      .from('site_visits' as any)
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
      } as any)
      .then(() => {});
  }, [location.pathname]);
}
