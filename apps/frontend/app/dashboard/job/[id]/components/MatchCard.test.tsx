import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { MatchCard } from "./MatchCard";
import { ApiError, generateMatch, getMe } from "@/lib/api";
import type { Job } from "@/lib/types";

// Mirrors how the real job-detail page wires this up: `job` only changes
// when the parent's state does, driven by `onUpdated`.
function Harness({ initial }: { initial: Job }) {
  const [job, setJob] = useState(initial);
  return <MatchCard job={job} onUpdated={setJob} />;
}

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getMe: vi.fn(),
  generateMatch: vi.fn(),
}));
const mockGetMe = vi.mocked(getMe);
const mockGenerateMatch = vi.mocked(generateMatch);

beforeEach(() => {
  toast.error.mockReset();
  toast.success.mockReset();
  mockGetMe.mockReset();
  mockGenerateMatch.mockReset();
});

const job: Job = {
  id: "j1",
  title: "Staff Engineer",
  company: "Vercel",
  status: "Applied",
  appliedDate: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  statusChangedAt: "2026-09-01T00:00:00.000Z",
  tags: [],
  archived: false,
};

const authUser = (hasResume: boolean) => ({
  id: "u1",
  email: "a@example.com",
  firstName: null,
  lastName: null,
  hasResume,
});

describe("<MatchCard />", () => {
  it("points at Settings when there's no résumé on file", async () => {
    mockGetMe.mockResolvedValue(authUser(false));
    render(<MatchCard job={job} onUpdated={vi.fn()} />);

    expect(await screen.findByText(/Upload your résumé in Settings/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Check match/ }),
    ).not.toBeInTheDocument();
  });

  it("checks the match and renders the score, bar and lists", async () => {
    mockGetMe.mockResolvedValue(authUser(true));
    const updated: Job = {
      ...job,
      resumeMatch: {
        score: 82,
        band: "strong",
        summary: "Strong overlap on the core stack.",
        strengths: ["5 years of React"],
        gaps: ["No Go experience"],
      },
      resumeMatchAt: new Date().toISOString(),
    };
    mockGenerateMatch.mockResolvedValue(updated);

    render(<Harness initial={job} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Check match/ }),
    );

    expect(mockGenerateMatch).toHaveBeenCalledWith("j1");
    expect(await screen.findByText("82")).toBeInTheDocument();
    expect(screen.getByText("strong match")).toBeInTheDocument();
    expect(screen.getByText("Strong overlap on the core stack.")).toBeInTheDocument();
    expect(screen.getByText("5 years of React")).toBeInTheDocument();
    expect(screen.getByText("No Go experience")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Match checked");
  });

  it("shows a hint when AI matching isn't set up on the server", async () => {
    mockGetMe.mockResolvedValue(authUser(true));
    mockGenerateMatch.mockRejectedValue(new ApiError("not configured", 503));

    render(<MatchCard job={job} onUpdated={vi.fn()} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Check match/ }),
    );

    expect(
      await screen.findByText(/AI matching isn.t set up/i),
    ).toBeInTheDocument();
  });

  it("tells the user to slow down on a 429", async () => {
    mockGetMe.mockResolvedValue(authUser(true));
    mockGenerateMatch.mockRejectedValue(new ApiError("rate limited", 429));

    render(<MatchCard job={job} onUpdated={vi.fn()} />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Check match/ }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Slow down a moment, then try again.",
    );
  });

  it("offers a re-check once a score exists", async () => {
    mockGetMe.mockResolvedValue(authUser(true));
    const withMatch: Job = {
      ...job,
      resumeMatch: {
        score: 40,
        band: "weak",
        summary: "Limited overlap.",
        strengths: [],
        gaps: ["No backend experience"],
      },
      resumeMatchAt: new Date().toISOString(),
    };

    render(<MatchCard job={withMatch} onUpdated={vi.fn()} />);

    expect(await screen.findByText("40")).toBeInTheDocument();
    expect(screen.getByText("weak match")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Re-check" }),
    ).toBeInTheDocument();
  });
});
