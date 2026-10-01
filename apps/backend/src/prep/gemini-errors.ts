import { PrepGenerationError } from './prep.types';

/** Thrown by GeminiProvider when OUR timeout fired — distinct from Google
 * reporting the model overloaded, so the two never get confused below. */
export class AbortedError extends Error {}

/** Google's "the model is overloaded, try again" signal specifically. */
export function isOverloaded(err: unknown): boolean {
  if (err instanceof AbortedError) return false;
  const detail = err instanceof Error ? err.message : String(err);
  return /"code":\s*503|UNAVAILABLE|overloaded|high demand/i.test(detail);
}

/** Whether a fallback model is worth a shot: Google said it's overloaded, or
 * the request simply didn't answer in time (observed in practice: fast when
 * called directly, but consistently timing out over this server's own path
 * to Google — a second model is worth trying rather than failing outright).
 * An auth failure never counts, since a different model wouldn't fix that. */
export function shouldTryFallback(err: unknown): boolean {
  return err instanceof AbortedError || isOverloaded(err);
}

export function toGenerationError(
  err: unknown,
  model: string,
): PrepGenerationError {
  const detail = err instanceof Error ? err.message : String(err);
  // surface a short, useful hint (the user runs this server themselves)
  const hint =
    err instanceof AbortedError
      ? 'the model took too long to respond — try again'
      : /not[_ ]?found|no longer available/i.test(detail)
        ? `model "${model}" is unavailable — set GEMINI_MODEL to a current one`
        : /api[_ ]?key|permission|unauthenticated|401|403/i.test(detail)
          ? 'the GEMINI_API_KEY was rejected'
          : /quota|rate|429|503|unavailable/i.test(detail)
            ? 'the model is rate-limited or busy — try again shortly'
            : 'request to Gemini failed';
  return new PrepGenerationError(hint);
}
