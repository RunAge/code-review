import { describe, expect, it } from "vitest";

import { buildFileTreeProgress } from "../../src/components/fileTreeProgress";

describe("fileTreeProgress", () => {
  it("builds per-file reviewed counters", () => {
    const result = buildFileTreeProgress([
      { filePath: "src/a.ts", isViewed: true },
      { filePath: "src/a.ts", isViewed: false },
      { filePath: "src/b.ts", isViewed: true },
    ]);

    expect(result).toEqual([
      { filePath: "src/a.ts", reviewed: 1, total: 2 },
      { filePath: "src/b.ts", reviewed: 1, total: 1 },
    ]);
  });
});
