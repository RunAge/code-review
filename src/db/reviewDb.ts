import Dexie, { type EntityTable } from "dexie";

export interface ReviewRecord {
  id?: number;
  prId: number;
  owner: string;
  repo: string;
  title: string;
  createdAt: number;
}

export interface ViewedHunkRecord {
  id?: number;
  prId: number;
  filePath: string;
  patchId: string;
  timestamp: number;
}

interface ReviewDbSchema {
  reviews: EntityTable<ReviewRecord, "id">;
  viewedHunks: EntityTable<ViewedHunkRecord, "id">;
}

class ReviewDb extends Dexie {
  reviews!: ReviewDbSchema["reviews"];
  viewedHunks!: ReviewDbSchema["viewedHunks"];

  constructor() {
    super("codeReviewDb");

    this.version(1).stores({
      reviews: "++id, prId, owner, repo, createdAt",
      viewedHunks: "++id, [prId+patchId], prId, filePath, patchId, timestamp"
    });
  }
}

const db = new ReviewDb();

export async function createReview(input: {
  prId: number;
  owner: string;
  repo: string;
  title: string;
}): Promise<number | undefined> {
  return db.reviews.add({
    ...input,
    createdAt: Date.now()
  });
}

export async function markHunkViewed(input: {
  prId: number;
  filePath: string;
  patchId: string;
}): Promise<void> {
  const existing = await db.viewedHunks.where("[prId+patchId]").equals([input.prId, input.patchId]).first();

  if (existing?.id) {
    await db.viewedHunks.update(existing.id, {
      filePath: input.filePath,
      timestamp: Date.now()
    });
    return;
  }

  await db.viewedHunks.add({
    ...input,
    timestamp: Date.now()
  });
}

export async function unmarkHunkViewed(prId: number, patchId: string): Promise<void> {
  const existing = await db.viewedHunks.where("[prId+patchId]").equals([prId, patchId]).first();
  if (existing?.id) {
    await db.viewedHunks.delete(existing.id);
  }
}

export async function isHunkViewed(prId: number, patchId: string): Promise<boolean> {
  const row = await db.viewedHunks.where("[prId+patchId]").equals([prId, patchId]).first();
  return Boolean(row);
}

export async function listViewedHunks(prId: number): Promise<ViewedHunkRecord[]> {
  return db.viewedHunks.where("prId").equals(prId).toArray();
}

export async function listViewedPatchIds(prId: number): Promise<Set<string>> {
  const rows = await listViewedHunks(prId);
  return new Set(rows.map((row) => row.patchId));
}

export async function clearReviewData(): Promise<void> {
  await db.transaction("rw", db.reviews, db.viewedHunks, async () => {
    await db.reviews.clear();
    await db.viewedHunks.clear();
  });
}
