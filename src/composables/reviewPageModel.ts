import { classifyAiNoise } from "../filters/aiNoiseFilter";

export interface ParsedReviewHunk {
  patchId: string;
  header: string;
  lines: Array<{ type: "added" | "removed" | "context"; content: string }>;
}

export interface ParsedReviewFile {
  newPath: string;
  hunks: ParsedReviewHunk[];
}

export interface ReviewPageState {
  visibleFiles: ParsedReviewFile[];
  noiseFiles: ParsedReviewFile[];
}

export interface FlatReviewHunk {
  filePath: string;
  patchId: string;
  lines: ParsedReviewHunk["lines"];
}

export function buildReviewPageState(
  files: ParsedReviewFile[]
): ReviewPageState {
  const visibleFiles: ParsedReviewFile[] = [];
  const noiseFiles: ParsedReviewFile[] = [];

  for (const file of files) {
    if (classifyAiNoise(file.newPath) === "noise") {
      noiseFiles.push(file);
    } else {
      visibleFiles.push(file);
    }
  }

  return { visibleFiles, noiseFiles };
}

export function flattenReviewHunks(
  files: ParsedReviewFile[]
): FlatReviewHunk[] {
  return files.flatMap((file) =>
    file.hunks.map((hunk) => ({
      filePath: file.newPath,
      patchId: hunk.patchId,
      lines: hunk.lines,
    }))
  );
}
