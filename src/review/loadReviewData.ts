import { detectCommentAuthorType } from "../comments/botDetection";
import {
  filterComments,
  type CommentFilterMode,
} from "../comments/commentFilters";
import { mapCommentsToFileTree } from "../comments/commentMapper";
import {
  fetchIssueComments,
  fetchPullRequestComments,
  fetchResolvedThreadMap,
  submitPullRequestInlineComment,
  submitPullRequestReview,
} from "../comments/githubCommentsApi";
import {
  listViewedPatchIds,
  markHunkViewed,
  unmarkHunkViewed,
} from "../db/reviewDb";
import { assembleReviewData } from "./reviewAssembler";
import type { ParsedFileFromWorker } from "./parseDiffInWorker";
import { fetchPullRequestDiff } from "./pullRequestDiffApi";
import { parseDiffInWorker } from "./parseDiffInWorker";

export interface PullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface ReviewCommentView {
  id: number;
  path: string;
  line: number;
  body: string;
  authorType: "human" | "bot";
  authorLogin: string;
  isResolved: boolean;
}

export type ReviewCommentTree = Record<
  string,
  Record<number, ReviewCommentView[]>
>;

export async function loadPullRequestReviewData(
  context: PullRequestContext,
  fetchImpl: typeof fetch
): Promise<{
  files: ParsedFileFromWorker[];
  hunks: ReturnType<typeof assembleReviewData>["hunks"];
  commentsTree: ReviewCommentTree;
}> {
  const diff = await fetchPullRequestDiff(context, fetchImpl);
  const files = await parseDiffInWorker(diff);
  const viewedPatchIds = await listViewedPatchIds(context.pullNumber);
  const assembled = assembleReviewData({ files, viewedPatchIds });

  const [inlineCommentsRaw] = await Promise.all([
    fetchPullRequestComments(context, fetchImpl),
    fetchIssueComments(
      { ...context, issueNumber: context.pullNumber },
      fetchImpl
    ),
  ]);

  const threadResolvedMap = await fetchResolvedThreadMap(context, fetchImpl);

  const inlineComments = (inlineCommentsRaw as Array<Record<string, unknown>>)
    .filter(
      (comment) =>
        typeof comment.path === "string" && typeof comment.line === "number"
    )
    .map((comment) => {
      const id = Number(comment.id ?? 0);
      const author = (comment.user ?? { login: "unknown", type: "User" }) as {
        login: string;
        type: string;
      };
      const nodeId = String(comment.node_id ?? id);

      return {
        id,
        path: String(comment.path),
        line: Number(comment.line),
        body: String(comment.body ?? ""),
        authorType: detectCommentAuthorType(author),
        authorLogin: author.login,
        isResolved: threadResolvedMap.get(nodeId) ?? false,
      } satisfies ReviewCommentView;
    });

  const commentsTree = mapCommentsToFileTree(inlineComments);

  return {
    files,
    hunks: assembled.hunks,
    commentsTree,
  };
}

export function getFilteredCommentTree(
  tree: ReviewCommentTree,
  mode: CommentFilterMode
): ReviewCommentTree {
  if (mode === "all") {
    return tree;
  }

  const output: ReviewCommentTree = {};

  for (const [filePath, lineMap] of Object.entries(tree)) {
    const filteredLineMap: Record<number, ReviewCommentView[]> = {};

    for (const [line, comments] of Object.entries(lineMap)) {
      const filtered = filterComments(comments, mode);
      if (filtered.length > 0) {
        filteredLineMap[Number(line)] = filtered;
      }
    }

    if (Object.keys(filteredLineMap).length > 0) {
      output[filePath] = filteredLineMap;
    }
  }

  return output;
}

export async function persistHunkViewedState(input: {
  pullNumber: number;
  filePath: string;
  patchId: string;
  isViewed: boolean;
}) {
  if (input.isViewed) {
    await markHunkViewed({
      prId: input.pullNumber,
      filePath: input.filePath,
      patchId: input.patchId,
    });
    return;
  }

  await unmarkHunkViewed(input.pullNumber, input.patchId);
}

export async function submitReviewDecision(
  input: PullRequestContext & {
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
    body?: string;
    comments?: Array<{
      path: string;
      startLine?: number;
      line: number;
      body: string;
    }>;
  },
  fetchImpl: typeof fetch
) {
  await submitPullRequestReview(
    {
      owner: input.owner,
      repo: input.repo,
      pullNumber: input.pullNumber,
      event: input.event,
      body: input.body,
      comments: input.comments,
    },
    fetchImpl
  );
}

export async function submitInlineComment(
  input: PullRequestContext & {
    path: string;
    startLine?: number;
    line: number;
    body: string;
  },
  fetchImpl: typeof fetch
) {
  await submitPullRequestInlineComment(
    {
      owner: input.owner,
      repo: input.repo,
      pullNumber: input.pullNumber,
      path: input.path,
      startLine: input.startLine,
      line: input.line,
      body: input.body,
    },
    fetchImpl
  );
}
