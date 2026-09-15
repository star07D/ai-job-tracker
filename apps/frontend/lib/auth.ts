"use client";

import { AuthUser } from "./types";

const USER_KEY = "user";

// The access token lives in memory only — never localStorage — so it isn't
// readable by an injected script. That means it's lost on a full page
// reload by design; lib/api.ts's refreshAccessToken() recovers it via the
// refresh token, which lives in an httpOnly cookie this code never touches.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Merge a partial update (e.g. a preference change) into the stored user. */
export function updateStoredUser(patch: Partial<AuthUser>) {
  const current = getUser();
  if (!current) return;
  setUser({ ...current, ...patch });
}

/** Drops the in-memory access token and the cached user. Local-only — doesn't
 * revoke the refresh cookie server-side; see logoutUser() in lib/api.ts. */
export function clearSession() {
  accessToken = null;
  localStorage.removeItem(USER_KEY);
}
