import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { NeedsAttention } from "./NeedsAttention";
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

const day = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * day).toISOString();

function makeJob(over: Partial<Job>): Job {
  return {
    id: Math.random().toString(36).slice(2),
    title: "Role",
    company: "Co",
    status: "Applied",
    appliedDate: iso(-30),
    createdAt: iso(-30),
    ...over,
  };
}

describe("<NeedsAttention />", () => {
  it("renders nothing when no follow-up is overdue or due today", () => {
    const { container } = render(
      <NeedsAttention
        jobs={[
          makeJob({ nextAction: "Later", nextActionDue: iso(5) }),
          makeJob({ nextAction: null, nextActionDue: null }),
        ]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists overdue and due-today items, overdue first, and excludes future ones", () => {
    render(
      <NeedsAttention
        jobs={[
          makeJob({
            title: "Staff Eng",
            company: "Vercel",
            nextAction: "Email recruiter",
            nextActionDue: iso(0),
          }),
          makeJob({
            title: "Backend Eng",
            company: "Supabase",
            nextAction: "System design prep",
            nextActionDue: iso(4),
          }),
          makeJob({
            title: "Frontend Dev",
            company: "Linear",
            nextAction: "Send thank-you note",
            nextActionDue: iso(-3),
          }),
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Send thank-you note");
    expect(items[1]).toHaveTextContent("Email recruiter");
    expect(screen.queryByText("System design prep")).not.toBeInTheDocument();
  });

  it("falls back to 'Follow up' when a due job has no action text", () => {
    render(
      <NeedsAttention
        jobs={[makeJob({ nextAction: null, nextActionDue: iso(-1) })]}
      />,
    );
    expect(screen.getByText("Follow up")).toBeInTheDocument();
  });
});
