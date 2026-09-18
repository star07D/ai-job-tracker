"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Job } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { dueInfo, dueToneClass } from "@/lib/due";
import { isStale, stageInfo } from "@/lib/stale";
import { cn } from "@/lib/cn";

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();
}

export function JobRow({
  job,
  onEdit,
  onDelete,
  onToggleArchive,
}: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onToggleArchive: (job: Job) => void;
}) {
  const router = useRouter();
  const due =
    job.nextActionDue && dueInfo(job.nextActionDue).days <= 7
      ? dueInfo(job.nextActionDue)
      : null;
  const stage = stageInfo(job);
  const showStale = isStale(job);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2",
        job.archived && "opacity-60",
      )}
    >
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-transparent transition-colors group-hover:bg-accent" />

      <Link href={`/dashboard/job/${job.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14.5px] font-semibold">
          <span className="truncate">{job.title}</span>
          {job.archived && (
            <Archive size={12} className="shrink-0 text-fg-subtle" />
          )}
          <ArrowUpRight
            size={14}
            className="shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <div className="mt-0.5 flex items-center gap-2 truncate text-[12.5px] text-fg-muted">
          <span className="truncate">
            {[job.company, job.location, job.salary].filter(Boolean).join(" · ")}
          </span>
          {due && (
            <span
              className={cn(
                "font-data shrink-0 text-[11px] font-semibold",
                dueToneClass(due.tone),
              )}
            >
              · {due.label}
            </span>
          )}
          {showStale && (
            <span className="font-data shrink-0 text-[11px] font-semibold text-[var(--st-interview)]">
              · {stage.label} in {job.status}
            </span>
          )}
        </div>
        {job.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-fg-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      <StatusBadge status={job.status} />
      <span className="hidden font-data text-[11px] text-fg-subtle sm:block">
        {formatDate(job.appliedDate)}
      </span>

      <Dropdown
        label={`Actions for ${job.title}`}
        trigger={() => (
          <span className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg">
            <MoreHorizontal size={16} />
          </span>
        )}
      >
        {(close) => (
          <>
            <DropdownItem
              onClick={() => {
                close();
                router.push(`/dashboard/job/${job.id}`);
              }}
            >
              <ArrowUpRight size={15} /> View
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                onEdit(job);
              }}
            >
              <Pencil size={15} /> Edit
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                onToggleArchive(job);
              }}
            >
              {job.archived ? (
                <>
                  <ArchiveRestore size={15} /> Unarchive
                </>
              ) : (
                <>
                  <Archive size={15} /> Archive
                </>
              )}
            </DropdownItem>
            <DropdownItem
              destructive
              onClick={() => {
                close();
                onDelete(job);
              }}
            >
              <Trash2 size={15} /> Delete
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  );
}
