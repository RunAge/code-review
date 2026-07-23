export interface PullRequestSummary {
  owner: string;
  repo: string;
  number: number;
  title: string;
}

export function formatPrLabel(input: PullRequestSummary): string {
  return `${input.owner}/${input.repo}#${input.number} - ${input.title}`;
}

export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export function getRiskTag(linesChanged: number): "low" | "medium" | "high" {
  if (linesChanged < 80) {
    return "low";
  }

  if (linesChanged < 300) {
    return "medium";
  }

  return "high";
}
