import type { DiffFile, DiffHunk, DiffLine, ParsedDiff } from "./types";

function getPathFromDiffToken(token: string): string {
  if (token.startsWith("a/") || token.startsWith("b/")) {
    return token.slice(2);
  }

  return token;
}

function createLine(rawLine: string): DiffLine | null {
  if (rawLine.startsWith("+")) {
    return { type: "added", content: rawLine };
  }

  if (rawLine.startsWith("-")) {
    return { type: "removed", content: rawLine };
  }

  if (rawLine.startsWith(" ")) {
    return { type: "context", content: rawLine };
  }

  return null;
}

export function parseUnifiedDiff(rawDiff: string): ParsedDiff {
  if (!rawDiff.trim()) {
    return { files: [] };
  }

  const files: DiffFile[] = [];
  const lines = rawDiff.split(/\r?\n/);

  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const parts = line.split(" ");
      const oldPath = getPathFromDiffToken(parts[2] ?? "");
      const newPath = getPathFromDiffToken(parts[3] ?? "");

      currentFile = { oldPath, newPath, hunks: [] };
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith("@@")) {
      currentHunk = { header: line, lines: [] };
      currentFile.hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    const parsedLine = createLine(line);
    if (parsedLine) {
      currentHunk.lines.push(parsedLine);
    }
  }

  return { files };
}
