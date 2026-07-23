export interface GitHubCommentUser {
  login: string;
  type: string;
}

export interface GitHubReviewComment {
  id: number;
  path: string;
  line: number;
  body: string;
  user: GitHubCommentUser;
}

export type FileCommentTree<T extends { path: string; line: number }> = Record<string, Record<number, T[]>>;

export function mapCommentsToFileTree<T extends { path: string; line: number }>(comments: T[]): FileCommentTree<T> {
  const tree: FileCommentTree<T> = {};

  for (const comment of comments) {
    if (!tree[comment.path]) {
      tree[comment.path] = {};
    }

    if (!tree[comment.path][comment.line]) {
      tree[comment.path][comment.line] = [];
    }

    tree[comment.path][comment.line].push(comment);
  }

  return tree;
}
