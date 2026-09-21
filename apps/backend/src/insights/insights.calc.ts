import { JOB_STATUSES } from '../jobs/job-status';

/**
 * Pure maths behind GET /insights — no Prisma, no clock reads (`now` is passed
 * in), so every rule here is unit-testable with fixed dates.
 *
 * The one thing to keep in mind: history is only trustworthy where a
 * StatusEvent has a non-null `fromStatus`. Jobs created directly in a status,
 * or backfilled before the table existed, have an unknown path, and the rules
 * below deliberately leave those out of anything that needs a real transition.
 */

export const MIN_SAMPLE = 3;
export const WEEKS = 8;
// Mirrors STALE_AFTER_DAYS.Applied in digest.service.ts / apps/frontend/lib/stale.ts.
export const STALE_APPLIED_DAYS = 21;
const DAY = 86_400_000;

export interface InsightEvent {
  fromStatus: string | null;
  toStatus: string;
  at: Date;
}

export interface InsightJob {
  status: string;
  appliedDate: Date;
  statusChangedAt: Date;
  tags: string[];
  archived: boolean;
  statusEvents: InsightEvent[];
}

export interface TagStat {
  tag: string;
  total: number;
  responded: number;
  interviewed: number;
}

export interface Insights {
  total: number;
  byStatus: Record<string, number>;
  funnel: {
    applied: number;
    responded: number;
    interviewed: number;
    offers: number;
  };
  /** null until there are MIN_SAMPLE applications to speak about. */
  replyRate: number | null;
  interviewRate: number | null;
  /** median days from applying to first hearing back (known transitions only). */
  daysToResponse: { median: number | null; n: number };
  /** median days from first interview to an accept/reject decision. */
  daysToDecision: { median: number | null; n: number };
  weekly: { weekStart: string; count: number }[];
  tags: TagStat[];
  /** active Applied jobs with no reply for STALE_APPLIED_DAYS+. */
  silent: number;
  takeaways: string[];
}

const pct = (n: number, d: number) => Math.round((n / d) * 100);

function median(values: number[]): number | null {
  if (values.length < MIN_SAMPLE) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY));
}

const responded = (j: InsightJob) =>
  j.status !== 'Applied' ||
  j.statusEvents.some((e) => e.fromStatus === 'Applied');

// An offer implies an interview happened, even if the move wasn't recorded.
const interviewed = (j: InsightJob) =>
  j.status === 'Interview' ||
  j.status === 'Accepted' ||
  j.statusEvents.some((e) => e.toStatus === 'Interview');

// Rejected with no recorded route: could have been a straight no or a
// post-interview no, so it can't count for or against the interview rate.
const pathUnknown = (j: InsightJob) =>
  j.status === 'Rejected' &&
  !j.statusEvents.some((e) => e.toStatus === 'Interview') &&
  !j.statusEvents.some(
    (e) => e.toStatus === 'Rejected' && e.fromStatus !== null,
  );

function weekStart(d: Date) {
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day),
  );
}

function weeklyCounts(jobs: InsightJob[], now: Date) {
  const thisWeek = weekStart(now).getTime();
  const buckets = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(thisWeek - (WEEKS - 1 - i) * 7 * DAY);
    return {
      weekStart: start.toISOString().slice(0, 10),
      start: start.getTime(),
      count: 0,
    };
  });
  for (const j of jobs) {
    const t = weekStart(j.appliedDate).getTime();
    const b = buckets.find((x) => x.start === t);
    if (b) b.count += 1;
  }
  return buckets.map(({ weekStart: w, count }) => ({ weekStart: w, count }));
}

function tagStats(jobs: InsightJob[]): TagStat[] {
  const map = new Map<string, TagStat>();
  for (const j of jobs) {
    for (const tag of new Set(j.tags.map((t) => t.toLowerCase()))) {
      const display = j.tags.find((t) => t.toLowerCase() === tag) ?? tag;
      const s = map.get(tag) ?? {
        tag: display,
        total: 0,
        responded: 0,
        interviewed: 0,
      };
      s.total += 1;
      if (responded(j)) s.responded += 1;
      if (interviewed(j)) s.interviewed += 1;
      map.set(tag, s);
    }
  }
  return [...map.values()]
    .filter((s) => s.total >= MIN_SAMPLE)
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))
    .slice(0, 8);
}

