import { beforeEach, describe, expect, it } from "vitest";

import {
  clearReviewData,
  createReview,
  isHunkViewed,
  listViewedHunks,
  markHunkViewed,
  unmarkHunkViewed,
} from "../../src/db/reviewDb";

describe("reviewDb", () => {
  beforeEach(async () => {
    await clearReviewData();
  });

  it("creates review entry and marks hunk as viewed", async () => {
    await createReview({
      prId: 101,
      owner: "acme",
      repo: "tool",
      title: "PR 101",
    });
    await markHunkViewed({
      prId: 101,
      filePath: "src/a.ts",
      patchId: "hash_1",
    });

    expect(await isHunkViewed(101, "hash_1")).toBe(true);

    const viewed = await listViewedHunks(101);
    expect(viewed).toHaveLength(1);
    expect(viewed[0].filePath).toBe("src/a.ts");
  });

  it("supports unmarking hunk as viewed", async () => {
    await markHunkViewed({
      prId: 202,
      filePath: "src/b.ts",
      patchId: "hash_2",
    });
    expect(await isHunkViewed(202, "hash_2")).toBe(true);

    await unmarkHunkViewed(202, "hash_2");
    expect(await isHunkViewed(202, "hash_2")).toBe(false);
  });
});
