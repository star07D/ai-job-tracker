export const JOB_STATUSES = [
  'Applied',
  'Interview',
  'Accepted',
  'Rejected',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
