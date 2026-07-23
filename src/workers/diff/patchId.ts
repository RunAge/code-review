import type { DiffHunk, DiffLine } from "./types";

function getContentWithoutMarker(line: string): string {
  return line.length > 0 ? line.slice(1) : "";
}

export function normalizePatchLines(lines: DiffLine[]): string[] {
  const normalized: string[] = [];

  for (const line of lines) {
    const marker = line.content[0] ?? "";
    if (marker !== "+" && marker !== "-" && marker !== " ") {
      continue;
    }

    const trimmedTrailing = getContentWithoutMarker(line.content).replace(
      /[ \t]+$/g,
      ""
    );

    if (!trimmedTrailing.trim()) {
      continue;
    }

    if (line.type === "context") {
      continue;
    }

    normalized.push(`${marker}${trimmedTrailing}`);
  }

  return normalized;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createPatchId(
  hunk: Pick<DiffHunk, "lines">
): Promise<string> {
  const normalized = normalizePatchLines(hunk.lines);
  return sha256(normalized.join("\n"));
}
