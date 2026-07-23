import { describe, expect, it } from "vitest";

import {
  buildReviewPageState,
  flattenReviewHunks,
  type ParsedReviewFile,
} from "../../src/composables/reviewPageModel";

const files: ParsedReviewFile[] = [
  {
    newPath: "src/a.ts",
    hunks: [
      {
        patchId: "a1",
        header: "@@ -1 +1 @@",
        lines: [{ type: "added", content: "+const x = 1;" }],
      },
      {
        patchId: "a2",
        header: "@@ -2 +2 @@",
        lines: [{ type: "added", content: "+const y = 2;" }],
      },
    ],
  },
  {
    newPath: "src/types.gen.ts",
    hunks: [
      {
        patchId: "g1",
        header: "@@ -0,0 +1 @@",
        lines: [{ type: "added", content: "+type T = string;" }],
      },
    ],
  },
];

describe("reviewPageModel", () => {
  it("filters AI noise files from visible list", () => {
    const state = buildReviewPageState(files);

    expect(state.visibleFiles.map((f) => f.newPath)).toEqual(["src/a.ts"]);
    expect(state.noiseFiles.map((f) => f.newPath)).toEqual([
      "src/types.gen.ts",
    ]);
  });

  it("flattens hunks with file metadata for store navigation", () => {
    const flat = flattenReviewHunks(files);

    expect(flat).toHaveLength(3);
    expect(flat[0].filePath).toBe("src/a.ts");
    expect(flat[0].patchId).toBe("a1");
    expect(flat[2].filePath).toBe("src/types.gen.ts");
  });
});
