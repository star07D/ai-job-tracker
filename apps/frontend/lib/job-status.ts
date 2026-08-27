export const JOB_STATUSES = [
  "Applied",
  "Interview",
  "Accepted",
  "Rejected",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_COLORS: Record<
  JobStatus,
  { badge: string; solid: string }
> = {
  Applied: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    solid: "bg-blue-500",
  },
  Interview: {
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    solid: "bg-yellow-500",
  },
  Accepted: {
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    solid: "bg-green-500",
  },
  Rejected: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    solid: "bg-red-500",
  },
};
