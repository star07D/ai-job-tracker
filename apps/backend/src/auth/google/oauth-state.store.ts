import { randomBytes, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import type OAuth2Strategy from 'passport-oauth2';

const STATE_COOKIE_NAME = 'oauth_state';
// Scoped to just the two routes involved in the handshake — never sent on
// ordinary API calls.
export const STATE_COOKIE_PATH = '/auth/google';
const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * A stateless "double-submit cookie" state store for passport-oauth2 —
 * there's no express-session in this app, so passport's session-backed
 * default (`state: true`) isn't usable, and passport-oauth2 falls back to
 * skipping state verification entirely if left unconfigured.
 *
 * The same random value is handed back both as the OAuth `state` query
 * param (round-tripped through Google) and as an httpOnly cookie set on the
 * initiating browser. The callback only succeeds if the two match — a
 * victim's browser, which never received the *attacker's* cookie, can't
 * satisfy that even if handed the attacker's own valid code+state URL. This
 * is what stops "login CSRF" (RFC 6749 §10.12): being tricked into
 * completing someone else's OAuth flow and landing in their account.
 */
// Deliberately not `implements OAuth2Strategy.StateStore` — that interface
// declares an overloaded (req, meta, callback) form for a use case we don't
// need, and passport-oauth2 picks which arity to call at runtime purely off
// `store.length`/`verify.length` (see its strategy.js), so a class offering
// only the simpler (req, callback)/(req, state, callback) forms below is
// exactly what the library's own bundled stores do too — it's cast to the
// interface where it's actually handed to the strategy, in google.strategy.ts.
export class StatelessOAuthStateStore {
  constructor(private readonly isProd: boolean) {}

  store(req: Request, callback: OAuth2Strategy.StateStoreStoreCallback) {
    const nonce = randomBytes(24).toString('hex');
    req.res?.cookie(STATE_COOKIE_NAME, nonce, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      path: STATE_COOKIE_PATH,
      maxAge: STATE_TTL_MS,
    });
    callback(null, nonce);
  }

  verify(
    req: Request,
    providedState: string,
    callback: OAuth2Strategy.StateStoreVerifyCallback,
  ) {
    const cookieValue = (req.cookies as Record<string, string> | undefined)?.[
      STATE_COOKIE_NAME
    ];
    req.res?.clearCookie(STATE_COOKIE_NAME, { path: STATE_COOKIE_PATH });

    if (!cookieValue || !providedState) {
      return callback(null, false, { message: 'Missing OAuth state' });
    }

    const a = Buffer.from(cookieValue);
    const b = Buffer.from(providedState);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return callback(null, false, { message: 'Invalid OAuth state' });
    }

    callback(null, true, undefined);
  }
}
