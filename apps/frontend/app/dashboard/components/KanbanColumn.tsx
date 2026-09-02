"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Job } from "@/lib/types";
import { JobStatus, statusStyle } from "@/lib/job-status";
import { cn } from "@/lib/cn";
import { KanbanCard } from "./KanbanCard";

export function KanbanColumn({
  status,
  jobs,
  onEdit,
  onDelete,
}: {
  status: JobStatus;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  const s = statusStyle(status);

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-surface-2/50 md:w-auto">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="label-mono flex items-center gap-2 !text-[10px] !text-fg-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          {status}
        </span>
        <span className="font-data rounded-full border border-border bg-surface px-1.5 text-[10px] text-fg-subtle">
          {jobs.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[72px] flex-1 space-y-2 rounded-b-xl p-2 transition-colors",
              snapshot.isDraggingOver && "bg-accent-soft",
            )}
          >
            {jobs.map((job, index) => (
              <KanbanCard
                key={job.id}
                job={job}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-2 py-6 text-center text-[12px] text-fg-subtle">
                Nothing here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
