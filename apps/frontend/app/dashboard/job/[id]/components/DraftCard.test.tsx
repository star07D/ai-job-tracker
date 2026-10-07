import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DraftCard } from "./DraftCard";
import { ApiError, generateDraft } from "@/lib/api";
import type { Job } from "@/lib/types";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  generateDraft: vi.fn(),
}));
const mockGenerate = vi.mocked(generateDraft);

beforeEach(() => {
  toast.error.mockReset();
  toast.success.mockReset();
  mockGenerate.mockReset();
});

const job: Job = {
  id: "j1",
  title: "Backend Engineer",
  company: "Acme",
  status: "Interview",
  appliedDate: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  statusChangedAt: "2026-09-01T00:00:00.000Z",
  tags: [],
  archived: false,
  contactName: "Priya Shah",
  contactEmail: "priya@acme.example",
};

describe("<DraftCard />", () => {
  it("offers the three draft types and mentions the contact", () => {
    render(<DraftCard job={job} />);

    expect(screen.getByRole("button", { name: "Follow-up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thank-you" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cover letter" })).toBeInTheDocument();
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
  });

  it("requests the chosen kind and shows an editable draft", async () => {
    mockGenerate.mockResolvedValue({
      subject: "Checking in on the Backend Engineer role",
      body: "Hi Priya,\n\nJust checking in.\n\nAlex",
    });
    render(<DraftCard job={job} />);

    await userEvent.click(screen.getByRole("button", { name: "Follow-up" }));

    expect(mockGenerate).toHaveBeenCalledWith("j1", "follow-up");
    const subject = await screen.findByLabelText("Subject");
    expect(subject).toHaveValue("Checking in on the Backend Engineer role");
    const body = screen.getByLabelText("Email body");
    expect(body).toHaveValue("Hi Priya,\n\nJust checking in.\n\nAlex");

    // it's a starting point — the user can rewrite it
    await userEvent.clear(body);
    await userEvent.type(body, "My own words");
    expect(body).toHaveValue("My own words");
  });

  it("regenerates with the same kind", async () => {
    mockGenerate.mockResolvedValue({ subject: "s", body: "b" });
    render(<DraftCard job={job} />);

    await userEvent.click(screen.getByRole("button", { name: "Thank-you" }));
    await userEvent.click(await screen.findByRole("button", { name: /Regenerate/ }));

    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate).toHaveBeenLastCalledWith("j1", "thank-you");
  });

  it("shows the server's message when a cover letter needs a résumé", async () => {
    mockGenerate.mockRejectedValue(
      new ApiError(
        "Upload your résumé in Settings before drafting a cover letter",
        400,
      ),
    );
    render(<DraftCard job={job} />);

    await userEvent.click(screen.getByRole("button", { name: "Cover letter" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Upload your résumé in Settings before drafting a cover letter",
    );
    expect(screen.queryByLabelText("Email body")).not.toBeInTheDocument();
  });

  it("shows a hint when AI drafting isn't set up on the server", async () => {
    mockGenerate.mockRejectedValue(new ApiError("not configured", 503));
    render(<DraftCard job={job} />);

    await userEvent.click(screen.getByRole("button", { name: "Follow-up" }));

    expect(await screen.findByText(/AI drafting isn.t set up/i)).toBeInTheDocument();
  });

  it("tells the user to slow down on a 429", async () => {
    mockGenerate.mockRejectedValue(new ApiError("rate limited", 429));
    render(<DraftCard job={job} />);

    await userEvent.click(screen.getByRole("button", { name: "Follow-up" }));

    expect(toast.error).toHaveBeenCalledWith("Slow down a moment, then try again.");
  });
});
