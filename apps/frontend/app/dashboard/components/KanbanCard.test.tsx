import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

import { KanbanCard } from "./KanbanCard";
import type { Job } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function makeJob(over: Partial<Job>): Job {
  return {
    id: "j1",
    title: "Staff Engineer",
    company: "Vercel",
    status: "Applied",
    appliedDate: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    statusChangedAt: "2026-09-01T00:00:00.000Z",
    tags: [],
    archived: false,
    ...over,
  };
}

// Draggable only renders inside a drag-drop context + droppable.
function renderCard(job: Job) {
  const noop = vi.fn();
  return render(
    <DragDropContext onDragEnd={noop}>
      <Droppable droppableId="col">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <KanbanCard job={job} index={0} onEdit={noop} onDelete={noop} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );
}

describe("<KanbanCard /> résumé match badge", () => {
  it("shows nothing when the job has no match yet", () => {
    renderCard(makeJob({}));
    expect(screen.getByText("Staff Engineer")).toBeInTheDocument();
    expect(screen.queryByText(/match$/)).not.toBeInTheDocument();
  });

  it("shows the score once a match has been checked", () => {
    renderCard(
      makeJob({
        resumeMatch: {
          score: 61,
          band: "partial",
          summary: "s",
          strengths: [],
          gaps: [],
        },
      }),
    );
    expect(screen.getByText("61 match")).toBeInTheDocument();
  });
});
