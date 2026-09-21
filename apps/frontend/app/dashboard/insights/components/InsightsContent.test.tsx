import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InsightsContent } from "./InsightsContent";
import { getInsights } from "@/lib/api";
import type { Insights } from "@/lib/types";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getInsights: vi.fn(),
}));
const mockGet = vi.mocked(getInsights);

beforeEach(() => mockGet.mockReset());

const insights: Insights = {
  total: 5,
  byStatus: { Applied: 1, Interview: 1, Accepted: 1, Rejected: 2 },
  funnel: { applied: 5, responded: 4, interviewed: 2, offers: 1 },
  replyRate: 0.8,
  interviewRate: 0.5,
  daysToResponse: { median: 6, n: 3 },
  daysToDecision: { median: null, n: 1 },
  weekly: [
    "2026-08-03",
    "2026-08-10",
    "2026-08-17",
    "2026-08-24",
    "2026-08-31",
    "2026-09-07",
    "2026-09-14",
    "2026-09-21",
  ].map((weekStart, i) => ({ weekStart, count: i === 7 ? 3 : 0 })),
  tags: [{ tag: "Remote", total: 3, responded: 3, interviewed: 2 }],
  silent: 1,
  takeaways: [
    "You've heard back on 4 of 5 applications (80%), usually within 6 days.",
    "1 application has had no reply for 21+ days — worth a follow-up.",
  ],
};

describe("<InsightsContent />", () => {
  it("shows the takeaways, headline numbers and tag table", async () => {
    mockGet.mockResolvedValue(insights);
    render(<InsightsContent />);

    expect(
      await screen.findByText(/heard back on 4 of 5 applications/),
    ).toBeInTheDocument();
    expect(screen.getByText(/no reply for 21\+ days/)).toBeInTheDocument();
    // "80%" also appears as a funnel share, so read each stat by its label
    expect(screen.getByText("Reply rate").parentElement).toHaveTextContent("80%");
    expect(screen.getByText("Interview rate").parentElement).toHaveTextContent(
      "50%",
    );
    expect(screen.getByText("median, from 3 replies")).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: "Remote" }),
    ).toBeInTheDocument();
  });

  it("gives screen readers each week's count as text", async () => {
    mockGet.mockResolvedValue(insights);
    render(<InsightsContent />);

    // regex: Node's en-GB abbreviates September as "Sept", older ICU as "Sep"
    expect(await screen.findByText(/^Week of 21 Sep\w*: 3$/)).toBeInTheDocument();
  });

  it("shows a dash instead of a number when there is too little data", async () => {
    mockGet.mockResolvedValue({
      ...insights,
      interviewRate: null,
      daysToResponse: { median: null, n: 1 },
    });
    render(<InsightsContent />);

    expect(await screen.findByText("needs 3+ recorded replies")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("asks for more applications instead of charting almost nothing", async () => {
    mockGet.mockResolvedValue({ ...insights, total: 2, takeaways: [] });
    render(<InsightsContent />);

    expect(await screen.findByText("Not enough to go on yet")).toBeInTheDocument();
    expect(screen.getByText(/you have 2/)).toBeInTheDocument();
    expect(screen.queryByText("Funnel")).not.toBeInTheDocument();
  });

  it("shows the error and retries", async () => {
    mockGet.mockRejectedValueOnce(new Error("boom"));
    mockGet.mockResolvedValueOnce(insights);
    render(<InsightsContent />);

    expect(await screen.findByText("boom")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText(/heard back on 4 of 5 applications/),
    ).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
