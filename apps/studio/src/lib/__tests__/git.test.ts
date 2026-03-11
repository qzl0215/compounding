import { describe, expect, it } from "vitest";
import { getGitHistory, getGitStatus } from "../git";

describe("git helpers", () => {
  it("return serializable values even when the repo is not committed yet", () => {
    expect(Array.isArray(getGitHistory())).toBe(true);
    expect(typeof getGitStatus()).toBe("string");
  });
});
