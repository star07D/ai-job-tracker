import { JobStatus } from "./job-status";

export interface JobPrep {
  summary: string;
  likelyQuestions: string[];
  talkingPoints: string[];
  research: string[];
  questionsToAsk: string[];
}

/** Fields the AI pulled out of a pasted job description — any may be missing. */
export interface ParsedJob {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  notes?: string;
}

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
  /** When the job last moved to its current status. Drives staleness. */
  statusChangedAt: string;
  prep?: JobPrep | null;
  prepGeneratedAt?: string | null;
  /** Free-text next step, e.g. "Email recruiter about timeline". */
  nextAction?: string | null;
  /** ISO date the next step is due. Drives the "Needs attention" strip. */
  nextActionDue?: string | null;
  /** Primary contact for this role — a recruiter or hiring manager. */
  contactName?: string | null;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  tags: string[];
  /** Soft-hidden from the active pipeline — set/cleared via `setJobArchived`. */
  archived: boolean;
  archivedAt?: string | null;
}

/**
 * Fields the client sends when creating/updating a job. `appliedDate` is
 * optional — the backend defaults it to "now" when omitted. `archived` isn't
 * part of the form — it's toggled separately via `setJobArchived`.
 */
export type JobInput = Omit<
  Job,
  "id" | "createdAt" | "statusChangedAt" | "appliedDate" | "archived" | "archivedAt"
> & {
  appliedDate?: string;
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt?: string;
  /** Whether daily "needs attention" email digests are on. Absent right after
   * login/signup — fetch GET /users/me for the authoritative value. */
  emailDigestEnabled?: boolean;
  /** Set while the public share link is on — build the URL as /share/<token>.
   * Absent right after login/signup — fetch GET /users/me for the
   * authoritative value. */
  shareToken?: string | null;
}

/** A job as shown on someone else's public share page — trimmed of
 * salary, notes, contact details, and next-step fields. */
export interface PublicJob {
  title: string;
  company: string;
  status: JobStatus;
  location: string | null;
  appliedDate: string;
  tags: string[];
}

export interface PublicShare {
  displayName: string;
  trackingSince: string | null;
  jobs: PublicJob[];
}
