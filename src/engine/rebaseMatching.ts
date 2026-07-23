export interface RebaseHunkInput {
  filePath: string;
  patchId: string;
}

export interface RebasedHunkState extends RebaseHunkInput {
  isViewed: boolean;
}

export function matchViewedHunksAfterRebase(input: {
  viewedPatchIds: Set<string>;
  newDiffHunks: RebaseHunkInput[];
}): RebasedHunkState[] {
  return input.newDiffHunks.map((hunk) => ({
    ...hunk,
    isViewed: input.viewedPatchIds.has(hunk.patchId),
  }));
}
