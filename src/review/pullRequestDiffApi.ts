interface PullRequestRef {
  owner: string;
  repo: string;
  pullNumber: number;
}

export async function fetchPullRequestDiff(
  pullRequest: PullRequestRef,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(
    `https://api.github.com/repos/${pullRequest.owner}/${pullRequest.repo}/pulls/${pullRequest.pullNumber}`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pull request diff: ${response.status}`);
  }

  return response.text();
}
