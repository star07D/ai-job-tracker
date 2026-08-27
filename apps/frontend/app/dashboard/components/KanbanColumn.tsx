import { Droppable, Draggable } from "@hello-pangea/dnd";

import { Job } from "@/lib/types";
import { JobStatus, STATUS_COLORS } from "@/lib/job-status";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  status: JobStatus;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

export default function KanbanColumn({
  status,
  jobs,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  return (
    <div className="bg-[#020617] border border-slate-800 rounded-3xl p-4 w-80 shrink-0 flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between mb-4 px-1">
        <span
          className={`px-3 py-1 rounded-lg text-sm font-semibold ${STATUS_COLORS[status].badge}`}
        >
          {status}
        </span>

        <span className="text-slate-500 text-sm">{jobs.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto space-y-3 rounded-2xl p-1 transition ${
              snapshot.isDraggingOver ? "bg-slate-900/50" : ""
            }`}
          >
            {jobs.map((job, index) => (
              <Draggable key={job.id} draggableId={job.id} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <KanbanCard job={job} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {jobs.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-6">
                No jobs here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
