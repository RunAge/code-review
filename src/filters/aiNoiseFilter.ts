const NOISE_FILE_PATTERNS = [
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /\.gen\.ts$/,
  /(^|\/)schema\.sql$/,
  /(^|\/)dist\//,
  /(^|\/)build\//
];

export type NoiseClassification = "noise" | "relevant";

export function classifyAiNoise(filePath: string): NoiseClassification {
  const isNoise = NOISE_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
  return isNoise ? "noise" : "relevant";
}

function normalizeCodeLine(line: string): string {
  return line
    .slice(1)
    .replace(/["']/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function shouldCollapseHunk(lines: string[]): boolean {
  if (lines.length === 0) {
    return false;
  }

  const added = lines.filter((line) => line.startsWith("+"));
  const removed = lines.filter((line) => line.startsWith("-"));

  if (added.length === 0 || removed.length === 0) {
    return false;
  }

  const allImports = [...added, ...removed].every((line) => /^(\+|-)\s*import\s/.test(line));
  if (allImports) {
    return true;
  }

  const normalizedAdded = added.map(normalizeCodeLine).sort();
  const normalizedRemoved = removed.map(normalizeCodeLine).sort();

  return JSON.stringify(normalizedAdded) === JSON.stringify(normalizedRemoved);
}
