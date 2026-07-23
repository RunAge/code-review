import type { DiffFile, DiffHunk, DiffLine, ParsedDiff } from "./types";

function parseHunkHeader(header: string): { oldLine: number; newLine: number } {
  const match = header.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
  if (!match) {
    return { oldLine: 0, newLine: 0 };
  }

  return {
    oldLine: Number.parseInt(match[1], 10),
    newLine: Number.parseInt(match[2], 10)
  };
}

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
  let oldLine = 0;
  let newLine = 0;

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
      const parsed = parseHunkHeader(line);
      oldLine = parsed.oldLine;
      newLine = parsed.newLine;
      currentFile.hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    const parsedLine = createLine(line);
    if (parsedLine) {
      if (parsedLine.type === "removed") {
        currentHunk.lines.push({
          ...parsedLine,
          oldLineNumber: oldLine,
          newLineNumber: null
        });
        oldLine += 1;
        continue;
      }

      if (parsedLine.type === "added") {
        currentHunk.lines.push({
          ...parsedLine,
          oldLineNumber: null,
          newLineNumber: newLine
        });
        newLine += 1;
        continue;
      }

      currentHunk.lines.push({
        ...parsedLine,
        oldLineNumber: oldLine,
        newLineNumber: newLine
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  return { files };
}
