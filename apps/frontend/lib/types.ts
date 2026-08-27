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

export type JobInput = Omit<Job, "id" | "createdAt" | "appliedDate">;
