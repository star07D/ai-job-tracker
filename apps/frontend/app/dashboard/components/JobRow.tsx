"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import { Job } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();
}

export function JobRow({
  job,
  onEdit,
  onDelete,
}: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  const router = useRouter();

  return (
    <div className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2">
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-transparent transition-colors group-hover:bg-accent" />

      <Link href={`/dashboard/job/${job.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14.5px] font-semibold">
          <span className="truncate">{job.title}</span>
          <ArrowUpRight
            size={14}
            className="shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-fg-muted">
          {[job.company, job.location, job.salary].filter(Boolean).join(" · ")}
        </div>
      </Link>

      <StatusBadge status={job.status} />
      <span className="hidden font-data text-[11px] text-fg-subtle sm:block">
        {formatDate(job.appliedDate)}
      </span>

      <Dropdown
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
