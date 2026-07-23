import { describe, expect, it, vi } from "vitest";

import { fetchPullRequestDiff } from "../../src/review/pullRequestDiffApi";

describe("fetchPullRequestDiff", () => {
  it("requests PR diff with GitHub diff accept header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("diff --git a/a b/a", { status: 200 }));

    const diff = await fetchPullRequestDiff(
      { owner: "acme", repo: "tool", pullNumber: 12 },
      fetchMock as unknown as typeof fetch
    );

    expect(diff).toContain("diff --git");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/acme/tool/pulls/12");
    expect(new Headers(init.headers).get("Accept")).toBe(
      "application/vnd.github.v3.diff"
    );
  });

  it("throws when GitHub returns non-OK response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("bad", { status: 403 }));

    await expect(
      fetchPullRequestDiff(
        { owner: "acme", repo: "tool", pullNumber: 12 },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow("Failed to fetch pull request diff");
  });
});
