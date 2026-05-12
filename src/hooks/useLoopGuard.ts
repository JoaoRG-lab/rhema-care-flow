import { useEffect, useRef } from 'react';
import { loopDetector, type LoopDetectorOptions } from '@/lib/loopDetector';

/**
 * useLoopGuard
 * React hook that records every render (or every change of `deps`) of the host
 * component under `label`, and lets loopDetector warn when re-renders happen
 * suspiciously fast — classic symptom of an infinite update loop.
 *
 * Example:
 *   useLoopGuard('PrescriptionComposer:render');
 *   useLoopGuard('PrescriptionComposer:items-effect', { context: { count: items.length } }, [items]);
 */
export function useLoopGuard(
  label: string,
  opts: LoopDetectorOptions = {},
  deps?: ReadonlyArray<unknown>,
): void {
  // Render-phase counter so we catch render-loops even before effects flush.
  const renderCount = useRef(0);
  renderCount.current += 1;
  loopDetector.track(label, {
    ...opts,
    context: { ...(opts.context ?? {}), renders: renderCount.current },
  });

  // Optional deps-mode: also track every time deps change in a committed effect.
  useEffect(() => {
    if (!deps) return;
    loopDetector.track(`${label}:deps`, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
}
