import { describe, expect, it } from "vitest";
import { buildHistoricalEstimates } from "./history-estimates";
import { predictCycle } from "./prediction";
import { buildDayInfo } from "@/components/calendar/cycle-calendar";

describe("historical calendar estimates", () => {
  it("keeps past ovulation dates when a new period is added", () => {
    const previous = buildHistoricalEstimates(["2026-01-01", "2026-01-29"]);
    const next = buildHistoricalEstimates([
      "2026-01-01",
      "2026-01-29",
      "2026-02-26",
    ]);
    expect(next[0]).toEqual(previous[0]);
    expect(next.map((entry) => entry.predictedOvulation)).toEqual([
      "2026-01-14",
      "2026-02-11",
    ]);
  });

  it("uses each recorded cycle length rather than applying today's average to all history", () => {
    const result = buildHistoricalEstimates([
      "2026-07-12",
      "2026-08-16",
      "2026-09-05",
    ]);
    expect(result.map((entry) => entry.predictedOvulation)).toEqual([
      "2026-08-01",
      "2026-08-21",
    ]);
    expect(result[1].fertileWindow.start).toBe("2026-08-16");
  });

  it("handles year and leap-month boundaries, sorting and deduplicating inputs", () => {
    expect(
      buildHistoricalEstimates(["2026-01-07", "2025-12-10", "2025-12-10"])[0]
        .predictedOvulation,
    ).toBe("2025-12-23");
    expect(
      buildHistoricalEstimates(["2024-02-16", "2024-03-15"])[0]
        .predictedOvulation,
    ).toBe("2024-02-29");
  });

  it("does not invent cycles before records or inside missing months", () => {
    expect(buildHistoricalEstimates([])).toEqual([]);
    expect(buildHistoricalEstimates(["2026-01-01"])).toEqual([]);
    const result = buildHistoricalEstimates(["2026-01-01", "2026-06-01"], 30);
    expect(result).toHaveLength(1);
    expect(result[0].predictedOvulation).toBe("2026-01-16");
  });

  it("does not carry a fallback estimate past a closely spaced next period", () => {
    expect(buildHistoricalEstimates(["2026-01-01", "2026-01-08"])).toEqual([]);
  });

  it("renders historical ovulation and fertile markers alongside the current cycle", () => {
    const historical = buildHistoricalEstimates(["2026-01-01", "2026-01-29"]);
    const current = predictCycle({
      lastPeriodStart: "2026-01-29",
      cycleLengths: [28],
      periodDurations: [5],
    });
    const marker = (date: string) =>
      buildDayInfo(date, new Set(), new Set(), current, historical).marker;
    expect(marker("2026-01-14")).toBe("ovulation");
    expect(marker("2026-01-09")).toBe("fertile");
    expect(marker("2026-02-11")).toBe("ovulation");
    expect(marker("2025-12-14")).toBe("none");
    expect(marker("2026-01-29")).toBe("none");
  });

  it("preserves both recorded periods and ovulation when their dates overlap", () => {
    const history = buildHistoricalEstimates(["2026-08-16", "2026-09-05"]);
    expect(
      buildDayInfo(
        "2026-08-21",
        new Set(["2026-08-21"]),
        new Set(["2026-08-21"]),
        null,
        history,
      ),
    ).toEqual({
      marker: "period",
      hasLog: true,
      hasOvulation: true,
    });
  });
});
