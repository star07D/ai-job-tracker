import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import LoginPage from "./page";
import { getAuthConfig } from "@/lib/api";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: toast }));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getAuthConfig: vi.fn(),
}));
const mockGetAuthConfig = vi.mocked(getAuthConfig);

beforeEach(() => {
  toast.error.mockReset();
  toast.success.mockReset();
  mockGetAuthConfig.mockReset();
  push.mockReset();
  window.history.pushState({}, "", "/login");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("<LoginPage />", () => {
  it('shows "Continue with Google" once the backend reports it configured', async () => {
    mockGetAuthConfig.mockResolvedValue({ googleEnabled: true });
    render(<LoginPage />);

    expect(
      await screen.findByRole("link", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("hides the Google button when it isn't configured", async () => {
    mockGetAuthConfig.mockResolvedValue({ googleEnabled: false });
    render(<LoginPage />);

    await screen.findByLabelText("Email");
    expect(
      screen.queryByRole("link", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });

  it("warns when redirected back with ?error=google", async () => {
    mockGetAuthConfig.mockResolvedValue({ googleEnabled: false });
    window.history.pushState({}, "", "/login?error=google");

    render(<LoginPage />);

    expect(toast.error).toHaveBeenCalledWith(
      "Google sign-in didn't go through. Please try again.",
    );
  });
});
