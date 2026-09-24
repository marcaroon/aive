import { describe, expect, it } from "vitest";
import {
  average,
  computeCycleLengths,
  countFrequency,
  cycleVariability,
  daysBetween,
  groupPeriodDays,
  recentValues,
} from "./calculations";

describe("daysBetween", () => {
  it("counts calendar days between two date keys", () => {
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(daysBetween("2026-01-08", "2026-01-01")).toBe(-7);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("handles month and year boundaries", () => {
    expect(daysBetween("2025-12-28", "2026-01-04")).toBe(7);
  });
});

describe("computeCycleLengths", () => {
  it("returns the gaps between consecutive period starts", () => {
    expect(computeCycleLengths(["2026-01-01", "2026-01-29", "2026-02-26"])).toEqual([28, 28]);
  });

  it("sorts unordered input before measuring", () => {
    expect(computeCycleLengths(["2026-02-26", "2026-01-01", "2026-01-29"])).toEqual([28, 28]);
  });

  it("drops implausible gaps so a typo cannot poison the average", () => {
    // 2 days apart is too short, 200 days apart is too long.
    expect(computeCycleLengths(["2026-01-01", "2026-01-03", "2026-01-31"])).toEqual([28]);
    expect(computeCycleLengths(["2026-01-01", "2026-07-20"])).toEqual([]);
  });

  it("returns nothing when there is only one recorded start", () => {
    expect(computeCycleLengths(["2026-01-01"])).toEqual([]);
  });
});

describe("groupPeriodDays", () => {
  it("groups consecutive days into one span", () => {
    expect(groupPeriodDays(["2026-01-01", "2026-01-02", "2026-01-03"])).toEqual([
      { start: "2026-01-01", end: "2026-01-03", duration: 3 },
    ]);
  });

  it("starts a new span when there is a gap of more than one day", () => {
    const spans = groupPeriodDays([
      "2026-01-01",
      "2026-01-02",
      "2026-01-29",
      "2026-01-30",
      "2026-01-31",
    ]);
    expect(spans).toEqual([
      { start: "2026-01-01", end: "2026-01-02", duration: 2 },
      { start: "2026-01-29", end: "2026-01-31", duration: 3 },
    ]);
  });

  it("removes duplicates and copes with unordered input", () => {
    expect(groupPeriodDays(["2026-01-02", "2026-01-01", "2026-01-02"])).toEqual([
      { start: "2026-01-01", end: "2026-01-02", duration: 2 },
    ]);
  });

  it("returns an empty list for no data", () => {
    expect(groupPeriodDays([])).toEqual([]);
  });
});

describe("cycleVariability", () => {
  it("is zero for perfectly regular cycles", () => {
    expect(cycleVariability([28, 28, 28])).toBe(0);
  });

  it("is zero when there is not enough history to compare", () => {
    expect(cycleVariability([28])).toBe(0);
  });

  it("grows with spread", () => {
    expect(cycleVariability([26, 28, 30, 32])).toBeGreaterThan(0);
  });
});

describe("recentValues and average", () => {
  it("keeps at most the last six values", () => {
    expect(recentValues([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it("returns null for an empty average", () => {
    expect(average([])).toBeNull();
  });
});

describe("countFrequency", () => {
  it("orders by count, then alphabetically", () => {
    expect(countFrequency(["cramps", "acne", "cramps", "bloating", "acne", "cramps"])).toEqual([
      { value: "cramps", count: 3 },
      { value: "acne", count: 2 },
      { value: "bloating", count: 1 },
    ]);
  });
});
