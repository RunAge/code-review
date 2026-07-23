import { describe, expect, it } from "vitest";

import { detectCommentAuthorType } from "../../src/comments/botDetection";

describe("bot detection", () => {
  it("detects bot and human authors", () => {
    expect(detectCommentAuthorType({ login: "alice", type: "User" })).toBe(
      "human"
    );
    expect(
      detectCommentAuthorType({ login: "dependabot[bot]", type: "Bot" })
    ).toBe("bot");
    expect(detectCommentAuthorType({ login: "copilot", type: "User" })).toBe(
      "bot"
    );
  });
});
