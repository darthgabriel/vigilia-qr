import { describe, expect, it } from "vitest";
import { assign, groupSizes, pickSmallest, shuffle } from "../shared/balance";

const TOPICS = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];

describe("shuffle", () => {
  it("keeps all items", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input).sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("assign", () => {
  it("assigns everyone to a topic", () => {
    const names = Array.from({ length: 23 }, (_, i) => `p${i}`);
    const result = assign(names, TOPICS);
    expect(result).toHaveLength(23);
    expect(result.every((a) => a.topicId !== null)).toBe(true);
    expect(new Set(result.map((a) => a.name)).size).toBe(23);
  });

  it("balances group sizes within 1", () => {
    for (const total of [8, 17, 23, 40, 51]) {
      const names = Array.from({ length: total }, (_, i) => `p${i}`);
      const result = assign(names, TOPICS);
      const counts = TOPICS.map((t) => result.filter((a) => a.topicId === t).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it("returns null topics when no topics exist", () => {
    const result = assign(["a", "b"], []);
    expect(result.every((a) => a.topicId === null)).toBe(true);
  });

  it("handles fewer people than topics", () => {
    const result = assign(["a", "b"], TOPICS);
    expect(result).toHaveLength(2);
    expect(new Set(result.map((a) => a.topicId)).size).toBe(2);
  });
});

describe("groupSizes", () => {
  it("splits remainder evenly", () => {
    expect(groupSizes(23, 8)).toEqual([3, 3, 3, 3, 3, 3, 3, 2]);
    expect(groupSizes(8, 8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(groupSizes(0, 3)).toEqual([0, 0, 0]);
    expect(groupSizes(5, 0)).toEqual([]);
  });
});

describe("pickSmallest", () => {
  const TOPICS = ["a", "b", "c"];

  it("picks the group with fewest members", () => {
    const counts = new Map([
      ["a", 5],
      ["b", 2],
      ["c", 4],
    ]);
    expect(pickSmallest(TOPICS, counts)).toBe("b");
  });

  it("treats missing counts as zero", () => {
    const counts = new Map([["a", 3]]);
    const pick = pickSmallest(TOPICS, counts);
    expect(["b", "c"]).toContain(pick);
  });

  it("returns null when there are no topics", () => {
    expect(pickSmallest([], new Map())).toBeNull();
  });

  it("stays balanced over sequential registrations", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const pick = pickSmallest(TOPICS, counts);
      expect(pick).not.toBeNull();
      counts.set(pick!, (counts.get(pick!) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });
});
