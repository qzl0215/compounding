import { describe, expect, it } from "vitest";
import { getGitHistory, getGitStatus } from "../service";

describe("git health service", () => {
  it("returns serializable values", () => {
    expect(Array.isArray(getGitHistory())).toBe(true);
    expect(typeof getGitStatus()).toBe("string");
  });
});
