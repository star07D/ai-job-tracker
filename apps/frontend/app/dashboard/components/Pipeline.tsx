"use client";

import { JOB_STATUSES, statusStyle } from "@/lib/job-status";
import { CountUp } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

export function Pipeline({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {JOB_STATUSES.map((status) => {
        const n = counts[status] ?? 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        const s = statusStyle(status);
        return (
          <div
            key={status}
            className="relative overflow-hidden rounded-xl border border-border bg-surface p-4"
          >
            <span
              className={cn("absolute inset-y-0 left-0 w-[3px]", s.dot)}
            />
            <div className="label-mono flex items-center gap-2 !text-[10px]">
              <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
              {status}
            </div>
            <div className="mt-2 font-display text-[27px] font-semibold leading-none">
              <CountUp value={n} />
            </div>
            {status === "Interview" && total > 0 && (
              <div className="label-mono mt-1 !text-[10px] !tracking-normal !normal-case">
                {pct}% response rate
              </div>
            )}
            <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-surface-3">
              <span
                className={cn("block h-full rounded-full transition-[width] duration-700", s.dot)}
                style={{ width: `${Math.max(pct, n ? 6 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
