import type { DiffFile, DiffLine } from "../workers/diff/types";

export interface ParsedHunkWithPatchId {
  header: string;
  patchId: string;
  lines: DiffLine[];
}

export interface ParsedFileWithPatchId extends Omit<DiffFile, "hunks"> {
  hunks: ParsedHunkWithPatchId[];
}

export interface ReviewHunkItem {
  filePath: string;
  patchId: string;
  header: string;
  lines: DiffLine[];
  isViewed: boolean;
}

export function assembleReviewData(input: {
  files: ParsedFileWithPatchId[];
  viewedPatchIds: Set<string>;
}) {
  const hunks: ReviewHunkItem[] = input.files.flatMap((file) =>
    file.hunks.map((hunk) => ({
      filePath: file.newPath,
      patchId: hunk.patchId,
      header: hunk.header,
      lines: hunk.lines,
      isViewed: input.viewedPatchIds.has(hunk.patchId),
    }))
  );

  return { hunks };
}
