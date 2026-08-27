"use client";

import { JOB_STATUSES, statusStyle } from "@/lib/job-status";
import { CountUp } from "@/components/ui/motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function Pipeline({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const max = Math.max(1, ...JOB_STATUSES.map((s) => counts[s] ?? 0));
  const responded =
    (counts.Interview ?? 0) + (counts.Accepted ?? 0) + (counts.Rejected ?? 0);
  const responseRate = total ? Math.round((responded / total) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      {/* summary numbers */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {JOB_STATUSES.map((status) => {
          const s = statusStyle(status);
          return (
            <div key={status} className="p-4">
              <div className="label-mono flex items-center gap-2 !text-[10px]">
                <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                {status}
              </div>
              <div className="mt-2 font-display text-[26px] font-semibold leading-none">
                <CountUp value={counts[status] ?? 0} />
              </div>
            </div>
          );
        })}
      </div>

      {/* proportional breakdown */}
      <div className="space-y-2.5 border-t border-border p-4">
        {JOB_STATUSES.map((status) => {
          const n = counts[status] ?? 0;
          const s = statusStyle(status);
          const share = total ? Math.round((n / total) * 100) : 0;
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="label-mono w-[64px] shrink-0 !text-[10px] !text-fg-muted">
                {status}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn("funnel-bar h-full rounded-full", s.dot)}
                  style={{
                    ["--w" as string]: `${Math.max((n / max) * 100, n ? 5 : 0)}%`,
                  }}
                />
              </div>
              <span className="font-data w-6 shrink-0 text-right text-[12px] font-semibold">
                {n}
              </span>
              <span className="font-data w-8 shrink-0 text-right text-[11px] text-fg-subtle">
                {share}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="label-mono border-t border-border px-4 py-3 !text-[10px] !normal-case !tracking-normal">
        {responseRate}% response rate
        <span className="mx-2 text-fg-subtle">·</span>
        {responded} of {total} heard back
      </div>
    </Card>
  );
}
