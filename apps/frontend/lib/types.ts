import { JobStatus } from "./job-status";

export interface Job {
  id: string;
  title: string;
  company: string;
  status: JobStatus;
  location?: string;
  salary?: string;
  notes?: string;
  appliedDate: string;
  createdAt: string;
}

/**
 * Fields the client sends when creating/updating a job. `appliedDate` is
 * optional — the backend defaults it to "now" when omitted.
 */
export type JobInput = Omit<Job, "id" | "createdAt" | "appliedDate"> & {
  appliedDate?: string;
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}
