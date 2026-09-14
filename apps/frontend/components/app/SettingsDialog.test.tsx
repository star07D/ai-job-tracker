import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsDialog } from "./SettingsDialog";
import { getMe, updateEmailDigest } from "@/lib/api";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getMe: vi.fn(),
  updateEmailDigest: vi.fn(),
}));
const mockGetMe = vi.mocked(getMe);
const mockUpdate = vi.mocked(updateEmailDigest);

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
    });

    render(<SettingsDialog open onClose={vi.fn()} />);

    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("toggles the digest on and reports success", async () => {
    mockGetMe.mockResolvedValue({
      id: "u1",
      email: "ada@example.com",
      firstName: null,
      lastName: null,
      emailDigestEnabled: false,
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

    await userEvent.click(screen.getByRole("switch"));

    expect(mockUpdate).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true"),
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
    });
    mockUpdate.mockRejectedValue(new Error("network down"));

    render(<SettingsDialog open onClose={vi.fn()} />);
    await screen.findByText("ada@example.com");

    await userEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false"),
    );
    expect(toast.error).toHaveBeenCalledWith("network down");
  });
});
