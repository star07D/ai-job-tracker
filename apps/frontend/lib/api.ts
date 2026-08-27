import { Job, JobInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.message || "Request failed", res.status);
  }

  return data as T;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
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
