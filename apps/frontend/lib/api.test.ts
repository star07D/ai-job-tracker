import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiError, createJob, generatePrep, getJobs } from "./api";

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

/** Minimal in-memory Storage so the SUT and the test share one object. */
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
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("localStorage", memStorage());
  fetchMock.mockReset();
  // Keep the 401 handler off the navigation path (it early-returns on /login).
  window.history.pushState({}, "", "/login");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("apiFetch (via the exported wrappers)", () => {
  it("attaches the bearer token from localStorage", async () => {
    localStorage.setItem("token", "tok-123");
    fetchMock.mockResolvedValue(jsonResponse([]));

    await getJobs();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/jobs$/);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok-123",
    );
  });

  it("omits Authorization when there is no token", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await getJobs();
    const [, init] = fetchMock.mock.calls[0];
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("sends the body as JSON for a create", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "j1" }));
    await createJob({
      title: "Dev",
      company: "Acme",
      status: "Applied",
    } as Parameters<typeof createJob>[0]);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      title: "Dev",
      company: "Acme",
    });
  });

  it("joins an array error message into one string", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { message: ["title must be a string", "company must be a string"] },
        { ok: false, status: 400 },
      ),
    );

    await expect(getJobs()).rejects.toMatchObject({
      message: "title must be a string, company must be a string",
      status: 400,
    });
    await expect(getJobs()).rejects.toBeInstanceOf(ApiError);
  });

  it("clears the stored session on a 401", async () => {
    localStorage.setItem("token", "tok-123");
    localStorage.setItem("user", '{"id":"u1"}');
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Unauthorized" }, { ok: false, status: 401 }),
    );

    await expect(getJobs()).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("turns a timeout abort into a 408 ApiError", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const pending = generatePrep("j1");
    const assertion = expect(pending).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;
  });
});
