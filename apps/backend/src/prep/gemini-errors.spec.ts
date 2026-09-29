import { PrepGenerationError } from './prep.types';
import { AbortedError, isOverloaded, toGenerationError } from './gemini-errors';

// The exact shape Google returned during a real demand spike (2026-09-28) —
// this string is what triggered the fallback-model work, so it's pinned here.
const REAL_OVERLOAD_MESSAGE =
  '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}';

describe('isOverloaded', () => {
  it('recognizes the real overload response Google sent', () => {
    expect(isOverloaded(new Error(REAL_OVERLOAD_MESSAGE))).toBe(true);
  });

  it('never treats our own timeout as an overload', () => {
    expect(isOverloaded(new AbortedError(REAL_OVERLOAD_MESSAGE))).toBe(false);
  });

  it('does not treat an auth failure as an overload', () => {
    expect(
      isOverloaded(new Error('API key not valid, 403 permission denied')),
    ).toBe(false);
  });

  it('does not treat a missing model as an overload', () => {
    expect(
      isOverloaded(new Error('model "gemini-x" is no longer available')),
    ).toBe(false);
  });

  it('handles a non-Error throw', () => {
    expect(isOverloaded('503 UNAVAILABLE')).toBe(true);
    expect(isOverloaded('just some string')).toBe(false);
  });
});

describe('toGenerationError', () => {
  it('gives a timeout-specific hint for our own abort', () => {
    const e = toGenerationError(new AbortedError('aborted'), 'gemini-x');
    expect(e).toBeInstanceOf(PrepGenerationError);
    expect(e.message).toBe('the model took too long to respond — try again');
  });

  it('names the model in a not-found hint', () => {
    const e = toGenerationError(
      new Error('model "gemini-2.5-flash" is no longer available to new users'),
      'gemini-2.5-flash',
    );
    expect(e.message).toBe(
      'model "gemini-2.5-flash" is unavailable — set GEMINI_MODEL to a current one',
    );
  });

  it('flags a rejected key distinctly from other failures', () => {
    const e = toGenerationError(
      new Error('API key not valid: permission denied (403)'),
      'gemini-x',
    );
    expect(e.message).toBe('the GEMINI_API_KEY was rejected');
  });

  it('still gives the rate-limited hint for an overload that survived the fallback', () => {
    const e = toGenerationError(
      new Error(REAL_OVERLOAD_MESSAGE),
      'gemini-flash-latest',
    );
    expect(e.message).toBe(
      'the model is rate-limited or busy — try again shortly',
    );
  });

  it('falls back to a generic message for anything unrecognized', () => {
    const e = toGenerationError(new Error('connection reset'), 'gemini-x');
    expect(e.message).toBe('request to Gemini failed');
  });
});
