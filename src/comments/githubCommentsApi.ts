interface RepoRef {
  owner: string;
  repo: string;
}

interface PullCommentsInput extends RepoRef {
  pullNumber: number;
}

interface IssueCommentsInput extends RepoRef {
  issueNumber: number;
}

interface ThreadMapInput extends RepoRef {
  pullNumber: number;
}

interface ReviewSubmitInput extends RepoRef {
  pullNumber: number;
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  body?: string;
  comments?: Array<{
    path: string;
    startLine?: number;
    line: number;
    body: string;
  }>;
}

interface InlineCommentSubmitInput extends RepoRef {
  pullNumber: number;
  path: string;
  startLine?: number;
  line: number;
  body: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchPullRequestComments(
  input: PullCommentsInput,
  fetchImpl: typeof fetch = fetch
): Promise<unknown[]> {
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/pulls/${input.pullNumber}/comments`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  return parseJson<unknown[]>(response);
}

export async function fetchIssueComments(
  input: IssueCommentsInput,
  fetchImpl: typeof fetch = fetch
): Promise<unknown[]> {
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/comments`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  return parseJson<unknown[]>(response);
}

interface GraphQLThreadsResponse {
  data?: {
    repository?: {
      pullRequest?: {
        reviewThreads?: {
          nodes?: Array<{ id: string; isResolved: boolean }>;
        };
      };
    };
  };
}

export async function fetchResolvedThreadMap(
  input: ThreadMapInput,
  fetchImpl: typeof fetch = fetch
): Promise<Map<string, boolean>> {
  const query = `query PullRequestThreads($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
          }
        }
      }
    }
  }`;

  const response = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        owner: input.owner,
        repo: input.repo,
        number: input.pullNumber,
      },
    }),
  });

  const payload = await parseJson<GraphQLThreadsResponse>(response);
  const map = new Map<string, boolean>();
  const nodes =
    payload.data?.repository?.pullRequest?.reviewThreads?.nodes ?? [];

  for (const node of nodes) {
    map.set(node.id, node.isResolved);
  }

  return map;
}

export async function submitPullRequestReview(
  input: ReviewSubmitInput,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/pulls/${input.pullNumber}/reviews`;
  const comments = (input.comments ?? []).map((comment) => {
    const normalizedStartLine =
      typeof comment.startLine === "number" &&
      comment.startLine !== comment.line
        ? Math.min(comment.startLine, comment.line)
        : undefined;
    const normalizedEndLine =
      typeof comment.startLine === "number" &&
      comment.startLine !== comment.line
        ? Math.max(comment.startLine, comment.line)
        : comment.line;

    return {
      path: comment.path,
      line: normalizedEndLine,
      side: "RIGHT",
      start_line: normalizedStartLine,
      start_side: normalizedStartLine ? "RIGHT" : undefined,
      body: comment.body,
    };
  });

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: input.event,
      body: input.body,
      comments,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub review submission failed with status ${response.status}`
    );
  }
}

export async function submitPullRequestInlineComment(
  input: InlineCommentSubmitInput,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/pulls/${input.pullNumber}/comments`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: input.body,
      path: input.path,
      line:
        input.startLine && input.startLine !== input.line
          ? Math.max(input.startLine, input.line)
          : input.line,
      side: "RIGHT",
      start_line:
        input.startLine && input.startLine !== input.line
          ? Math.min(input.startLine, input.line)
          : undefined,
      start_side:
        input.startLine && input.startLine !== input.line ? "RIGHT" : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub inline comment submission failed with status ${response.status}`
    );
  }
}
