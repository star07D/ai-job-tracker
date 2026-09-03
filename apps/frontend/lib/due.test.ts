import { describe, it, expect } from "vitest";
import { dueInfo, dueToneClass, needsAttention } from "./due";

// Fixed reference point: midday so timezone rounding can't drift the day.
const NOW = new Date("2026-09-03T12:00:00.000Z");

describe("dueInfo", () => {
  it("marks a past date as overdue with a day count", () => {
    expect(dueInfo("2026-08-31T00:00:00.000Z", NOW)).toEqual({
      tone: "overdue",
      days: -3,
      label: "3 days overdue",
    });
  });

  it("uses the singular for one day overdue", () => {
    expect(dueInfo("2026-09-02T09:00:00.000Z", NOW).label).toBe("1 day overdue");
  });

  it("treats any time today as due today", () => {
    const info = dueInfo("2026-09-03T23:30:00.000Z", NOW);
    expect(info.tone).toBe("today");
    expect(info.label).toBe("Due today");
    expect(info.days).toBe(0);
  });

  it("labels tomorrow explicitly", () => {
    expect(dueInfo("2026-09-04T00:00:00.000Z", NOW)).toMatchObject({
      tone: "soon",
      label: "Due tomorrow",
    });
  });

  it("counts days for the rest of the week", () => {
    expect(dueInfo("2026-09-09T00:00:00.000Z", NOW)).toMatchObject({
      tone: "soon",
      label: "Due in 6 days",
    });
  });

  it("shows a date once it is more than a week out", () => {
    const info = dueInfo("2026-10-15T00:00:00.000Z", NOW);
    expect(info.tone).toBe("later");
    expect(info.label).toBe("Due 15 Oct");
  });
});

describe("needsAttention", () => {
  it("is true for overdue and due-today", () => {
    expect(needsAttention("2026-08-01T00:00:00.000Z", NOW)).toBe(true);
    expect(needsAttention("2026-09-03T18:00:00.000Z", NOW)).toBe(true);
  });

  it("is false for future dates and missing values", () => {
    expect(needsAttention("2026-09-04T00:00:00.000Z", NOW)).toBe(false);
    expect(needsAttention(null, NOW)).toBe(false);
    expect(needsAttention(undefined, NOW)).toBe(false);
  });
});

describe("dueToneClass", () => {
  it("maps each tone to a class string", () => {
    expect(dueToneClass("overdue")).toContain("st-rejected");
    expect(dueToneClass("today")).toContain("st-interview");
    expect(dueToneClass("soon")).toBe("text-fg-muted");
    expect(dueToneClass("later")).toBe("text-fg-subtle");
  });
});
