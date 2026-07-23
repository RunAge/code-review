export interface HunkProgressInput {
  filePath: string;
  isViewed: boolean;
}

export interface FileProgress {
  filePath: string;
  reviewed: number;
  total: number;
}

export function buildFileTreeProgress(hunks: HunkProgressInput[]): FileProgress[] {
  const byFile = new Map<string, FileProgress>();

  for (const hunk of hunks) {
    const entry = byFile.get(hunk.filePath) ?? {
      filePath: hunk.filePath,
      reviewed: 0,
      total: 0
    };

    entry.total += 1;
    if (hunk.isViewed) {
      entry.reviewed += 1;
    }

    byFile.set(hunk.filePath, entry);
  }

  return Array.from(byFile.values()).sort((a, b) => a.filePath.localeCompare(b.filePath));
}
