import { describe, expect, it, vi } from "vitest";

import {
  fetchIssueComments,
  fetchPullRequestComments,
  fetchResolvedThreadMap,
  submitPullRequestReview,
} from "../../src/comments/githubCommentsApi";

describe("github comments api", () => {
  it("fetches pull request and issue comments via REST", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, path: "src/a.ts", line: 2 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 10, body: "general" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const inline = await fetchPullRequestComments(
      { owner: "acme", repo: "tool", pullNumber: 5 },
      fetchMock as unknown as typeof fetch
    );
    const general = await fetchIssueComments(
      { owner: "acme", repo: "tool", issueNumber: 5 },
      fetchMock as unknown as typeof fetch
    );

    expect(inline).toHaveLength(1);
    expect(general).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps resolved thread status from GraphQL response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            repository: {
              pullRequest: {
                reviewThreads: {
                  nodes: [
                    { id: "T1", isResolved: true },
                    { id: "T2", isResolved: false },
                  ],
                },
              },
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const map = await fetchResolvedThreadMap(
      { owner: "acme", repo: "tool", pullNumber: 8 },
      fetchMock as unknown as typeof fetch
    );

    expect(map.get("T1")).toBe(true);
    expect(map.get("T2")).toBe(false);
  });

  it("submits review action", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await submitPullRequestReview(
      {
        owner: "acme",
        repo: "tool",
        pullNumber: 12,
        event: "APPROVE",
        body: "Looks good",
      },
      fetchMock as unknown as typeof fetch
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as {
      event: string;
      comments?: unknown[];
    };
    expect(url).toContain("/pulls/12/reviews");
    expect(init.method).toBe("POST");
    expect(payload.event).toBe("APPROVE");
    expect(payload.comments).toBeUndefined();
  });

  it("throws when pull request comments endpoint returns non-OK status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(
      fetchPullRequestComments(
        { owner: "acme", repo: "tool", pullNumber: 5 },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow("GitHub API request failed with status 500");
  });

  it("throws when review submission fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 422 }));

    await expect(
      submitPullRequestReview(
        {
          owner: "acme",
          repo: "tool",
          pullNumber: 12,
          event: "REQUEST_CHANGES",
          body: "Needs fixes",
        },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow("GitHub review submission failed with status 422");
  });

  it("falls back to COMMENT then decision when 422 occurs with inline comments", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Review comments is invalid" }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await submitPullRequestReview(
      {
        owner: "acme",
        repo: "tool",
        pullNumber: 12,
        event: "REQUEST_CHANGES",
        body: "Please update this.",
        comments: [
          {
            path: "src/a.ts",
            startLine: 10,
            line: 12,
            body: "nit",
          },
        ],
      },
      fetchMock as unknown as typeof fetch
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const firstPayload = JSON.parse(
      String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)
    );
    const secondPayload = JSON.parse(
      String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body)
    );
    const thirdPayload = JSON.parse(
      String((fetchMock.mock.calls[2] as [string, RequestInit])[1].body)
    );

    expect(firstPayload.event).toBe("REQUEST_CHANGES");
    expect(firstPayload.comments).toHaveLength(1);
    expect(secondPayload.event).toBe("COMMENT");
    expect(secondPayload.comments).toHaveLength(1);
    expect(thirdPayload.event).toBe("REQUEST_CHANGES");
    expect(thirdPayload.comments).toBeUndefined();
  });

  it("falls back on generic 422 when inline comments are present", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unprocessable Entity" }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await submitPullRequestReview(
      {
        owner: "acme",
        repo: "tool",
        pullNumber: 12,
        event: "APPROVE",
        comments: [
          {
            path: "src/a.ts",
            line: 12,
            body: "nit",
          },
        ],
      },
      fetchMock as unknown as typeof fetch
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("includes API message when fallback decision request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Review comments is invalid" }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Can not approve your own pull request" }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

    await expect(
      submitPullRequestReview(
        {
          owner: "acme",
          repo: "tool",
          pullNumber: 12,
          event: "APPROVE",
          body: "Looks good",
          comments: [
            {
              path: "src/a.ts",
              line: 12,
              body: "nit",
            },
          ],
        },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow(
      "GitHub review submission failed with status 422: Can not approve your own pull request"
    );
  });

  it("includes API message in submission error when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Review comments is invalid" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      submitPullRequestReview(
        {
          owner: "acme",
          repo: "tool",
          pullNumber: 12,
          event: "COMMENT",
          body: "Test",
        },
        fetchMock as unknown as typeof fetch
      )
    ).rejects.toThrow(
      "GitHub review submission failed with status 422: Review comments is invalid"
    );
  });
});
