import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  EMPTY_JOB_FORM,
  formToJobInput,
  jobToForm,
  JobFormDialog,
} from "./JobFormDialog";
import { ApiError, parseJobDescription } from "@/lib/api";
import type { Job } from "@/lib/types";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  parseJobDescription: vi.fn(),
}));
const mockParse = vi.mocked(parseJobDescription);

beforeEach(() => {
  toast.error.mockReset();
  toast.success.mockReset();
  mockParse.mockReset();
});

const job: Job = {
  id: "j1",
  title: "Staff Engineer",
  company: "Vercel",
  status: "Interview",
  location: "Remote",
  salary: "",
  notes: "spoke to recruiter",
  appliedDate: "2026-08-01T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
  statusChangedAt: "2026-08-01T00:00:00.000Z",
  nextAction: "Send thank-you note",
  nextActionDue: "2026-09-10T00:00:00.000Z",
  contactName: "Priya Shah",
  contactEmail: "priya@vercel.com",
  contactLinkedin: "linkedin.com/in/priya-shah",
  tags: ["remote"],
  archived: false,
};

describe("jobToForm / formToJobInput", () => {
  it("maps a job onto form values, trimming the due date to a day", () => {
    expect(jobToForm(job)).toMatchObject({
      title: "Staff Engineer",
      company: "Vercel",
      nextAction: "Send thank-you note",
      nextActionDue: "2026-09-10",
      contactName: "Priya Shah",
      contactEmail: "priya@vercel.com",
      contactLinkedin: "linkedin.com/in/priya-shah",
    });
  });

  it("uses empty strings where the job has no contact", () => {
    const form = jobToForm({
      ...job,
      contactName: null,
      contactEmail: null,
      contactLinkedin: null,
    });
    expect(form.contactName).toBe("");
    expect(form.contactEmail).toBe("");
    expect(form.contactLinkedin).toBe("");
  });

  it("sends null for blank contact fields", () => {
    expect(formToJobInput(EMPTY_JOB_FORM)).toMatchObject({
      contactName: null,
      contactEmail: null,
      contactLinkedin: null,
    });
  });

  it("uses empty strings where the job has no follow-up", () => {
    const form = jobToForm({ ...job, nextAction: null, nextActionDue: null });
    expect(form.nextAction).toBe("");
    expect(form.nextActionDue).toBe("");
  });

  it("sends null for a blank next step and an ISO string for a set one", () => {
    expect(formToJobInput(EMPTY_JOB_FORM)).toMatchObject({
      nextAction: null,
      nextActionDue: null,
    });

    const out = formToJobInput({
      ...EMPTY_JOB_FORM,
      title: "  Dev  ",
      company: "Acme",
      nextAction: "  ping the recruiter  ",
      nextActionDue: "2026-09-10",
    });
    expect(out.title).toBe("Dev");
    expect(out.nextAction).toBe("ping the recruiter");
    expect(out.nextActionDue).toBe("2026-09-10T00:00:00.000Z");
  });

  it("round-trips a job through both functions", () => {
    const out = formToJobInput(jobToForm(job));
    expect(out).toMatchObject({
      title: "Staff Engineer",
      company: "Vercel",
      status: "Interview",
      nextAction: "Send thank-you note",
      nextActionDue: "2026-09-10T00:00:00.000Z",
      contactName: "Priya Shah",
      contactEmail: "priya@vercel.com",
      contactLinkedin: "linkedin.com/in/priya-shah",
      tags: ["remote"],
    });
  });

  it("defaults tags to an empty array when the job has none", () => {
    expect(jobToForm({ ...job, tags: [] }).tags).toEqual([]);
  });
});

describe("<JobFormDialog />", () => {
  it("renders the follow-up fields", () => {
    render(
      <JobFormDialog
        open
        initial={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Next step")).toBeInTheDocument();
    expect(screen.getByLabelText("Due")).toBeInTheDocument();
  });

  it("blocks submit and warns when role or company is missing", async () => {
    const onSubmit = vi.fn();
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Add application" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Role and company are required.");
  });

  it("autofills the form from a pasted description", async () => {
    mockParse.mockResolvedValue({
      title: "Senior Platform Engineer",
      company: "Fly.io",
      salary: "$190k–230k",
    });
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByLabelText("Paste a job description"),
      "Senior Platform Engineer at Fly.io — remote, hiring now",
    );
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));

    expect(mockParse).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Role")).toHaveValue("Senior Platform Engineer");
    expect(screen.getByLabelText("Company")).toHaveValue("Fly.io");
    expect(screen.getByLabelText("Salary")).toHaveValue("$190k–230k");
    expect(toast.success).toHaveBeenCalled();
  });

  it("shows a hint when AI autofill isn't set up on the server", async () => {
    mockParse.mockRejectedValue(new ApiError("not configured", 503));
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByLabelText("Paste a job description"),
      "some job posting text long enough to enable the button",
    );
    await userEvent.click(screen.getByRole("button", { name: "Autofill" }));

    expect(
      await screen.findByText(/autofill isn.t set up/i),
    ).toBeInTheDocument();
  });

  it("submits the entered values, including the next step", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText("Role"), "Frontend Dev");
    await userEvent.type(screen.getByLabelText("Company"), "Linear");
    await userEvent.type(
      screen.getByLabelText("Next step"),
      "Reply with availability",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add application" }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: "Frontend Dev",
      company: "Linear",
      nextAction: "Reply with availability",
    });
  });

  it("shows the server's error and stays open when saving fails", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError("property tags should not exist", 400));
    const onClose = vi.fn();
    render(
      <JobFormDialog open initial={null} onClose={onClose} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText("Role"), "Frontend Dev");
    await userEvent.type(screen.getByLabelText("Company"), "Linear");
    await userEvent.click(
      screen.getByRole("button", { name: "Add application" }),
    );

    expect(toast.error).toHaveBeenCalledWith("property tags should not exist");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Role")).toHaveValue("Frontend Dev");
  });

  it("submits the entered contact info", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText("Role"), "Frontend Dev");
    await userEvent.type(screen.getByLabelText("Company"), "Linear");
    await userEvent.type(screen.getByLabelText("Contact name"), "Priya Shah");
    await userEvent.type(
      screen.getByLabelText("Contact email"),
      "priya@linear.app",
    );
    await userEvent.type(
      screen.getByLabelText("Contact LinkedIn"),
      "linkedin.com/in/priya-shah",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add application" }),
    );

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      contactName: "Priya Shah",
      contactEmail: "priya@linear.app",
      contactLinkedin: "linkedin.com/in/priya-shah",
    });
  });

  it("adds tags on Enter and lets them be removed", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <JobFormDialog open initial={null} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText("Role"), "Frontend Dev");
    await userEvent.type(screen.getByLabelText("Company"), "Linear");
    const tagField = screen.getByLabelText("Tags");
    await userEvent.type(tagField, "remote{Enter}dream-job{Enter}");

    expect(screen.getByText("remote")).toBeInTheDocument();
    expect(screen.getByText("dream-job")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Remove tag dream-job"));
    expect(screen.queryByText("dream-job")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Add application" }),
    );
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ tags: ["remote"] });
  });
});
