"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/ui/motion";
import { getInsights } from "@/lib/api";
import { Insights } from "@/lib/types";

const MIN_SAMPLE = 3;

const pct = (rate: number | null) =>
  rate === null ? "—" : `${Math.round(rate * 100)}%`;

function weekLabel(weekStart: string) {
  return new Date(`${weekStart}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="p-4">
      <div className="label-mono !text-[10px]">{label}</div>
      <div className="mt-2 font-display text-[40px] font-extrabold leading-none tracking-[-0.03em]">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-fg-muted">{hint}</div>
    </div>
  );
}

function FunnelRow({
  label,
  count,
  of,
}: {
  label: string;
  count: number;
  of: number;
}) {
  const share = of ? Math.round((count / of) * 100) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="label-mono w-[92px] shrink-0 !text-[10px] !text-fg-muted">
        {label}
      </span>
      <div
        aria-hidden="true"
        className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(share, count ? 4 : 0)}%` }}
        />
      </div>
      <span className="font-data w-14 shrink-0 text-right text-[12px] font-semibold">
        {count}
        <span className="ml-1 font-normal text-fg-subtle">{share}%</span>
      </span>
    </li>
  );
}

export function InsightsView({ data }: { data: Insights }) {
  const { funnel, weekly, tags } = data;
  const peak = Math.max(1, ...weekly.map((w) => w.count));
  const timing =
    data.daysToResponse.median === null
      ? "needs 3+ recorded replies"
      : `median, from ${data.daysToResponse.n} replies`;

  return (
    <>
      <Reveal index={1} className="mt-8 block">
        <Card className="ink-card border-2 border-fg">
          <CardBody>
            <h2 className="label-mono !text-[11px]">What stands out</h2>
            <ul className="mt-3 space-y-2.5">
              {data.takeaways.map((t) => (
                <li
                  key={t}
                  className="flex gap-3 text-[15px] leading-relaxed text-fg"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </Reveal>

      <Reveal index={2} className="mt-6 block">
        <Card>
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            <Stat
              label="Reply rate"
              value={pct(data.replyRate)}
              hint={`${funnel.responded} of ${funnel.applied} heard back`}
            />
            <Stat
              label="Interview rate"
              value={pct(data.interviewRate)}
              hint="of applications with a known outcome"
            />
            <Stat
              label="Days to reply"
              value={
                data.daysToResponse.median === null
                  ? "—"
                  : String(data.daysToResponse.median)
              }
              hint={timing}
            />
            <Stat
              label="Offers"
              value={String(funnel.offers)}
              hint={`from ${funnel.applied} applications`}
            />
          </div>
        </Card>
      </Reveal>

      <Reveal index={3} className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funnel</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3">
              <FunnelRow label="Applied" count={funnel.applied} of={funnel.applied} />
              <FunnelRow label="Heard back" count={funnel.responded} of={funnel.applied} />
              <FunnelRow label="Interviewed" count={funnel.interviewed} of={funnel.applied} />
              <FunnelRow label="Offers" count={funnel.offers} of={funnel.applied} />
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications per week</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="flex h-[132px] items-end gap-2">
              {weekly.map((w) => (
                <li
                  key={w.weekStart}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="sr-only">
                    Week of {weekLabel(w.weekStart)}: {w.count}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-data text-[11px] font-semibold"
                  >
                    {w.count}
                  </span>
                  <div
                    aria-hidden="true"
                    className="w-full rounded-t-md bg-accent"
                    style={{
                      height: `${Math.max((w.count / peak) * 84, w.count ? 6 : 2)}px`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="font-data text-[9.5px] text-fg-subtle"
                  >
                    {weekLabel(w.weekStart)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </Reveal>

      <Reveal index={4} className="mt-6 block">
        <Card>
          <CardHeader>
            <CardTitle>By tag</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            {tags.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Tags used on {MIN_SAMPLE}+ applications will show up here.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="label-mono !text-[10px]">
                    <th scope="col" className="pb-2 font-normal">
                      Tag
                    </th>
                    <th scope="col" className="pb-2 text-right font-normal">
                      Applications
                    </th>
                    <th scope="col" className="pb-2 text-right font-normal">
                      Heard back
                    </th>
                    <th scope="col" className="pb-2 text-right font-normal">
                      Interviewed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((t) => (
                    <tr
                      key={t.tag}
                      className="border-t border-dashed border-border"
                    >
                      <th scope="row" className="py-2.5 font-medium">
                        {t.tag}
                      </th>
                      <td className="font-data py-2.5 text-right">{t.total}</td>
                      <td className="font-data py-2.5 text-right">
                        {t.responded}
                      </td>
                      <td className="font-data py-2.5 text-right">
                        {t.interviewed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </Reveal>

      <p className="label-mono mt-6 !text-[10px] !normal-case !tracking-normal">
        Based on {data.total} applications. Timings only use status changes
        recorded since tracking began, so older applications count towards the
        totals but not the timings.
      </p>
    </>
  );
}

export function InsightsContent() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(
    () =>
      getInsights()
        .then(setData)
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Couldn't load insights"),
        )
        .finally(() => setLoading(false)),
    [],
  );

  // first load: `loading` already starts true, so nothing to set up front
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  function retry() {
    setLoading(true);
    setError(null);
    fetchInsights();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/dashboard"
        className="label-mono inline-flex items-center gap-1.5 transition-colors hover:text-fg"
      >
        <ArrowLeft size={13} /> Dashboard
      </Link>

      <Reveal className="mt-5 block">
        <p className="label-mono !text-[11px]">Your search, measured</p>
        <h1 className="mt-2 font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.035em] md:text-[3.4rem]">
          <span className="hl">Insights</span>
        </h1>
      </Reveal>

      {loading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : error || !data ? (
        <div className="mt-8">
          <EmptyState
            icon={<Inbox size={18} />}
            title="Couldn't load insights"
            description={error ?? "Something went wrong."}
            action={
              <Button variant="outline" onClick={retry}>
                Try again
              </Button>
            }
          />
        </div>
      ) : data.total < MIN_SAMPLE ? (
        <div className="mt-8">
          <EmptyState
            icon={<Inbox size={18} />}
            title="Not enough to go on yet"
            description={`Insights start once you've tracked ${MIN_SAMPLE} applications — you have ${data.total}.`}
            action={
              <Link href="/dashboard">
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <InsightsView data={data} />
      )}
    </div>
  );
}
