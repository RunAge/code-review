import { describe, expect, it } from "vitest";

import { matchViewedHunksAfterRebase } from "../../src/engine/rebaseMatching";

describe("rebase matching", () => {
  it("preserves viewed state for unchanged hunks after force-push", () => {
    const viewedPatchIds = new Set(["hash_a", "hash_c"]);

    const newDiffHunks = [
      { filePath: "src/a.ts", patchId: "hash_a" },
      { filePath: "src/a.ts", patchId: "hash_b" },
      { filePath: "src/c.ts", patchId: "hash_c" },
    ];

    const result = matchViewedHunksAfterRebase({
      viewedPatchIds,
      newDiffHunks,
    });

    expect(result.map((item) => item.isViewed)).toEqual([true, false, true]);
  });
});
