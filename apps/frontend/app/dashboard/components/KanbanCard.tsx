"use client";

import { Draggable } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Job } from "@/lib/types";
import { dueInfo, dueToneClass } from "@/lib/due";
import { cn } from "@/lib/cn";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function KanbanCard({
  job,
  index,
  onEdit,
  onDelete,
}: {
  job: Job;
  index: number;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  const router = useRouter();
  const due =
    job.nextActionDue && dueInfo(job.nextActionDue).days <= 7
      ? dueInfo(job.nextActionDue)
      : null;

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group relative rounded-lg border border-border bg-surface p-3 shadow-card transition-shadow",
            snapshot.isDragging && "shadow-pop",
          )}
        >
          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              aria-label="Edit"
              onClick={() => onEdit(job)}
              className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-fg-muted hover:text-fg"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => onDelete(job)}
              className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-fg-muted hover:text-[var(--st-rejected)]"
            >
              <Trash2 size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/job/${job.id}`)}
            className="block w-full text-left"
          >
            <div className="pr-12 text-[13px] font-semibold leading-snug">
              {job.title}
            </div>
            <div className="mt-0.5 text-[11.5px] text-fg-muted">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-data text-[10.5px] text-fg-subtle">
              <span>
                {[job.salary, shortDate(job.appliedDate)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {due && (
                <span className={cn("font-semibold", dueToneClass(due.tone))}>
                  {due.label}
                </span>
              )}
            </div>
          </button>
        </div>
      )}
    </Draggable>
  );
}
