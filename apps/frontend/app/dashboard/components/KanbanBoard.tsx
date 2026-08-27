"use client";

import { DragDropContext, DropResult } from "@hello-pangea/dnd";

import { Job } from "@/lib/types";
import { JOB_STATUSES, JobStatus } from "@/lib/job-status";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onStatusChange: (jobId: string, status: JobStatus) => void;
}

export default function KanbanBoard({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanBoardProps) {
  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    onStatusChange(draggableId, destination.droppableId as JobStatus);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-4">
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobs.filter((job) => job.status === status)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
