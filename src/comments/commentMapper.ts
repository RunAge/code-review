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

export type FileCommentTree = Record<string, Record<number, GitHubReviewComment[]>>;

export function mapCommentsToFileTree(comments: GitHubReviewComment[]): FileCommentTree {
  const tree: FileCommentTree = {};

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
