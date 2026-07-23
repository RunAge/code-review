import { describe, expect, it } from "vitest";

import { filterComments } from "../../src/comments/commentFilters";

const comments = [
  { id: 1, authorType: "human", isResolved: false },
  { id: 2, authorType: "bot", isResolved: false },
  { id: 3, authorType: "human", isResolved: true }
] as const;

describe("comment filters", () => {
  it("filters by humans, bots and unresolved", () => {
    expect(filterComments(comments, "all")).toHaveLength(3);
    expect(filterComments(comments, "humans").map((c) => c.id)).toEqual([1, 3]);
    expect(filterComments(comments, "bots").map((c) => c.id)).toEqual([2]);
    expect(filterComments(comments, "unresolved").map((c) => c.id)).toEqual([1, 2]);
  });
});
