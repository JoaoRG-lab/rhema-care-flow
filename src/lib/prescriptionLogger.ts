/**
 * prescriptionLogger
 * Structured console logging for the prescription pipeline (create → sign →
 * export). Every log line is grouped under a single `[Rx]` namespace so it's
 * easy to filter in DevTools, and emits a stable JSON-shaped payload.
 *
 * Usage:
 *   rxLog.info('create:start', { patientId });
 *   rxLog.error('pdf:failed', { rxId, error });
 */

type RxStage =
  | 'create:start' | 'create:success' | 'create:failed'
  | 'sign:start'   | 'sign:success'   | 'sign:failed'
  | 'cancel:start' | 'cancel:success' | 'cancel:failed'
  | 'delete:start' | 'delete:success' | 'delete:failed'
  | 'fetch:start'  | 'fetch:success'  | 'fetch:failed'
  | 'pdf:start'    | 'pdf:success'    | 'pdf:failed';

type RxLevel = 'info' | 'warn' | 'error';

function emit(level: RxLevel, stage: RxStage, payload: Record<string, unknown> = {}) {
  const entry = {
    ns: 'Rx',
    ts: new Date().toISOString(),
    level,
    stage,
    ...payload,
  };
  const tag = `[Rx:${stage}]`;
  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  fn(tag, entry);
}

export const rxLog = {
  info:  (stage: RxStage, payload?: Record<string, unknown>) => emit('info',  stage, payload),
  warn:  (stage: RxStage, payload?: Record<string, unknown>) => emit('warn',  stage, payload),
  error: (stage: RxStage, payload?: Record<string, unknown>) => emit('error', stage, payload),
};

/**
 * Normalise unknown errors into a serialisable shape for logs and UI banners.
 */
export function describeError(e: unknown): { message: string; name?: string; code?: string } {
  if (!e) return { message: 'Unknown error' };
  if (typeof e === 'string') return { message: e };
  if (e instanceof Error) return { message: e.message, name: e.name };
  const obj = e as { message?: string; code?: string; name?: string };
  return {
    message: obj.message ?? JSON.stringify(e),
    code: obj.code,
    name: obj.name,
  };
}
