/**
 * loopDetector
 * Dev-only recurrence / infinite-loop detector.
 *
 * Tracks how often a labelled "event" (component render, hook effect, fetch,
 * state update, etc.) fires inside a rolling time window. If the count crosses
 * a threshold it logs a structured warning to the console under the
 * `[LoopDetector]` namespace so it shows up next to `[Rx:*]` logs.
 *
 * Gated behind:
 *   - `?debug=1` query param, OR
 *   - `localStorage.loopDebug === '1'`, OR
 *   - `localStorage.rxDebug === '1'` (shares the prescription debug switch)
 *
 * Zero overhead in production: when disabled, `track()` is a no-op.
 *
 * Usage (plain):
 *   import { loopDetector } from '@/lib/loopDetector';
 *   loopDetector.track('usePrescriptions:fetch', { patientCode });
 *
 * Usage (React hook):
 *   useLoopGuard('PrescriptionComposer:render');
 */

type Bucket = {
  label: string;
  timestamps: number[];
  lastWarnAt: number;
  totalWarns: number;
};

const DEFAULT_WINDOW_MS = 1000;
const DEFAULT_THRESHOLD = 25;        // hits per window before we shout
const WARN_COOLDOWN_MS = 2000;       // don't spam the console
const MAX_TIMESTAMPS = 200;          // hard cap per bucket

const buckets = new Map<string, Bucket>();

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get('debug') === '1') return true;
    const ls = window.localStorage;
    return ls.getItem('loopDebug') === '1' || ls.getItem('rxDebug') === '1';
  } catch {
    return false;
  }
}

export interface LoopDetectorOptions {
  /** Sliding window size in ms (default 1000). */
  windowMs?: number;
  /** Hits inside the window before a warning is emitted (default 25). */
  threshold?: number;
  /** Extra context logged alongside the warning. */
  context?: Record<string, unknown>;
}

function emitWarn(b: Bucket, hitsInWindow: number, opts: LoopDetectorOptions) {
  b.totalWarns += 1;
  // eslint-disable-next-line no-console
  console.warn('[LoopDetector] recurrence detected', {
    ns: 'LoopDetector',
    label: b.label,
    hitsInWindow,
    windowMs: opts.windowMs ?? DEFAULT_WINDOW_MS,
    threshold: opts.threshold ?? DEFAULT_THRESHOLD,
    totalWarns: b.totalWarns,
    ts: new Date().toISOString(),
    ...(opts.context ?? {}),
  });
}

export const loopDetector = {
  /**
   * Record one occurrence of `label`. Warns when the sliding-window count
   * exceeds `threshold`. No-op when debug mode is off.
   */
  track(label: string, opts: LoopDetectorOptions = {}): void {
    if (!isEnabled()) return;
    const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
    const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
    const now = performance.now();

    let b = buckets.get(label);
    if (!b) {
      b = { label, timestamps: [], lastWarnAt: 0, totalWarns: 0 };
      buckets.set(label, b);
    }

    b.timestamps.push(now);
    // Trim old timestamps out of the window.
    const cutoff = now - windowMs;
    while (b.timestamps.length && b.timestamps[0] < cutoff) b.timestamps.shift();
    if (b.timestamps.length > MAX_TIMESTAMPS) {
      b.timestamps.splice(0, b.timestamps.length - MAX_TIMESTAMPS);
    }

    if (b.timestamps.length >= threshold && now - b.lastWarnAt > WARN_COOLDOWN_MS) {
      b.lastWarnAt = now;
      emitWarn(b, b.timestamps.length, opts);
    }
  },

  /** Inspect current buckets — useful from the DevTools console. */
  snapshot(): Array<{ label: string; recent: number; totalWarns: number }> {
    return Array.from(buckets.values()).map((b) => ({
      label: b.label,
      recent: b.timestamps.length,
      totalWarns: b.totalWarns,
    }));
  },

  /** Clear all tracking state. */
  reset(label?: string): void {
    if (label) buckets.delete(label);
    else buckets.clear();
  },

  isEnabled,
};

// Expose to window for quick poking in DevTools.
if (typeof window !== 'undefined') {
  (window as unknown as { __loopDetector?: typeof loopDetector }).__loopDetector = loopDetector;
}
