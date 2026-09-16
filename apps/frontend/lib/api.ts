import { AuthUser, Job, JobInput, ParsedJob, PublicShare } from "./types";
import { getAccessToken, setAccessToken, clearSession } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isAuthPath(path: string) {
  return path.startsWith("/auth/");
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {},
  isRetry = false,
): Promise<T> {
  const { timeoutMs, ...init } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      // sends the httpOnly refresh cookie on the (few) requests that need it —
      // its Path scoping keeps it off every other call regardless
      credentials: "include",
      signal: controller?.signal,
    });
  } catch (err) {
    if (controller?.signal.aborted) {
      throw new ApiError("The request timed out. Please try again.", 408);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  // The access token expired mid-session: try one silent refresh and replay
  // the request before giving up. Never for the auth endpoints themselves —
  // a 401 there means "bad credentials" or "no valid session", not "retry".
  if (res.status === 401 && !isAuthPath(path) && !isRetry) {
    const session = await refreshAccessToken();
    if (session) {
      return apiFetch<T>(path, options, true);
    }
    handleUnauthorized();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Request failed";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

let refreshInFlight: Promise<AuthResponse | null> | null = null;

/**
 * Renews the access token from the httpOnly refresh cookie. Concurrent
 * callers (e.g. several requests 401-ing at once) share one in-flight call.
 * Never throws — returns null when there's no valid session.
 */
export function refreshAccessToken(): Promise<AuthResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const data = (await res.json()) as AuthResponse;
    setAccessToken(data.accessToken);
    return data;
  } catch {
    setAccessToken(null);
    return null;
  }
}

/** Best-effort revocation of the refresh cookie server-side. Never throws —
 * callers should clear local state regardless of whether this succeeds. */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // logging out locally either way
  }
}

export function getMe() {
  return apiFetch<AuthUser>("/users/me");
}

/** Whether "Continue with Google" should be shown — set up server-side or not. */
export function getAuthConfig() {
  return apiFetch<{ googleEnabled: boolean }>("/auth/config");
}

/** Full-page navigation target for the "Continue with Google" button. */
export function googleAuthUrl() {
  return `${API_URL}/auth/google`;
}

/** Turn the daily "needs attention" email digest on or off. */
export function updateEmailDigest(enabled: boolean) {
  return apiFetch<AuthUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify({ emailDigestEnabled: enabled }),
  });
}

/** Turns the public share link on, issuing a fresh token either way — also
 * how "regenerate" invalidates a previously shared link. */
export function enableSharing() {
  return apiFetch<AuthUser>("/users/me/share", { method: "POST" });
}

export function disableSharing() {
  return apiFetch<AuthUser>("/users/me/share", { method: "DELETE" });
}

/** Public, unauthenticated — no bearer token is required to view a share link. */
export function getPublicShare(token: string) {
  return apiFetch<PublicShare>(`/public/share/${token}`);
}

export function getJobs() {
  return apiFetch<Job[]>("/jobs");
}

export function getSingleJob(id: string) {
  return apiFetch<Job>(`/jobs/${id}`);
}

export function createJob(data: JobInput) {
  return apiFetch<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateJob(id: string, data: Partial<JobInput>) {
  return apiFetch<Job>(`/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJob(id: string) {
  return apiFetch<Job>(`/jobs/${id}`, {
    method: "DELETE",
  });
}

/** Archive/unarchive a job — hides or restores it in the active pipeline. */
export function setJobArchived(id: string, archived: boolean) {
  return apiFetch<Job>(`/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });
}

/** Generate (or regenerate) AI interview prep for a job. Returns the updated job. */
export function generatePrep(id: string) {
  return apiFetch<Job>(`/jobs/${id}/prep`, { method: "POST", timeoutMs: 60_000 });
}

/** Pull structured fields out of a pasted job description. */
export function parseJobDescription(description: string) {
  return apiFetch<ParsedJob>("/jobs/parse", {
    method: "POST",
    body: JSON.stringify({ description }),
    timeoutMs: 45_000,
  });
}
