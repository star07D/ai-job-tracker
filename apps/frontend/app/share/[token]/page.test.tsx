import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import SharePage from "./page";
import { getPublicShare } from "@/lib/api";
import { ApiError } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ token: "abc123" }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getPublicShare: vi.fn(),
}));
const mockGetShare = vi.mocked(getPublicShare);

beforeEach(() => {
  mockGetShare.mockReset();
});

describe("<SharePage />", () => {
  it("renders the pipeline stats and job list", async () => {
    mockGetShare.mockResolvedValue({
      displayName: "Ada",
      trackingSince: "2026-01-01T00:00:00.000Z",
      jobs: [
        {
          title: "Staff Engineer",
          company: "Vercel",
          status: "Interview",
          location: "Remote",
          appliedDate: "2026-01-05T00:00:00.000Z",
          tags: ["remote"],
        },
        {
          title: "Backend Engineer",
          company: "Supabase",
          status: "Applied",
          location: null,
          appliedDate: "2026-02-01T00:00:00.000Z",
          tags: [],
        },
      ],
    });

    render(<SharePage />);

    expect(await screen.findByText("Ada's job search")).toBeInTheDocument();
    expect(screen.getByText("Staff Engineer")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText(/2 applications/)).toBeInTheDocument();
    expect(screen.getByText(/tracking since 1 Jan 2026/)).toBeInTheDocument();
  });

  it("never renders salary, notes or contact fields even if present in the API response", async () => {
    mockGetShare.mockResolvedValue({
      displayName: "Ada",
      trackingSince: null,
      jobs: [
        {
          title: "Staff Engineer",
          company: "Vercel",
          status: "Applied",
          location: "Remote",
          appliedDate: "2026-01-05T00:00:00.000Z",
          tags: [],
          // @ts-expect-error asserting these never render even if a
          // misbehaving backend included them
          salary: "$200k",
          notes: "secret notes",
          contactEmail: "recruiter@vercel.com",
        },
      ],
    });

    render(<SharePage />);

    await screen.findByText("Staff Engineer");
    expect(screen.queryByText("$200k")).not.toBeInTheDocument();
    expect(screen.queryByText("secret notes")).not.toBeInTheDocument();
    expect(screen.queryByText("recruiter@vercel.com")).not.toBeInTheDocument();
  });

  it("shows a friendly message for an invalid or disabled link", async () => {
    mockGetShare.mockRejectedValue(
      new ApiError("This share link is invalid or has been turned off", 404),
    );

    render(<SharePage />);

    expect(await screen.findByText("Link not found")).toBeInTheDocument();
    expect(
      screen.getByText("This share link is invalid or has been turned off"),
    ).toBeInTheDocument();
  });
});
