/**
 * Shared error response helpers for edge functions.
 *
 * Goals:
 *  - Never throw while building an error response (safe stringify).
 *  - Always return a consistent JSON shape:
 *      { error: string, code: string, details?: unknown }
 *  - Include CORS headers so browser callers always see the body.
 */

/** Canonical error codes used across functions. */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "UPSTREAM_ERROR"
  | "CONFIG_ERROR"
  | "INTERNAL_ERROR";

/** Map HTTP status -> default code if caller doesn't supply one. */
const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  502: "UPSTREAM_ERROR",
  503: "UPSTREAM_ERROR",
};

/** Safely turn any thrown value into a human-readable string. */
export function safeStringifyError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name || "Error";
  if (typeof err === "object") {
    // Common shape from supabase / fetch / postgrest
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
    try {
      return JSON.stringify(err, getCircularReplacer());
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  try {
    return String(err);
  } catch {
    return "Unstringifiable error";
  }
}

/** JSON.stringify replacer that strips circular refs. */
function getCircularReplacer() {
  const seen = new WeakSet<object>();
  return (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value as object)) return "[Circular]";
      seen.add(value as object);
    }
    if (typeof value === "bigint") return value.toString();
    return value;
  };
}

/** Best-effort serializable details payload for diagnostics. */
export function serializeErrorDetails(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      // Stack omitted in prod responses; logs already capture it.
    };
  }
  if (err && typeof err === "object") {
    try {
      return JSON.parse(JSON.stringify(err, getCircularReplacer()));
    } catch {
      return { value: safeStringifyError(err) };
    }
  }
  return { value: safeStringifyError(err) };
}

export interface ErrorResponseOptions {
  status?: number;
  code?: ErrorCode;
  /** Extra CORS / content headers to merge in. */
  headers?: Record<string, string>;
  /** Include serialized error details (default: true). */
  includeDetails?: boolean;
  /** Pre-serialized details payload to attach instead of `error`. */
  details?: unknown;
}

/**
 * Build a JSON Response with a consistent error envelope.
 * Never throws — falls back to a minimal payload if serialization fails.
 */
export function errorResponse(
  error: unknown,
  options: ErrorResponseOptions = {},
): Response {
  const status = options.status ?? 500;
  const code = options.code ?? STATUS_TO_CODE[status] ?? "INTERNAL_ERROR";
  const message = safeStringifyError(error);
  const includeDetails = options.includeDetails ?? true;

  const payload: Record<string, unknown> = { error: message, code };
  if (includeDetails) {
    payload.details = options.details ?? serializeErrorDetails(error);
  }

  let body: string;
  try {
    body = JSON.stringify(payload);
  } catch {
    body = JSON.stringify({ error: message, code });
  }

  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}
