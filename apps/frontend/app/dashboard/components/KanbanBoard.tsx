"use client";

import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Job } from "@/lib/types";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStatusChange: (jobId: string, status: JobStatus) => void;
}) {
  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    onStatusChange(draggableId, destination.droppableId as JobStatus);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobs.filter((j) => j.status === status)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
