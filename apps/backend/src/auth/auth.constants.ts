/** How long a refresh token (and its cookie) lives before it must be re-issued. */
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS =
  REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

/** A revoked refresh token is dead the moment it's revoked (rotation or logout);
 * this is only how long its row lingers before being swept, for debugging. */
export const REVOKED_TOKEN_RETENTION_MS = 24 * 60 * 60 * 1000;

/** How long an access token (the bearer JWT) is valid for. Kept short since it
 * lives in the frontend's memory, not storage — a silent refresh renews it. */
export const ACCESS_TOKEN_TTL = '15m';

export const REFRESH_COOKIE_NAME = 'refreshToken';
/** Scoped to /auth so the cookie is never sent on ordinary API calls. */
export const REFRESH_COOKIE_PATH = '/auth';
