import { describe, it, expect } from "vitest";
import { isStale, stageInfo, staleCount } from "./stale";

const NOW = new Date("2026-09-20T12:00:00.000Z");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe("stageInfo", () => {
  it("counts whole days in the current status", () => {
    expect(stageInfo({ status: "Applied", statusChangedAt: daysAgo(9) }, NOW).days).toBe(9);
    expect(stageInfo({ status: "Applied", statusChangedAt: daysAgo(0) }, NOW).days).toBe(0);
  });

  it("never reports negative days for a future timestamp", () => {
    expect(
      stageInfo({ status: "Applied", statusChangedAt: daysAgo(-3) }, NOW).days,
    ).toBe(0);
  });

  it("formats a compact and a spelled-out label", () => {
    const d3 = stageInfo({ status: "Applied", statusChangedAt: daysAgo(3) }, NOW);
    expect(d3.label).toBe("3d");
    expect(d3.longLabel).toBe("3 days");

    const w2 = stageInfo({ status: "Applied", statusChangedAt: daysAgo(15) }, NOW);
    expect(w2.label).toBe("2w");
    expect(w2.longLabel).toBe("2 weeks");

    const m2 = stageInfo({ status: "Applied", statusChangedAt: daysAgo(60) }, NOW);
    expect(m2.label).toBe("2mo");
    expect(m2.longLabel).toBe("2 months");
  });

  it("goes stale for Applied after 21 days", () => {
    expect(stageInfo({ status: "Applied", statusChangedAt: daysAgo(20) }, NOW).stale).toBe(false);
    expect(stageInfo({ status: "Applied", statusChangedAt: daysAgo(21) }, NOW).stale).toBe(true);
  });

  it("goes stale for Interview after 10 days", () => {
    expect(stageInfo({ status: "Interview", statusChangedAt: daysAgo(9) }, NOW).stale).toBe(false);
    expect(stageInfo({ status: "Interview", statusChangedAt: daysAgo(10) }, NOW).stale).toBe(true);
  });

  it("never goes stale for terminal statuses", () => {
    expect(stageInfo({ status: "Accepted", statusChangedAt: daysAgo(200) }, NOW).stale).toBe(false);
    expect(stageInfo({ status: "Rejected", statusChangedAt: daysAgo(200) }, NOW).stale).toBe(false);
  });
});

describe("isStale", () => {
  it("is true when past threshold with no follow-up scheduled", () => {
    expect(
      isStale({ status: "Applied", statusChangedAt: daysAgo(30) }, NOW),
    ).toBe(true);
  });

  it("is false once a follow-up is scheduled, however old the stage", () => {
    expect(
      isStale(
        {
          status: "Applied",
          statusChangedAt: daysAgo(90),
          nextActionDue: daysAgo(-5),
        },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("staleCount", () => {
  it("counts past-threshold jobs that have no follow-up", () => {
    const jobs = [
      { status: "Applied", statusChangedAt: daysAgo(30) }, // stale
      { status: "Applied", statusChangedAt: daysAgo(5) }, // fresh
      { status: "Interview", statusChangedAt: daysAgo(12) }, // stale
      { status: "Rejected", statusChangedAt: daysAgo(99) }, // terminal
      {
        status: "Applied",
        statusChangedAt: daysAgo(60),
        nextActionDue: daysAgo(-2),
      }, // old but has a plan
    ];
    expect(staleCount(jobs, NOW)).toBe(2);
  });
});
