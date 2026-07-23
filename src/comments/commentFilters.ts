export type CommentFilterMode = "all" | "humans" | "bots" | "unresolved";

export interface FilterableComment {
  id: number;
  authorType: "human" | "bot";
  isResolved: boolean;
}

export function filterComments<T extends FilterableComment>(
  comments: readonly T[],
  mode: CommentFilterMode
): T[] {
  if (mode === "all") {
    return [...comments];
  }

  if (mode === "humans") {
    return comments.filter((comment) => comment.authorType === "human");
  }

  if (mode === "bots") {
    return comments.filter((comment) => comment.authorType === "bot");
  }

  return comments.filter((comment) => !comment.isResolved);
}
