/**
 * loopDetectorAutoStart
 * Ensures the recurrence/loop detector is ON by default and runs continuously.
 *
 * - Enables `localStorage.loopDebug = '1'` on first load (idempotent).
 * - Starts a periodic heartbeat that prints a snapshot of active buckets
 *   so recurrent issues surface even without dev interaction.
 * - Safe in production: only logs at `console.debug` unless warnings fire.
 */
import { loopDetector } from './loopDetector';

const HEARTBEAT_MS = 15_000;

let started = false;

export function startLoopDetectorAuto(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  try {
    if (!window.localStorage.getItem('loopDebug')) {
      window.localStorage.setItem('loopDebug', '1');
    }
  } catch {
    // ignore storage failures (private mode, etc.)
  }

  // Periodic heartbeat: surface any bucket with recent activity.
  const tick = () => {
    try {
      const snap = loopDetector.snapshot().filter((b) => b.recent > 0 || b.totalWarns > 0);
      if (snap.length) {
        // eslint-disable-next-line no-console
        console.debug('[LoopDetector] heartbeat', {
          ns: 'LoopDetector',
          at: new Date().toISOString(),
          buckets: snap,
        });
      }
    } catch {
      // never throw from the heartbeat
    }
  };

  // Fire once shortly after boot, then on a fixed cadence.
  window.setTimeout(tick, 3_000);
  window.setInterval(tick, HEARTBEAT_MS);

  // Expose a manual control to DevTools.
  (window as unknown as { __loopDetectorAuto?: { stop: () => void } }).__loopDetectorAuto = {
    stop: () => {
      try {
        window.localStorage.removeItem('loopDebug');
      } catch {
        /* noop */
      }
    },
  };
}