function buildTakeaways(
  jobs: InsightJob[],
  i: Pick<
    Insights,
    'funnel' | 'daysToResponse' | 'silent' | 'tags' | 'interviewRate'
  > & { interviewDenominator: number },
): string[] {
  const out: string[] = [];
  const { funnel, daysToResponse, silent } = i;

  out.push(
    `You've heard back on ${funnel.responded} of ${funnel.applied} applications (${pct(funnel.responded, funnel.applied)}%)` +
      (daysToResponse.median !== null
        ? daysToResponse.median === 0
          ? ', usually the same day.'
          : `, usually within ${daysToResponse.median} day${daysToResponse.median === 1 ? '' : 's'}.`
        : '.'),
  );

  if (i.interviewRate !== null) {
    out.push(
      `${funnel.interviewed} of ${i.interviewDenominator} applications with a known outcome reached an interview (${Math.round(i.interviewRate * 100)}%).`,
    );
  }

  // the tag whose interview rate beats the rest by the widest margin
  let best: {
    tag: string;
    a: number;
    n: number;
    b: number;
    m: number;
    diff: number;
  } | null = null;
  for (const t of i.tags) {
    const key = t.tag.toLowerCase();
    const others = jobs.filter(
      (j) => !j.tags.some((x) => x.toLowerCase() === key),
    );
    if (others.length < MIN_SAMPLE) continue;
    const b = others.filter(interviewed).length;
    const diff = t.interviewed / t.total - b / others.length;
    if (diff >= 0.25 && (!best || diff > best.diff)) {
      best = {
        tag: t.tag,
        a: t.interviewed,
        n: t.total,
        b,
        m: others.length,
        diff,
      };
    }
  }
  if (best) {
    out.push(
      `Applications tagged “${best.tag}” reached interview ${best.a} of ${best.n} times, vs ${best.b} of ${best.m} without it.`,
    );
  }

  if (silent > 0) {
    out.push(
      `${silent} application${silent === 1 ? ' has' : 's have'} had no reply for ${STALE_APPLIED_DAYS}+ days — worth a follow-up.`,
    );
  }

  return out;
}

export function computeInsights(jobs: InsightJob[], now: Date): Insights {
  const total = jobs.length;

  const byStatus: Record<string, number> = {};
  for (const s of JOB_STATUSES) byStatus[s] = 0;
  for (const j of jobs) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;

  const funnel = {
    applied: total,
    responded: jobs.filter(responded).length,
    interviewed: jobs.filter(interviewed).length,
    offers: byStatus['Accepted'] ?? 0,
  };

  // days from applying to the first known move out of Applied
  const toResponse: number[] = [];
  // days from the first interview to an accept/reject
  const toDecision: number[] = [];
  for (const j of jobs) {
    const events = [...j.statusEvents].sort(
      (a, b) => a.at.getTime() - b.at.getTime(),
    );
    const first = events.find((e) => e.fromStatus === 'Applied');
    if (first) toResponse.push(daysBetween(j.appliedDate, first.at));

    const enteredInterview = events.find((e) => e.toStatus === 'Interview');
    const decided = events.find(
      (e) =>
        e.fromStatus === 'Interview' &&
        (e.toStatus === 'Accepted' || e.toStatus === 'Rejected'),
    );
    if (enteredInterview && decided) {
      toDecision.push(daysBetween(enteredInterview.at, decided.at));
    }
  }

  const known = jobs.filter((j) => !pathUnknown(j));
  const enough = total >= MIN_SAMPLE;
  const replyRate = enough ? funnel.responded / total : null;
  const interviewRate =
    known.length >= MIN_SAMPLE
      ? known.filter(interviewed).length / known.length
      : null;

  const silent = jobs.filter(
    (j) =>
      !j.archived &&
      j.status === 'Applied' &&
      daysBetween(j.statusChangedAt, now) >= STALE_APPLIED_DAYS,
  ).length;

  const tags = tagStats(jobs);
  const daysToResponse = { median: median(toResponse), n: toResponse.length };
  const daysToDecision = { median: median(toDecision), n: toDecision.length };

  return {
    total,
    byStatus,
    funnel,
    replyRate,
    interviewRate,
    daysToResponse,
    daysToDecision,
    weekly: weeklyCounts(jobs, now),
    tags,
    silent,
    takeaways: enough
      ? buildTakeaways(jobs, {
          funnel: {
            ...funnel,
            // the sentence's numerator must match its (known-outcome) denominator
            interviewed: known.filter(interviewed).length,
          },
          daysToResponse,
          silent,
          tags,
          interviewRate,
          interviewDenominator: known.length,
        })
      : [],
  };
}
