import { describe, expect, it } from "vitest";

import { assembleReviewData } from "../../src/review/reviewAssembler";

describe("assembleReviewData", () => {
  it("marks hunks as viewed based on patch-id set", () => {
    const result = assembleReviewData({
      files: [
        {
          oldPath: "src/a.ts",
          newPath: "src/a.ts",
          hunks: [
            {
              header: "@@ -1 +1 @@",
              patchId: "hash_1",
              lines: [{ type: "added", content: "+const x = 1;", newLineNumber: 1, oldLineNumber: null }]
            }
          ]
        }
      ],
      viewedPatchIds: new Set(["hash_1"])
    });

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].isViewed).toBe(true);
  });
});
