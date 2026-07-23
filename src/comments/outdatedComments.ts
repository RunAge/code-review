export interface OutdatedComment {
  id: number;
  path: string;
  line: number;
  outdated: boolean;
  patchId: string;
  body: string;
}

export interface CurrentHunkRef {
  patchId: string;
  filePath: string;
  startLine: number;
}

export interface OutdatedRemapResult {
  remapped: OutdatedComment[];
  unresolved: OutdatedComment[];
}

export function remapOutdatedComments(
  comments: OutdatedComment[],
  currentHunks: CurrentHunkRef[]
): OutdatedRemapResult {
  const byPatchId = new Map(currentHunks.map((hunk) => [hunk.patchId, hunk]));

  const remapped: OutdatedComment[] = [];
  const unresolved: OutdatedComment[] = [];

  for (const comment of comments) {
    if (!comment.outdated) {
      remapped.push(comment);
      continue;
    }

    const target = byPatchId.get(comment.patchId);
    if (!target) {
      unresolved.push(comment);
      continue;
    }

    remapped.push({
      ...comment,
      path: target.filePath,
      line: target.startLine,
      outdated: false,
    });
  }

  return { remapped, unresolved };
}
