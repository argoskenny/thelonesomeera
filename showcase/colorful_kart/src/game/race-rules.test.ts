import { describe, expect, it } from "vitest";
import {
  circularDistance,
  formatRaceTime,
  lapFromProgress,
  racePositionSuffix,
  sortRankings,
  wrapProgress,
} from "./race-rules";

describe("race rules", () => {
  it("wraps progress at both ends of the circuit", () => {
    expect(wrapProgress(1.25)).toBeCloseTo(0.25);
    expect(wrapProgress(-0.1)).toBeCloseTo(0.9);
  });

  it("reports one through three laps without exposing a fourth lap", () => {
    expect(lapFromProgress(0)).toBe(1);
    expect(lapFromProgress(1.4)).toBe(2);
    expect(lapFromProgress(2.99)).toBe(3);
    expect(lapFromProgress(3)).toBe(3);
  });

  it("sorts finished racers by time and active racers by distance", () => {
    const ranking = sortRankings([
      { id: "a", name: "A", color: 0, totalProgress: 3, finishTime: 42 },
      { id: "b", name: "B", color: 0, totalProgress: 2.8, finishTime: null },
      { id: "c", name: "C", color: 0, totalProgress: 3, finishTime: 39 },
      { id: "d", name: "D", color: 0, totalProgress: 2.9, finishTime: null },
    ]);

    expect(ranking.map((racer) => racer.id)).toEqual(["c", "a", "d", "b"]);
  });

  it("handles finish-line proximity and display formatting", () => {
    expect(circularDistance(0.99, 0.01)).toBeCloseTo(0.02);
    expect(racePositionSuffix(3)).toBe("3RD");
    expect(racePositionSuffix(4)).toBe("4TH");
    expect(formatRaceTime(65.237)).toBe("1:05.24");
  });
});
