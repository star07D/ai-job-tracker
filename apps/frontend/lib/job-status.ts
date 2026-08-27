export const JOB_STATUSES = [
  "Applied",
  "Interview",
  "Accepted",
  "Rejected",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

type StatusStyle = {
  /** text + bg for a badge/pill (theme-aware via CSS vars) */
  badge: string;
  /** solid dot / bar color */
  dot: string;
};

export const STATUS_STYLES: Record<JobStatus, StatusStyle> = {
  Applied: {
    badge: "text-[var(--st-applied)] bg-[var(--st-applied-bg)]",
    dot: "bg-[var(--st-applied)]",
  },
  Interview: {
    badge: "text-[var(--st-interview)] bg-[var(--st-interview-bg)]",
    dot: "bg-[var(--st-interview)]",
  },
  Accepted: {
    badge: "text-[var(--st-accepted)] bg-[var(--st-accepted-bg)]",
    dot: "bg-[var(--st-accepted)]",
  },
  Rejected: {
    badge: "text-[var(--st-rejected)] bg-[var(--st-rejected-bg)]",
    dot: "bg-[var(--st-rejected)]",
  },
};

export function statusStyle(status: string): StatusStyle {
  return (
    STATUS_STYLES[status as JobStatus] ?? {
      badge: "text-fg-subtle bg-surface-2",
      dot: "bg-fg-subtle",
    }
  );
}
