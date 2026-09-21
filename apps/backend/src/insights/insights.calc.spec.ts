import { computeInsights, InsightEvent, InsightJob } from './insights.calc';

const DAY = 86_400_000;
// a Monday, so the weekly buckets are easy to reason about
const NOW = new Date('2026-09-21T12:00:00.000Z');
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

const ev = (
  fromStatus: string | null,
  toStatus: string,
  daysAgo: number,
): InsightEvent => ({ fromStatus, toStatus, at: ago(daysAgo) });

function job(p: Partial<InsightJob> & { appliedAgo?: number }): InsightJob {
  const applied = ago(p.appliedAgo ?? 5);
  return {
    status: 'Applied',
    appliedDate: applied,
    statusChangedAt: applied,
    tags: [],
    archived: false,
    statusEvents: [],
    ...p,
  };
}

// a realistic mixed pipeline — see the assertions for what each row means
const pipeline = (): InsightJob[] => [
  // no reply for 30 days
  job({ appliedAgo: 30, statusEvents: [ev(null, 'Applied', 30)] }),
  // interview, 6 days after applying
  job({
    status: 'Interview',
    appliedAgo: 20,
    statusChangedAt: ago(14),
    statusEvents: [ev(null, 'Applied', 20), ev('Applied', 'Interview', 14)],
  }),
  // offer: 10 days to interview, 10 more to a decision
  job({
    status: 'Accepted',
    appliedAgo: 40,
    statusChangedAt: ago(20),
    statusEvents: [
      ev(null, 'Applied', 40),
      ev('Applied', 'Interview', 30),
      ev('Interview', 'Accepted', 20),
    ],
  }),
  // straight rejection, 5 days after applying
  job({
    status: 'Rejected',
    appliedAgo: 25,
    statusChangedAt: ago(20),
    statusEvents: [ev(null, 'Applied', 25), ev('Applied', 'Rejected', 20)],
  }),
  // rejected, but only ever recorded as "now Rejected" — path unknown
  job({
    status: 'Rejected',
    appliedAgo: 50,
    statusChangedAt: ago(10),
    statusEvents: [ev(null, 'Rejected', 10)],
  }),
];

describe('computeInsights', () => {
  it('stays quiet until there are enough applications to say anything', () => {
    const r = computeInsights([job({}), job({})], NOW);
    expect(r.total).toBe(2);
    expect(r.replyRate).toBeNull();
    expect(r.interviewRate).toBeNull();
    expect(r.takeaways).toEqual([]);
  });

  it('counts the funnel, treating an offer as having interviewed', () => {
    const r = computeInsights(pipeline(), NOW);
    expect(r.funnel).toEqual({
      applied: 5,
      responded: 4,
      interviewed: 2,
      offers: 1,
    });
    expect(r.byStatus).toEqual({
      Applied: 1,
      Interview: 1,
      Accepted: 1,
      Rejected: 2,
    });
    expect(r.replyRate).toBeCloseTo(0.8);
  });

  it('leaves a path-unknown rejection out of the interview rate', () => {
    // 2 interviewed of the 4 jobs whose route is known — not of all 5
    expect(computeInsights(pipeline(), NOW).interviewRate).toBeCloseTo(0.5);
  });

  it('measures time to first response from known transitions only', () => {
    const r = computeInsights(pipeline(), NOW);
    // 6, 10 and 5 days — the path-unknown job contributes nothing
    expect(r.daysToResponse).toEqual({ median: 6, n: 3 });
  });

  it('withholds a median that rests on fewer than three data points', () => {
    const r = computeInsights(pipeline(), NOW);
    // only one job has a recorded interview → decision
    expect(r.daysToDecision).toEqual({ median: null, n: 1 });
  });

  it('flags active applications with no reply for 21+ days', () => {
    expect(computeInsights(pipeline(), NOW).silent).toBe(1);
  });

  it('does not count archived applications as silent', () => {
    const jobs = pipeline();
    jobs[0].archived = true;
    expect(computeInsights(jobs, NOW).silent).toBe(0);
  });

  it('writes plain-language takeaways from the numbers', () => {
    expect(computeInsights(pipeline(), NOW).takeaways).toEqual([
      "You've heard back on 4 of 5 applications (80%), usually within 6 days.",
      '2 of 4 applications with a known outcome reached an interview (50%).',
      '1 application has had no reply for 21+ days — worth a follow-up.',
    ]);
  });

  it('says "the same day" rather than "within 0 days"', () => {
    const quick = (status: string) =>
      job({
        status,
        appliedAgo: 10,
        statusChangedAt: ago(10),
        statusEvents: [ev(null, 'Applied', 10), ev('Applied', status, 10)],
      });
    const r = computeInsights(
      [quick('Interview'), quick('Rejected'), quick('Interview')],
      NOW,
    );
    expect(r.daysToResponse.median).toBe(0);
    expect(r.takeaways[0]).toBe(
      "You've heard back on 3 of 3 applications (100%), usually the same day.",
    );
  });

  it('buckets applications into the last 8 Monday-start weeks', () => {
    const r = computeInsights(
      [
        job({ appliedDate: new Date('2026-09-21T09:00:00.000Z') }), // this week
        job({ appliedDate: new Date('2026-09-20T09:00:00.000Z') }), // Sunday → last week
        job({ appliedDate: new Date('2026-09-15T09:00:00.000Z') }), // last week
        job({ appliedAgo: 100 }), // outside the window
      ],
      NOW,
    );
    expect(r.weekly).toHaveLength(8);
    expect(r.weekly[0].weekStart).toBe('2026-08-03');
    expect(r.weekly[7]).toEqual({ weekStart: '2026-09-21', count: 1 });
    expect(r.weekly[6]).toEqual({ weekStart: '2026-09-14', count: 2 });
  });

  it('only reports tags with enough applications, merging case', () => {
    const r = computeInsights(
      [
        job({ status: 'Interview', tags: ['Remote'] }),
        job({ status: 'Interview', tags: ['remote'] }),
        job({ status: 'Interview', tags: ['remote', 'rare'] }),
        job({}),
        job({}),
        job({}),
      ],
      NOW,
    );
    expect(r.tags).toEqual([
      { tag: 'Remote', total: 3, responded: 3, interviewed: 3 },
    ]);
    expect(r.takeaways).toContain(
      'Applications tagged “Remote” reached interview 3 of 3 times, vs 0 of 3 without it.',
    );
  });
});
