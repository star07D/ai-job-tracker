import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { JobRow } from "./JobRow";
import type { Job } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: unknown;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

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

const noop = vi.fn();

describe("<JobRow /> résumé match pill", () => {
  it("shows nothing when the job has no match yet", () => {
    render(
      <JobRow job={makeJob({})} onEdit={noop} onDelete={noop} onToggleArchive={noop} />,
    );
    expect(screen.queryByText(/match$/)).not.toBeInTheDocument();
  });

  it("shows the score once a match has been checked", () => {
    const job = makeJob({
      resumeMatch: {
        score: 82,
        band: "strong",
        summary: "s",
        strengths: [],
        gaps: [],
      },
    });
    render(
      <JobRow job={job} onEdit={noop} onDelete={noop} onToggleArchive={noop} />,
    );
    expect(screen.getByText("82 match")).toBeInTheDocument();
  });
});
