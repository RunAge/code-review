import { describe, expect, it } from "vitest";

import { remapOutdatedComments } from "../../src/comments/outdatedComments";

describe("outdated comments", () => {
  it("reattaches outdated comments based on patch-id", () => {
    const comments = [
      {
        id: 7,
        path: "src/a.ts",
        line: 10,
        outdated: true,
        patchId: "hash_1",
        body: "still relevant",
      },
      {
        id: 8,
        path: "src/b.ts",
        line: 2,
        outdated: true,
        patchId: "hash_missing",
        body: "old thread",
      },
    ];

    const currentHunks = [
      { patchId: "hash_1", filePath: "src/a.ts", startLine: 30 },
    ];

    const result = remapOutdatedComments(comments, currentHunks);

    expect(result.remapped).toHaveLength(1);
    expect(result.remapped[0].line).toBe(30);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0].id).toBe(8);
  });
});
