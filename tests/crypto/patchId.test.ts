import { describe, expect, it } from "vitest";

import { createPatchId, normalizePatchLines } from "../../src/workers/diff/patchId";

describe("patch-id", () => {
  it("returns same hash for identical logical change with shifted line numbers", async () => {
    const hunkA = {
      header: "@@ -10,3 +10,3 @@",
      lines: [
        { type: "removed", content: "-return a+b;" },
        { type: "added", content: "+return a + b;" }
      ]
    };

    const hunkB = {
      header: "@@ -120,3 +120,3 @@",
      lines: [
        { type: "removed", content: "-return a+b;" },
        { type: "added", content: "+return a + b;" }
      ]
    };

    expect(await createPatchId(hunkA)).toBe(await createPatchId(hunkB));
  });

  it("returns different hash when logic changes", async () => {
    const hunkA = {
      header: "@@ -1,2 +1,2 @@",
      lines: [
        { type: "removed", content: "-return sum(a, b);" },
        { type: "added", content: "+return sum(a, b) + 1;" }
      ]
    };

    const hunkB = {
      header: "@@ -1,2 +1,2 @@",
      lines: [
        { type: "removed", content: "-return sum(a, b);" },
        { type: "added", content: "+return sum(a, b);" }
      ]
    };

    expect(await createPatchId(hunkA)).not.toBe(await createPatchId(hunkB));
  });

  it("normalizes trailing spaces and empty lines", () => {
    const normalized = normalizePatchLines([
      { type: "removed", content: "-const x = 'a';   " },
      { type: "added", content: "+const x = \"a\";   " },
      { type: "context", content: " " },
      { type: "context", content: "" }
    ]);

    expect(normalized).toEqual([
      "-const x = 'a';",
      "+const x = \"a\";"
    ]);
  });
});
