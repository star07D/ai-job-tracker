import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsDialog } from "./SettingsDialog";
import {
  ApiError,
  disableSharing,
  enableSharing,
  getMe,
  removeResume,
  updateEmailDigest,
  uploadResume,
} from "@/lib/api";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getMe: vi.fn(),
  updateEmailDigest: vi.fn(),
  enableSharing: vi.fn(),
  disableSharing: vi.fn(),
  uploadResume: vi.fn(),
  removeResume: vi.fn(),
}));
const mockGetMe = vi.mocked(getMe);
const mockUpdate = vi.mocked(updateEmailDigest);
const mockEnableSharing = vi.mocked(enableSharing);
const mockDisableSharing = vi.mocked(disableSharing);
const mockUploadResume = vi.mocked(uploadResume);
const mockRemoveResume = vi.mocked(removeResume);

/** Minimal in-memory Storage — happy-dom's bare `localStorage` global is flaky
 * on Node 25 (see lib/api.test.ts), and updateStoredUser() touches it. */
function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

beforeEach(() => {
  toast.error.mockReset();
  toast.success.mockReset();
  mockGetMe.mockReset();
  mockUpdate.mockReset();
  mockEnableSharing.mockReset();
  mockDisableSharing.mockReset();
  mockUploadResume.mockReset();
  mockRemoveResume.mockReset();
  vi.stubGlobal("localStorage", memStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<SettingsDialog />", () => {
  it("loads the current preference and email when opened", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      emailDigestEnabled: false,
      shareToken: null,
    });

    render(<SettingsDialog open onClose={vi.fn()} />);

    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Daily email digest" }),
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("switch", { name: "Public share link" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("toggles the digest on and reports success", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
    });
    mockUpdate.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: true,
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    await userEvent.click(screen.getByRole("switch", { name: "Daily email digest" }));

    expect(mockUpdate).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Daily email digest" }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it("reverts the toggle and warns when saving fails", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
    });
    mockUpdate.mockRejectedValue(new Error("network down"));

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    await userEvent.click(screen.getByRole("switch", { name: "Daily email digest" }));

    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Daily email digest" }),
      ).toHaveAttribute("aria-checked", "false"),
    );
    expect(toast.error).toHaveBeenCalledWith("network down");
  });

  it("turns the share link on and shows the URL", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
    });
    mockEnableSharing.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      shareToken: "abc123",
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    await userEvent.click(screen.getByRole("switch", { name: "Public share link" }));

    expect(mockEnableSharing).toHaveBeenCalled();
    expect(await screen.findByDisplayValue(/\/share\/abc123$/)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Share link turned on");
  });

  it("turns the share link off", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: "abc123",
    });
    mockDisableSharing.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      shareToken: null,
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByDisplayValue(/\/share\/abc123$/);

    await userEvent.click(screen.getByRole("switch", { name: "Public share link" }));

    expect(mockDisableSharing).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByDisplayValue(/\/share\//)).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("Share link turned off");
  });

  it("regenerates the link with a fresh token", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: "abc123",
    });
    mockEnableSharing.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      shareToken: "fresh456",
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByDisplayValue(/\/share\/abc123$/);

    await userEvent.click(screen.getByRole("button", { name: "Regenerate link" }));

    expect(mockEnableSharing).toHaveBeenCalled();
    expect(await screen.findByDisplayValue(/\/share\/fresh456$/)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      "New link generated — the old one no longer works.",
    );
  });

  it("shows the résumé filename when one is already on file", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
      hasResume: true,
      resumeFileName: "ada-cv.pdf",
      resumeUpdatedAt: new Date().toISOString(),
    });

    render(<SettingsDialog open onClose={vi.fn()} />);

    expect(await screen.findByText("ada-cv.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove résumé" }),
    ).toBeInTheDocument();
  });

  it("uploads a résumé and shows the filename", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
      hasResume: false,
    });
    mockUploadResume.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      hasResume: true,
      resumeFileName: "resume.pdf",
      resumeUpdatedAt: new Date().toISOString(),
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    const file = new File(["%PDF-1.4"], "resume.pdf", {
      type: "application/pdf",
    });
    await userEvent.upload(screen.getByLabelText("Résumé file"), file);

    expect(mockUploadResume).toHaveBeenCalledWith(file);
    expect(await screen.findByText("resume.pdf")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Résumé uploaded");
  });

  it("shows the server's error when the upload is rejected", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
      hasResume: false,
    });
    mockUploadResume.mockRejectedValue(
      new ApiError("Couldn't read that file — it may be scanned.", 400),
    );

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    const file = new File(["not a pdf"], "resume.pdf", {
      type: "application/pdf",
    });
    await userEvent.upload(screen.getByLabelText("Résumé file"), file);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't read that file — it may be scanned.",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Remove résumé" }),
    ).not.toBeInTheDocument();
  });

  it("removes the résumé", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
      shareToken: null,
      hasResume: true,
      resumeFileName: "ada-cv.pdf",
      resumeUpdatedAt: new Date().toISOString(),
    });
    mockRemoveResume.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      hasResume: false,
    });

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada-cv.pdf");

    await userEvent.click(
      screen.getByRole("button", { name: "Remove résumé" }),
    );

    expect(mockRemoveResume).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText("ada-cv.pdf")).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledWith("Résumé removed");
  });
});
