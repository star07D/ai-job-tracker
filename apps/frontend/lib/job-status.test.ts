import { describe, it, expect } from "vitest";
import { JOB_STATUSES, STATUS_STYLES, statusStyle } from "./job-status";

describe("statusStyle", () => {
  it("returns the defined style for every known status", () => {
    for (const status of JOB_STATUSES) {
      expect(statusStyle(status)).toBe(STATUS_STYLES[status]);
    }
  });

  it("falls back to a neutral style for an unknown status", () => {
    const s = statusStyle("Ghosted");
    expect(s.badge).toContain("text-fg-subtle");
    expect(s.dot).toBe("bg-fg-subtle");
  });
});
