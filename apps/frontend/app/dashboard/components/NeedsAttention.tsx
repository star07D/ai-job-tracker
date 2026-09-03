"use client";

import Link from "next/link";
import { ArrowUpRight, Bell } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Job } from "@/lib/types";
import { dueInfo, dueToneClass, needsAttention } from "@/lib/due";
import { cn } from "@/lib/cn";

export function NeedsAttention({ jobs }: { jobs: Job[] }) {
  const due = jobs
    .filter((j) => needsAttention(j.nextActionDue))
    .sort(
      (a, b) =>
        new Date(a.nextActionDue as string).getTime() -
        new Date(b.nextActionDue as string).getTime(),
    );

  if (due.length === 0) return null;

  return (
    <Card className="overflow-hidden border-[var(--accent-line)]">
      <div className="label-mono flex items-center gap-2 border-b border-border px-4 py-2.5 !text-[10px]">
        <Bell size={12} className="text-accent" />
        Needs attention
        <span className="font-data ml-auto rounded-full border border-border bg-surface-2 px-1.5 text-[10px] text-fg-subtle">
          {due.length}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {due.map((job) => {
          const info = dueInfo(job.nextActionDue as string);
          return (
            <li key={job.id}>
              <Link
                href={`/dashboard/job/${job.id}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">
                    {job.nextAction || "Follow up"}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-fg-muted">
                    {job.title} · {job.company}
                  </div>
                </div>
                <span
                  className={cn(
                    "font-data shrink-0 text-[11px] font-semibold",
                    dueToneClass(info.tone),
                  )}
                >
                  {info.label}
                </span>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
