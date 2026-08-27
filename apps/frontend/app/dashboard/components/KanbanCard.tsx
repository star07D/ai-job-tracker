"use client";

import { Draggable } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Job } from "@/lib/types";
import { cn } from "@/lib/cn";

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

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group rounded-lg border border-border bg-surface p-3 shadow-card transition-shadow",
            snapshot.isDragging && "shadow-pop",
          )}
        >
          <button
            type="button"
            onClick={() => router.push(`/dashboard/job/${job.id}`)}
            className="block w-full text-left"
          >
            <div className="text-[13px] font-semibold leading-snug">
              {job.title}
            </div>
            <div className="mt-0.5 text-[11.5px] text-fg-muted">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </div>
          </button>
          <div className="mt-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Edit"
              onClick={() => onEdit(job)}
              className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-fg-muted hover:text-fg"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => onDelete(job)}
              className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-fg-muted hover:text-[var(--st-rejected)]"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
