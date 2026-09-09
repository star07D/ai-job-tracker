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
}

/**
 * Fields the client sends when creating/updating a job. `appliedDate` is
 * optional — the backend defaults it to "now" when omitted.
 */
export type JobInput = Omit<
  Job,
  "id" | "createdAt" | "statusChangedAt" | "appliedDate"
> & {
  appliedDate?: string;
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}
