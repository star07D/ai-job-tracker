/**
 * Staleness — how long a job has sat in its current status, and whether that's
 * gone on too long. Terminal statuses (Accepted / Rejected) never go stale.
 * Comparisons are by calendar day in the viewer's timezone.
 */

const STALE_AFTER_DAYS: Record<string, number> = {
  Applied: 21,
  Interview: 10,
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface StageInfo {
  /** Whole days in the current status. */
  days: number;
  /** Compact duration, e.g. "5d", "3w", "2mo". */
  label: string;
  /** Spelled-out duration, e.g. "5 days", "3 weeks". */
  longLabel: string;
  /** True once the job has sat here longer than its status allows. */
  stale: boolean;
}

interface StageInput {
  status: string;
  statusChangedAt: string;
}

type StaleInput = StageInput & { nextActionDue?: string | null };

export function stageInfo(job: StageInput, now: Date = new Date()): StageInfo {
  const DAY = 86_400_000;
  const days = Math.max(
    0,
    Math.round(
      (startOfDay(now).getTime() -
        startOfDay(new Date(job.statusChangedAt)).getTime()) /
        DAY,
    ),
  );
  const threshold = STALE_AFTER_DAYS[job.status] ?? Infinity;

  return {
    days,
    label: shortDuration(days),
    longLabel: longDuration(days),
    stale: days >= threshold,
  };
}

/**
 * Whether a job should be flagged as neglected: past its stage threshold *and*
 * with no follow-up scheduled. A job you've planned a next step for isn't quiet.
 */
export function isStale(job: StaleInput, now?: Date): boolean {
  return !job.nextActionDue && stageInfo(job, now).stale;
}

export function staleCount(jobs: StaleInput[], now?: Date): number {
  return jobs.reduce((n, job) => n + (isStale(job, now) ? 1 : 0), 0);
}

function shortDuration(days: number): string {
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function longDuration(days: number): string {
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 45) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}
